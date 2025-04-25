import { Suspense } from "react";
import { Mypage } from "./Mypage";
import { ToggleTheme } from "./ToggleTheme";

export async function Nav() {
  return (
    <nav className="flex items-center gap-3">
      <ToggleTheme />
      <Suspense>
        <Mypage />
      </Suspense>
    </nav>
  );
}
