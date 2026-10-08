import { test } from 'node:test';
import assert from 'node:assert/strict';
import slugifyDefault, { slugify, EMOJI } from '../index.js';

const cp = (...codes) => String.fromCodePoint(...codes);
const ZWJ = cp(0x200d), VS16 = cp(0xfe0f);

test('default export', () => {
  assert.equal(slugifyDefault, slugify);
});

test('basics', () => {
  assert.equal(slugify('Hello World!'), 'hello-world');
  assert.equal(slugify('  --Hello,   World--  '), 'hello-world');
  assert.equal(slugify('one_two.three/four\\five'), 'one-two-three-four-five');
  assert.equal(slugify('Version 2.0 (beta)'), 'version-2-0-beta');
  assert.equal(slugify(''), '');
  assert.equal(slugify('!!!'), '');
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(12345), '12345');
});

test('apostrophes join words', () => {
  assert.equal(slugify("Don't stop"), 'dont-stop');
  assert.equal(slugify('It’s here'), 'its-here');
  assert.equal(slugify("'quoted'"), 'quoted');
});

test('diacritics are stripped via NFKD', () => {
  assert.equal(slugify('Crème brûlée'), 'creme-brulee');
  assert.equal(slugify('Ünïcödé façade naïve'), 'unicode-facade-naive');
  assert.equal(slugify('São Paulo, Açaí'), 'sao-paulo-acai');
  assert.equal(slugify('Čeština Šťastný Žluťoučký'), 'cestina-stastny-zlutoucky');
  assert.equal(slugify('Ångström Ölkälla'), 'angstrom-olkalla');
  assert.equal(slugify('Ştefan Ţară Ğüzel'), 'stefan-tara-guzel');
  assert.equal(slugify('Nguyễn Việt'), 'nguyen-viet');
});

test('NFKD compatibility forms', () => {
  assert.equal(slugify('ﬁnal ﬂow'), 'final-flow');
  assert.equal(slugify('① ② ③'), '1-2-3');
  assert.equal(slugify('ＦＵＬＬ ｗｉｄｔｈ'), 'full-width');
  assert.equal(slugify('x²'), 'x2');
});

test('Latin extended letters', () => {
  assert.equal(slugify('Straße'), 'strasse');
  assert.equal(slugify('Æsir Ærøskøbing'), 'aesir-aeroskobing');
  assert.equal(slugify('Œuvre cœur'), 'oeuvre-coeur');
  assert.equal(slugify('Łódź Wrocław'), 'lodz-wroclaw');
  assert.equal(slugify('Đorđe Đoković'), 'dorde-dokovic');
  assert.equal(slugify('Þórður Guðrún'), 'thordur-gudrun');
  assert.equal(slugify('Ħamrun'), 'hamrun');
  assert.equal(slugify('Diyarbakır'), 'diyarbakir');
});

test('Greek', () => {
  assert.equal(slugify('Αθήνα'), 'athina');
  assert.equal(slugify('Θεσσαλονίκη'), 'thessaloniki');
  assert.equal(slugify('Ψυχή Χάος'), 'psychi-chaos');
  assert.equal(slugify('καλημέρα κόσμε'), 'kalimera-kosme');
  assert.equal(slugify('ΑΘΗΝΑ', { lowercase: false }), 'ATHINA');
});

test('Cyrillic', () => {
  assert.equal(slugify('Москва'), 'moskva');
  assert.equal(slugify('Привет, мир!'), 'privet-mir');
  assert.equal(slugify('Щука Ёжик Объём'), 'shchuka-yozhik-obyom');
  assert.equal(slugify('Чайковский'), 'chaykovskiy');
  assert.equal(slugify('Юлия Яна Цветаева Хабаровск'), 'yuliya-yana-tsvetaeva-khabarovsk');
  assert.equal(slugify('Жук', { lowercase: false }), 'Zhuk');
  assert.equal(slugify('ЖУК ЩИ', { lowercase: false }), 'ZHUK-SHCHI');
  assert.equal(slugify('Београд Љубљана Њујорк Џон'), 'beograd-ljubljana-njujork-dzon');
});

test('symbols become words', () => {
  assert.equal(slugify('Salt & Pepper'), 'salt-and-pepper');
  assert.equal(slugify('50% off'), '50-percent-off');
  assert.equal(slugify('me@home'), 'me-at-home');
  assert.equal(slugify('C+D'), 'c-plus-d');
  assert.equal(slugify('$5 or €5 or £5 or ¥5'), 'dollar-5-or-euro-5-or-pound-5-or-yen-5');
  assert.equal(slugify('Brand™ ©2026 ®'), 'brand-tm-c-2026-r');
  assert.equal(slugify('20°C'), '20-deg-c');
  assert.equal(slugify('I ♥ JS'), 'i-love-js');
});

test('emoji become names', () => {
  assert.equal(slugify('I ❤️ NY'), 'i-heart-ny');
  assert.equal(slugify('I ❤ NY'), 'i-heart-ny');
  assert.equal(slugify('Launch 🚀🚀'), 'launch-rocket-rocket');
  assert.equal(slugify('🔥hot🔥'), 'fire-hot-fire');
  assert.equal(slugify('👍🏽 great'), 'thumbs-up-great'); // skin tone stripped
  assert.equal(slugify('🍕 & 🍺'), 'pizza-and-beer');
  assert.equal(slugify(`${cp(0x1f468)}${ZWJ}${cp(0x1f4bb)} jobs`), 'technologist-jobs');
  assert.equal(slugify(`${cp(0x1f3f3)}${VS16}${ZWJ}${cp(0x1f308)}`), 'rainbow-flag');
  assert.equal(slugify(`1${VS16}${cp(0x20e3)} first`), '1-first'); // keycap
  assert.equal(slugify('🇺🇸 vs 🇩🇪'), 'flag-us-vs-flag-de');
  assert.equal(slugify('✅ done'), 'check-done');
});

test('unknown emoji are dropped', () => {
  assert.equal(slugify(`hello ${cp(0x1fae0)} world`), 'hello-world'); // melting face, not in table
});

test('emoji: false drops emoji', () => {
  assert.equal(slugify('I ❤️ NY 🚀', { emoji: false }), 'i-ny');
  assert.equal(slugify('🇺🇸 news', { emoji: false }), 'news');
});

test('emoji table has at least 100 entries with slug-safe names', () => {
  const entries = Object.entries(EMOJI);
  assert.ok(entries.length >= 100, `only ${entries.length}`);
  for (const [k, v] of entries) {
    assert.match(v, /^[a-z0-9]+( [a-z0-9]+)*$/, `bad name for ${k}`);
    assert.ok(!k.includes(VS16), `table key ${k} must not contain VS16`);
    assert.equal(slugify(k), v.replace(/ /g, '-'), `round trip ${k}`);
  }
});

test('separator option', () => {
  assert.equal(slugify('Hello big World', { separator: '_' }), 'hello_big_world');
  assert.equal(slugify('Hello big World', { separator: '' }), 'hellobigworld');
  assert.equal(slugify('Hello big World', { separator: '--' }), 'hello--big--world');
  assert.equal(slugify('a - b -- c', { separator: '.' }), 'a.b.c');
});

test('lowercase option', () => {
  assert.equal(slugify('Hello World', { lowercase: false }), 'Hello-World');
  assert.equal(slugify('Ærø Łódź', { lowercase: false }), 'AEro-Lodz');
});

test('maxLength cuts on word boundaries', () => {
  const s = 'The quick brown fox jumps over';
  assert.equal(slugify(s, { maxLength: 100 }), 'the-quick-brown-fox-jumps-over');
  assert.equal(slugify(s, { maxLength: 15 }), 'the-quick-brown'); // exact fit
  assert.equal(slugify(s, { maxLength: 16 }), 'the-quick-brown');
  assert.equal(slugify(s, { maxLength: 14 }), 'the-quick');
  assert.equal(slugify(s, { maxLength: 3 }), 'the');
  assert.equal(slugify(s, { maxLength: 2 }), 'th'); // first word alone too long: hard cut
  assert.equal(slugify('Supercalifragilistic expialidocious', { maxLength: 10 }), 'supercalif');
  assert.equal(slugify(s, { maxLength: 0 }), 'the-quick-brown-fox-jumps-over');
  assert.equal(slugify(s, { maxLength: 9, separator: '' }), 'thequick');
  assert.equal(slugify(s, { maxLength: 10, separator: '__' }), 'the__quick');
  for (let n = 1; n < 40; n++) {
    const out = slugify(s, { maxLength: n });
    assert.ok(out.length <= n, `length ${n}`);
    assert.ok(!out.endsWith('-') && !out.startsWith('-'));
  }
});

test('maxLength counts code points', () => {
  assert.equal(slugify('東京 タワー', { maxLength: 4 }), '東京');
  assert.equal(slugify('東京 タワー', { maxLength: 6 }), '東京-タワー');
});

test('custom replacements run first, longest match wins', () => {
  assert.equal(slugify('C++ and C# and C', { custom: { 'C++': 'cpp', 'C#': 'csharp' } }), 'cpp-and-csharp-and-c');
  assert.equal(slugify('Tom & Jerry', { custom: { '&': ' y ' } }), 'tom-y-jerry');
  assert.equal(slugify('a.b', { custom: [['.', ' dot ']] }), 'a-dot-b');
  assert.equal(slugify('ö', { custom: { 'ö': 'oe' } }), 'oe');
  assert.equal(slugify('abc', { custom: { '': 'x' } }), 'abc'); // empty keys ignored
  assert.equal(slugify('a*b', { custom: { '*': ' star ' } }), 'a-star-b'); // regex chars escaped
});

test('locale rules', () => {
  assert.equal(slugify('Müller Größe Übermut'), 'muller-grosse-ubermut');
  assert.equal(slugify('Müller Größe Übermut', { locale: 'de' }), 'mueller-groesse-uebermut');
  assert.equal(slugify('Müller', { locale: 'de-AT', lowercase: false }), 'Mueller');
  assert.equal(slugify('Ærø Ålborg', { locale: 'da' }), 'aeroe-aalborg');
  assert.equal(slugify('Tromsø', { locale: 'nb' }), 'tromsoe');
  assert.equal(slugify('Київ Гліб'), 'kiyiv-glib');
  assert.equal(slugify('Київ Гліб', { locale: 'uk' }), 'kyyiv-hlib');
  assert.equal(slugify('България Щастие', { locale: 'bg' }), 'balgariya-shtastie');
  assert.equal(slugify('ISTANBUL Iğdır', { locale: 'tr' }), 'istanbul-igdir');
  assert.equal(slugify('İzmir'), 'izmir');
  assert.equal(slugify('Müller', { locale: 'xx' }), 'muller'); // unknown locale: defaults only
});

test('untransliterable scripts are kept by default', () => {
  assert.equal(slugify('東京タワー 2026'), '東京タワー-2026');
  assert.equal(slugify('がんばれ！'), 'がんばれ'); // voiced kana survive NFKD
  assert.equal(slugify('한국어 문장'), '한국어-문장'); // Hangul recomposed
  assert.equal(slugify('مرحبا بالعالم'), 'مرحبا-بالعالم');
  assert.equal(slugify('שלום עולם'), 'שלום-עולם');
  assert.equal(slugify('नमस्ते दुनिया'), 'नमस्ते-दुनिया'); // Devanagari vowel signs kept
  assert.equal(slugify('สวัสดี'), 'สวัสดี');
  assert.equal(slugify('東京、大阪。京都'), '東京-大阪-京都'); // CJK punctuation is a separator
});

test("unicode: 'drop' removes untransliterable letters", () => {
  assert.equal(slugify('東京 Tower', { unicode: 'drop' }), 'tower');
  assert.equal(slugify('Café 東京 Москва', { unicode: 'drop' }), 'cafe-moskva');
  assert.equal(slugify('東京', { unicode: 'drop' }), '');
});

test('output only contains letters, numbers, marks and the separator', () => {
  const inputs = ['Hello <script>alert(1)</script>', 'a/b?c=d&e#f', '"quotes" `ticks`', 'tab\tnew\nline', '../../etc/passwd'];
  for (const input of inputs) {
    assert.match(slugify(input), /^[\p{L}\p{N}\p{M}]+(-[\p{L}\p{N}\p{M}]+)*$/u, input);
  }
  assert.equal(slugify('../../etc/passwd'), 'etc-passwd');
});

test('idempotent', () => {
  for (const input of ['Crème brûlée & café 🔥', 'Москва', '東京 タワー', 'a--b']) {
    const once = slugify(input);
    assert.equal(slugify(once), once);
  }
});
