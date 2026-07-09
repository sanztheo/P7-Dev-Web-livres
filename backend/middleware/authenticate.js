const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    // le token arrive dans le header, format "Bearer xxxxx"
    const token = authorizationHeader && authorizationHeader.split(' ')[1];
    // on garde que la partie après "Bearer "
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // si le token a été trafiqué ou expiré, ça plante ici direct (catch plus bas)
    req.auth = { userId: decodedToken.userId };
    // on récupère le userId caché dans le token, pour les contrôleurs suivants
    next();
  } catch (error) {
    res.status(401).json({ message: 'Requête non authentifiée.' });
  }
};
