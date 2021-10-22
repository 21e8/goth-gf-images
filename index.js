const mergeImages = require("merge-images-v2");
const Canvas = require("canvas");
const ImageDataURI = require("image-data-uri");
const { traits } = require("./traits");
const jsonFormat = require("json-format");
const { from, mergeMap } = require("rxjs");
const fs = require('fs');


/**
 * Needed for calculating traits
 */
const cache = Object.keys(traits).reduce((acc, curr) => {
  acc[curr] = 1;
  return acc;
}, {});

/**
 * create a range of two numbers for each percentage.
 * the random number must fall into this range
 */
const mappedtraits = Object.entries(traits).reduce(
  (acc, [traitName, traits]) => {
    acc[traitName] = Object.entries(traits).map(([trait, chance]) => {
      const oldCache = +`${cache[traitName]}`;
      cache[traitName] = cache[traitName] - chance;
      return [trait, [oldCache, oldCache - chance]];
    });
    return acc;
  },
  {}
);

const SET_SIZE = 6969;

/**
 * Metadata template
 */
const makeJson = ({ i, traits }) => {
  return {
    name: `Goth GF #${i + 1}`,
    symbol: "",
    description: "",
    image: `${i}.png`,
    external_url: "",
    attributes: traits,
    seller_fee_basis_points: 500,
    update_authority: "",
    properties: {
      files: [{ type: "image/png", src: `${i}.png` }],
      category: "image",
      creators: null,
    },
  };
};

const findByChance = ({ number, trait }) => {
  return number <= trait[1][0] && number >= trait[1][1];
};

const list = [];

/**
 * Generates set of traits.
 * Recursive if it encounters a duplicate
 */
const getTraits = () => {
  const traits = Object.keys(mappedtraits)
    .map((key) => {
      const number = Math.random();
      const found = mappedtraits[key].find((trait) =>
        findByChance({ number, trait })
      );
      return found
        ? {
          trait_type: key,
          value: found[0],
        }
        : null;
    })
    .filter((t) => !!t);

  if (list.indexOf(JSON.stringify(traits)) >= 0) {
    return getTraits();
  }

  return traits;
};

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const HAIR_AND_HAT = require('fs').readdirSync('/Users/madbook/git/gothgf/data/Hair + Hat').map(f => f.split('.png')[0]);

const BLACKLIST = {
  HAIR_AND_HAT: HAIR_AND_HAT
}
const errors = new Set();

const gen = async (i) => {
  // console.log(i);
  const b = makeJson({ i, traits: getTraits() });

  // traits = traits.filter((t) => t.value !== "NONE");
  // if (traits.find((t) => t.value.includes("PEANUT"))) {
  //   traits = filterPeanutStuff(traits);
  // }
  // if (traits.find((t) => t.value.includes("RIPPED"))) {
  //   traits = filterRippedStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("SUIT"))) {
  //   traits = filterSuitStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("ROBE"))) {
  //   traits = filterRobeSuff(traits);
  // }
  // if (traits.find((t) => t.value.includes("SWEATSHIRT"))) {
  //   traits = filterSweatshirtStuff(traits);
  // }
  // if (traits.find((t) => t.value.includes("EYE PATCH"))) {
  //   traits = filterEyePatchStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("EYES"))) {
  //   traits = filterEyesStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("EYEWEAR"))) {
  //   traits = filterEyewearStuff(traits);
  // }
  // if (traits.find((t) => t.value.includes("COOL COLLAR"))) {
  //   traits = filterCollarStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("BOTH HANDS"))) {
  //   traits = filterHandStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("HEADGEAR"))) {
  //   traits = filterHeadgearStuff(traits);
  // }
  // if (traits.find((t) => t.trait_type.includes("FACE"))) {
  //   traits = filterFaceStuff(traits);
  // }
  // if (traits.find((t) => t.value.includes("ZOMBIE"))) {
  //   traits = filterZombieStuff(traits);
  // }

  // if (traits.find((t) => t.value.includes("COINS"))) {
  //   if (
  //     traits.find((t) => {
  //       return t.trait_type === "NAKED" && t.value !== "GREEN";
  //     })
  //   ) {
  //     traits = traits.filter((t) => t.value !== "COINS");
  //   }
  // }

  // fixHeadgearLevel(traits);

  // traits = traits.filter((t) => !!Object.keys(t).length);

  // fixOverall(traits);

  // traits = traits.filter((t) => !!Object.keys(t).length);

  // fixClownNose(traits);

  // b.attributes = traits.filter((t) => !!Object.keys(t).length);

  const capitalizeWords = w => w
    .split(" ")
    .map((w) => capitalize(w))
    .join(" ")

  const images = b.attributes
    .map((t) => {
      if (!t.trait_type) {
        return undefined;
      }

      // split(' ').map(w => capitalize(w)).join(' ')

      return `${__dirname}/data/${t.trait_type}/${capitalizeWords(
        b.attributes.find(
          (c) =>
            capitalizeWords(c.trait_type) === capitalizeWords(t.trait_type)
        ).value)
        }.png`;
    })
    .filter((t) => !!t);

  images.forEach(img => {
    try {
      fs.statSync(img)
    } catch (e) {
      errors.add(img.split('data/')[1]);
    }
  })


  // return await mergeImages(images, {
  //   Canvas: Canvas,
  // })
  //   .catch((e) => {
  //     console.log(e, images);
  //     errors.push({
  //       error: e,
  //       images,
  //     });
  //   })
  //   .then((b64) => ImageDataURI.outputFile(b64, `out/${i}.png`))
  //   .then(() => {
  //     return require("fs/promises").writeFile(
  //       `out/${i}.json`,
  //       jsonFormat(b, { size: 2, type: "space" })
  //     );
  //   });
};

from(
  Array(SET_SIZE)
    .fill("")
    .map((_, i) => i)
)
  .pipe(mergeMap((i) => gen(i), 1))
  .subscribe(() => {
    // require("fs").writeFileSync("errors.json", JSON.stringify(errors));
    fs.writeFileSync('errors.json', JSON.stringify(Array.from(errors)))

  });
