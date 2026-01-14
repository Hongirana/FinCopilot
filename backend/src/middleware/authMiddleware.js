require('dotenv').config();
const jwt = require('jsonwebtoken');
const { user } = require('../prismaClient');
const authUtils = require('../utils/authUtils');
const { successResponse ,errorResponse } = require('../utils/responseHelper');
const { error } = require('node:console');

async function authenticateMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return errorResponse(res, 401, 'Unauthorized');
  }

  const [tokenType, token] = authorizationHeader.split(' ');

  if (tokenType !== 'Bearer') {
    return errorResponse(res, 401, 'Unauthorized');
  }

  try {
   const decoded = await authUtils.verifyToken(token);
   console.log(decoded);
      if (!decoded) {
        return errorResponse(res, 401, 'Unauthorized');
      }
      req.user = {id : decoded.id, email: decoded.email};
      console.log('Authenticated User:', decoded);
      next();

  } catch (error) {
    console.error('JWT Verification Error:', error);
    return errorResponse(res, 401, 'Unauthorized');
  }
}

module.exports = authenticateMiddleware;