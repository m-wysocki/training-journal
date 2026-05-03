import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/PageContainer'
import { createClient } from '@/lib/supabase/server'

type AuthCallbackPageProps = {
  searchParams?: Promise<{
    code?: string
    token_hash?: string
    type?: string
  }>
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const code = params?.code
  const tokenHash = params?.token_hash
  const type = params?.type as EmailOtpType | undefined
  let message = 'Sign-in link is missing a verification code.'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirect('/')
    }

    message = 'Could not complete sign-in. Request a new sign-in link.'
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      redirect('/')
    }

    message = 'Could not confirm your email. Request a new sign-in link.'
  }

  return (
    <PageContainer>
      <p>{message}</p>
    </PageContainer>
  )
}
