export const allowedDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export const generateAllPattiCombinations = () => {
  const combos: string[] = [];
  for (let i = 0; i < allowedDigits.length; i++) {
    const d1 = allowedDigits[i];
    for (let j = i; j < allowedDigits.length; j++) {
      const d2 = allowedDigits[j];
      for (let k = j; k < allowedDigits.length; k++) {
        const d3 = allowedDigits[k];
        combos.push(d1 + d2 + d3);
      }
    }
  }
  return combos;
};

export const sumOfDigits = (combo: string) => {
  return combo.split('').reduce((s, d) => s + parseInt(d, 10), 0);
};

export const generatePattiGroups = () => {
  const pattiGroups: { [key: string]: string[] } = {};
  allowedDigits.forEach(d => pattiGroups[d] = []);
  
  const allCombos = generateAllPattiCombinations();
  allCombos.forEach(combo => {
    const key = (sumOfDigits(combo) % 10).toString();
    pattiGroups[key].push(combo);
  });
  
  // Sort each group numerically
  for (const key in pattiGroups) {
    pattiGroups[key].sort((a, b) => parseInt(a) - parseInt(b));
  }
  
  return pattiGroups;
};