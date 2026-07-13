import { PageHeader } from "@/components/shared/page-header";
import { PageContent } from "@/components/shared/page-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamMembersPage() {
  return (
    <PageContent>
      <PageHeader
        title="Team members"
        description="Manage org roles and client membership. Org admins only."
      />
      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
          <CardDescription>
            User roster, org roles, and per-client membership will be wired to Firestore in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Create users in Firebase Authentication first, then assign client membership from this
          page.
        </CardContent>
      </Card>
    </PageContent>
  );
}
