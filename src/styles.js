// Each role stylesheet remains independently switchable; Vite emits local files.
const sheets = [
  ['tokens', new URL('../v2/radix-tokens.css', import.meta.url).href],
  ['common', new URL('../v2/common.css', import.meta.url).href],
  ['grid', new URL('../v2/grid.css', import.meta.url).href],
  ['shelter', new URL('../v2/shelter.css', import.meta.url).href],
  ['collection', new URL('../v2/collection.css', import.meta.url).href],
  ['home-shell', new URL('../v2/home-shell.css', import.meta.url).href],
  ['home-map', new URL('../v2/home-map.css', import.meta.url).href],
  ['grid-shelters', new URL('../v2/grid-shelters.css', import.meta.url).href],
  ['department', new URL('../v2/department.css', import.meta.url).href],
  ['design-tokens', new URL('./design-tokens.css', import.meta.url).href],
];
export function loadStyles() {
  return Promise.all(sheets.map(([name, href]) => new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.dataset.roleStyle = name;
    link.onload = () => { if (name === 'shelter') link.disabled = true; resolve(); };
    link.onerror = () => reject(new Error(`Cannot load stylesheet ${name}`));
    document.head.append(link);
  })));
}
