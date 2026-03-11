// Bootstrap → Tailwind class conversion script
// Run: node scripts/migrate-bootstrap.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';

// Bootstrap → Tailwind class mappings
const replacements = [
  // Display
  ['d-flex', 'flex'],
  ['d-none', 'hidden'],
  ['d-block', 'block'],
  ['d-inline', 'inline'],
  ['d-inline-flex', 'inline-flex'],
  ['d-grid', 'grid'],
  ['d-lg-none', 'lg:hidden'],
  ['d-lg-block', 'lg:block'],
  ['d-lg-flex', 'lg:flex'],
  ['d-md-inline', 'md:inline'],
  ['d-md-block', 'md:block'],
  ['d-md-flex', 'md:flex'],
  ['d-sm-flex', 'sm:flex'],

  // Flexbox
  ['flex-column', 'flex-col'],
  ['flex-row', 'flex-row'], // same
  ['flex-wrap', 'flex-wrap'], // same
  ['flex-grow-1', 'flex-grow'],
  ['flex-shrink-0', 'shrink-0'],
  ['flex-fill', 'flex-1'],
  ['justify-content-center', 'justify-center'],
  ['justify-content-between', 'justify-between'],
  ['justify-content-around', 'justify-around'],
  ['justify-content-end', 'justify-end'],
  ['justify-content-start', 'justify-start'],
  ['align-items-center', 'items-center'],
  ['align-items-start', 'items-start'],
  ['align-items-end', 'items-end'],
  ['align-items-baseline', 'items-baseline'],
  ['align-items-stretch', 'items-stretch'],
  ['align-self-center', 'self-center'],
  ['align-self-end', 'self-end'],

  // Spacing - margins
  ['mb-0', 'mb-0'],
  ['mb-1', 'mb-1'],
  ['mb-2', 'mb-2'],
  ['mb-3', 'mb-3'],
  ['mb-4', 'mb-4'],
  ['mb-5', 'mb-6'],
  ['mt-0', 'mt-0'],
  ['mt-1', 'mt-1'],
  ['mt-2', 'mt-2'],
  ['mt-3', 'mt-3'],
  ['mt-4', 'mt-4'],
  ['mt-5', 'mt-6'],
  ['ms-1', 'ml-1'],
  ['ms-2', 'ml-2'],
  ['ms-3', 'ml-3'],
  ['ms-auto', 'ml-auto'],
  ['me-1', 'mr-1'],
  ['me-2', 'mr-2'],
  ['me-3', 'mr-3'],
  ['me-auto', 'mr-auto'],
  ['mx-auto', 'mx-auto'],
  ['my-1', 'my-1'],
  ['my-2', 'my-2'],
  ['my-3', 'my-3'],
  ['my-4', 'my-4'],

  // Spacing - padding
  ['p-0', 'p-0'],
  ['p-1', 'p-1'],
  ['p-2', 'p-2'],
  ['p-3', 'p-3'],
  ['p-4', 'p-4'],
  ['p-5', 'p-6'],
  ['px-1', 'px-1'],
  ['px-2', 'px-2'],
  ['px-3', 'px-3'],
  ['px-4', 'px-4'],
  ['px-5', 'px-6'],
  ['py-1', 'py-1'],
  ['py-2', 'py-2'],
  ['py-3', 'py-3'],
  ['py-4', 'py-4'],
  ['py-5', 'py-6'],
  ['pb-1', 'pb-1'],
  ['pb-2', 'pb-2'],
  ['pb-3', 'pb-3'],
  ['pb-4', 'pb-4'],
  ['pb-5', 'pb-6'],
  ['pt-1', 'pt-1'],
  ['pt-2', 'pt-2'],
  ['pt-3', 'pt-3'],
  ['pt-4', 'pt-4'],
  ['pe-2', 'pr-2'],
  ['pe-3', 'pr-3'],
  ['ps-2', 'pl-2'],
  ['ps-3', 'pl-3'],
  ['p-md-4', 'md:p-4'],
  ['p-sm-5', 'sm:p-6'],
  ['p-lg-5', 'lg:p-6'],

  // Gap
  ['gap-1', 'gap-1'],
  ['gap-2', 'gap-2'],
  ['gap-3', 'gap-3'],
  ['gap-4', 'gap-4'],

  // Grid
  ['row ', 'grid grid-cols-12 gap-4 '],
  ['col-12', 'col-span-12'],
  ['col-6', 'col-span-6'],
  ['col-lg-8', 'lg:col-span-8'],
  ['col-lg-4', 'lg:col-span-4'],
  ['col-lg-6', 'lg:col-span-6'],
  ['col-lg-3', 'lg:col-span-3'],
  ['col-md-8', 'md:col-span-8'],
  ['col-md-6', 'md:col-span-6'],
  ['col-md-4', 'md:col-span-4'],
  ['g-3', 'gap-3'],
  ['g-4', 'gap-4'],

  // Text
  ['text-center', 'text-center'],
  ['text-start', 'text-left'],
  ['text-end', 'text-right'],
  ['text-muted', 'text-slate-400'],
  ['text-secondary', 'text-slate-500'],
  ['text-primary', 'text-chrono-blue'],
  ['text-dark', 'text-navy'],
  ['text-white', 'text-white'],
  ['text-danger', 'text-red-500'],
  ['text-success', 'text-emerald-500'],
  ['text-warning', 'text-amber-500'],
  ['text-info', 'text-sky-500'],
  ['text-white-50', 'text-white/50'],
  ['text-truncate', 'truncate'],
  ['text-uppercase', 'uppercase'],
  ['text-decoration-none', 'no-underline'],
  ['small', 'text-sm'],

  // Font
  ['fw-bold', 'font-bold'],
  ['fw-semibold', 'font-semibold'],
  ['fw-light', 'font-light'],
  ['fw-normal', 'font-normal'],
  ['fs-1', 'text-4xl'],
  ['fs-2', 'text-3xl'],
  ['fs-3', 'text-2xl'],
  ['fs-4', 'text-xl'],
  ['fs-5', 'text-lg'],
  ['fs-6', 'text-base'],
  ['display-1', 'text-7xl'],
  ['display-4', 'text-5xl'],
  ['display-6', 'text-4xl'],
  ['font-monospace', 'font-mono'],

  // Width/Height
  ['w-100', 'w-full'],
  ['h-100', 'h-full'],
  ['min-vh-100', 'min-h-screen'],
  ['vh-100', 'h-screen'],
  ['min-vh-50', 'min-h-[50vh]'],

  // Position
  ['position-relative', 'relative'],
  ['position-absolute', 'absolute'],
  ['position-fixed', 'fixed'],
  ['position-sticky', 'sticky'],
  ['fixed-bottom', 'fixed bottom-0 left-0 right-0'],
  ['top-0', 'top-0'],
  ['bottom-0', 'bottom-0'],
  ['start-0', 'left-0'],
  ['end-0', 'right-0'],
  ['top-50', 'top-1/2'],
  ['translate-middle', '-translate-x-1/2 -translate-y-1/2'],
  ['translate-middle-y', '-translate-y-1/2'],

  // Background
  ['bg-light', 'bg-gray-50'],
  ['bg-dark', 'bg-navy'],
  ['bg-white', 'bg-white'],
  ['bg-transparent', 'bg-transparent'],
  ['bg-danger', 'bg-red-500'],
  ['bg-success', 'bg-emerald-500'],
  ['bg-warning', 'bg-amber-500'],
  ['bg-info', 'bg-sky-500'],
  ['bg-primary', 'bg-chrono-blue'],
  ['bg-secondary', 'bg-slate-500'],
  ['bg-opacity-10', 'bg-opacity-10'],
  ['bg-opacity-25', 'bg-opacity-25'],

  // Borders
  ['border-0', 'border-0'],
  ['border', 'border'],
  ['border-top', 'border-t'],
  ['border-bottom', 'border-b'],
  ['border-secondary', 'border-slate-500'],
  ['border-secondary-subtle', 'border-gray-200'],
  ['border-opacity-25', 'border-opacity-25'],

  // Rounded
  ['rounded-0', 'rounded-none'],
  ['rounded-1', 'rounded-sm'],
  ['rounded-2', 'rounded'],
  ['rounded-3', 'rounded-lg'],
  ['rounded-4', 'rounded-2xl'],
  ['rounded-5', 'rounded-3xl'],
  ['rounded-pill', 'rounded-full'],
  ['rounded-circle', 'rounded-full'],
  ['rounded-bottom-4', 'rounded-b-2xl'],
  ['rounded-end', 'rounded-r'],

  // Shadow
  ['shadow-sm', 'shadow-sm'],
  ['shadow', 'shadow-md'],
  ['shadow-lg', 'shadow-lg'],
  ['shadow-none', 'shadow-none'],

  // Overflow
  ['overflow-hidden', 'overflow-hidden'],
  ['overflow-auto', 'overflow-auto'],

  // Visibility
  ['visually-hidden', 'sr-only'],
  ['invisible', 'invisible'],
  ['visible', 'visible'],

  // Table
  ['table', 'w-full'],

  // Form
  ['form-control', 'w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm'],
  ['form-label', 'block text-sm font-semibold text-gray-700 mb-2'],
  ['form-select', 'w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm'],
  ['form-check-input', 'accent-chrono-blue'],
  ['input-group', 'relative'],

  // Buttons
  ['btn btn-primary', 'bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none'],
  ['btn btn-dark', 'bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none'],
  ['btn btn-outline-secondary', 'bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer'],
  ['btn btn-outline-danger', 'bg-transparent text-red-500 border border-red-500 px-4 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-colors cursor-pointer'],
  ['btn btn-outline-light', 'bg-transparent text-white border border-white/30 px-4 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors cursor-pointer'],
  ['btn btn-success', 'bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-colors cursor-pointer border-none'],
  ['btn btn-danger', 'bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors cursor-pointer border-none'],
  ['btn btn-warning', 'bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors cursor-pointer border-none'],
  ['btn btn-light', 'bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200'],
  ['btn btn-secondary', 'bg-slate-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-600 transition-colors cursor-pointer border-none'],
  ['btn btn-sm', 'text-sm py-1.5 px-3'],
  ['btn btn-lg', 'text-lg py-3 px-6'],
  ['btn btn-link', 'bg-transparent border-none cursor-pointer'],

  // Spinner
  ['spinner-border', 'animate-spin'],
  ['spinner-border-sm', 'animate-spin w-4 h-4'],
  ['spinner-grow', 'animate-pulse'],
  ['spinner-grow-sm', 'animate-pulse w-2 h-2'],

  // Badge
  ['badge bg-danger', 'bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-success', 'bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-warning', 'bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-primary', 'bg-chrono-blue text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-secondary', 'bg-slate-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-info', 'bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'],
  ['badge bg-light', 'bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold'],

  // Alert
  ['alert alert-danger', 'bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm'],
  ['alert alert-success', 'bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm'],
  ['alert alert-warning', 'bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm'],
  ['alert alert-info', 'bg-sky-50 border border-sky-200 text-sky-700 rounded-xl p-3 text-sm'],

  // Card
  ['card-body', 'p-4'],
  ['card-header', 'p-4 border-b border-gray-100'],
  ['card-footer', 'p-4 border-t border-gray-100'],

  // Modal
  ['modal-dialog', 'fixed inset-0 z-50 flex items-center justify-center p-4'],
  ['modal-content', 'bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto'],
  ['modal-header', 'flex items-center justify-between p-5 border-b border-gray-100'],
  ['modal-body', 'p-5'],
  ['modal-footer', 'flex justify-end gap-2 p-5 border-t border-gray-100'],
  ['modal-title', 'font-bold text-lg text-navy'],
  ['btn-close', 'text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl'],

  // Progress
  ['progress', 'bg-gray-200 rounded-full overflow-hidden'],
  ['progress-bar', 'h-full'],
  ['progress-bar-striped', 'bg-stripes'],
  ['progress-bar-animated', 'animate-pulse'],

  // Nav
  ['nav-item', 'list-none'],
  ['nav ', 'flex '],
  ['nav-pills', 'gap-1'],

  // Row cols
  ['row-cols-1', 'grid grid-cols-1'],
  ['row-cols-sm-2', 'sm:grid-cols-2'],
  ['row-cols-lg-4', 'lg:grid-cols-4'],
  ['row-cols-lg-3', 'lg:grid-cols-3'],
];

function getAllFiles(dir) {
  const files = [];
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        files.push(...getAllFiles(fullPath));
      }
    } else if (['.tsx', '.ts'].includes(extname(item)) && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  // Sort replacements by length (longest first) to avoid partial matches
  const sorted = [...replacements].sort((a, b) => b[0].length - a[0].length);

  for (const [from, to] of sorted) {
    if (from === to) continue; // Skip identical mappings

    // Only replace within className attributes and string literals
    // Use word boundary-ish matching to avoid partial replacements
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=["'\\s\`])${escapedFrom}(?=["'\\s\`])`, 'g');

    const newContent = content.replace(regex, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  // Remove bootstrap icon references and suggest lucide
  // Don't auto-replace icons as they need manual mapping

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
  }

  return changed;
}

// Main
const files = getAllFiles(SRC_DIR);
let updatedCount = 0;

for (const file of files) {
  if (migrateFile(file)) {
    updatedCount++;
  }
}

console.log(`\n🎉 Done! Updated ${updatedCount} of ${files.length} files.`);
