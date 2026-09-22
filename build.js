/* Inlines src/* into a single self-contained page.
   Outputs index.html (full document, for GitHub/Vercel) and
   dist/artifact.html (head+body fragment, for publishing as an Artifact). */
const fs = require('fs'), path = require('path');
const p = f => path.join(__dirname, f);
const read = f => fs.readFileSync(p(f), 'utf8');

const fragment = read('src/page.html')
  .replace('/*__CSS__*/', () => read('src/styles.css'))
  .replace('/*__MODEL__*/', () => read('src/model.js'))
  .replace('/*__SPOTS__*/', () => read('src/spots.js'))
  .replace('/*__TASKS__*/', () => read('src/tasks.js'))
  .replace('/*__APP__*/', () => read('src/app.js'));

const head = fragment.slice(0, fragment.indexOf('<header'));
const body = fragment.slice(fragment.indexOf('<header'));

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Surf-expedition financial model and route planner: departure cash, monthly burn, runway, and a world course you can rearrange.">
<meta name="color-scheme" content="dark">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23050C15'/%3E%3Cpath d='M4 21c4 0 4-5 8-5s4 5 8 5 4-5 8-5' stroke='%23D9A441' stroke-width='2.2' fill='none' stroke-linecap='round'/%3E%3Cpath d='M4 26c4 0 4-4 8-4s4 4 8 4 4-4 8-4' stroke='%236FE0A6' stroke-width='1.6' fill='none' stroke-linecap='round' opacity='.65'/%3E%3C/svg%3E">
${head.replace(/^/, '').trim()}
<style>
  html, body { min-height: 100%; }
  :root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(p('dist'), { recursive: true });
fs.writeFileSync(p('index.html'), doc);
fs.writeFileSync(p('dist/artifact.html'), fragment);
const kb = n => (fs.statSync(p(n)).size / 1024).toFixed(1) + ' KB';
console.log('index.html         ' + kb('index.html'));
console.log('dist/artifact.html ' + kb('dist/artifact.html'));
