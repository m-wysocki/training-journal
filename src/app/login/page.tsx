'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { signInWithPassword, signUpWithPassword } from './actions'
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

        const result = await signUpWithPassword(email, password)

        if (result.error) throw new Error(result.error)

        if (result.signedIn) {
          router.push('/')
          router.refresh()
          return
        }

        showMessage(result.message ?? 'Account created. Check your inbox to confirm your email address.', 'success')
        return
      }

      const result = await signInWithPassword(email, password)

      if (result.error) throw new Error(result.error)

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
    <div className={styles.Login}>
      <PageContainer className={styles.LoginContainer}>
        <div className={styles.LoginHeader}>
          <BackLink href="/" label="Back to Home" />
          <h1 className={styles.LoginTitle}>Sign In</h1>
          <p className={styles.LoginDescription}>
            Sign in with your email and password or request a new account.
          </p>
        </div>

        <div className={styles.LoginModeTabs}>
          <button
            type="button"
            className={`${styles.LoginModeTab} ${passwordMode === 'sign-in' ? styles.LoginModeTabActive : ''}`}
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
            className={`${styles.LoginModeTab} ${passwordMode === 'sign-up' ? styles.LoginModeTabActive : ''}`}
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
          className={styles.LoginForm}
        >
          <div>
            <label htmlFor="email" className={styles.LoginLabel}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className={styles.LoginInput}
            />
          </div>

          <div>
            <label htmlFor="password" className={styles.LoginLabel}>
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
              className={styles.LoginInput}
            />
          </div>

          {passwordMode === 'sign-up' ? (
            <div>
              <label htmlFor="confirmPassword" className={styles.LoginLabel}>
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
                className={styles.LoginInput}
              />
            </div>
          ) : null}

          {message && (
            <div
              className={`${styles.LoginMessage} ${messageType === 'error' ? styles.LoginMessageError : styles.LoginMessageSuccess}`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.LoginSubmit}
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
