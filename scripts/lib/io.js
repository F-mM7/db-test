import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

export const dataDir = path.join(ROOT, 'data');
export const publicDir = path.join(ROOT, 'public');

export function loadHtml(filename, hint) {
  const htmlPath = path.join(dataDir, filename);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Error: ${filename} not found!`);
    if (hint) console.error(hint);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  console.log(`✓ Loaded ${filename} (${html.length} characters)`);
  return html;
}

export function writeJson(targetDir, filename, data) {
  fs.mkdirSync(targetDir, { recursive: true });
  const outPath = path.join(targetDir, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`✓ Wrote ${outPath}`);
  return outPath;
}
