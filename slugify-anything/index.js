// slugify-anything: URL slugs that survive emoji, accents and non-Latin scripts.

// Build a { char: replacement } table from "key value key value ..." pairs.
// Uppercase variants are added automatically (Ж -> Zh) unless already present.
function table(pairs, withUpper = true) {
  const out = {};
  const parts = pairs.trim().split(/\s+/);
  for (let i = 0; i < parts.length; i += 2) {
    const k = parts[i], v = parts[i + 1] === '_' ? '' : parts[i + 1];
    out[k] = v;
    const K = k.toUpperCase();
    if (withUpper && K !== k && K.length === 1 && !(K in out)) out[K] = v.charAt(0).toUpperCase() + v.slice(1);
  }
  return out;
}

// Characters that Unicode decomposition (NFKD) does not reduce to ASCII.
const LATIN = table(`
  ß ss ẞ SS æ ae Æ AE œ oe Œ OE ø o ł l đ d ð d þ th ħ h ı i ĸ k ŋ ng ŧ t ƒ f
  ə e ɛ e ɔ o ʒ z ƀ b ɓ b ƈ c ɗ d ɠ g ƙ k ɲ n ƥ p ʂ s ƭ t ʋ v ƴ y ȥ z
`);

const GREEK = table(`
  α a β v γ g δ d ε e ζ z η i θ th ι i κ k λ l μ m ν n ξ x ο o π p ρ r
  σ s ς s τ t υ y φ f χ ch ψ ps ω o
`);

const CYRILLIC = table(`
  а a б b в v г g д d е e ё yo ж zh з z и i й y к k л l м m н n о o п p
  р r с s т t у u ф f х kh ц ts ч ch ш sh щ shch ъ _ ы y ь _ э e ю yu я ya
  і i ї yi є ye ґ g ў u ђ dj ј j љ lj њ nj ћ c џ dz ѓ gj ќ kj ѕ dz
`);

// Symbols become whole words.
const SYMBOLS = {
  '&': 'and', '%': 'percent', '@': 'at', '+': 'plus', '$': 'dollar', '¢': 'cent',
  '€': 'euro', '£': 'pound', '¥': 'yen', '₹': 'rupee', '₽': 'ruble', '₩': 'won',
  '₿': 'bitcoin', '©': 'c', '®': 'r', '™': 'tm', '°': 'deg', '∞': 'infinity',
  '♥': 'love', '§': 'section', '¶': 'paragraph', '×': 'x', '÷': 'divided by',
  '±': 'plus minus', '≠': 'not equal', '≈': 'approx', '√': 'sqrt'
};
for (const k in SYMBOLS) SYMBOLS[k] = ` ${SYMBOLS[k]} `;

const BASE = { ...LATIN, ...GREEK, ...CYRILLIC, ...SYMBOLS };

// Language-specific rules, applied before the defaults (keyed by language subtag).
const LOCALES = {
  de: table('ä ae ö oe ü ue'),
  da: table('æ ae ø oe å aa'),
  uk: table('г h и y і i ї yi є ye ґ g й y'),
  bg: table('щ sht ъ a')
};
LOCALES.nb = LOCALES.nn = LOCALES.no = LOCALES.da;

// Emoji -> name. Variation selectors and skin tones are stripped before lookup.
export const EMOJI = {
  '😀': 'grinning', '😃': 'smiley', '😄': 'smile', '😁': 'grin', '😆': 'laughing',
  '😅': 'sweat smile', '🤣': 'rofl', '😂': 'joy', '🙂': 'slight smile', '🙃': 'upside down',
  '😉': 'wink', '😊': 'blush', '😇': 'innocent', '🥰': 'smiling hearts', '😍': 'heart eyes',
  '🤩': 'star struck', '😘': 'kiss', '😋': 'yum', '😛': 'tongue', '😜': 'wink tongue',
  '🤪': 'zany', '🤔': 'thinking', '🤫': 'shush', '🤐': 'zipper mouth', '😐': 'neutral',
  '😑': 'expressionless', '😶': 'no mouth', '😏': 'smirk', '😒': 'unamused', '🙄': 'eye roll',
  '😬': 'grimace', '😌': 'relieved', '😔': 'pensive', '😪': 'sleepy', '😴': 'sleeping',
  '😷': 'mask', '🤒': 'sick', '🤢': 'nauseated', '🤮': 'vomit', '🥵': 'hot',
  '🥶': 'cold', '😵': 'dizzy', '🤯': 'mind blown', '🥳': 'party', '😎': 'cool',
  '🤓': 'nerd', '🧐': 'monocle', '😕': 'confused', '😟': 'worried', '😮': 'open mouth',
  '😲': 'astonished', '😳': 'flushed', '🥺': 'pleading', '😢': 'cry', '😭': 'sob',
  '😱': 'scream', '😤': 'triumph', '😡': 'angry', '😠': 'mad', '🤬': 'cursing',
  '😈': 'devil', '💀': 'skull', '💩': 'poop', '🤡': 'clown', '👻': 'ghost',
  '👽': 'alien', '🤖': 'robot', '😺': 'smiley cat', '🙈': 'see no evil', '🙉': 'hear no evil',
  '🙊': 'speak no evil', '💋': 'kiss mark', '💌': 'love letter', '💘': 'cupid', '💔': 'broken heart',
  '❤': 'heart', '🧡': 'orange heart', '💛': 'yellow heart', '💚': 'green heart', '💙': 'blue heart',
  '💜': 'purple heart', '🖤': 'black heart', '🤍': 'white heart', '💯': '100', '💥': 'boom',
  '💫': 'dizzy star', '💦': 'sweat drops', '💨': 'dash', '💬': 'speech', '💤': 'zzz',
  '👋': 'wave', '✋': 'raised hand', '👌': 'ok hand', '✌': 'victory', '🤞': 'fingers crossed',
  '🤘': 'rock on', '🤙': 'call me', '👈': 'point left', '👉': 'point right', '👆': 'point up',
  '👇': 'point down', '👍': 'thumbs up', '👎': 'thumbs down', '✊': 'fist', '👊': 'punch',
  '👏': 'clap', '🙌': 'raised hands', '👐': 'open hands', '🤝': 'handshake', '🙏': 'pray',
  '✍': 'writing', '💪': 'muscle', '🧠': 'brain', '👀': 'eyes', '👶': 'baby',
  '👨\u200D💻': 'technologist', '👩\u200D💻': 'technologist', '🧑\u200D💻': 'technologist', '🧑\u200D🍳': 'cook', '🎅': 'santa',
  '👑': 'crown', '🎓': 'graduation cap', '👓': 'glasses', '🐶': 'dog', '🐱': 'cat',
  '🐭': 'mouse', '🐰': 'rabbit', '🦊': 'fox', '🐻': 'bear', '🐼': 'panda',
  '🐨': 'koala', '🐯': 'tiger', '🦁': 'lion', '🐮': 'cow', '🐷': 'pig',
  '🐸': 'frog', '🐵': 'monkey', '🐔': 'chicken', '🐧': 'penguin', '🐦': 'bird',
  '🦄': 'unicorn', '🐝': 'bee', '🦋': 'butterfly', '🐢': 'turtle', '🐍': 'snake',
  '🐙': 'octopus', '🐳': 'whale', '🐬': 'dolphin', '🐟': 'fish', '🦈': 'shark',
  '🌸': 'cherry blossom', '🌹': 'rose', '🌻': 'sunflower', '🌲': 'evergreen tree', '🌳': 'tree',
  '🌴': 'palm tree', '🌵': 'cactus', '🍀': 'four leaf clover', '🍁': 'maple leaf', '🍄': 'mushroom',
  '🌍': 'earth', '🌎': 'earth', '🌏': 'earth', '🌙': 'moon', '⭐': 'star',
  '🌟': 'glowing star', '☀': 'sun', '⛅': 'partly cloudy', '☁': 'cloud', '🌧': 'rain',
  '⛈': 'storm', '❄': 'snowflake', '⛄': 'snowman', '🔥': 'fire', '💧': 'droplet',
  '🌊': 'wave', '🌈': 'rainbow', '⚡': 'lightning', '🍎': 'apple', '🍊': 'orange',
  '🍋': 'lemon', '🍌': 'banana', '🍉': 'watermelon', '🍇': 'grapes', '🍓': 'strawberry',
  '🍒': 'cherries', '🍑': 'peach', '🥑': 'avocado', '🍅': 'tomato', '🥕': 'carrot',
  '🌽': 'corn', '🌶': 'hot pepper', '🍞': 'bread', '🧀': 'cheese', '🍔': 'burger',
  '🍟': 'fries', '🍕': 'pizza', '🌭': 'hot dog', '🌮': 'taco', '🌯': 'burrito',
  '🍣': 'sushi', '🍜': 'ramen', '🍝': 'spaghetti', '🍦': 'ice cream', '🍩': 'donut',
  '🍪': 'cookie', '🎂': 'birthday cake', '🍰': 'cake', '🍫': 'chocolate', '🍬': 'candy',
  '🍿': 'popcorn', '☕': 'coffee', '🍵': 'tea', '🍺': 'beer', '🍻': 'cheers',
  '🍷': 'wine', '🍸': 'cocktail', '🥂': 'toast', '⚽': 'soccer', '🏀': 'basketball',
  '🏈': 'football', '⚾': 'baseball', '🎾': 'tennis', '🏆': 'trophy', '🥇': 'gold medal',
  '🎮': 'video game', '🎲': 'dice', '🎯': 'bullseye', '🎨': 'art', '🎬': 'clapper',
  '🎤': 'microphone', '🎧': 'headphones', '🎵': 'music', '🎶': 'notes', '🎸': 'guitar',
  '🎹': 'piano', '🎉': 'tada', '🎊': 'confetti', '🎈': 'balloon', '🎁': 'gift',
  '🚗': 'car', '🚕': 'taxi', '🚌': 'bus', '🚲': 'bike', '🚀': 'rocket',
  '✈': 'airplane', '🚢': 'ship', '🏠': 'house', '🏢': 'office', '🏥': 'hospital',
  '🏫': 'school', '⛪': 'church', '🗽': 'statue of liberty', '🗼': 'tower', '⌚': 'watch',
  '📱': 'phone', '💻': 'laptop', '🖥': 'desktop', '⌨': 'keyboard', '🖱': 'mouse',
  '📷': 'camera', '📺': 'tv', '💡': 'bulb', '🔋': 'battery', '🔌': 'plug',
  '💰': 'money bag', '💵': 'dollar', '💳': 'credit card', '💎': 'gem', '🔧': 'wrench',
  '🔨': 'hammer', '⚙': 'gear', '🔒': 'lock', '🔓': 'unlock', '🔑': 'key',
  '📌': 'pin', '📎': 'paperclip', '✂': 'scissors', '📝': 'memo', '📚': 'books',
  '📖': 'book', '📅': 'calendar', '📈': 'chart up', '📉': 'chart down', '📊': 'bar chart',
  '📦': 'package', '📧': 'email', '✉': 'envelope', '🔔': 'bell', '📣': 'megaphone',
  '🔍': 'search', '⏰': 'alarm clock', '⏳': 'hourglass', '🚧': 'construction', '🚨': 'siren',
  '⚠': 'warning', '⛔': 'no entry', '🚫': 'prohibited', '✅': 'check', '✔': 'check mark',
  '☑': 'ballot check', '❌': 'cross', '❎': 'cross mark', '❓': 'question', '❗': 'exclamation',
  '➕': 'plus', '➖': 'minus', '➗': 'divide', '♻': 'recycle', '🆕': 'new',
  '🆗': 'ok', '🆒': 'cool', '🆓': 'free', '🔝': 'top', '🔴': 'red circle',
  '🟢': 'green circle', '🔵': 'blue circle', '⚫': 'black circle', '⚪': 'white circle', '🏁': 'checkered flag',
  '🚩': 'red flag', '🏳\u200D🌈': 'rainbow flag', '🏴\u200D☠': 'pirate flag', '☮': 'peace', '☯': 'yin yang'
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keyRe = (keys) => new RegExp(keys.sort((a, b) => b.length - a.length).map(escapeRe).join('|'), 'gu');
const EMOJI_RE = keyRe(Object.keys(EMOJI));

const MAPPED_SCRIPT_MARK = /([\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}])\p{M}+/gu;
const NOT_WORD = /[^\p{L}\p{N}\p{M}]+/u;

const isUpper = (c) => c !== undefined && c !== c.toLowerCase();

// Replace characters via `map`. A multi-letter replacement for an uppercase letter is
// fully uppercased when a neighbour is uppercase too (ЖУК -> ZHUK, but Жук -> Zhuk).
function mapChars(s, map) {
  const chars = [...s];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    let r = map[c];
    if (r === undefined) { out += c; continue; }
    if (r.length > 1 && isUpper(c) && (isUpper(chars[i + 1]) || (isUpper(chars[i - 1]) && !/\p{L}/u.test(chars[i + 1] ?? '')))) r = r.toUpperCase();
    out += r;
  }
  return out;
}

export function slugify(input, options = {}) {
  const {
    separator = '-',
    lowercase = true,
    maxLength = 0,
    emoji = true,
    custom,
    locale,
    unicode = 'keep'
  } = options;

  let s = String(input ?? '').normalize('NFC');

  // 1. User replacements first, so they can override anything below.
  if (custom) {
    const map = Object.fromEntries(Array.isArray(custom) ? custom : Object.entries(custom));
    const keys = Object.keys(map).filter(Boolean);
    if (keys.length) s = s.replace(keyRe(keys), (m) => String(map[m]));
  }

  // 2. Emoji: drop variation selectors and skin tones, name flags and known emoji.
  s = s.replace(/[\uFE00-\uFE0F\u20E3]|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}/gu, '');
  if (emoji) {
    s = s.replace(EMOJI_RE, (m) => ` ${EMOJI[m]} `);
    s = s.replace(/([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/gu, (_, a, b) =>
      ` flag ${String.fromCharCode(a.codePointAt(0) - 0x1f185, b.codePointAt(0) - 0x1f185)} `);
  }
  s = s.replace(/\u200D/g, ' ');

  // Lowercase before transliterating so locale rules apply (Turkish İ -> i, I -> ı -> i).
  if (lowercase) s = locale ? s.toLocaleLowerCase(locale) : s.toLowerCase();

  // 3. Transliterate: locale rules, then the defaults, then decompose and strip accents.
  const lang = locale && String(locale).toLowerCase().split(/[-_]/)[0];
  if (lang && LOCALES[lang]) s = mapChars(s, LOCALES[lang]);
  s = mapChars(s, BASE);
  s = s.normalize('NFKD').replace(MAPPED_SCRIPT_MARK, '$1');
  s = mapChars(s, BASE).normalize('NFC'); // NFC re-composes kana, Hangul, etc.

  // 4. Apostrophes join words ("don't" -> "dont"); everything else that isn't a letter,
  //    number or combining mark is a word boundary.
  s = s.replace(/(\p{L})['’ʼ`](?=\p{L})/gu, '$1');
  if (unicode === 'drop') s = s.replace(/[^\x00-\x7F]+/g, ' ');
  s = s.replace(/(^|[^\p{L}\p{N}\p{M}])\p{M}+/gu, '$1'); // stray marks with no base letter

  const words = s.split(NOT_WORD).filter(Boolean);

  // 5. maxLength: keep whole words; hard-cut only if the first word alone is too long.
  if (maxLength > 0) {
    const sepLen = [...separator].length;
    const kept = [];
    let len = 0;
    for (const w of words) {
      const wLen = [...w].length;
      const next = len + (kept.length ? sepLen : 0) + wLen;
      if (next > maxLength) {
        if (!kept.length) kept.push([...w].slice(0, maxLength).join(''));
        break;
      }
      kept.push(w);
      len = next;
    }
    return kept.join(separator);
  }
  return words.join(separator);
}

export default slugify;
