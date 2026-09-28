import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { preparePrompt } from './prompt.js';
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
assert.ok(html.includes('noindex,nofollow'));
assert.ok(html.includes('원작 라이선스 안내'));
assert.ok(!html.includes('src="https://'));
process.stdout.write('PASS: prompt body preserved; phone fields, CRLF, special input, missing fields, and preview safeguards verified.\n');
