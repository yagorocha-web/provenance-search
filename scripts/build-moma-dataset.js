// Regenerates data/moma-artworks.json.gz from MoMA's official open-access dataset
// (https://github.com/MuseumofModernArt/collection). Run with: node scripts/build-moma-dataset.js
//
// The Artworks.csv in that repo is stored via Git LFS; GitHub's raw URL only serves the
// LFS pointer, so we fetch the real content from media.githubusercontent.com instead.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SOURCE_URL = 'https://media.githubusercontent.com/media/MuseumofModernArt/collection/main/Artworks.csv';
const OUT_PATH = path.join(__dirname, '..', 'data', 'moma-artworks.json.gz');

function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function main() {
  console.log('Downloading MoMA Artworks.csv (~70MB)...');
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const text = (await res.text()).replace(/^﻿/, '');

  console.log('Parsing CSV...');
  const table = parseCsv(text);
  const header = table[0];
  const idx = {
    title: header.indexOf('Title'),
    artist: header.indexOf('Artist'),
    date: header.indexOf('Date'),
    medium: header.indexOf('Medium'),
    credit: header.indexOf('CreditLine'),
    url: header.indexOf('URL')
  };

  const rows = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const title = (r[idx.title] || '').trim();
    const artist = (r[idx.artist] || '').trim();
    if (!title || !artist) continue;
    rows.push({
      t: title, a: artist,
      d: (r[idx.date] || '').trim(),
      m: (r[idx.medium] || '').trim(),
      c: (r[idx.credit] || '').trim(),
      u: (r[idx.url] || '').trim()
    });
  }

  console.log(`Kept ${rows.length} artworks. Compressing...`);
  const json = JSON.stringify(rows);
  const gz = zlib.gzipSync(json, { level: 9 });
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, gz);
  console.log(`Wrote ${OUT_PATH} (${(gz.length / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
