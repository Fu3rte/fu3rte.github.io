import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'src');
const inputFont = join(srcDir, 'assets', 'fonts', 'RuiMeiJiaHand.ttf');
const outputFont = join(srcDir, 'assets', 'fonts', 'RuiMeiJiaHand-subset.woff2');

const CJK_RE = /[\u2000-\u206F\u3000-\u303F\u4E00-\u9FFF\uFF00-\uFFEF]/g;
const FALLBACK_SEED =
  '技术栈贴纸与物理碰撞桌垫。，。、？！：；（）【】《》“”‘’—…·0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const SCAN_EXTS = new Set(['.json', '.ts', '.tsx']);

function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, out);
    } else if (entry.isFile() && SCAN_EXTS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(source, ext) {
  if (ext === '.json') return source;
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/gm, '$1 ');
}

const glyphs = new Set([...FALLBACK_SEED]);

for (const file of collectFiles(srcDir)) {
  const ext = extname(file);
  const content = stripComments(readFileSync(file, 'utf8'), ext);
  const matches = content.match(CJK_RE);
  if (matches) {
    for (const ch of matches) {
      glyphs.add(ch);
    }
  }
}

const sortedText = [...glyphs].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
const tempFile = join(tmpdir(), `cjk-subset-${process.pid}-${Date.now()}.txt`);

try {
  writeFileSync(tempFile, sortedText, 'utf8');
  execFileSync(
    'uvx',
    [
      '--from',
      'fonttools[woff]',
      'pyftsubset',
      inputFont,
      `--text-file=${tempFile}`,
      '--flavor=woff2',
      '--layout-features=*',
      `--output-file=${outputFont}`,
    ],
    { cwd: root, stdio: 'inherit' },
  );
} finally {
  rmSync(tempFile, { force: true });
}

const inputBytes = statSync(inputFont).size;
const outputBytes = statSync(outputFont).size;
const pct = (((inputBytes - outputBytes) / inputBytes) * 100).toFixed(2);

console.log(
  `Subset generated: ${glyphs.size} unique glyphs | ${inputBytes} B -> ${outputBytes} B (-${pct}%)`,
);
