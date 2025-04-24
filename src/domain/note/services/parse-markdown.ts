import type { ParsedMarkdown } from "../dtos/parsed-markdown";
import { noteScopeSchema } from "../models/note";

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);

  const [frontMatter, content] = match ? match.slice(1) : ["", markdown];

  const scopeMatch = frontMatter.match(/access:\s*(.*)$/m);
  const scope =
    noteScopeSchema.safeParse(scopeMatch?.at(1)?.trim().replace(/["']/g, ""))
      .data || "private";

  const headingRegex = /^#+\s+(.+)$/m;
  const headingMatch = content.match(headingRegex);

  const title = headingMatch ? headingMatch[1].trim() : null;
  const body = headingMatch
    ? content.substring(headingMatch[0].length)
    : content;

  const hashtagRegex = /#([\p{L}\p{N}_-]+)/gu;
  const hashtagMatch = body.matchAll(hashtagRegex);

  const tags = hashtagMatch
    .map((match) => {
      const beforeMatch = body.substring(0, match.index);
      const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
      return codeBlockCount % 2 === 0 ? match[1].trim() : null;
    })
    .filter((tag): tag is string => tag !== null)
    .toArray();

  return {
    title,
    body: body.trim(),
    tags,
    scope,
  };
}
