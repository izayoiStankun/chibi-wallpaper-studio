import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { preparePrompt } from './prompt.js';
import {languages, locales, uiRows} from './locales.js';
const source = await readFile(new URL('./master-prompt.txt', import.meta.url), 'utf8');
const marker = source.lastIndexOf('[휴대폰 기종]');
assert.ok(marker > 0);
const bodyEnd = source.indexOf('\n',marker) + 1;
for (const model of ['갤럭시 S24 FE','갤럭시 Z 폴드6 커버 화면','iPhone 16','<script>alert(1)</script>']) {
  const result = preparePrompt(source, model);
  assert.equal(result.slice(0,bodyEnd),source.slice(0,bodyEnd),'Source body must remain exact');
  assert.equal(result.slice(bodyEnd).trim(),model);
}
assert.throws(() => preparePrompt(source,'   '));
assert.throws(() => preparePrompt('missing field','Pixel'));
const crlf = source.replace(/\r?\n/g,'\r\n');
assert.equal(preparePrompt(crlf,'Pixel').split('[휴대폰 기종]').at(-1).trim(),'Pixel');
assert.equal(preparePrompt(source,'A\nB').slice(bodyEnd).trim(),'A B');
const html = await readFile(new URL('./index.html', import.meta.url),'utf8');
assert.ok(!html.includes('noindex'));
assert.ok(html.includes('index,follow'));
assert.ok(html.includes('원작 라이선스 안내'));
assert.ok(!html.includes('src="https://'));
assert.ok(html.includes('https://x.com/Stang_kun'));
assert.ok(html.includes('https://x.com/multi_serio_ai'));
for (const row of uiRows) {
  assert.equal(row.length, languages.length + 1, `Missing UI translation: ${row[0]}`);
  for (const value of row.slice(1)) assert.ok(value.length > 0);
  for (const value of row.slice(2)) assert.ok(!/[가-힣]/.test(value), `Untranslated Korean: ${row[0]}`);
}
for (const lang of languages) {
  const locale = locales[lang];
  assert.deepEqual(Object.keys(locale).sort(), Object.keys(locales.ko).sort());
  const text = await readFile(new URL(locale.file, import.meta.url), 'utf8');
  const end = text.indexOf('\n', text.lastIndexOf(locale.marker)) + 1;
  assert.ok(end > 0);
  assert.equal(text.match(/^\[/gm).length, 9, `${lang}: all sections present`);
  assert.equal(text.match(/^- /gm).length, 14, `${lang}: all instruction bullets present`);
  if (lang !== 'ko') assert.ok(!/[가-힣]/.test(text));
  for (const model of ['Galaxy S24 FE', 'Galaxy Z Fold6 inner screen', '<img src=x onerror=alert(1)>', '日本語 简体 繁體']) {
    const prepared = preparePrompt(text, model, locale.marker);
    assert.equal(prepared.slice(0,end), text.slice(0,end), `${lang}: body preserved`);
    assert.equal(prepared.slice(end).trim(), model);
  }
  assert.throws(() => preparePrompt(text, ' ', locale.marker));
  assert.throws(() => preparePrompt(text, 'Pixel', '[Invalid marker]'));
  assert.equal(preparePrompt(`${locale.marker} \t\r\nExample\r\n`, 'Pixel', locale.marker), `${locale.marker} \t\r\nPixel\r\n`);
}
const review = await readFile(new URL('./review.html', import.meta.url),'utf8');
const bundled = JSON.parse(review.match(/<script id="embedded-prompts" type="application\/json">([\s\S]*?)<\/script>/)[1]);
for (const lang of languages) assert.equal(bundled[lang], await readFile(new URL(locales[lang].file,import.meta.url),'utf8'));
assert.ok(!review.includes('src="./app.js"'));
process.stdout.write('PASS: five complete locale catalogs and prompt structures; exact prompt-body preservation; device input, CRLF, invalid markers, creator links and offline bundle verified.\n');
