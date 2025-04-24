import { DeleteAccount } from "@/components/domain/account/DeleteAccount";
import { ForGuest } from "@/components/domain/account/ForGuest";
import { ForUser } from "@/components/domain/account/ForUser";

export default function Page() {
  return (
    <main className="flex items-center justify-center py-(--spacing-layout-lg)">
      <div className="content article">
        <ForUser>
          <h1>Delete account</h1>
          <p>Permanently delete your account and all of your content.</p>

          <div>
            <DeleteAccount />
          </div>
        </ForUser>

        <ForGuest>
          <h1>Thank you for using our service!</h1>
          <p>Your account has been deleted. We hope to see you again soon.</p>
        </ForGuest>
      </div>
    </main>
  );
}
