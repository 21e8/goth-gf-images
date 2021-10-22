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

const SET_SIZE = 1_000_000;

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
  const b = makeJson({ i, traits: getTraits() });

  const capitalizeWords = w => w
    .split(" ")
    .map((w) => capitalize(w))
    .join(" ")

  const images = b.attributes
    .map((t) => {
      if (!t.trait_type) {
        return undefined;
      }

      return `${__dirname}/data/${t.trait_type}/${capitalizeWords(
        b.attributes.find(
          (c) =>
            capitalizeWords(c.trait_type) === capitalizeWords(t.trait_type)
        ).value)
        }.png`;
    })
    .filter((t) => !!t)
    .reverse();

  images.forEach(img => {
    try {
      fs.statSync(img)
    } catch (e) {
      errors.add(img.split('data/')[1]);
    }
  })


  return await mergeImages(images, {
    Canvas: Canvas,
  })
    .catch((e) => {
      console.log(e, images);
      fs.writeFileSync('errors.json', JSON.stringify(Array.from(errors)))
    })
    .then((b64) => ImageDataURI.outputFile(b64, `out/${i}.png`))
    .then(() => {
      return require("fs/promises").writeFile(
        `out/${i}.json`,
        jsonFormat(b, { size: 2, type: "space" })
      );
    });
};

from(
  Array(SET_SIZE)
    .fill("")
    .map((_, i) => i)
)
  .pipe(mergeMap((i) => gen(i), 1))
  .subscribe(() => {
    fs.writeFileSync('errors.json', JSON.stringify(Array.from(errors)))
  });
