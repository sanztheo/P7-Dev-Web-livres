const fs = require('fs');
const path = require('path');

// Dossier où sont stockées les images des livres, créé au démarrage s'il
// n'existe pas. Centralisé ici pour avoir une seule source de vérité partagée
// par l'optimisation d'image, la suppression et le service statique.
const IMAGES_DIR = path.join(__dirname, '..', 'images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });

module.exports = { IMAGES_DIR };
