'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import AuthButton, { type AuthButtonUser } from '@/components/AuthButton'
import IconButton from '@/components/IconButton'

type AppHeaderActionsProps = {
  initialUser: AuthButtonUser | null
}

export default function AppHeaderActions({ initialUser }: AppHeaderActionsProps) {
  const [user, setUser] = useState<AuthButtonUser | null>(initialUser)

  return (
    <>
      <IconButton href="/completed-exercises/new" aria-label="Log exercise" icon={Plus} iconSize={20} iconStrokeWidth={2} />
      <AuthButton user={user} onUserChange={setUser} />
    </>
  )
}
