import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";
import { OverviewClient } from "@/components/dashboard/OverviewClient";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await findUserById(session.uid);
  if (!user) redirect("/login");
  return <OverviewClient user={{ name: user.name }} />;
}
