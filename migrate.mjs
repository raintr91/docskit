import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Move draft/product-skeleton/components and surfaces/common to templates/
const draftSkeleton = path.join(__dirname, 'draft/product-skeleton');
const templatesSkeleton = path.join(__dirname, 'templates/product-skeleton');
if (fs.existsSync(path.join(draftSkeleton, 'components'))) {
  copyDir(path.join(draftSkeleton, 'components'), path.join(templatesSkeleton, 'components'));
}
if (fs.existsSync(path.join(draftSkeleton, 'surfaces/common'))) {
  copyDir(path.join(draftSkeleton, 'surfaces/common'), path.join(templatesSkeleton, 'surfaces/common'));
}

// 2. Move draft/schemas to harness/cursor/schemas/docskit
const draftSchemas = path.join(__dirname, 'draft/schemas');
const destSchemas = path.join(__dirname, 'harness/cursor/schemas/docskit');
if (fs.existsSync(draftSchemas)) {
  copyDir(draftSchemas, destSchemas);
}

// 3. Move draft/templates to templates/shared
const draftTemplates = path.join(__dirname, 'draft/templates');
const destShared = path.join(__dirname, 'templates/shared');
if (fs.existsSync(draftTemplates)) {
  copyDir(draftTemplates, destShared);
}

// 4. Move draft/.vitepress to engines/docs/vitepress
const draftVitepress = path.join(__dirname, 'draft/.vitepress');
const destVitepress = path.join(__dirname, 'engines/docs/vitepress');
if (fs.existsSync(draftVitepress)) {
  copyDir(draftVitepress, destVitepress);
}

// 6. Delete draft completely
if (fs.existsSync(path.join(__dirname, 'draft'))) {
  fs.rmSync(path.join(__dirname, 'draft'), { recursive: true, force: true });
}

console.log('Migration complete');
