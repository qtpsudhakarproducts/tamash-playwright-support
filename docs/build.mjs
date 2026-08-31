// Static docs-site build. Renders docs/content/<slug>.md through docs/pages/template.html,
// generating a shared left-sidebar (from docs/nav.json) and a per-page "On this page" TOC.
// Output goes to _site/. Run: `npm --prefix docs ci && node docs/build.mjs` (from repo root)
// or `npm run build` from inside docs/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id';

const docsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(docsDir, '..');
const contentDir = path.join(docsDir, 'content');
const outDir = path.join(repoRoot, '_site');

const nav = JSON.parse(fs.readFileSync(path.join(docsDir, 'nav.json'), 'utf8'));
const template = fs.readFileSync(path.join(docsDir, 'pages', 'template.html'), 'utf8');

const marked = new Marked();
marked.use(gfmHeadingId());

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Every page, flat, with prev/next wired up. */
const pages = [];
for (const group of nav.groups) {
  for (const item of group.items) {
    pages.push({ ...item, group: group.title });
  }
}

function sidebarHtml(currentSlug) {
  const parts = ['<nav class="sidebar" aria-label="Docs">'];
  for (const group of nav.groups) {
    parts.push(`<div class="side-group"><p class="side-group-title">${escapeHtml(group.title)}</p><ul>`);
    for (const item of group.items) {
      const active = item.slug === currentSlug ? ' class="active" aria-current="page"' : '';
      parts.push(`<li><a href="${item.slug}.html"${active}>${escapeHtml(item.title)}</a></li>`);
    }
    parts.push('</ul></div>');
  }
  parts.push('</nav>');
  return parts.join('\n');
}

function tocHtml(headings) {
  const relevant = headings.filter((h) => h.level === 2 || h.level === 3);
  if (relevant.length < 2) return '';
  const items = relevant
    .map((h) => `<li class="lvl-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
    .join('\n');
  return `<aside class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ul>\n${items}\n</ul></aside>`;
}

function pagerHtml(currentSlug) {
  const idx = pages.findIndex((p) => p.slug === currentSlug);
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;
  if (!prev && !next) return '';
  const link = (p, rel) =>
    p
      ? `<a class="pager-link ${rel}" href="${p.slug}.html"><span>${rel === 'prev' ? '← Previous' : 'Next →'}</span><strong>${escapeHtml(p.title)}</strong></a>`
      : '<span></span>';
  return `<div class="pager">${link(prev, 'prev')}${link(next, 'next')}</div>`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(docsDir, 'pages', 'style.css'), path.join(outDir, 'style.css'));

// A CNAME file, if present at repo root, is carried through so a custom domain survives deploys.
for (const extra of ['CNAME', '.nojekyll']) {
  const src = path.join(repoRoot, extra);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, extra));
}

for (const page of pages) {
  const mdPath = path.join(contentDir, `${page.slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`  MISSING: docs/content/${page.slug}.md`);
    process.exitCode = 1;
    continue;
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  resetHeadings();
  const body = marked.parse(md);
  const headings = getHeadingList();

  const firstH1 = headings.find((h) => h.level === 1);
  const pageTitle = firstH1 ? firstH1.text : page.title;

  const html = template
    .replaceAll('__TITLE__', `${escapeHtml(pageTitle)} — ${escapeHtml(nav.site)}`)
    .replace('__SIDEBAR__', sidebarHtml(page.slug))
    .replace('__TOC__', tocHtml(headings))
    .replace('__CONTENT__', body)
    .replace('__PAGER__', pagerHtml(page.slug));

  fs.writeFileSync(path.join(outDir, `${page.slug}.html`), html);
  console.log(`  built ${page.slug}.html`);
}

// index.html → the introduction page.
fs.copyFileSync(path.join(outDir, 'intro.html'), path.join(outDir, 'index.html'));
console.log(`\n  ${pages.length + 1} pages written to _site/`);
