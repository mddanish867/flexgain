import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUserRecord } from "@/lib/currentUser";

export const metadata = {
  title: "Sign in · FlexGain",
};

export default async function LoginPage() {
  // Uses the full check, not just a valid signature: a revoked session
  // must fall through to the form rather than bounce to a page that
  // will only redirect back here.
  const user = await getCurrentUserRecord();
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
