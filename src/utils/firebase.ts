import { Capacitor } from '@capacitor/core';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

interface BackendServices {
  supabase: SupabaseClient;
}

let cachedServices: BackendServices | null = null;

function hasConfigValue(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('your-');
}

export function isFirebaseConfigured() {
  return [import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY].every(hasConfigValue);
}

export const isSupabaseConfigured = isFirebaseConfigured;

export function getSupabaseClient() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (cachedServices) {
    return cachedServices.supabase;
  }

  const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-hercare-platform': Capacitor.getPlatform(),
      },
    },
  });

  cachedServices = { supabase };
  return supabase;
}

export async function ensureAnonymousSession(): Promise<{
  supabase: SupabaseClient;
  session: Session;
  user: User;
} | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const currentSessionResult = await supabase.auth.getSession();

  if (currentSessionResult.error) {
    throw currentSessionResult.error;
  }

  let session = currentSessionResult.data.session;

  if (!session) {
    const anonymousSignInResult = await supabase.auth.signInAnonymously();

    if (anonymousSignInResult.error) {
      throw anonymousSignInResult.error;
    }

    session = anonymousSignInResult.data.session;
  }

  if (!session?.user) {
    throw new Error('Unable to start a secure partner session right now.');
  }

  return {
    supabase,
    session,
    user: session.user,
  };
}
