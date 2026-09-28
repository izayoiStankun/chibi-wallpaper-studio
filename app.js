import { preparePrompt } from './prompt.js';

const device = document.querySelector('#device');
const copyButton = document.querySelector('#copy-button');
const downloadButton = document.querySelector('#download-button');
const copyLabel = document.querySelector('#copy-label');
const status = document.querySelector('#copy-status');
const error = document.querySelector('#device-error');
const preview = document.querySelector('#prompt-text');
const manual = document.querySelector('#manual-copy');
const manualText = document.querySelector('#manual-text');
let source = '';
let copying = false;

function currentPrompt() { return preparePrompt(source, device.value); }
function render() {
  const value = device.value.trim();
  const ready = Boolean(source && value);
  copyButton.disabled = !ready || copying;
  downloadButton.disabled = !ready;
  copyLabel.textContent = source ? '내 기종으로 프롬프트 복사' : '프롬프트 불러오는 중';
  document.querySelector('#device-preview').textContent = value || '기종을 입력하면 여기에 표시돼요.';
  if (source) preview.textContent = value ? currentPrompt() : source;
  for (const button of document.querySelectorAll('[data-device]')) {
    button.setAttribute('aria-pressed', String(button.dataset.device === value));
  }
}
function edited() {
  status.textContent = '';
  error.hidden = true;
  device.removeAttribute('aria-invalid');
  manual.hidden = true;
  render();
}
device.addEventListener('input', edited);
for (const button of document.querySelectorAll('[data-device]')) {
  button.addEventListener('click', () => { device.value = button.dataset.device; edited(); device.focus(); });
}
document.querySelector('#device-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!source || copying) return;
  if (!device.value.trim()) {
    error.textContent = '휴대폰 기종을 입력해주세요.';
    error.hidden = false;
    device.setAttribute('aria-invalid', 'true');
    device.focus();
    return;
  }
  const text = currentPrompt();
  copying = true; render();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    status.textContent = '복사했어요. 아이콘을 만든 같은 ChatGPT 대화에 붙여넣어주세요.';
  } catch {
    manual.hidden = false;
    manualText.value = text;
    manualText.focus(); manualText.select();
    status.textContent = '자동 복사가 지원되지 않아 직접 복사할 내용을 펼쳤어요.';
  } finally { copying = false; render(); }
});
downloadButton.addEventListener('click', () => {
  if (!source || !device.value.trim()) return;
  const blob = new Blob([currentPrompt()], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = device.value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').slice(0,60);
  link.download = `치비_월페이퍼_프롬프트_${safeName}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = '텍스트 파일을 준비했어요. 다운로드 목록을 확인해주세요.';
});
try {
  const embedded = document.querySelector('#embedded-prompt');
  if (embedded) {
    source = JSON.parse(embedded.textContent);
  } else {
    const response = await fetch('./master-prompt.txt', {cache: 'no-cache'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    source = await response.text();
  }
  preparePrompt(source, '입력 확인');
  render();
} catch {
  source = '';
  copyButton.disabled = true; downloadButton.disabled = true;
  copyLabel.textContent = '프롬프트를 불러오지 못했어요';
  status.textContent = '연결을 확인하고 페이지를 새로고침해주세요.';
  preview.textContent = '프롬프트 파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}
