import { redirect } from "next/navigation";
import { getCurrentUserRecord } from "@/lib/currentUser";
import { OverviewClient } from "@/components/dashboard/OverviewClient";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");
  return <OverviewClient user={{ name: user.name }} />;
}
