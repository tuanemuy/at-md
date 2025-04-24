import { Mypage } from "./Mypage";
import { ToggleTheme } from "./ToggleTheme";

export async function Nav() {
  return (
    <nav className="flex items-center gap-3">
      <ToggleTheme />
      <Mypage />
    </nav>
  );
}
