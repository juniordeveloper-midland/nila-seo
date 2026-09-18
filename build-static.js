const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

html = html.replace(
  /<link rel="stylesheet" href="[^"]*styles\.css">/,
  `<style>\n${css}\n</style>`
);

html = html.replace(
  /<script src="[^"]*app\.js"><\/script>/,
  `<script>\n${js}\n</script>`
);

if (!html.includes('<style>')) {
  throw new Error('Failed to inline CSS into HTML');
}

if (!/<script>[\s\S]*analysisData/.test(html)) {
  throw new Error('Failed to inline JS into HTML');
}

const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'index.html'), html);
fs.writeFileSync(path.join(publicDir, 'styles.css'), css);
fs.writeFileSync(path.join(publicDir, 'app.js'), js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);

console.log('Built public/ with inlined CSS and JS');
