// Safe fetcher: blocks private/loopback targets (SSRF), follows redirects manually,
// enforces timeout + size limit.
import dns from 'node:dns/promises';
import net from 'node:net';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80')) return true;
    const m = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? isPrivateIp(m[1]) : false;
  }
  return true;
}

export async function assertPublicUrl(u) {
  const url = new URL(u);
  if (!/^https?:$/.test(url.protocol)) throw new Error('Only http(s) URLs are allowed');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) { if (isPrivateIp(host)) throw new Error('Private address blocked'); return url; }
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Private address blocked');
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new Error('Private address blocked');
  return url;
}

export async function fetchText(u, { timeout = 12000, maxBytes = 2_500_000, hops = 5 } = {}) {
  let current = u;
  for (let i = 0; i <= hops; i++) {
    await assertPublicUrl(current);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    let res;
    try {
      res = await fetch(current, {
        redirect: 'manual', signal: ctrl.signal,
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,text/css;q=0.9,*/*;q=0.5', 'accept-language': 'en-US,en;q=0.9' }
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location'), current).href;
        continue;
      }
      if (!res.ok) throw new Error(`Site responded with HTTP ${res.status}`);
      const reader = res.body.getReader();
      const chunks = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length; chunks.push(value);
        if (size > maxBytes) { ctrl.abort(); break; }
      }
      const buf = Buffer.concat(chunks);
      const ct = res.headers.get('content-type') || '';
      let charset = (ct.match(/charset=([\w-]+)/i) || [])[1];
      if (!charset) charset = (buf.subarray(0, 2048).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
      let text;
      try { text = new TextDecoder(charset || 'utf-8').decode(buf); } catch { text = buf.toString('utf8'); }
      return { text, url: current, contentType: ct };
    } finally { clearTimeout(t); }
  }
  throw new Error('Too many redirects');
}
