// Autorise le frontend (autre origine) à appeler l'API et répond directement
// aux requêtes préliminaires OPTIONS envoyées par le navigateur.
const allowCrossOrigin = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
};

module.exports = allowCrossOrigin;
