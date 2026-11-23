/* Minimal, safe Markdown for journal posts: ## headings, > quotes, - lists, *italic*, **bold**, [links](url). */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const inline = (s: string) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\*(.+?)\*/g, "<em>$1</em>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[\w/-]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

export function renderMarkdown(src: string): string {
  return String(src).split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return "";
    if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
    if (b.startsWith("> ")) return `<blockquote>${inline(b.replace(/^>\s?/gm, ""))}</blockquote>`;
    if (/^- /.test(b)) return `<ul>${b.split(/\n/).map((l) => `<li>${inline(l.replace(/^- /, ""))}</li>`).join("")}</ul>`;
    return `<p>${inline(b).replace(/\n/g, "<br/>")}</p>`;
  }).join("");
}
