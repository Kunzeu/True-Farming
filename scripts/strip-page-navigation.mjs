import fs from 'node:fs';
import path from 'node:path';

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, a);
    else if (e.name === 'page.tsx') a.push(f);
  }
  return a;
}

const files = walk('src/app').filter(
  (f) => !f.includes(`${path.sep}api${path.sep}`) && !f.includes(`wintersday${path.sep}Orphan`)
);

let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  s = s.replace(/^import Navigation from ['"]@\/components\/layout\/Navigation['"];?\r?\n/m, '');
  s = s.replace(/^[ \t]*<Navigation\s*\/>\r?\n/gm, '');
  s = s.replace(/^[ \t]*<Navigation><\/Navigation>\r?\n/gm, '');
  if (s !== before) {
    fs.writeFileSync(f, s);
    n++;
    console.log('stripped', f);
  }
}
console.log('updated', n);
