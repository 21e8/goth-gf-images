const mergeImages = require("merge-images-v2");
const Canvas = require("canvas");
const ImageDataURI = require("image-data-uri");
const { traits } = require("./fixed");
const jsonFormat = require("json-format");
const { from, mergeMap } = require("rxjs");
const fs = require("fs");
const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

var swapArrayElements = function (arr, indexA, indexB) {
  var temp = arr[indexA];
  arr[indexA] = arr[indexB];
  arr[indexB] = temp;
};

const capitalizeWords = (w) =>
  w
    .split(" ")
    .map((w) => capitalize(w))
    .join(" ");

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

/**
 * Metadata template
 */
const makeJson = ({ i, traits }) => {
  return {
    name: `Goth GF #${i + 1}`,
    symbol: "GOTHGF",
    description: "",
    image: `${i}.png`,
    external_url: "https://gothgfs.com/",
    attributes: traits,
    seller_fee_basis_points: 500,
    update_authority: "GoThgFHS5W9jCLX7JoWnCHtL5RMJEBWL3HVuhGjVntyg",
    properties: {
      files: [{ type: "image/png", src: `${i}.png` }],
      category: "image",
      creators: [
        { address: "GoThgFHS5W9jCLX7JoWnCHtL5RMJEBWL3HVuhGjVntyg", share: 100 },
      ],
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
            value: capitalizeWords(found[0]),
          }
        : null;
    })
    .filter((t) => !!t);

  if (list.indexOf(JSON.stringify(traits)) >= 0) {
    return getTraits();
  }

  return traits;
};

const HAIR_AND_HAT = require("fs")
  .readdirSync("data/Hair + Hat")
  .map((f) => f.split(".png")[0]);
const CLOTHES_AND_NECK = require("fs")
  .readdirSync("data/Clothes + Neck")
  .map((f) => f.split(".png")[0]);
const HAIR_BEHIND = fs
  .readdirSync("data/Hair Behind")
  .map((f) => f.split(".png")[0]);

const errors = new Set();

const gen = async (i) => {
  console.log(i);
  const b = makeJson({ i, traits: getTraits() });

  const hasHairAndHat = b.attributes.find(
    (t) => HAIR_AND_HAT.indexOf(t.value) > -1
  );
  if (hasHairAndHat) {
    console.log(`Should remove Head Accessory in ${i}`);
    b.attributes = b.attributes.filter(
      (t) => t.trait_type !== "Head Accessory"
    );
  }
  const hasClothesAndNeck = b.attributes.find(
    (t) => CLOTHES_AND_NECK.indexOf(t.value) > -1
  );

  if (hasClothesAndNeck) {
    console.log(`Should remove Neck Accessory in ${i}`);
    b.attributes = b.attributes.filter(
      (t) => t.trait_type !== "Neck Accessory"
    );
  }

  const hair = b.attributes.findIndex((a) => a.trait_type === "Hair");
  if (hair > -1) {
    const isBehind = HAIR_BEHIND.indexOf(b.attributes[hair].value) > -1;
    const earrings = [
      "Earring upper",
      "Earring Lower",
      "Orbital",
      "Industrial",
      "Helix",
      "Tragus",
      "Snug",
    ];
    const indicesOfEarrrings = b.attributes.map((t) => {
      const index = earrings.indexOf(t.value);
      return index > -1 ? {index: index, ...t } : null;
    }).filter(r => r !== null);

    if (!indicesOfEarrrings.length) {
      return
    }
    const highestIndex = indicesOfEarrrings[indicesOfEarrrings.length  -1].index;

    if (isBehind) {
      swapArrayElements(b.attributes, highestIndex, hair)
    }
  }

  const images = b.attributes
    .map((t) => {
      if (!t.trait_type) {
        return undefined;
      }
      return `${__dirname}/data/${t.trait_type}/${capitalizeWords(
        b.attributes.find(
          (c) => capitalizeWords(c.trait_type) === capitalizeWords(t.trait_type)
        ).value
      )}.png`;
    })
    .filter((t) => !!t)
    .reverse();

  images.forEach((img) => {
    try {
      fs.statSync(img);
    } catch (e) {
      errors.add(img);
    }
  });

  return await mergeImages(images, {
    Canvas: Canvas,
  })
    .catch((e) => {
      console.log(e, images);
      fs.writeFileSync("errors.json", JSON.stringify(Array.from(errors)));
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
  Array(5000)
    .fill("")
    .map((_, i) => i)
)
  .pipe(mergeMap((i) => gen(i), 1))
  .subscribe(() => {
    fs.writeFileSync("errors.json", JSON.stringify(Array.from(errors)));
  });
