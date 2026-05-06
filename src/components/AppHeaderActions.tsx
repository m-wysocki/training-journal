'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import AuthButton, { type AuthButtonUser } from '@/components/AuthButton'
import ButtonSquare from '@/components/ButtonSquare'
import { getAuthButtonUser } from '@/components/authActions'

export default function AppHeaderActions() {
  const [user, setUser] = useState<AuthButtonUser | null>(null)

  useEffect(() => {
    let isActive = true

    getAuthButtonUser()
      .then((nextUser) => {
        if (!isActive) return

        setUser(nextUser)
      })
      .catch(() => {
        if (!isActive) return

        setUser(null)
      })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <>
      <ButtonSquare href="/completed-exercises/new" aria-label="Log exercise">
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
      </ButtonSquare>
      <AuthButton user={user} onUserChange={setUser} />
    </>
  )
}
