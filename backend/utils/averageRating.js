const round2 = (value) => Math.round(value * 100) / 100;

// Moyenne des notes d'un livre, arrondie à 2 décimales. Réutilisée à la création
// d'un livre et à l'ajout d'une note.
const computeAverage = (ratings) => {
  if (ratings.length === 0) {
    return 0;
  }
  const total = ratings.reduce((sum, { grade }) => sum + grade, 0);
  return round2(total / ratings.length);
};

module.exports = { computeAverage };
