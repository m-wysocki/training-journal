'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage('Check your inbox — we sent you a magic login link.')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while signing in.'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.description}>
            Enter your email address and we&apos;ll send you a magic sign-in link.
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className={styles.input}
            />
          </div>

          {message && (
            <div
              className={`${styles.message} ${
                message.toLowerCase().includes('error')
                  ? styles.messageError
                  : styles.messageSuccess
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submit}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
      </PageContainer>
    </div>
  )
}
