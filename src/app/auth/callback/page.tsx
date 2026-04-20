'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import PageContainer from '@/components/PageContainer'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    let isActive = true

    const redirectHome = () => {
      router.replace('/')
      router.refresh()
    }

    const completeSignIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isActive) return

      if (session) {
        redirectHome()
        return
      }

      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!isActive) return

        if (error) {
          setMessage('Could not complete sign-in. Request a new magic link.')
          return
        }

        redirectHome()
        return
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })

        if (!isActive) return

        if (error) {
          setMessage('Could not confirm your email. Request a new sign-in link.')
          return
        }

        redirectHome()
        return
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!isActive) return

        if (error) {
          setMessage('Could not restore your session. Sign in again.')
          return
        }

        redirectHome()
        return
      }

      setMessage('Sign-in link is missing a verification code.')
    }

    void completeSignIn()

    return () => {
      isActive = false
    }
  }, [router])

  return (
    <PageContainer>
      <p>{message}</p>
    </PageContainer>
  )
}
