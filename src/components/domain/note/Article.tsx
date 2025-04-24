import xss, { escapeAttrValue } from "xss";

type Props = {
  text: string;
};

export function Article({ text }: Props) {
  const sanitized = xss(text, {
    onIgnoreTagAttr: (_tag, name, value) => {
      if (name === "class") {
        return `${name}="${escapeAttrValue(value)}"`;
      }
    },
  });

  return (
    <article
      className="article"
      dangerouslySetInnerHTML={{
        __html: sanitized,
      }}
    />
  );
}
