const { traits } = require("./traits.js");
const fs = require("fs");
const { roof } = require("./roof.js");



const calc = Object.keys(traits).reduce((acc, curr) => {
  if (!acc[curr]) {
    acc[curr] = 0;
  }
  Object.keys(traits[curr]).forEach((tt) => {
    acc[curr] += traits[curr][tt];
  });
  return acc;
}, {});

Object.keys(calc).forEach((key) => {
  if (calc[key] > 1 || roof[key]) {
    Object.keys(traits[key]).forEach((tt) => {
      console.log(roof[key]);

      traits[key][tt] = roof[key]
        ? (traits[key][tt] / calc[key]) * roof[key]
        : traits[key][tt] / calc[key];
    });
  }
});

fs.writeFileSync("fixed_.json", JSON.stringify(traits));
