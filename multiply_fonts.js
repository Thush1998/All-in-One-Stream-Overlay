const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'app', 'overlay', 'overlay.module.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/font-size:\s*([0-9.]+)rem/g, (match, val) => {
    return 'font-size: ' + (parseFloat(val) * 1.5).toFixed(2) + 'rem';
});

// Also manually bump up the font weights and ensure specific labels are bold
css = css.replace(/\.eventLabel \{([^}]*)\}/, (match, inner) => {
    return match.replace(/font-weight:\s*\d+;/, 'font-weight: 900;');
});
css = css.replace(/\.statLabel \{([^}]*)\}/, (match, inner) => {
    return match.replace(/font-weight:\s*\d+;/, 'font-weight: 900;').replace(/color: [^;]+;/, 'color: rgba(255,255,255,0.9);');
});

fs.writeFileSync(cssPath, css);
console.log('Font sizes multiplied.');
