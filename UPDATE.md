# Werkbank – Hinweise für Updates

Diese App läuft über GitHub Pages und funktioniert nach dem ersten Öffnen offline.

- `index.html` – die App
- `sw.js` – Offline-Speicher (bei Änderungen an der App `CACHE` hochzählen)
- `data.enc.json` – die Projektinhalte, verschlüsselt (PBKDF2-SHA256, AES-GCM). Ohne Passwort nicht lesbar.
- `tools/werkbank.mjs` – Ver- und Entschlüsseln. Das Passwort wird nie im Repository gespeichert.

## Inhalte aktualisieren
1. `WERKBANK_PASS=… node tools/werkbank.mjs decrypt data.enc.json > /tmp/inhalt.json`
2. Einträge ändern oder ergänzen. Jede geänderte Zeile bekommt ein neues `updated` (ISO-Zeit), sonst übernimmt die App sie nicht.
   Gelöschte Einträge kommen mit Zeitstempel in `deleted`.
3. `WERKBANK_PASS=… node tools/werkbank.mjs encrypt /tmp/inhalt.json > data.enc.json`
4. Committen und pushen. Die App holt die Änderungen beim nächsten Öffnen mit Internet und führt sie mit lokalen Änderungen zusammen (der neuere Stand pro Eintrag gewinnt).

Lokale Änderungen der Person bleiben auf ihrem Gerät. Damit sie hier einfließen, lädt sie über „Projekt sichern“ eine Sicherung herunter und gibt sie weiter.
