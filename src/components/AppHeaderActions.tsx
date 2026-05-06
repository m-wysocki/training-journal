'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import AuthButton, { type AuthButtonUser } from '@/components/AuthButton'
import ButtonSquare from '@/components/ButtonSquare'

type AppHeaderActionsProps = {
  initialUser: AuthButtonUser | null
}

export default function AppHeaderActions({ initialUser }: AppHeaderActionsProps) {
  const [user, setUser] = useState<AuthButtonUser | null>(initialUser)

  return (
    <>
      <ButtonSquare href="/completed-exercises/new" aria-label="Log exercise">
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
      </ButtonSquare>
      <AuthButton user={user} onUserChange={setUser} />
    </>
  )
}
