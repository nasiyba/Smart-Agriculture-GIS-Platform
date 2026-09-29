const svgWrap = (body: string, width = 84, height = 84) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 84 84">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="rgba(39,54,34,0.22)"/>
    </filter>
    <filter id="selectedGlow" x="-35%" y="-35%" width="170%" height="170%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.8" result="expanded"/>
      <feFlood flood-color="#D6FF3F" result="glowColor"/>
      <feComposite in="glowColor" in2="expanded" operator="in" result="outline"/>
      <feGaussianBlur in="outline" stdDeviation="1.15" result="softOutline"/>
      <feMerge>
        <feMergeNode in="softOutline"/>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="leafPalm" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#b6e06f"/>
      <stop offset="55%" stop-color="#6fae41"/>
      <stop offset="100%" stop-color="#3d7e33"/>
    </radialGradient>
    <radialGradient id="leafLight" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#d1e9af"/>
      <stop offset="60%" stop-color="#93b870"/>
      <stop offset="100%" stop-color="#66825b"/>
    </radialGradient>
    <radialGradient id="leafMid" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#a9cb8c"/>
      <stop offset="58%" stop-color="#6e9667"/>
      <stop offset="100%" stop-color="#4b6b4f"/>
    </radialGradient>
    <radialGradient id="leafDark" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#627f58"/>
      <stop offset="55%" stop-color="#3c5742"/>
      <stop offset="100%" stop-color="#24352a"/>
    </radialGradient>
    <radialGradient id="leafDeepOlive" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#86a162"/>
      <stop offset="58%" stop-color="#59734b"/>
      <stop offset="100%" stop-color="#32472f"/>
    </radialGradient>
    <radialGradient id="fruitYellow" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#fff5a2"/>
      <stop offset="100%" stop-color="#e3c742"/>
    </radialGradient>
    <radialGradient id="fruitOrange" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#ffd8a0"/>
      <stop offset="100%" stop-color="#ea8c2f"/>
    </radialGradient>
    <radialGradient id="fruitRed" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#ffb4b4"/>
      <stop offset="100%" stop-color="#c74545"/>
    </radialGradient>
    <radialGradient id="fruitPurple" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#c6b0f0"/>
      <stop offset="100%" stop-color="#7853a9"/>
    </radialGradient>
    <radialGradient id="fruitCoconut" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#d5b285"/>
      <stop offset="100%" stop-color="#936239"/>
    </radialGradient>
  </defs>
  ${body}
</svg>`;

function palmFronds(fill = 'url(#leafPalm)', stroke = '#4f8538', count = 11, length = 28) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = i * (360 / count);
    return `<g transform="translate(42 42) rotate(${angle})">
      <path d="M0 -3 C8 -7, 16 -17, 19 -${length - 4} C12 -${length - 2}, 4 -${length - 10}, -1 -11 C-3 -17, -8 -22, -14 -26 C-12 -17, -8 -8, 0 -3 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="0.9" stroke-linejoin="round"/>
      <path d="M0 -4 C4 -10, 9 -16, 12 -${length - 8}" stroke="rgba(255,255,255,.30)" stroke-width="0.8" stroke-linecap="round"/>
    </g>`;
  }).join('');
}

function palmTopSvg() {
  return svgWrap(`
    <g filter="url(#shadow)">
      ${palmFronds('url(#leafPalm)', '#4f8538', 12, 31)}
      <circle cx="42" cy="42" r="5.1" fill="#5c7d43" opacity="0.95"/>
      <circle cx="42" cy="42" r="2.4" fill="rgba(255,255,255,.18)"/>
    </g>
  `);
}

function coconutTopSvg() {
  return svgWrap(`
    <g filter="url(#shadow)">
      ${palmFronds('url(#leafPalm)', '#4f8538', 10, 29)}
      <g fill="url(#fruitCoconut)" stroke="#7a532f" stroke-width="0.55">
        <circle cx="40" cy="38" r="3.6"/>
        <circle cx="45.5" cy="38.8" r="3.6"/>
        <circle cx="42.8" cy="43.5" r="3.5"/>
      </g>
      <circle cx="42" cy="42" r="3.2" fill="#577840" opacity="0.9"/>
    </g>
  `);
}

function canopy(topFill = 'url(#leafMid)', stroke = '#5c7d5a', fruitFill = '', fruits: [number, number, number?][] = [], extra = '') {
  const fruitSvg = fruitFill
    ? `<g fill="${fruitFill}" opacity="0.98">${fruits.map(([x,y,r=2.7]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`
    : '';

  return svgWrap(`
    <g filter="url(#shadow)">
      <g fill="${topFill}" stroke="${stroke}" stroke-width="0.9">
        <circle cx="29" cy="33" r="12"/>
        <circle cx="42" cy="26" r="14"/>
        <circle cx="55" cy="34" r="12"/>
        <circle cx="34" cy="49" r="13"/>
        <circle cx="50" cy="50" r="12.8"/>
        <circle cx="42" cy="39" r="15.5"/>
      </g>
      <circle cx="35" cy="29" r="11" fill="rgba(255,255,255,.07)"/>
      ${fruitSvg}
      ${extra}
    </g>
  `);
}

function lemonTopSvg() {
  return canopy('url(#leafLight)', '#6e8e66', 'url(#fruitYellow)', [[35,31,2.9],[49,36,3],[42,49,2.8]]);
}

function orangeTopSvg() {
  return canopy('url(#leafLight)', '#6e8e66', 'url(#fruitOrange)', [[35,31,2.9],[49,36,3],[42,49,2.8]]);
}

function mangoTopSvg() {
  return canopy('url(#leafMid)', '#557350', 'url(#fruitOrange)', [[34,33,2.3],[49,37,2.4],[41,48,2.2],[45,29,2.1]]);
}

function papayaTopSvg() {
  const leaves = Array.from({ length: 8 }).map((_, i) => {
    const angle = i * 45;
    return `<g transform="translate(42 42) rotate(${angle})">
      <path d="M0 -3 C7 -7, 15 -14, 17 -24 C10 -22, 4 -17, 0 -9 C-3 -15, -8 -19, -13 -21 C-11 -13, -6 -7, 0 -3 Z"
        fill="url(#leafMid)" stroke="#57744d" stroke-width="0.85" stroke-linejoin="round"/>
    </g>`;
  }).join('');
  return svgWrap(`
    <g filter="url(#shadow)">
      ${leaves}
      <g fill="url(#fruitOrange)">
        <circle cx="43" cy="41" r="3.2"/>
        <circle cx="39" cy="45" r="2.5"/>
      </g>
      <circle cx="42" cy="42" r="3" fill="#608149"/>
    </g>
  `);
}

function bananaTopSvg() {
  const leaves = [0, 55, 115, 180, 245, 305].map((angle) => `
    <g transform="translate(42 42) rotate(${angle})">
      <path d="M0 -3 C10 -8, 20 -18, 21 -31 C13 -28, 5 -21, 0 -10 C-3 -17, -8 -22, -14 -26 C-12 -17, -7 -8, 0 -3 Z"
        fill="url(#leafPalm)" stroke="#4f8538" stroke-width="0.9"/>
      <path d="M0 -3 C4 -10, 8 -17, 12 -24" stroke="rgba(255,255,255,.30)" stroke-width="0.8" stroke-linecap="round"/>
    </g>`).join('');
  return svgWrap(`
    <g filter="url(#shadow)">
      ${leaves}
      <circle cx="42" cy="42" r="4" fill="#6c8a4c" opacity="0.85"/>
    </g>
  `);
}

function pricklyPearTopSvg() {
  return svgWrap(`
    <g filter="url(#shadow)">
      <g fill="url(#leafLight)" stroke="#6d8f66" stroke-width="0.9">
        <ellipse cx="42" cy="42" rx="12" ry="15"/>
        <ellipse cx="28" cy="41" rx="8.5" ry="12"/>
        <ellipse cx="56" cy="41" rx="8.5" ry="12"/>
        <ellipse cx="36" cy="28" rx="7.8" ry="10.5"/>
        <ellipse cx="48" cy="28" rx="7.8" ry="10.5"/>
      </g>
      <g fill="#f2df75" opacity="0.85">
        <circle cx="34" cy="39" r="1.2"/>
        <circle cx="49" cy="46" r="1.2"/>
        <circle cx="42" cy="29" r="1.1"/>
      </g>
    </g>
  `);
}

function figTopSvg() {
  return canopy('url(#leafDark)', '#213026', 'url(#fruitPurple)', [[35,31,2.2],[49,37,2.3],[43,50,2.2]], '<circle cx="41" cy="39" r="14" fill="rgba(255,255,255,.04)"/>');
}

function sidrTopSvg() {
  return canopy('url(#leafDeepOlive)', '#31472f', 'url(#fruitYellow)', [[36,31,1.8],[49,36,1.9],[43,49,1.8]]);
}

function pomegranateTopSvg() {
  return canopy('url(#leafMid)', '#557350', 'url(#fruitRed)', [[35,31,2.6],[49,35,2.6],[42,49,2.5]]);
}

function mixedFruitTopSvg() {
  return canopy('url(#leafLight)', '#678760', '', [], `
    <g>
      <circle cx="35" cy="31" r="2.2" fill="url(#fruitYellow)"/>
      <circle cx="49" cy="35" r="2.4" fill="url(#fruitOrange)"/>
      <circle cx="42" cy="49" r="2.3" fill="url(#fruitRed)"/>
      <circle cx="39" cy="38" r="2.1" fill="url(#fruitPurple)"/>
    </g>
  `);
}

function bougainvilleaTopSvg() {
  return canopy('url(#leafMid)', '#557350', '', [], `
    <g fill="#d14578" opacity="0.92">
      <circle cx="34" cy="30" r="2.4"/>
      <circle cx="49" cy="35" r="2.4"/>
      <circle cx="43" cy="49" r="2.2"/>
      <circle cx="40" cy="39" r="2.3"/>
    </g>
  `);
}

function ixoraTopSvg() {
  return canopy('url(#leafMid)', '#557350', '', [], `
    <g fill="#d64949" opacity="0.92">
      <circle cx="34" cy="31" r="2.2"/>
      <circle cx="49" cy="35" r="2.2"/>
      <circle cx="42" cy="49" r="2.2"/>
      <circle cx="39" cy="39" r="2.1"/>
    </g>
  `);
}

function durantaTopSvg() {
  return canopy('url(#leafLight)', '#708e67', '', [], `
    <g fill="#f1cf5c" opacity="0.85">
      <circle cx="36" cy="32" r="1.7"/>
      <circle cx="47" cy="36" r="1.7"/>
      <circle cx="41" cy="48" r="1.7"/>
    </g>
  `);
}

function genericTopSvg(fill = 'url(#leafMid)', stroke = '#5c7d5a') {
  return canopy(fill, stroke);
}

function grassTopSvg() {
  return svgWrap(`
    <g filter="url(#shadow)">
      <g fill="url(#leafLight)" stroke="#6e8e66" stroke-width="0.85">
        <circle cx="33" cy="42" r="10"/>
        <circle cx="43" cy="34" r="11"/>
        <circle cx="52" cy="43" r="9.5"/>
        <circle cx="42" cy="50" r="10.5"/>
      </g>
    </g>
  `);
}

export function getTreeTypeSvg(treeType: string) {
  const value = String(treeType || '').trim().toLowerCase().replace(/_/g, ' ');

  if (value.includes('coconut')) return coconutTopSvg();
  if (value.includes('ornamental palm')) return palmTopSvg();
  if (value === 'palm') return palmTopSvg();
  if (value.includes('palm & mixed fruit')) return mixedFruitTopSvg();
  if (value.includes('banana')) return bananaTopSvg();
  if (value.includes('prickly pear')) return pricklyPearTopSvg();
  if (value.includes('lemon & orange')) return mixedFruitTopSvg();
  if (value.includes('lemon') || value.includes('lime') || value.includes('citrus')) return lemonTopSvg();
  if (value.includes('orange')) return orangeTopSvg();
  if (value.includes('mango')) return mangoTopSvg();
  if (value.includes('papaya')) return papayaTopSvg();
  if (value.includes('pomegranate')) return pomegranateTopSvg();
  if (value.includes('fig')) return figTopSvg();
  if (value.includes('sidr')) return sidrTopSvg();
  if (value.includes('mixed fruit')) return mixedFruitTopSvg();
  if (value.includes('grass')) return grassTopSvg();
  if (value.includes('cassava')) return genericTopSvg('url(#leafLight)', '#718f69');
  if (value.includes('conocarpus')) return genericTopSvg('url(#leafDark)', '#233228');
  if (value.includes('copperpod')) return genericTopSvg('url(#leafMid)', '#4d6d49');
  if (value.includes('duranta')) return durantaTopSvg();
  if (value.includes('bougainvillea')) return bougainvilleaTopSvg();
  if (value.includes('ixora')) return ixoraTopSvg();
  if (value.includes('mesquite')) return genericTopSvg('url(#leafDark)', '#26372d');
  if (value.includes('ornamental tree')) return genericTopSvg('url(#leafMid)', '#577653');
  if (value.includes('zucchini')) return grassTopSvg();
  if (value.includes('indian almond')) return genericTopSvg('url(#leafMid)', '#5f7449');
  if (value.includes('betham')) return genericTopSvg('url(#leafLight)', '#79916f');
  if (value.includes('unknown') || value.includes('other')) return genericTopSvg('url(#leafDeepOlive)', '#31472f');

  return genericTopSvg('url(#leafMid)', '#5c7d5a');
}

export function getTreeTypeDataUrl(treeType: string) {
  const svg = getTreeTypeSvg(treeType).replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getHighlightedTreeTypeDataUrl(treeType: string) {
  const svg = getTreeTypeSvg(treeType)
    .replace(/filter="url\(#shadow\)"/g, 'filter="url(#selectedGlow)"')
    .replace(/\s+/g, ' ')
    .trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
