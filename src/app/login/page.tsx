'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.scss'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

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

      setMessage('Sprawdź swoją skrzynkę email - wysłaliśmy Ci magiczny link!')
    } catch (error: any) {
      setMessage(error.message || 'Wystąpił błąd podczas logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href="/"
            className={styles.backLink}
          >
            ← Back to Home
          </Link>
          <h1 className={styles.title}>Logowanie</h1>
          <p className={styles.description}>
            Wprowadź swój adres email, a wyślemy Ci magiczny link do logowania
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
              placeholder="twoj@email.com"
              required
              className={styles.input}
            />
          </div>

          {message && (
            <div
              className={`${styles.message} ${
                message.includes('błąd')
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
            {loading ? 'Wysyłanie...' : 'Wyślij magiczny link'}
          </button>
        </form>
      </div>
    </div>
  )
}
