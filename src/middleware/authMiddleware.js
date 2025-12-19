require('dotenv').config();
const jwt = require('jsonwebtoken');
const { user } = require('../prismaClient');
const authUtils = require('../utils/authUtils');

async function authenticateMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [tokenType, token] = authorizationHeader.split(' ');

  if (tokenType !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
   const decoded = await authUtils.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid Token or missing' });
      }
      req.user = {id : decoded.id, email: decoded.email};
      console.log('Authenticated User:', decoded);
      next();

  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ error: 'Forbidden' });
  }
}

module.exports = authenticateMiddleware;