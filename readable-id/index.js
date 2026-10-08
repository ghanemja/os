// readable-id — friendly IDs like `brave-otter-42`. Zero dependencies.

// Curated to be inoffensive: no body parts, no insults, no words that read badly
// next to each other. Lowercase a-z only so any separator is safe.
export const adjectives = `
able agile airy amber amiable ample amused apt aqua arctic artful astral autumn awake azure
balmy blissful bold bonny bouncy brave breezy bright brisk bubbly buoyant busy calm candid
careful caring cheerful cheery chipper civil classic clean clear clever cloudy coastal cobalt
comfy cosmic cozy crafty crisp curious dainty dandy dapper daring dashing dazzling deep deft
dewy diligent dreamy eager earnest easy elated electric elegant emerald epic even exact fabled
fair faithful famous fancy fearless festive fine fluent fluffy flying focused fond frank free
fresh friendly frosty gallant gentle giant gifted glad gleaming glossy golden graceful grand
grateful great gusty happy hardy hazy hearty helpful heroic honest hopeful humble humming icy
ideal jade jazzy jolly jovial joyful keen kind kindly lavish leafy lofty lively loyal lucid
lucky lunar lush magic majestic mellow merry mighty mild mint misty modern modest mossy neat
nifty nimble noble noted novel oaken olive open orange patient peaceful peppy perky placid
plucky plush polished polite prime proud pure quick quiet quirky radiant rapid rare ready
regal relaxed rosy royal ruby rustic sage sandy scenic serene shiny silent silky silver simple
sincere sleek smart smiling snowy snug soft solar solid sparkling speedy spry starry steady
stellar sturdy sunny super sweet swift tender thrifty tidy tranquil trusty upbeat urban
valiant velvet vital vivid warm wavy whimsical wise witty wondrous woven young zany zealous
zesty zippy bright breezy brilliant cosy crimson dusky fleet glowing hushed jaunty kindred
lilac luminous maroon nautical opal pastel pearly primal quaint scarlet sterling tawny teal
`.split(/\s+/).filter((w, i, a) => w && a.indexOf(w) === i);

export const nouns = `
acorn alpaca anchor antelope apple armadillo arrow aspen aurora axolotl badger bamboo banjo
beacon beaver bee berry birch biscuit bison blossom boulder breeze brook butterfly button
cactus camel canyon cedar cheetah cherry chipmunk cloud clover comet compass condor cookie
coral cosmos cove crane cricket crystal daisy delta dolphin dove duck dune eagle egret elk
ember emu falcon feather fern ferret fig finch fjord flamingo fox galaxy garden gazelle gecko
giraffe glacier goose gopher grove harbor hare hawk hedgehog heron hill hippo horizon
hummingbird ibis iguana impala island ivy jaguar jay kangaroo kestrel kingfisher kite kiwi
koala ladybug lagoon lake lantern lark laurel leaf lemon lemur lighthouse lily llama lobster
lotus lynx magpie manatee mango mantis maple marble marmot marten meadow meerkat melon meteor
mink mist mole mongoose moon moose mountain muffin narwhal nebula newt nightingale noodle oak
oasis ocelot octopus orca orchid oriole osprey ostrich otter owl pancake panda panther parrot
peach peacock pebble pelican penguin petal pheasant piano pigeon pine planet platypus plum
pond pony poppy porcupine prairie pretzel puffin quail quartz quokka rabbit raccoon rainbow
raven reef reindeer ribbon ridge river robin rocket salmon sapphire savanna seahorse seal
shell skylark sloth snail snowflake sparrow spruce squirrel star starling stingray stone stork
summit sun swallow swan tapir teapot tern thistle thrush thunder tide tiger toad toucan trout
tulip tundra turtle valley violet violin volcano vole voyage waffle walrus warbler waterfall
wave weasel whale willow wolf wombat wren yak zebra zephyr bonsai canoe dragonfly firefly
glade harp juniper kayak lynx meadowlark nutmeg pinecone puma saffron sequoia sunflower
`.split(/\s+/).filter((w, i, a) => w && a.indexOf(w) === i);

const DEFAULTS = { separator: '-', words: 2, number: true, digits: 2 };

function resolve(options = {}) {
  const o = { ...DEFAULTS, ...options };
  o.adjectives = options.adjectives || adjectives;
  o.nouns = options.nouns || nouns;
  if (!Number.isInteger(o.words) || o.words < 1) throw new RangeError('words must be an integer >= 1');
  if (!Number.isInteger(o.digits) || o.digits < 1 || o.digits > 15) throw new RangeError('digits must be an integer from 1 to 15');
  if (typeof o.separator !== 'string') throw new TypeError('separator must be a string');
  if (!o.adjectives.length || !o.nouns.length) throw new RangeError('word lists must not be empty');
  return o;
}

const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
const hasCrypto = !!(cryptoObj && typeof cryptoObj.getRandomValues === 'function');

/** Uniform integer in [0, max). Uses crypto with rejection sampling when available. */
function randomInt(max, random) {
  if (random) return Math.floor(random() * max);
  if (hasCrypto && max <= 0x100000000) {
    const buf = new Uint32Array(1);
    const limit = 0x100000000 - (0x100000000 % max);
    let x;
    do {
      cryptoObj.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Generate a readable ID such as `brave-otter-42`.
 * `words` counts all words: the last one is a noun, the rest are adjectives.
 */
export function readableId(options) {
  const o = resolve(options);
  const parts = [];
  for (let i = 0; i < o.words - 1; i++) parts.push(o.adjectives[randomInt(o.adjectives.length, o.random)]);
  parts.push(o.nouns[randomInt(o.nouns.length, o.random)]);
  if (o.number) {
    let n = '';
    for (let i = 0; i < o.digits; i++) n += randomInt(10, o.random);
    parts.push(n);
  }
  return parts.join(o.separator);
}

/** Number of distinct IDs the given options can produce. */
export function combinations(options) {
  const o = resolve(options);
  let total = o.adjectives.length ** (o.words - 1) * o.nouns.length;
  if (o.number) total *= 10 ** o.digits;
  return total;
}

/**
 * Probability that at least two of `count` generated IDs are equal
 * (birthday approximation, accurate for large spaces).
 */
export function collisionProbability(count, options) {
  if (!Number.isFinite(count) || count < 0) throw new RangeError('count must be a non-negative number');
  if (count < 2) return 0;
  const space = combinations(options);
  if (count > space) return 1;
  return -Math.expm1((-count * (count - 1)) / (2 * space));
}

/** Check that `id` has the shape the given options would produce, using the same word lists. */
export function isReadableId(id, options) {
  if (typeof id !== 'string') return false;
  const o = resolve(options);
  const expected = o.words + (o.number ? 1 : 0);
  const parts = o.separator === '' ? null : id.split(o.separator);
  if (!parts || parts.length !== expected) return false;
  const adj = new Set(o.adjectives);
  for (let i = 0; i < o.words - 1; i++) if (!adj.has(parts[i])) return false;
  if (!o.nouns.includes(parts[o.words - 1])) return false;
  if (o.number && !new RegExp(`^\\d{${o.digits}}$`).test(parts[o.words])) return false;
  return true;
}

export default readableId;
