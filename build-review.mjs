import {readFile,writeFile} from 'node:fs/promises';
const read = name => readFile(new URL(name,import.meta.url),'utf8');
const [html,css,app,assembler,prompt] = await Promise.all(['index.html','styles.css','app.js','prompt.js','master-prompt.txt'].map(read));
const source = JSON.stringify(prompt).replace(/</g,'\\u003c');
const inlineApp = assembler.replace('export function','function') + '\n' + app.replace("import { preparePrompt } from './prompt.js';",'');
const review = html
  .replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>',`<script id="embedded-prompt" type="application/json">${source}</script>\n<script type="module">${inlineApp}</script>`);
await writeFile(new URL('./review.html',import.meta.url),review,'utf8');
process.stdout.write('Created review.html: self-contained local review, no server needed.\n');
