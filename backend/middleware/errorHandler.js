// Dernier middleware de la chaîne : il attrape toute erreur passée à next(err)
// et renvoie un message générique au client (les détails restent dans les logs).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);

  const clientErrorNames = ['ValidationError', 'CastError', 'MulterError'];
  let status = err.status || err.statusCode;
  if (!status) {
    status =
      clientErrorNames.includes(err.name) || err.type === 'entity.parse.failed'
        ? 400
        : 500;
  }

  const message =
    err.name === 'MulterError'
      ? 'Fichier invalide ou trop volumineux.'
      : status === 413
        ? 'Charge trop volumineuse.'
        : status >= 500
          ? 'Erreur serveur.'
          : 'Requête invalide.';

  return res.status(status).json({ message });
};

module.exports = errorHandler;
