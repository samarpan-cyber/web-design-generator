// Optional: read a screenshot of a website with a vision model. Off unless ANTHROPIC_API_KEY (or a custom `call`) is provided.
const PROMPT = 'This is a screenshot of a company website. Return ONLY compact JSON: {"tagline":"","description":"one or two plain sentences about what the company does","color":"#rrggbb main brand colour","products":[{"name":"","description":""}]}. List up to 12 product or service names you can actually read. No invention.';
export async function readScreenshot(img, { call, key = process.env.ANTHROPIC_API_KEY, model = process.env.VISION_MODEL || 'claude-sonnet-5-5' } = {}) {
  if (call) return parse(await call(img, PROMPT));
  if (!key) return null;
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, signal: AbortSignal.timeout(45000),
    body: JSON.stringify({ model, max_tokens: 900, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data } }, { type: 'text', text: PROMPT }] }] }) });
  if (!r.ok) throw new Error('Screenshot reading failed (' + r.status + ')');
  const j = await r.json(); return parse((j.content || []).map(c => c.text || '').join(''));
}
function parse(t) { const m = /\{[\s\S]*\}/.exec(String(t || '')); if (!m) return null; try { return JSON.parse(m[0]); } catch { return null; } }
