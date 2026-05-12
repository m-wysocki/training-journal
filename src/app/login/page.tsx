'use client'

import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import { usePasswordAuthForm } from './hooks/usePasswordAuthForm'
import styles from './page.module.scss'

export default function LoginPage() {
  const { fields, ui, setPasswordMode, updateField, handleFormKeyDown, handlePasswordAuth } = usePasswordAuthForm()

  return (
    <div className={styles.Login}>
      <PageContainer className={styles.LoginContainer}>
        <BackLink href="/" label="Back to Home" />
        <PageHeader
          title="Sign In"
          description="Sign in with your email and password or request a new account."
        />

        <div className={styles.LoginModeTabs}>
          <button
            type="button"
            className={`${styles.LoginModeTab} ${ui.passwordMode === 'sign-in' ? styles.LoginModeTabActive : ''}`}
            onClick={() => setPasswordMode('sign-in')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.LoginModeTab} ${ui.passwordMode === 'sign-up' ? styles.LoginModeTabActive : ''}`}
            onClick={() => setPasswordMode('sign-up')}
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
              value={fields.email}
              onChange={(e) => updateField('email', e.target.value)}
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
              value={fields.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className={styles.LoginInput}
            />
          </div>

          {ui.passwordMode === 'sign-up' ? (
            <div>
              <label htmlFor="confirmPassword" className={styles.LoginLabel}>
                Repeat Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={fields.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                className={styles.LoginInput}
              />
            </div>
          ) : null}

          {ui.message && (
            <div
              className={`${styles.LoginMessage} ${ui.message.type === 'error' ? styles.LoginMessageError : styles.LoginMessageSuccess}`}
            >
              {ui.message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={ui.loading}
            className={styles.LoginSubmit}
          >
            {ui.loading
              ? 'Please wait...'
              : ui.passwordMode === 'sign-up'
                  ? 'Create Account'
                  : 'Sign In'}
          </button>
        </form>
      </PageContainer>
    </div>
  )
}
