const fs = require('fs');
const Graph = require('node-dijkstra');

fs.readFile('entries.txt', 'utf8', (err, data) => {
  if (err) throw err;

  const donneesEntree = transformeDonneeEnTableau(data);

  const donneesCiblesTableau = getDonneesCibles(donneesEntree);
  let D1, D2, M, nombreTauxDeChange;

  try {
    D1 = verifieDevise(donneesCiblesTableau[0]);
    D2 = verifieDevise(donneesCiblesTableau[2]);
    M = verifieMontant(donneesCiblesTableau[1]);
    nombreTauxDeChange = verifieMontant(donneesEntree[1]);
  } catch (e) {
    console.log(e);
  }

  if (!verifieLeNombreDeTauxDeChange(nombreTauxDeChange, donneesEntree)) {
    console.error(
      `Les donnees des taux ne correspondent pas au nombre dans le fichier :`
    );
    console.error(`Nombre dans le fichier : ${nombreTauxDeChange}`);
    console.error(
      `Nombre de donnees dans le fichier : ${donneesEntree.length - 2}`
    );
    return;
  }

  const tableauDesTaux = donneesEntree.slice(2, donneesEntree.length);
  const resultatsTestsTaux = verifierLesTaux(tableauDesTaux);

  if (!resultatsTestsTaux.passed) {
    console.error(resultatsTestsTaux.message);
  }

  const graphNodes = tableauDesTaux
    .map((v) => {
      const sp = v.split(';');
      return sp.map((el, i) => {
        if (sp.length === i + 1) {
          return +el;
        }
        return el;
      });
    })
    .reduce((acc, v) => {
      const normal = [...v];
      normal[2] = +normal[2];
      acc.push(v);
      const reversed = [v[1], v[0], +(1 / v[2]).toFixed(4)];
      acc.push(reversed);
      return acc;
    }, []);

  const listeDesTauxUnique = [...new Set(graphNodes.map((v) => v[0]))];

  // Creation du graph
  const route = new Graph();

  for (devise of listeDesTauxUnique) {
    const res = graphNodes.filter((v) => v[0] === devise);
    const obj = res.reduce((acc, v) => {
      acc[v[1]] = 1;
      return acc;
    }, {});
    route.addNode(devise, obj);
  }

  const converstionPath = route.path(D1, D2);

  let resultatConversion = M;
  converstionPath.forEach((_, i) => {
    if (i + 1 < converstionPath.length) {
      const getTaux = graphNodes.filter(
        (t) => t[0] === converstionPath[i] && t[1] === converstionPath[i + 1]
      )[0][2];
      resultatConversion *= getTaux;
    }
  });

  resultatConversion = +resultatConversion.toFixed(0);

  console.log(`${M} ${D1} -> ${resultatConversion} ${D2}`);
});

const transformeDonneeEnTableau = (entrees) => entrees.split('\n');

const getDonneesCibles = (donneesCibes) => donneesCibes[0].split(';');

const verifieDevise = (codeDevise) => {
  if (codeDevise.length !== 3) {
    throw new Error('Format code devis incorrect');
  }
  return codeDevise;
};

const verifieMontant = (montant) => {
  const montantNum = +montant;
  if (Number.isInteger(montantNum) && montantNum > 0) {
    return montantNum;
  }
  throw new Error(
    `Le montant "${montant}" n'est pas un nombre ou il est négatif`
  );
};

const verifieLeNombreDeTauxDeChange = (nombre, tableauDeTaux) =>
  nombre === tableauDeTaux.length - 2;

const verifierLesTaux = (tableauDeTaux) => {
  let passed = true;
  let message = '';
  for (const taux of tableauDeTaux) {
    const tauxTableau = taux.split(';');
    if (!verifieDevise(tauxTableau[0])) {
      passed = false;
      message = `Format code devis incorrect`;
      break;
    }
    if (!verifieDevise(tauxTableau[1])) {
      passed = false;
      message = `Format code devis incorrect`;
      break;
    }
    if (!verifierUnTaux(tauxTableau[2])) {
      passed = false;
      message = `Le montant "${tauxTableau[2]}" n'est pas un nombre avec 4 decimales`;
      break;
    }
  }
  return {
    passed,
    message,
  };
};

const verifierUnTaux = (taux) => {
  if (isDecimalNumber(taux) && hasFourDecimals(taux)) {
    return true;
  }
  return false;
};

const isDecimalNumber = (num) => !!(num % 1);
const hasFourDecimals = (num) =>
  num.slice(num.indexOf('.') + 1, num.length).length === 4;
