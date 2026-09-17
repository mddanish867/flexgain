import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";
import { OverviewClient } from "@/components/dashboard/OverviewClient";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) return null;
  const user = findUserById(session.uid);
  if (!user) return null;
  return <OverviewClient user={{ name: user.name }} />;
}
