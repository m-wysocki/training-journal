'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

type PasswordMode = 'sign-in' | 'sign-up'
type MessageType = 'success' | 'error'

export default function LoginPage() {
  const router = useRouter()
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('success')

  const showMessage = (nextMessage: string, nextType: MessageType) => {
    setMessage(nextMessage)
    setMessageType(nextType)
  }

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key !== 'Enter' ||
      e.shiftKey ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      e.nativeEvent.isComposing
    ) {
      return
    }

    e.preventDefault()
    e.currentTarget.requestSubmit()
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters long.', 'error')
      setLoading(false)
      return
    }

    try {
      if (passwordMode === 'sign-up') {
        if (password !== confirmPassword) {
          showMessage('Passwords must match.', 'error')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.user?.email) {
          await fetch('/api/auth/new-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.user.email,
              userId: data.user.id,
            }),
          })
        }

        if (data.session) {
          router.push('/')
          router.refresh()
          return
        }

        showMessage('Account created. Check your inbox to confirm your email address. Access starts after admin approval.', 'success')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while signing in.'
      showMessage(errorMessage, 'error')
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
            Sign in with your email and password or request a new account.
          </p>
        </div>

        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${passwordMode === 'sign-in' ? styles.modeTabActive : ''}`}
            onClick={() => {
              setPasswordMode('sign-in')
              setConfirmPassword('')
              setMessage('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${passwordMode === 'sign-up' ? styles.modeTabActive : ''}`}
            onClick={() => {
              setPasswordMode('sign-up')
              setMessage('')
            }}
          >
            Create Account
          </button>
        </div>

        <form
          onSubmit={handlePasswordAuth}
          onKeyDown={handleFormKeyDown}
          className={styles.form}
        >
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

          <div>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          {passwordMode === 'sign-up' ? (
            <div>
              <label htmlFor="confirmPassword" className={styles.label}>
                Repeat Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                className={styles.input}
              />
            </div>
          ) : null}

          {message && (
            <div
              className={`${styles.message} ${messageType === 'error' ? styles.messageError : styles.messageSuccess}`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submit}
          >
            {loading
              ? 'Please wait...'
              : passwordMode === 'sign-up'
                  ? 'Create Account'
                  : 'Sign In'}
          </button>
        </form>
      </PageContainer>
    </div>
  )
}
