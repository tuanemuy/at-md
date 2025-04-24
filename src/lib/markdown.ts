import { Marked, Renderer, type Tokens } from "marked";

export async function mdToHtml(markdown: string) {
  const renderer = new Renderer();
  const marked = new Marked({
    renderer: {
      table(token: Tokens.Table) {
        return `<div>${renderer.table.apply(this, [token])}</div>`;
      },
      link({ href, title, text }: Tokens.Link) {
        return `<a target="_blank" rel="noreferrer noopener" href="${href}" title="${title}">${text}</a>`;
      },
    },
  });
  return marked.parse(markdown);
}
