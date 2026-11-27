// node scripts/make-auth.mjs "Samarpan:password" "Chirag:password"
// Prints the value for the WDG_AUTH environment variable (salted scrypt hashes + a random signing secret).
// Also writes data/wdg-auth.json (git-ignored) so `npm start` works locally.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { hashPassword } from '../lib/auth.js';

const pairs = process.argv.slice(2);
if (!pairs.length) { console.error('Usage: node scripts/make-auth.mjs "User:Password" ["User2:Password2"]'); process.exit(1); }
const users = {};
for (const p of pairs) { const i = p.indexOf(':'); const name = p.slice(0, i).trim(), pw = p.slice(i + 1); if (!name || !pw) { console.error('Bad pair: ' + p.split(':')[0]); process.exit(1); } users[name.toLowerCase()] = { name, hash: hashPassword(pw) }; }
const value = JSON.stringify({ secret: crypto.randomBytes(32).toString('hex'), users });
fs.mkdirSync(new URL('../data', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/wdg-auth.json', import.meta.url), value + '\n');
console.log(value);
