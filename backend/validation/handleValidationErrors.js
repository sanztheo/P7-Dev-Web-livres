const { validationResult } = require('express-validator');

// Exécuté après les règles de validation : s'il y a au moins une erreur, on
// arrête la requête et on renvoie le premier message au client. Sinon on laisse
// passer vers le contrôleur.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return next();
};

module.exports = handleValidationErrors;
