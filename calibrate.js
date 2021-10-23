const { traits } = require("./traits");

const cache = {};

Object.keys(traits).forEach((key) => {
  if (!cache[key]) {
    cache[key] = 0;
  }
  Object.keys(traits[key]).forEach((trait_key) => {
    cache[key] += traits[key][trait_key];
  });
});

Object.keys(traits).forEach(key => {
    Object.keys(traits[key]).forEach((trait_key) => {
        traits[key][trait_key] = traits[key][trait_key] / cache[key];
    });
});

require('fs').writeFileSync('fixed.json', JSON.stringify(traits))
