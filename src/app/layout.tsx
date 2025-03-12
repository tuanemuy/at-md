import type { Metadata } from "next";
import "@/lib/style/global.css";

export const metadata: Metadata = {
  title: "@md",
  description: "",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
