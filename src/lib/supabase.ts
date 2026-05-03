import { createClient } from '@/lib/supabase/client'

/**
 * Browser Supabase client kept for interactive client components.
 * Server Components should use '@/lib/supabase/server' instead.
 */
export const supabase = createClient()
