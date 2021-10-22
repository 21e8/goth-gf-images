const mergeImages = require("merge-images-v2");
const Canvas = require("canvas");
const ImageDataURI = require("image-data-uri");
const { traits } = require("./traits");
const jsonFormat = require("json-format");
const { from, mergeMap } = require("rxjs");

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

// const BLACKLIST = {
//   BOTH_HAND_TRAIT_TYPES: ["RIGHT HAND", "LEFT HAND"],
//   COLLAR_TRAIT_TYPES: ["FANNY PACK"],
//   COLLAR_VALUES: ["LOBBY BUDDY"],
//   SUIT_TRAIT_TYPES: ["SHIRT", "PANTS", "FANNY PACK", "ROBE"],
//   SUIT_VALUES: [
//     "LOBBY BUDDY",
//     "MACHO BUDDY",
//     "COOGLASHNIKOV",
//     "PLASMA RIFLE",
//     "POLKA DOT BOWTIE",
//     "RANINBOW BOWTIE",
//   ],
//   FACE_VALUES: ['HAROLD MASK', 'DOGE MASK'],
//   SWEATSHIRT_TRAIT_TYPES: ["HEADGEAR", "EYEWEAR", "NECK"],
//   SWEATSHIRT_VALUES: ["HEADGEAR", "EYEWEAR", "NECK", 'BEARD', 'STUBBLE', "OLD TESTAMENT", "MACHINE", 'RAINBOW BEARD', "JOKER"],
//   ROBE_TRAIT_TYPES: ["SHIRT", "PANTS", "FANNY PACK"],
//   ROBE_VALUES: ["LOBBY BUDDY", "MACHO BUDDY", "COOGLASHNIKOV", "PLASMA RIFLE"],
//   PEANUT_TRAIT_TYPES: ["FACE", "EYES"],
//   PEANUT_VALUES: [
//     "EYE PATCH",
//     "NOVELTY",
//     "MCQUEEN",
//     "LENNON",
//     "COINS",
//     "CLOWN CAP",
//     "JESTER",
//     "DESPERADO",
//     "JACK BURTON",
//     "WAVY",
//     "SWEATSHIRT RED",
//     "SWEATSHIRT BLUE",
//     "SWEATSHIRT BLACK",
//     "DOGE MASK",
//     "HAROLD MASK",
//     "RAINBOW MOHAWK",
//     "CHEF"
//   ],
//   RIPPED_TRAIT_TYPES: ["SUIT", "ROPE", "SHIRT"],
//   HEADGEAR_VALUES: ["DOGE MASK", "HAROLD MASK", "OLD TESTAMENT"],
//   CLOWN_NOSE_TRAIT_TYPES: ['EYEWEAR', 'EYES'],
//   ZOMBIE_TRAIT_TYPES: ['EYES'],
//   EYE_PATCH_VALUES: ['CLOWN CAP'],
//   EYES_VALUES: ['MACHINE', 'VR'],
//   EYEWEAR_VALUES: ['MACHINE'],
// };

// const filterEyePatchStuff = traits => traits.filter(t => {
//   return BLACKLIST.EYE_PATCH_VALUES.indexOf(t.value) > -1 ? false : true;
// });
// const filterEyesStuff = traits => traits.filter(t => {
//   return BLACKLIST.EYES_VALUES.indexOf(t.value) > -1 ? false : true;
// });
// const filterEyewearStuff = traits => traits.filter(t => {
//   return BLACKLIST.EYEWEAR_VALUES.indexOf(t.value) > -1 ? false : true;
// });
// const filterFaceStuff = traits => traits.filter(t => {
//   return BLACKLIST.FACE_VALUES.indexOf(t.value) > -1 ? false : true;
// });

// const filterZombieStuff = traits => traits.filter(t => {
//   return BLACKLIST.ZOMBIE_TRAIT_TYPES.indexOf(t.value) > -1 ? false : true;
// });

// const filterHeadgearStuff = (traits) =>
//   traits.filter((t) => {
//     return BLACKLIST.HEADGEAR_VALUES.indexOf(t.value) > -1 ? false : true;
//   });
// const filterHandStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.BOTH_HAND_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterCollarStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.COLLAR_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     if (BLACKLIST.COLLAR_VALUES.indexOf(t.value) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterRobeSuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.ROBE_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     if (BLACKLIST.ROBE_VALUES.indexOf(t.value) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterSweatshirtStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.SWEATSHIRT_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     if (BLACKLIST.SWEATSHIRT_VALUES.indexOf(t.value) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterSuitStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.SUIT_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     if (BLACKLIST.SUIT_VALUES.indexOf(t.value) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterPeanutStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.PEANUT_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     if (BLACKLIST.PEANUT_VALUES.indexOf(t.value) > -1) {
//       return false;
//     }
//     return true;
//   });
// const filterRippedStuff = (traits) =>
//   traits.filter((t) => {
//     if (BLACKLIST.RIPPED_TRAIT_TYPES.indexOf(t.trait_type) > -1) {
//       return false;
//     }
//     return true;
//   });

// const fixHeadgearLevel = (traits) => {
//   const indexOfEyewear = traits.findIndex((t) => t.trait_type === "EYEWEAR");
//   const indexOfHeadGear = traits.findIndex((t) => t.trait_type === "HEADGEAR");
//   if (indexOfEyewear > -1 && indexOfHeadGear > -1) {
//     const eyewear = { ...traits.find((t) => t.trait_type === "EYEWEAR") };
//     const headger = { ...traits.find((t) => t.trait_type === "HEADGEAR") };

//     debugger

//     const headgearIsAboveEyewear =
//       [
//         "BLUE",
//         "BOOTY HUNTER",
//         "COOGIMON",
//         "COW POKE",
//         "FAST FOOD",
//         "OLD BROWN HAT",
//         "RED",
//         "SIZE MATTERS",
//         "SOLANA",
//         "TIN FOIL",
//       ].indexOf(headger.value) > -1;

//     if (headgearIsAboveEyewear) {
//       traits[indexOfEyewear] = headger;
//       traits[indexOfHeadGear] = eyewear;
//     }
//   }
// };

// const fixOverall = (traits) => {
//   const hasOverall = traits.find((t) => {
//     if (!t.value) {
//       console.log(t);
//       process.exit();
//     }
//     return t.value.includes("OVERALL");
//   });
//   if (hasOverall) {
//     const pantsIndex = traits.findIndex((t) => t.trait_type === "PANTS");
//     const shirtIndex = traits.findIndex((t) => t.trait_type === "SHIRT");

//     const pants = { ...traits[pantsIndex] };
//     const shirt = { ...traits[shirtIndex] };
//     traits[shirtIndex] = pants;
//     traits[pantsIndex] = shirt;
//   }
// };

// const fixClownNose = (traits) => {
//   const hasClownNose = traits.find(t => t.value.includes('CLOWN NOSE'));
//   if (hasClownNose) {
//     const indexOfEyewear = traits.findIndex((t) => t.trait_type === "EYEWEAR");
//     const indexOfEyes = traits.findIndex((t) => t.trait_type === "EYES");
//     const indexOfNose = traits.findIndex((t) => t.trait_type === "FACE");

//     const eyewear = { ...traits.find((t) => t.trait_type === "EYEWEAR") };
//     const eyes = { ...traits.find((t) => t.trait_type === "EYES") };
//     const nose = { ...traits.find((t) => t.trait_type === "FACE") };

//     traits[indexOfEyewear] = nose;
//     traits[indexOfEyes] = eyewear;
//     traits[eyes] = indexOfNose;
//   }
// }

const errors = [];

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

  return await mergeImages(images, {
    Canvas: Canvas,
  })
    .catch((e) => {
      console.log(e, images);
      errors.push({
        error: e,
        images,
      });
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
    require("fs").writeFileSync("errors.json", JSON.stringify(errors));
  });
