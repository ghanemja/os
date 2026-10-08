import bg from './bg.webp';

// Icons are looked up by name at runtime, so the file name never appears in full.
const icon = (name) => `/icons/${name}.svg`;
document.body.append(icon('arrow'), bg);
