// Shared by the live scripts. Credentials come from the environment at run time (WDG_USER, WDG_PASS), never from files.
export async function loginCookie(base) {
  const u = process.env.WDG_USER, p = process.env.WDG_PASS;
  if (!u || !p) { console.error('Set WDG_USER and WDG_PASS to run this against a protected deployment.'); process.exit(1); }
  const r = await fetch(base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
  if (!r.ok) { console.error('Login failed:', r.status, (await r.json().catch(() => ({}))).error || ''); process.exit(1); }
  const c = r.headers.get('set-cookie') || '';
  return c.split(';')[0];
}
