import { traits } from './traits.js';
import * as fs from 'fs';




const calc = Object.keys(traits).reduce(
  (acc, curr) => {
    if (!acc[curr]) {
      acc[curr] = 0
    }
    Object.keys(traits[curr]).forEach(tt => {
      acc[curr] += traits[curr][tt]
    })
    return acc;
  },
  {}
);

Object.keys(calc).forEach(key => {
  calc[key] = calc[key] / 23.671999999999958
})

fs.writeFileSync('out.json', JSON.stringify(calc));