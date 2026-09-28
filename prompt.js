// Only the final device field is replaced. All preceding source text is preserved.
export function preparePrompt(source, device, marker = '[휴대폰 기종]') {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(^|\\r?\\n)(${escaped}[ \\t]*\\r?\\n)([^\\r\\n]*)(\\r?\\n[\\s]*)?$`).exec(source);
  if (!match) throw new Error('The final device field is missing or ambiguous.');
  const model = String(device).trim().replace(/[\r\n]+/g, ' ');
  if (!model) throw new Error('A phone model is required.');
  const offset = match.index + match[1].length + match[2].length;
  return source.slice(0, offset) + model + (match[4] || '');
}
