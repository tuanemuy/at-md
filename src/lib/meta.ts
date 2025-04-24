export function extractDescription(body: string): string {
  return body
    .replace(/\r?\n/g, "")
    .replace(/(<([^>]+)>)/gi, "")
    .trim()
    .slice(0, 200);
}
