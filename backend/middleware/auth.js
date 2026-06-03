const jwt = require('jsonwebtoken');

// Verifies the Bearer JWT and exposes the authenticated user's id on req.auth
// so controllers can enforce ownership without ever trusting a client-supplied
// userId. Any malformed header, missing token, or invalid signature is treated
// as an authentication failure (401).
module.exports = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    // Expected format: "Bearer <token>". Reject anything that does not match.
    const token = authorizationHeader && authorizationHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
