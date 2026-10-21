// Ver- und Entschlüsseln der Werkbank-Inhalte (data.enc.json).
// Passwort kommt aus der Umgebungsvariable WERKBANK_PASS, nie aus einer Datei im Repo.
//   node tools/werkbank.mjs decrypt data.enc.json > inhalt.json
//   node tools/werkbank.mjs encrypt inhalt.json > data.enc.json
// Format des Klartexts: { meta: { project, subtitle, areas[] }, entries: [ {id, area, status, title, body, order, updated} ], deleted: { id: isoZeit } }
import { readFileSync } from "node:fs";
import { webcrypto as wc } from "node:crypto";

const [cmd, file] = process.argv.slice(2);
const pass = process.env.WERKBANK_PASS;
if (!pass || !cmd || !file) { console.error("Aufruf: WERKBANK_PASS=… node tools/werkbank.mjs encrypt|decrypt <datei>"); process.exit(1); }
const ITER = 250000;
const b64 = u => Buffer.from(u).toString("base64");
const ub64 = s => new Uint8Array(Buffer.from(s, "base64"));

async function key(salt, iter, usage) {
  const base = await wc.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return wc.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, [usage]);
}

if (cmd === "encrypt") {
  const plain = JSON.parse(readFileSync(file, "utf8"));
  const salt = wc.getRandomValues(new Uint8Array(16)), iv = wc.getRandomValues(new Uint8Array(12));
  const ct = await wc.subtle.encrypt({ name: "AES-GCM", iv }, await key(salt, ITER, "encrypt"), new TextEncoder().encode(JSON.stringify(plain)));
  process.stdout.write(JSON.stringify({ v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)), updated: new Date().toISOString() }, null, 1) + "\n");
} else if (cmd === "decrypt") {
  const env = JSON.parse(readFileSync(file, "utf8"));
  const pt = await wc.subtle.decrypt({ name: "AES-GCM", iv: ub64(env.iv) }, await key(ub64(env.salt), env.iter, "decrypt"), ub64(env.ct));
  process.stdout.write(JSON.stringify(JSON.parse(new TextDecoder().decode(pt)), null, 2) + "\n");
} else { console.error("Unbekannter Befehl"); process.exit(1); }
