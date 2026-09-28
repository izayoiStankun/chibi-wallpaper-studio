import { preparePrompt } from './prompt.js';
import { languages, locales, uiRows } from './locales.js';

const device = document.querySelector('#device');
const language = document.querySelector('#language');
const copyButton = document.querySelector('#copy-button');
const downloadButton = document.querySelector('#download-button');
const copyLabel = document.querySelector('#copy-label');
const status = document.querySelector('#copy-status');
const error = document.querySelector('#device-error');
const preview = document.querySelector('#prompt-text');
const manual = document.querySelector('#manual-copy');
const manualText = document.querySelector('#manual-text');
const embedded = document.querySelector('#embedded-prompts');
const cache = embedded ? JSON.parse(embedded.textContent) : {};
const requestedLanguage = new URL(location.href).searchParams.get('lang');
let lang = languages.includes(requestedLanguage) ? requestedLanguage : 'ko';
let source = '';
let copying = false;
let failed = false;
let revision = 0;
const t = () => locales[lang];

function currentPrompt() { return preparePrompt(source, device.value, t().marker); }
function render() {
  const value = device.value.trim();
  const ready = Boolean(source && value);
  copyButton.disabled = !ready || copying;
  downloadButton.disabled = !ready;
  copyLabel.textContent = failed ? t().failed : source ? t().copy : t().loading;
  document.querySelector('#device-preview').textContent = value || t().empty;
  preview.textContent = source ? (value ? currentPrompt() : source) : failed ? t().retry : t().loading;
  for (const button of document.querySelectorAll('[data-device]')) {
    button.setAttribute('aria-pressed', String(button.dataset.device === value));
  }
}
function edited() {
  status.textContent = failed ? t().retry : '';
  error.hidden = true;
  device.removeAttribute('aria-invalid');
  manual.hidden = true;
  manualText.value = '';
  render();
}
function translateUI() {
  document.documentElement.lang = lang;
  language.value = lang;
  const column = languages.indexOf(lang) + 1;
  for (const row of uiRows) {
    const [selector, attribute] = row[0].split('|');
    const element = document.querySelector(selector);
    if (attribute) element.setAttribute(attribute, row[column]);
    else element.innerHTML = row[column];
  }
  document.querySelectorAll('[data-device]').forEach((button, i) => {
    button.dataset.device = t().models[i];
    button.textContent = t().models[i];
  });
}
async function selectLanguage(next, updateUrl = true) {
  lang = next;
  const request = ++revision;
  // Disable actions before loading so a previous language cannot be copied.
  source = '';
  failed = false;
  translateUI();
  edited();
  if (updateUrl && location.protocol !== 'file:') {
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
  try {
    if (!cache[next]) {
      const response = await fetch(`./${locales[next].file}`, {cache: 'no-cache'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      cache[next] = await response.text();
    }
    preparePrompt(cache[next], 'Model check', locales[next].marker);
    if (request !== revision) return;
    source = cache[next];
    render();
  } catch {
    if (request !== revision) return;
    failed = true;
    status.textContent = t().retry;
    render();
  }
}
language.addEventListener('change', () => selectLanguage(language.value));
device.addEventListener('input', edited);
for (const button of document.querySelectorAll('[data-device]')) {
  button.addEventListener('click', () => { device.value = button.dataset.device; edited(); device.focus(); });
}
document.querySelector('#device-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!source || copying) return;
  if (!device.value.trim()) {
    error.textContent = t().required;
    error.hidden = false;
    device.setAttribute('aria-invalid', 'true');
    device.focus();
    return;
  }
  const text = currentPrompt();
  const request = revision;
  copying = true;
  language.disabled = true;
  render();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    if (request === revision) status.textContent = t().copied;
  } catch {
    if (request === revision) {
      manual.hidden = false;
      manualText.value = text;
      manualText.focus(); manualText.select();
      status.textContent = t().manual;
    }
  } finally { copying = false; language.disabled = false; render(); }
});
downloadButton.addEventListener('click', () => {
  if (!source || !device.value.trim()) return;
  const blob = new Blob([currentPrompt()], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = device.value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').slice(0,60);
  link.download = `chibi-wallpaper_${lang}_${safeName}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = t().downloaded;
});
await selectLanguage(lang, false);
