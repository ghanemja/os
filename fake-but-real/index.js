// fake-but-real — believable, seedable placeholder data. Zero dependencies.

/** mulberry32: tiny, fast, good-enough 32-bit PRNG. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash so string seeds work too. */
function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  const str = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Word lists. Names are grouped by region so first and last names fit together.
// ---------------------------------------------------------------------------

const NAMES = {
  anglo: {
    first: ['Olivia', 'James', 'Amelia', 'Oliver', 'Charlotte', 'Henry', 'Grace', 'Theo', 'Ruby', 'Samuel', 'Harriet', 'Arthur', 'Isla', 'Jack', 'Eleanor', 'Leo'],
    last: ['Bennett', 'Hughes', 'Carter', 'Whitaker', 'Fletcher', 'Holloway', 'Pearson', 'Marsh', 'Ellison', 'Thornton', 'Granger', 'Ashby', 'Caldwell', 'Shaw'],
  },
  hispanic: {
    first: ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Diego', 'Lucía', 'Alejandro', 'Isabel', 'Javier', 'Carmen', 'Andrés', 'Paloma', 'Rafael'],
    last: ['García', 'Romero', 'Navarro', 'Castillo', 'Vargas', 'Morales', 'Ortega', 'Delgado', 'Herrera', 'Fuentes', 'Medina', 'Salazar', 'Reyes', 'Ibarra'],
  },
  westAfrican: {
    first: ['Amara', 'Kwame', 'Adaeze', 'Kofi', 'Chiamaka', 'Tunde', 'Abena', 'Emeka', 'Yaa', 'Oluwaseun', 'Nneka', 'Kojo', 'Folake', 'Ifeanyi'],
    last: ['Okafor', 'Mensah', 'Adeyemi', 'Boateng', 'Nwosu', 'Asante', 'Okonkwo', 'Owusu', 'Balogun', 'Eze', 'Appiah', 'Adebayo', 'Obi', 'Danquah'],
  },
  eastAsian: {
    first: ['Mei', 'Hiroshi', 'Yuna', 'Wei', 'Haruka', 'Jun', 'Seo-yeon', 'Kenji', 'Lian', 'Min-jun', 'Aiko', 'Chen', 'Ji-woo', 'Ren'],
    last: ['Tanaka', 'Wang', 'Kim', 'Nakamura', 'Li', 'Park', 'Sato', 'Zhang', 'Choi', 'Watanabe', 'Liu', 'Kobayashi', 'Han', 'Yamamoto'],
  },
  southAsian: {
    first: ['Priya', 'Arjun', 'Ananya', 'Rohan', 'Kavya', 'Vikram', 'Meera', 'Aditya', 'Ishaan', 'Nisha', 'Rahul', 'Divya', 'Sanjay', 'Tara'],
    last: ['Sharma', 'Patel', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Desai', 'Menon', 'Kapoor', 'Rao', 'Banerjee', 'Joshi', 'Pillai', 'Chopra'],
  },
  arabic: {
    first: ['Layla', 'Omar', 'Yasmin', 'Karim', 'Noor', 'Tariq', 'Salma', 'Youssef', 'Rania', 'Hamza', 'Dalia', 'Samir', 'Huda', 'Ziad'],
    last: ['Haddad', 'Mansour', 'Khalil', 'Nasser', 'Saleh', 'Farouk', 'Aziz', 'Hamdan', 'Rahman', 'Ghanem', 'Sabbagh', 'Darwish', 'Karam', 'Amin'],
  },
  european: {
    first: ['Elena', 'Lukas', 'Chiara', 'Matteo', 'Anouk', 'Jonas', 'Ingrid', 'Mathieu', 'Zofia', 'Nikolai', 'Freya', 'Luca', 'Margaux', 'Henrik'],
    last: ['Rossi', 'Müller', 'Dubois', 'Jansen', 'Kowalski', 'Lindqvist', 'Bianchi', 'Novak', 'Petrov', 'Moreau', 'Fischer', 'Horvat', 'Andersen', 'Costa'],
  },
  pacific: {
    first: ['Leilani', 'Tane', 'Moana', 'Keanu', 'Aroha', 'Sione', 'Mere', 'Nalu', 'Ana', 'Rawiri', 'Kalani', 'Tevita'],
    last: ['Kealoha', 'Tupou', 'Ngata', 'Fifita', 'Kahale', 'Parata', 'Mahoe', 'Taufa', 'Akana', 'Walker', 'Faleolo', 'Kanoho'],
  },
};
const REGIONS = Object.keys(NAMES);

const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net'];
const USERNAME_WORDS = ['pixel', 'cosmic', 'quiet', 'river', 'maple', 'lunar', 'copper', 'ember', 'nova', 'orbit', 'fern', 'atlas', 'harbor', 'tide', 'cedar', 'sparrow'];
const AREA_CODES = ['201', '212', '213', '303', '312', '404', '415', '503', '512', '602', '617', '702', '718', '773', '801', '919'];

const COMPANY_PREFIX = ['North', 'Bright', 'Blue', 'Iron', 'Silver', 'Harbor', 'Summit', 'Clear', 'Golden', 'Evergreen', 'Atlas', 'Pioneer', 'Cedar', 'Lumen', 'Quarry', 'Willow'];
const COMPANY_CORE = ['field', 'stone', 'bridge', 'light', 'wave', 'peak', 'works', 'leaf', 'path', 'craft', 'line', 'forge', 'gate', 'spring'];
const COMPANY_SUFFIX = ['Labs', 'Co.', 'Studio', 'Systems', 'Group', 'Partners', 'Collective', 'Industries', 'Analytics', 'Logistics', 'Health', 'Foods', 'Robotics', 'Design'];

const JOB_LEVEL = ['', '', 'Senior ', 'Lead ', 'Junior ', 'Principal ', 'Associate '];
const JOB_AREA = ['Product', 'Data', 'Marketing', 'Customer Success', 'Operations', 'Platform', 'Brand', 'Finance', 'Research', 'Growth', 'Security', 'Supply Chain'];
const JOB_ROLE = ['Manager', 'Engineer', 'Designer', 'Analyst', 'Strategist', 'Coordinator', 'Specialist', 'Consultant', 'Director', 'Architect'];

const PRODUCT_ADJ = ['Classic', 'Everyday', 'Ultralight', 'Organic', 'Handmade', 'Compact', 'Premium', 'Recycled', 'Weatherproof', 'Cordless', 'Insulated', 'Modular'];
const PRODUCT_MATERIAL = ['Linen', 'Oak', 'Ceramic', 'Merino', 'Bamboo', 'Steel', 'Cotton', 'Walnut', 'Glass', 'Leather', 'Cork', 'Copper'];
const PRODUCT_ITEMS = [
  ['Tote Bag', 18, 45], ['Desk Lamp', 35, 120], ['Water Bottle', 15, 40], ['Throw Blanket', 40, 140],
  ['Pour-Over Kettle', 30, 90], ['Notebook', 6, 24], ['Backpack', 50, 180], ['Coffee Mug', 9, 28],
  ['Cutting Board', 20, 75], ['Wireless Speaker', 45, 220], ['Plant Pot', 12, 48], ['Running Jacket', 60, 190],
  ['Wall Clock', 25, 95], ['Phone Stand', 10, 35], ['Chef Knife', 40, 160], ['Bed Sheets', 55, 180],
];

const STREET_NAMES = ['Juniper', 'Maple', 'Hawthorn', 'Willow', 'Larkspur', 'Bramble', 'Cobalt', 'Foxglove', 'Linden', 'Marigold', 'Quail', 'Saffron', 'Thistle', 'Wren', 'Alder', 'Briar'];
const STREET_TYPES = ['Street', 'Avenue', 'Lane', 'Road', 'Court', 'Way', 'Terrace', 'Drive', 'Place', 'Row'];
const CITY_START = ['Ash', 'Brook', 'Clear', 'Elm', 'Fair', 'Green', 'Hollow', 'Lake', 'Mill', 'Oak', 'Pine', 'Red', 'Stone', 'West', 'Wood', 'Glen'];
const CITY_END = ['field', 'ford', 'haven', 'ridge', 'ton', 'wood', 'brook', 'dale', 'port', 'view', 'mont', 'bury'];
const CITY_FORMAT = ['{c}', '{c}', '{c}', 'Port {c}', '{c} Falls', 'New {c}', '{c} Springs'];
const REGIONS_ADDR = [
  ['Oregon', 'OR'], ['Vermont', 'VT'], ['Colorado', 'CO'], ['Maine', 'ME'], ['Ohio', 'OH'], ['Georgia', 'GA'],
  ['Minnesota', 'MN'], ['New Mexico', 'NM'], ['Virginia', 'VA'], ['Michigan', 'MI'], ['Montana', 'MT'], ['Iowa', 'IA'],
];

const BIO_OPENERS = [
  '{first} is a {job} based in {city}.',
  'Originally from {city}, {first} now works as a {job}.',
  '{first} has spent the last {years} years as a {job}.',
  'By day, {first} is a {job} at {company}.',
];
const BIO_MIDDLES = [
  'They care about clear writing and well-named variables.',
  'Most weekends you will find them {hobby}.',
  'Before that, they spent a few years {hobby} semi-professionally.',
  'They are currently learning {skill} and enjoying it more than expected.',
  'Their team relies on them for calm, practical advice.',
];
const BIO_CLOSERS = [
  'Ask them about {hobby}.',
  'Coffee is non-negotiable.',
  'They are always happy to talk about {skill}.',
  'Currently reading three books at once.',
  '',
];
const HOBBIES = ['baking sourdough', 'trail running', 'restoring old bikes', 'birdwatching', 'playing chess', 'growing tomatoes', 'rock climbing', 'drawing maps', 'brewing tea', 'sailing'];
const SKILLS = ['Portuguese', 'woodworking', 'the cello', 'data visualization', 'pottery', 'Rust', 'film photography', 'typography'];

const REVIEW_TITLES = {
  1: ['Disappointed', 'Not as described', 'Would not buy again'],
  2: ['Just okay', 'Expected more', 'Has some issues'],
  3: ['Decent for the price', 'Does the job', 'Mixed feelings'],
  4: ['Really solid', 'Very happy overall', 'Great value'],
  5: ['Absolutely love it', 'Exceeded expectations', 'Perfect'],
};
const REVIEW_BODIES = {
  1: ['It stopped working after {n} days.', 'The quality felt much cheaper than the photos suggested.', 'Shipping took {n} weeks and the box was damaged.'],
  2: ['It works, but the finish started wearing off quickly.', 'Smaller than I expected and a bit flimsy.', 'Customer support was slow to respond.'],
  3: ['It does what it says, nothing more.', 'Good quality, though the color is slightly off.', 'Fine for everyday use, but I would not gift it.'],
  4: ['Well made and arrived quickly.', 'I have used it daily for {n} weeks with no complaints.', 'Nice design, just wish it came in more colors.'],
  5: ['Beautifully made and exactly what I needed.', 'I bought a second one for my {relative}.', 'After {n} months it still looks brand new.'],
};
const RELATIVES = ['sister', 'brother', 'mom', 'dad', 'best friend', 'neighbor', 'partner'];

const DAY = 86400000;

function toTime(d, fallback) {
  if (d == null) return fallback;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (Number.isNaN(t)) throw new TypeError(`Invalid date: ${d}`);
  return t;
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
}

function slug(s) {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Create a seeded faker. Same seed, same sequence of values.
 * @param {number|string} [seed]
 */
export function createFaker(seed = 1) {
  const rand = mulberry32(hashSeed(seed));

  const random = () => rand();
  const int = (min, max) => {
    if (max === undefined) [min, max] = [0, min];
    return min + Math.floor(rand() * (max - min + 1));
  };
  const float = (min = 0, max = 1, decimals = 2) => {
    const f = 10 ** decimals;
    return Math.round((min + rand() * (max - min)) * f) / f;
  };
  const bool = (probability = 0.5) => rand() < probability;
  const pick = (arr) => {
    if (!arr || arr.length === 0) throw new RangeError('pick() needs a non-empty array');
    return arr[Math.floor(rand() * arr.length)];
  };
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => (typeof vars[k] === 'function' ? vars[k]() : vars[k]));

  const region = () => pick(REGIONS);
  const names = (r) => NAMES[r] || NAMES[region()];
  const firstName = (r) => pick(names(r).first);
  const lastName = (r) => pick(names(r).last);
  const fullName = (r) => {
    const n = names(r);
    return `${pick(n.first)} ${pick(n.last)}`;
  };

  const username = (first = firstName(), last = lastName()) => {
    const f = slug(first);
    const l = slug(last);
    switch (int(0, 3)) {
      case 0: return `${f}.${l}`;
      case 1: return `${f}${l[0]}${int(10, 99)}`;
      case 2: return `${pick(USERNAME_WORDS)}_${f}`;
      default: return `${f[0]}${l}`;
    }
  };

  const email = (first = firstName(), last = lastName()) => {
    const f = slug(first);
    const l = slug(last);
    const local = pick([`${f}.${l}`, `${f}${l}`, `${f[0]}${l}`, `${f}_${l}${int(1, 99)}`]);
    return `${local}@${pick(EMAIL_DOMAINS)}`;
  };

  // 555-0100 through 555-0199 are reserved for fiction in the NANP.
  const phone = () => `(${pick(AREA_CODES)}) 555-01${String(int(0, 99)).padStart(2, '0')}`;

  const person = () => {
    const r = region();
    const first = firstName(r);
    const last = lastName(r);
    return {
      firstName: first,
      lastName: last,
      fullName: `${first} ${last}`,
      email: email(first, last),
      username: username(first, last),
      phone: phone(),
    };
  };

  const company = () => {
    const name = int(0, 2) === 0 ? `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}` : `${pick(COMPANY_PREFIX)}${pick(COMPANY_CORE)} ${pick(COMPANY_SUFFIX)}`;
    return name;
  };

  const jobTitle = () => `${pick(JOB_LEVEL)}${pick(JOB_AREA)} ${pick(JOB_ROLE)}`;

  const product = () => {
    const [item, lo, hi] = pick(PRODUCT_ITEMS);
    const name = bool(0.5) ? `${pick(PRODUCT_ADJ)} ${pick(PRODUCT_MATERIAL)} ${item}` : `${pick(PRODUCT_ADJ)} ${item}`;
    const price = Math.max(lo, int(lo, hi) - 0.01);
    return { name, price: Math.round(price * 100) / 100, currency: 'USD' };
  };

  const city = () => fill(pick(CITY_FORMAT), { c: () => pick(CITY_START) + pick(CITY_END) });

  const address = () => {
    const street = `${int(1, 9899)} ${pick(STREET_NAMES)} ${pick(STREET_TYPES)}`;
    const c = city();
    const [regionName, regionCode] = pick(REGIONS_ADDR);
    const postalCode = String(int(10000, 99999));
    return {
      street,
      city: c,
      region: regionName,
      regionCode,
      postalCode,
      country: 'United States',
      full: `${street}, ${c}, ${regionCode} ${postalCode}`,
    };
  };

  const bio = (who = {}) => {
    const vars = {
      first: who.firstName || firstName(),
      job: (who.jobTitle || jobTitle()).toLowerCase(),
      company: who.company || company(),
      city: who.city || city(),
      years: int(2, 15),
      hobby: () => pick(HOBBIES),
      skill: () => pick(SKILLS),
    };
    return [pick(BIO_OPENERS), pick(BIO_MIDDLES), pick(BIO_CLOSERS)]
      .map((t) => fill(t, vars))
      .filter(Boolean)
      .join(' ');
  };

  const review = (opts = {}) => {
    const rating = opts.rating ?? pick([1, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5]);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new RangeError('rating must be an integer 1-5');
    const bodies = sample(REVIEW_BODIES[rating], int(1, 2));
    const text = bodies.map((b) => fill(b, { n: () => int(2, 11), relative: () => pick(RELATIVES) })).join(' ');
    return { rating, title: pick(REVIEW_TITLES[rating]), text, author: fullName() };
  };

  const date = ({ from, to } = {}) => {
    const end = toTime(to, Date.UTC(2026, 0, 1));
    const start = toTime(from, end - 365 * DAY);
    if (start > end) throw new RangeError('from must be before to');
    return new Date(start + Math.floor(rand() * (end - start + 1)));
  };

  const dateRange = ({ from, to, minDays = 1, maxDays = 30 } = {}) => {
    const start = date({ from, to });
    const days = int(minDays, maxDays);
    return { start, end: new Date(start.getTime() + days * DAY), days };
  };

  return {
    seed,
    random, int, float, bool, pick, shuffle, sample,
    firstName, lastName, fullName, person, email, username, phone,
    company, jobTitle, product, city, address, bio, review, date, dateRange,
  };
}

export default createFaker;
