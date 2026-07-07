// Download tiles through Vite proxy (localhost:5173/tiles/...)
// Prereq: frontend dev server must be running (npm run dev)
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173/tiles-dl/dark_nolabels';
const OUT = path.join(__dirname, '..', 'frontend', 'public', 'tiles');

const BOUNDS = { north: 23.8, south: 22.2, east: 115.8, west: 109.8 };

function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const rad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n);
  return { x, y };
}

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 200) { resolve(); return; }
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          if (fs.existsSync(dest) && fs.statSync(dest).size < 200) fs.unlinkSync(dest);
          resolve();
        });
      } else {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        resolve();
      }
    }).on('error', () => { file.close(); try { fs.unlinkSync(dest); } catch {} resolve(); });
  });
}

(async () => {
  // Test connection first
  const testUrl = `${BASE}/10/834/444.png`;
  console.log('Testing Vite proxy...');
  const ok = await new Promise(r => {
    http.get(testUrl, res => r(res.statusCode === 200));
  });
  if (!ok) {
    console.log('ERROR: Vite proxy not accessible. Make sure frontend is running: npm run dev');
    process.exit(1);
  }
  console.log('Proxy OK, downloading...\n');

  const zooms = [8, 9, 10, 11, 12, 13, 14];
  const jobs = [];
  for (const z of zooms) {
    const nw = latLngToTile(BOUNDS.north, BOUNDS.west, z);
    const se = latLngToTile(BOUNDS.south, BOUNDS.east, z);
    for (let x = nw.x; x <= se.x; x++)
      for (let y = nw.y; y <= se.y; y++)
        jobs.push({ z, x, y });
  }

  console.log(`Total: ${jobs.length} tiles\n`);
  let done = 0;
  const BATCH = 20;

  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    await Promise.all(batch.map(j => {
      const url = `${BASE}/${j.z}/${j.x}/${j.y}.png`;
      const dest = path.join(OUT, `${j.z}/${j.x}/${j.y}.png`);
      return download(url, dest);
    }));
    done += batch.length;
    process.stdout.write(`\r${done}/${jobs.length} (${Math.round(done/jobs.length*100)}%)`);
  }
  console.log('\nDone!');
})();
