import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { getCurrentSession, subscribeToSession } from "@/lib/auth";

// `beforeLoad` guards (see -auth-guards.ts) can't know the session on the
// server: it only lives in the browser's storage. So the very first (SSR)
// render always skips that check and would otherwise flash protected content.
// These components are the real, client-side source of truth: they render a
// loading state until the session is known, then either show the page or
// redirect — during SSR and the first paint, that's always the loading state.
function useAuthSession() {
  const [session, setSession] =
    useState<Awaited<ReturnType<typeof getCurrentSession>>>(undefined);
  useEffect(() => {
    let active = true;
    getCurrentSession().then((currentSession) => {
      if (active) setSession(currentSession);
    });
    const unsubscribe = subscribeToSession(setSession);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return session;
}

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
        role="status"
        aria-label="Carregando sessão"
      />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const session = useAuthSession();

  useEffect(() => {
    if (session === null) navigate({ to: "/login", replace: true });
  }, [session, navigate]);

  if (!session) return <SessionLoading />;
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const session = useAuthSession();

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  if (session === undefined || session) return <SessionLoading />;
  return <>{children}</>;
}
