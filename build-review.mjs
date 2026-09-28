import {readFile,writeFile} from 'node:fs/promises';
import {languages,locales} from './locales.js';
const read = name => readFile(new URL(name,import.meta.url),'utf8');
const [html,css,app,assembler,translations] = await Promise.all(['index.html','styles.css','app.js','prompt.js','locales.js'].map(read));
const prompts = Object.fromEntries(await Promise.all(languages.map(async lang => [lang,await read(locales[lang].file)])));
const source = JSON.stringify(prompts).replace(/</g,'\\u003c');
const inlineApp = assembler.replace('export function','function') + '\n' + translations.replaceAll('export const','const') + '\n' + app.replace(/^import .*;\r?\n/gm,'');
const review = html
  .replace('<link rel="stylesheet" href="./styles.css">',() => `<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>',() => `<script id="embedded-prompts" type="application/json">${source}</script>\n<script type="module">${inlineApp}</script>`);
await writeFile(new URL('./review.html',import.meta.url),review,'utf8');
process.stdout.write('Created review.html: self-contained local review, no server needed.\n');
