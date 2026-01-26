const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError, AuthenticationError } = require('../utils/customErrors');
const { invalidateUserCache } = require('../services/cacheService');


const getUsers = asyncHandler(async (req, res) => {
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true
      // Not returning password hash
    }
  });
  return successResponse(res, 200, 'Users Fetched Successfully', users);
});


const getUserById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return successResponse(res, 200, 'User Fetched Successfully', user);

});


const createUser = asyncHandler(async (req, res) => {
  const { email, firstName, lastName, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: email }
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const created = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: passwordHash
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true
    }
  });

  return successResponse(res, 201, 'User created successfully', created);
});


const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return successResponse(res, 200, 'Profile retrieved successfully', user);
});


const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // If email is being changed, check if it's already taken
  if (email && email !== user.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });

    if (emailExists) {
      throw new ConflictError('Email already in use');
    }
  }

  // Build update data
  const updateData = {
    ...(firstName !== undefined && { firstName }),
    ...(lastName !== undefined && { lastName }),
    ...(email !== undefined && { email })
  };

  // Update user
  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      updatedAt: true
    }
  });

  return successResponse(res, 200, 'Profile updated successfully', updated);
});


const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Validate inputs
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: newPasswordHash }
  });

  return successResponse(res, 200, 'Password updated successfully');
});

/**
 * Delete user account (soft delete or hard delete)
 * DELETE /api/users/me
 */
const deleteMyAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let password;
  const { confirmationText } = req.body;

  // ✅ SAFETY: Require confirmation phrase (e.g., "DELETE MY ACCOUNT")
  if (confirmationText !== 'DELETE ACCOUNT') {
    throw new ValidationError('Please confirm account deletion by sending confirmationText: "DELETE ACCOUNT"');
  }

  if (!req.body || !req.body.password === undefined) {
    throw new ValidationError('Password confirmation required to delete account');
  }
  else {
    password = req.body.password;
  }
  // Require password confirmation
  if (!password) {
    throw new ValidationError('Password confirmation required to delete account');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid password');
  }

  // Get statistics before deletion (for confirmation response)
  const stats = await prisma.$transaction([
    prisma.account.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } })
  ]);

  const [accountCount, transactionCount, budgetCount, goalCount] = stats;

  // ✅ Log deletion for audit trail
  console.warn(`[Account Deletion] User ${userId} deleted their account`);
  console.warn(`  - Accounts: ${accountCount}`);
  console.warn(`  - Transactions: ${transactionCount}`);
  console.warn(`  - Budgets: ${budgetCount}`);
  console.warn(`  - Goals: ${goalCount}`);

  // Delete user (this will cascade delete related data based on your Prisma schema)
  await prisma.user.delete({
    where: { id: userId }
  });

  // Clear any remaining cache
    await invalidateUserCache(userId);

  return successResponse(res, 200, 'User Account deleted successfully', {
    deletedStats: {
      accounts: accountCount,
      transactions: transactionCount,
      budgets: budgetCount,
      goals: goalCount
    }
  });
});

/**
 * Get user statistics
 * GET /api/users/me/stats
 */
const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get counts
  const [transactionCount, budgetCount, goalCount, accountCount] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.account.count({ where: { userId } })
  ]);

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true
    }
  });

  return successResponse(res, 200, 'User statistics retrieved successfully', {
    user,
    stats: {
      transactions: transactionCount,
      budgets: budgetCount,
      goals: goalCount,
      accounts: accountCount
    }
  });
});

module.exports = {
  getUsers,
  getUserById,
  getMyProfile,
  createUser,
  updateMyProfile,
  updatePassword,
  deleteMyAccount,
  getMyStats
};
