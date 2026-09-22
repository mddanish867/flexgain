import { redirect } from "next/navigation";
import { getCurrentUserRecord } from "@/lib/currentUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: "Dashboard · FlexGain",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  return (
    <DashboardShell user={{ name: user.name, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
