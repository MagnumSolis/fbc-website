// Cache-busting: gives every CSS/JS file a new URL so browsers never show a stale version.
// Run after changing any CSS or JS:   npm run bump
// (GitHub Pages lets browsers cache files for 10 minutes; a new ?v= forces a fresh download.)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12); // e.g. 202611230615
const files = ["index.html", ...readdirSync("js").filter((f) => f.endsWith(".js")).map((f) => "js/" + f)];

for (const f of files) {
  let s = readFileSync(f, "utf8");
  const before = s;
  if (f === "index.html") {
    s = s.replace(/(css\/styles\.css)(\?v=[\w.-]+)?"/g, `$1?v=${stamp}"`)
         .replace(/(js\/app\.js)(\?v=[\w.-]+)?"/g, `$1?v=${stamp}"`);
  } else {
    // every local import gets the same version, so each module loads exactly once
    s = s.replace(/(from\s+"\.\/[\w-]+\.js)(\?v=[\w.-]+)?"/g, `$1?v=${stamp}"`);
  }
  if (s !== before) { writeFileSync(f, s); console.log("updated", f); }
}
console.log("version", stamp);
