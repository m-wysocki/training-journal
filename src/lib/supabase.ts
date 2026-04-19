import { createClient } from '@supabase/supabase-js'

/**
 * Konfiguracja Supabase Client
 * 
 * Sesja użytkownika:
 * - Domyślnie trwa do odwołania (bez limitu czasu)
 * - Token dostępu (JWT): domyślnie 1 godzina (automatycznie odświeżany)
 * - Refresh token: nie wygasa (aż do wylogowania)
 * 
 * Aby zmienić czas trwania sesji:
 * 1. Panel Supabase > Authentication > Settings
 * 2. JWT expiry - czas ważności tokenu dostępu (domyślnie 1h)
 * 3. Time-boxed sessions - maksymalny czas życia sesji
 * 4. Inactivity timeout - wygaśnięcie po braku aktywności
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true, // Automatyczne odświeżanie tokenu
      persistSession: true, // Zapis sesji w localStorage
      detectSessionInUrl: true, // Wykrywanie sesji w URL (dla magic link)
    },
  }
)
