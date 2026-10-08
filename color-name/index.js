// color-name: hex in, human color name out ("dusty teal").
// Nearest named color by CIEDE2000 distance in CIELAB space.

/** Parse #rgb, #rgba, #rrggbb or #rrggbbaa (the # is optional). Alpha is 0-1. */
export function parseHex(hex) {
  const m = typeof hex === 'string' && /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!m) throw new TypeError(`color-name: invalid hex color: ${String(hex)}`);
  let h = m[1];
  if (h.length <= 4) h = h.replace(/./g, '$&$&');
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

/** sRGB (0-255) to CIELAB, D65 white point. */
export function rgbToLab({ r, g, b }) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export const hexToLab = (hex) => rgbToLab(parseHex(hex));

const RAD = Math.PI / 180;

/** CIEDE2000 color difference (Sharma, Wu & Dalal 2005), kL = kC = kH = 1. */
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cm7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cm7 / (Cm7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (b, a) => {
    if (b === 0 && a === 0) return 0;
    const h = Math.atan2(b, a) / RAD;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hue(b1, a1p), h2p = hue(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * RAD);

  const Lpm = (L1 + L2) / 2;
  const Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hpm /= 2;
    else hpm = hpm < 360 ? (hpm + 360) / 2 : (hpm - 360) / 2;
  }

  const T = 1 - 0.17 * Math.cos((hpm - 30) * RAD) + 0.24 * Math.cos(2 * hpm * RAD)
    + 0.32 * Math.cos((3 * hpm + 6) * RAD) - 0.2 * Math.cos((4 * hpm - 63) * RAD);
  const dTheta = 30 * Math.exp(-(((hpm - 275) / 25) ** 2));
  const Cpm7 = Cpm ** 7;
  const RC = 2 * Math.sqrt(Cpm7 / (Cpm7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2);
  const SC = 1 + 0.045 * Cpm;
  const SH = 1 + 0.015 * Cpm * T;
  const RT = -Math.sin(2 * dTheta * RAD) * RC;

  const l = dLp / SL, c = dCp / SC, h = dHp / SH;
  return Math.sqrt(l * l + c * c + h * h + RT * c * h);
}

// Curated list: "rrggbb name" per line.
const DATA = `
ff0000 red
d0312d fire engine red
c21e2c cherry red
9e1b32 crimson
b5332e brick red
5e1916 oxblood
7b1e2b burgundy
6d1a2a merlot
800000 maroon
e34234 vermilion
f44336 tomato red
c94c4c dusty red
a23b3b barn red
4e1a20 dark wine
722f37 wine
b03a2e chili red
e25c4b poppy red
ff6961 pastel red
f08080 light coral
fa8072 salmon
e9967a dark salmon
ffa07a light salmon
cb4154 rose red
960018 carmine
ce2029 lava red
ff2400 scarlet
e32636 alizarin
8b0000 dark red
ab274f amaranth
ea3c53 watermelon
ffa500 orange
ff8c00 dark orange
cc5500 burnt orange
ff7518 pumpkin
f28500 tangerine
ed9121 carrot
ffb347 pastel orange
e97451 burnt sienna
fbceb1 apricot
ffcba4 peach
ff6700 safety orange
e86100 deep orange
e2725b terracotta
cc7722 ochre
f4a460 sandy orange
ffa168 cantaloupe
ff8243 mango
ff7f50 coral
fd5e53 sunset orange
b7410e rust
ff9f00 orange peel
e66c2c persimmon
f6a96d light peach
ffb37f creamsicle
ff5f1f neon orange
b66a50 clay
da8a67 copper rose
f9a65a melon
c35a2d paprika
ee7f2d marmalade
ffff00 yellow
fff44f lemon
ffd700 gold
f8de7e mellow yellow
ffc512 sunflower
ffef00 canary yellow
f4c430 saffron
e1ad01 mustard
eba937 honey
fbec5d maize
fffacd lemon chiffon
f0e68c khaki
bdb76b dark khaki
eee8aa pale goldenrod
daa520 goldenrod
b8860b dark goldenrod
cfb53b old gold
ffbf00 amber
fdf1a8 butter
f3e5ab vanilla
fffd37 electric yellow
e4d96f straw
b5a642 brass
d4af37 metallic gold
ffe135 banana
e8c547 hay
fdfd96 pastel yellow
eaa221 marigold
cfff04 neon yellow
c9a227 dijon
f7e7ce champagne
fafad2 pale yellow
dfc56a wheat gold
00ff00 lime
008000 green
228b22 forest green
013220 dark green
355e3b hunter green
50c878 emerald
00a86b jade
98ff98 mint green
3eb489 mint
9caf88 sage
6b8e23 olive drab
808000 olive
556b2f dark olive
7fff00 chartreuse
32cd32 lime green
adff2f green yellow
9acd32 yellow green
90ee90 light green
93c572 pistachio
4f7942 fern green
29ab87 jungle green
01796f pine green
2e8b57 sea green
5da130 grass green
8a9a5b moss green
ace1af celadon
05472a evergreen
4b5320 army green
78866b camouflage green
d1e231 pear
00ff7f spring green
d0f0c0 tea green
006a4e bottle green
7cfc00 lawn green
8db600 apple green
4a5d23 dark moss
a9ba9d laurel green
123524 phthalo green
0a5c36 ivy
76ab56 leaf green
a6b28a willow
39ff14 neon green
6c7c59 dusty olive
b2d3c2 pale mint
c5e384 light lime
444c38 rifle green
008080 teal
00ffff cyan
40e0d0 turquoise
afeeee pale turquoise
00ced1 dark turquoise
4e8a8b dusty teal
005f6a petrol
7fffd4 aquamarine
9fe2bf seafoam green
20b2aa lagoon
96ded1 robin egg blue
008b8b dark cyan
e0ffff light cyan
00a693 persian green
014d4e dark teal
317873 myrtle
a0d6b4 eucalyptus
43b3ae verdigris
006d5b teal green
3a8f8a spruce
1c6b6b deep sea
b2dfdb frost
48d1cc medium turquoise
5f9ea0 cadet blue
2a7f7f sea teal
78c7c7 aqua mist
0e7c7b deep turquoise
0000ff blue
000080 navy
191970 midnight blue
4169e1 royal blue
0047ab cobalt
1560bd denim
6495ed cornflower
87ceeb sky blue
add8e6 light blue
b0e0e6 powder blue
4682b4 steel blue
1e90ff bright blue
0f52ba sapphire
002147 oxford blue
003153 prussian blue
120a8f ultramarine
89cff0 baby blue
007ba7 cerulean
1d2951 dark navy
26619c lapis
6e8fae dusty blue
7393b3 blue gray
01386a marine blue
00bfff deep sky blue
007fff azure
d6ecef ice blue
afdbf5 pale sky
0072bb french blue
2a52be cerulean blue
1034a6 egyptian blue
4997d0 celestial blue
5a7d9a storm blue
aec6cf pastel blue
7df9ff electric blue
3a4a8c indigo blue
6699cc faded denim
3e5f8a slate navy
0d3b66 deep ocean
a7c7e7 light periwinkle blue
800080 purple
4b0082 indigo
8a2be2 blue violet
9400d3 dark violet
ee82ee light violet
7f00ff violet
da70d6 orchid
dda0dd light plum
e6e6fa lavender mist
b57edc lavender
9966cc amethyst
7851a9 royal purple
6a5acd slate blue
483d8b dark slate blue
9370db soft purple
ccccff periwinkle
c8a2c8 lilac
e0b0ff mauve
9e7c8f dusty mauve
614051 eggplant
3d0c3e aubergine
301934 dark purple
c9a0dc wisteria
8b008b dark magenta
ff00ff magenta
9f00ff electric violet
5d3fd3 iris
915f6d mauve taupe
7b6d8d smoky purple
8e4585 plum
702963 byzantium
563c5c dark mauve
df73ff heliotrope
6f2da8 grape
b39eb5 pastel purple
4b2e83 deep purple
a76bcf rich lavender
ffc0cb pink
ffb6c1 light pink
ff69b4 hot pink
ff1493 deep pink
c71585 fuchsia
b8787f dusty rose
f88379 coral pink
ff007f rose
e30b5c raspberry
fc8eac flamingo pink
f4c2c2 baby pink
de5d83 blush
fadadd pale pink
ffd1dc pastel pink
e75480 dark pink
ff66cc rose pink
c08081 old rose
d8bfd8 thistle
915c83 antique fuchsia
e4717a candy pink
ffa6c9 carnation pink
f19cbb amaranth pink
fba0e3 lavender pink
f7cac9 rose quartz
b3446c raspberry rose
ffe4e1 misty rose
ffbcd9 cotton candy
f3cfc6 millennial pink
ff6ec7 neon pink
fd5da8 bubblegum
e3bc9a nude
c9a9a6 ash rose
964b00 brown
7b3f00 chocolate
d2691e cinnamon
8b4513 saddle brown
a0522d sienna
cd853f caramel
deb887 biscuit
f5deb3 wheat
d2b48c tan
c19a6b camel
826644 raw umber
635147 umber
3b2219 espresso
654321 dark brown
6f4e37 coffee
a67b5b latte
b87333 copper
cd7f32 bronze
80461b russet
7c3626 mahogany
966f33 wood brown
8d6e63 mocha
954535 chestnut
b5651d toffee
5d3a1a walnut
4a2c2a cocoa
bc8f8f rosy brown
9c6b3a hazelnut
4b3621 bark
e3a857 honey brown
c68e5f light caramel
8b7d6b taupe
483c32 dark taupe
c2b280 sand
cdb891 ecru
a9907e beaver
000000 black
ffffff white
808080 gray
c0c0c0 silver
d3d3d3 light gray
555555 dark gray
a9a9a9 medium gray
36454f charcoal
2f4f4f dark slate
708090 slate gray
778899 light slate
dcdcdc pale gray
f5f5f5 smoke white
fffaf0 floral white
faf0e6 linen
fffff0 ivory
fdf5e6 old lace
fffdd0 cream
f5f5dc beige
f0ead6 eggshell
e3dac9 bone
b2beb5 ash gray
2a3439 gunmetal
1b1b1b off black
343434 jet
3b3c36 black olive
e5e4e2 platinum
848482 battleship gray
fffafa snow
f8f8ff cool white
f0fff0 honeydew
f5fffa mint cream
fff5ee seashell
faebd7 antique white
ffe4c4 bisque
efdecd almond
f1e9d2 parchment
d8ccb4 oatmeal
4b4e53 graphite
91a3b0 cadet gray
eae0c8 pearl
bfc1c2 pale silver
6d6968 smoke gray
d5d0c8 greige
`;

/** All named colors as { name, hex } (hex is lowercase "#rrggbb"). */
export const colors = DATA.trim().split('\n').map((line) => {
  const i = line.indexOf(' ');
  return Object.freeze({ name: line.slice(i + 1), hex: `#${line.slice(0, i)}` });
});

let labs;
const table = () => (labs ??= colors.map((c) => hexToLab(c.hex)));

/** The `n` closest named colors to `hex`, nearest first: [{ name, hex, distance }]. */
export function nearest(hex, n = 5) {
  const lab = hexToLab(hex);
  const t = table();
  return colors
    .map((c, i) => ({ name: c.name, hex: c.hex, distance: deltaE2000(lab, t[i]) }))
    .sort((x, y) => x.distance - y.distance)
    .slice(0, Math.max(0, n));
}

/** The closest named color to `hex`: { name, hex, distance }. */
export function colorName(hex) {
  const lab = hexToLab(hex);
  const t = table();
  let best = 0, bestD = Infinity;
  for (let i = 0; i < t.length; i++) {
    const d = deltaE2000(lab, t[i]);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { name: colors[best].name, hex: colors[best].hex, distance: bestD };
}

export default colorName;
