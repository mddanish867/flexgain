import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata = {
  title: "Settings · FlexGain",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = findUserById(session.uid);
  if (!user) redirect("/login");

  return (
    <DashboardShell user={{ name: user.name, email: user.email }}>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <p className="font-mono-label text-fg-dim mb-2">SETTINGS</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Tune your training.
          </h1>
          <p className="text-fg-muted text-sm mt-2">
            Your goals drive every chart on the dashboard. Update them here.
          </p>
        </div>

        <SettingsForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            settings: user.settings,
          }}
        />
      </div>
    </DashboardShell>
  );
}
