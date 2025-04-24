import {
  auth,
  getGitHubConnection,
  listGitHubInstallations,
} from "@/actions/account";
import { listBooks } from "@/actions/note";

import { ConnectToGitHub } from "@/components/domain/account/ConnectToGitHub";
import { InstallGitHubApps } from "@/components/domain/account/InstallGitHubApps";
import { ManageGitHubApps } from "@/components/domain/account/ManageGitHubApps";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Repositories } from "./Repositories";

export async function GitHubConnection() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const connectionResult = await getGitHubConnection(session.user.id);
  const installationsResult = await listGitHubInstallations(session.user.id);
  const books = await listBooks(session.user.id);

  const installed =
    installationsResult.success && installationsResult.installations.length > 0;
  const connected =
    connectionResult.success && connectionResult.connection !== null;

  return (
    <div className="flex flex-col gap-4">
      {!installed && (
        <>
          <InstallGitHubApps />
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Are you already installed our GitHub Apps?
              </AccordionTrigger>
              <AccordionContent>
                <ConnectToGitHub />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      {installed && !connected && <ConnectToGitHub />}

      <Repositories
        userId={session.user.id}
        owners={installationsResult.installations.map((installation) => ({
          type: installation.account.type === "Organization" ? "org" : "user",
          name: installation.account.login,
        }))}
        usedRepositories={books.map((book) => `${book.owner}/${book.repo}`)}
      />

      <ManageGitHubApps />
    </div>
  );
}
