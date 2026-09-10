import { redirect } from "@tanstack/react-router";

import { getCurrentSession } from "@/lib/auth";

export async function requireAuthentication() {
  if (typeof window === "undefined") return;
  const session = await getCurrentSession();
  if (!session) throw redirect({ to: "/login" });
}

export async function redirectAuthenticatedUser() {
  if (typeof window === "undefined") return;
  const session = await getCurrentSession();
  if (session) throw redirect({ to: "/" });
}
