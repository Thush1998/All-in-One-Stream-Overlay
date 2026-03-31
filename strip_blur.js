const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'app', 'overlay', 'overlay.module.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Remove every line containing backdrop-filter or -webkit-backdrop-filter
css = css.split('\n').filter(line => {
  const l = line.toLowerCase();
  return !l.includes('backdrop-filter') && !l.includes('-webkit-backdrop-filter');
}).join('\n');

// Ensure highlightOverlay has the correct background
css = css.replace(
  /\.highlightOverlay\s*\{[^}]*\}/,
  (match) => {
    // remove any existing background line, then insert correct one
    let cleaned = match.replace(/\s*background:[^;]+;/g, '');
    // insert after the first {
    cleaned = cleaned.replace('{', '{\n  background: rgba(0, 0, 0, 0.5) !important;');
    return cleaned;
  }
);

fs.writeFileSync(cssPath, css);
console.log('Done: all backdrop-filter lines removed, overlay background fixed.');
