require('dotenv').config();
const jwt = require('jsonwebtoken'); 

function authenticateMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [tokenType, token] = authorizationHeader.split(' ');

  if (tokenType !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = user;
    console.log("Authenticated User:", user);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

  module.exports = authenticateMiddleware;