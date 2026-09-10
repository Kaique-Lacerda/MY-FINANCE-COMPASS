import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { ensureUserSetup } from "@/services/finance-service";

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch {
    return null;
  }
}

// Shared client-side session cache: `undefined` means "still checking", so
// route guards can render a loading state instead of assuming logged in/out.
type SessionListener = (session: Session | null) => void;

let cachedSession: Session | null | undefined;
const sessionListeners = new Set<SessionListener>();

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedSession = session;
    sessionListeners.forEach((listener) => listener(session));
  });
}

export function getCachedSession() {
  return cachedSession;
}

export function subscribeToSession(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  await ensureUserSetup(data.user.user_metadata?.full_name);
  return data;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  if (data.user && data.session) await ensureUserSetup(fullName);
  return data;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/login", document.baseURI).toString(),
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
