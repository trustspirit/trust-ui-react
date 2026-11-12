// Writes static/llms.txt: an index of every docs page for AI coding agents.
// Runs before each docs build so the index cannot go stale.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs');
const base = 'https://trustspirit.github.io/trust-ui-react/docs/';

const SECTIONS = [
  ['getting-started', 'Getting started'],
  ['components', 'Components'],
  ['guides', 'Guides'],
  ['design-tokens', 'Design tokens'],
];

function pages(dir) {
  return readdirSync(dir)
    .flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return pages(full);
      return /\.mdx?$/.test(name) ? [full] : [];
    })
    .sort();
}

/** Title from frontmatter, and the first prose paragraph after the H1. */
function describe(file) {
  const text = readFileSync(file, 'utf8');
  const title = /^title:\s*(.+)$/m.exec(text)?.[1].trim() ?? relative(docsDir, file);
  const body = text.replace(/^---[\s\S]*?---/, '');
  const afterHeading = body.slice(body.search(/^# .+$/m)).split('\n').slice(1);
  const paragraph = [];
  for (const line of afterHeading) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(import |<|#|```|\||- )/.test(trimmed)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(trimmed);
  }
  const summary = paragraph.join(' ').replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return { title, summary };
}

const lines = [
  '# trust-ui-react',
  '',
  '> A mobile-optimized, themeable React UI library: CSS Modules, CSS-variable tokens, no runtime styling. Install `trust-ui-react`, import `trust-ui-react/styles.css` once, and import components by name.',
  '',
];

for (const [folder, heading] of SECTIONS) {
  const files = pages(join(docsDir, folder));
  if (!files.length) continue;
  lines.push(`## ${heading}`, '');
  for (const file of files) {
    const { title, summary } = describe(file);
    const slug = relative(docsDir, file).replace(/\.mdx?$/, '');
    lines.push(`- [${title}](${base}${slug})${summary ? `: ${summary}` : ''}`);
  }
  lines.push('');
}

writeFileSync(join(root, 'static', 'llms.txt'), lines.join('\n'));
console.log(`llms.txt: ${lines.filter((l) => l.startsWith('- ')).length} pages`);
