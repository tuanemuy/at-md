import { Suspense } from "react";
import { Icon } from "@/components/brand/Icon";
import { ForUser } from "@/components/domain/account/ForUser";
import { ErrorToaster } from "@/components/notification/ErrorToaster";
import { Nav } from "./_components/Nav";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  const footerLinks = [
    {
      label: "Privacy Policy",
      href: "/privacy",
    },
    {
      label: "Terms of Service",
      href: "/terms",
    },
  ];
  return (
    <>
      <header className="sticky top-0 z-1 flex items-center justify-between py-2 px-4 bg-background border-b">
        <a href="/" className="no-underline">
          <Icon className="h-5 w-auto" />
        </a>

        <Nav />
      </header>

      <div className="relative z-0">{children}</div>

      <footer className="relative z-0 px-8 pb-4">
        <ul className="flex justify-center flex-wrap gap-6 gap-y-2">
          {footerLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="hover:underline">
                {link.label}
              </a>
            </li>
          ))}
          <ForUser>
            <li>
              <a href="/auth/delete" className="hover:underline">
                Delete account
              </a>
            </li>
          </ForUser>
        </ul>
      </footer>

      <Suspense>
        <ErrorToaster />
      </Suspense>
    </>
  );
}
