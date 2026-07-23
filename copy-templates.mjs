import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, 'draft/product-skeleton');
const dest = path.join(__dirname, 'templates/product-skeleton');

fs.cpSync(src, dest, { recursive: true });
console.log('Copied missing templates');
