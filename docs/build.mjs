// Static docs-site build. Renders docs/content/<slug>.md through docs/pages/template.html,
// generating a shared left-sidebar (from docs/nav.json), a per-page "On this page" TOC, syntax
// highlighting, callouts, a search index and the landing page (docs/pages/home.html).
// Output goes to _site/. Run: `npm --prefix docs ci && node docs/build.mjs` (from repo root)
// or `npm run build` from inside docs/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const docsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(docsDir, '..');
const contentDir = path.join(docsDir, 'content');
const pagesDir = path.join(docsDir, 'pages');
const outDir = path.join(repoRoot, '_site');
const REPO = 'https://github.com/qtpsudhakarproducts/tamash-playwright-support';

const nav = JSON.parse(fs.readFileSync(path.join(docsDir, 'nav.json'), 'utf8'));
const read = (f) => fs.readFileSync(path.join(pagesDir, f), 'utf8');
const template = read('template.html');
const home = read('home.html');
const header = read('header.html');
const footer = read('footer.html');

hljs.registerAliases(['sh', 'shell', 'env', 'dotenv'], { languageName: 'bash' });
hljs.registerAliases(['yml'], { languageName: 'yaml' });

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      return language ? hljs.highlight(code, { language, ignoreIllegals: true }).value : escapeHtml(code);
    },
  }),
);
marked.use(gfmHeadingId());

/** Every page, flat, with prev/next wired up. */
const pages = [];
for (const group of nav.groups) {
  for (const item of group.items) pages.push({ ...item, group: group.title });
}

function sidebarHtml(currentSlug) {
  const parts = ['<nav class="sidebar" id="sidebar" aria-label="Docs">'];
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
    .map((h) => `<li class="lvl-${h.level}"><a href="#${h.id}">${escapeHtml(stripTags(h.text))}</a></li>`)
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

/** Blockquotes that open with a bold label become callouts; the label picks the colour. */
function calloutize(html) {
  return html.replace(/<blockquote>\s*<p><strong>([^<]*)<\/strong>/g, (m, label) => {
    const l = label.toLowerCase();
    const kind = /^(tip|hint)/.test(l) ? 'tip' : /^(warning|caution|gotcha|important|danger)/.test(l) ? 'warn' : 'note';
    return `<blockquote class="callout ${kind}"><p><strong>${label}</strong>`;
  });
}

/** A "#" link beside each heading, so a section can be linked to. */
function anchorize(html) {
  return html.replace(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g, (m, lvl, id, inner) =>
    `<h${lvl} id="${id}">${inner}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${lvl}>`);
}

const stripTags = (html) =>
  html.replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<\/?(code|strong|em|a|span|b|i|mark|kbd)(\s[^>]*)?>/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const f of ['style.css', 'site.js', 'favicon.svg']) fs.copyFileSync(path.join(pagesDir, f), path.join(outDir, f));

// A CNAME file, if present at repo root, is carried through so a custom domain survives deploys.
for (const extra of ['CNAME', '.nojekyll']) {
  const src = path.join(repoRoot, extra);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, extra));
}

const searchIndex = [];
const shell = (html) => html.replace('__HEADER__', header).replace('__FOOTER__', footer);

for (const page of pages) {
  const mdPath = path.join(contentDir, `${page.slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`  MISSING: docs/content/${page.slug}.md`);
    process.exitCode = 1;
    continue;
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  resetHeadings();
  const body = anchorize(calloutize(marked.parse(md)));
  const headings = getHeadingList();

  const firstH1 = headings.find((h) => h.level === 1);
  const pageTitle = firstH1 ? stripTags(firstH1.text) : page.title;
  const plain = stripTags(body);
  const firstPara = stripTags((body.match(/<p>[\s\S]*?<\/p>/) || [''])[0]);
  const description = (firstPara || plain).slice(0, 180).replace(/\s+\S*$/, '');

  // Search entries: the page, then each section heading with the text that follows it.
  searchIndex.push({ kind: 'page', title: page.title, where: page.group, url: `${page.slug}.html`, text: plain.slice(0, 300), hay: `${page.title} ${plain}`.toLowerCase() });
  const sections = body.split(/(?=<h[23] id=")/).slice(1);
  for (const sec of sections) {
    const m = sec.match(/^<h[23] id="([^"]+)">([\s\S]*?)<a class="anchor"/);
    if (!m) continue;
    const text = stripTags(sec.replace(/<h[23][\s\S]*?<\/h[23]>/, ''));
    const title = stripTags(m[2]);
    searchIndex.push({ kind: 'section', title, where: `${page.title} · ${page.group}`, url: `${page.slug}.html#${m[1]}`, text: text.slice(0, 400), hay: `${title} ${text}`.toLowerCase() });
  }

  const html = shell(template)
    .replaceAll('__TITLE__', `${escapeHtml(pageTitle)} — ${escapeHtml(nav.site)}`)
    .replaceAll('__DESC__', escapeHtml(description))
    .replace('__CRUMBS__', `<a href="index.html">Home</a> › ${escapeHtml(page.group)}`)
    .replace('__SIDEBAR__', sidebarHtml(page.slug))
    .replace('__TOC__', tocHtml(headings))
    .replace('__CONTENT__', () => body)
    .replace('__EDIT__', `${REPO}/edit/main/docs/content/${page.slug}.md`)
    .replace('__PAGER__', pagerHtml(page.slug));

  fs.writeFileSync(path.join(outDir, `${page.slug}.html`), html);
  console.log(`  built ${page.slug}.html`);
}

fs.writeFileSync(path.join(outDir, 'search-index.js'), `window.__SEARCH_INDEX__=${JSON.stringify(searchIndex)};\n`);
fs.writeFileSync(path.join(outDir, 'index.html'), shell(home));
console.log(`\n  ${pages.length + 1} pages written to _site/ (${searchIndex.length} search entries)`);
