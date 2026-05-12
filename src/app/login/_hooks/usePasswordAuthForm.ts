'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPassword, signUpWithPassword } from '../actions'

type PasswordMode = 'sign-in' | 'sign-up'
type MessageType = 'success' | 'error'

type FieldsState = {
  email: string
  password: string
  confirmPassword: string
}

type MessageState = {
  text: string
  type: MessageType
} | null

type UiState = {
  passwordMode: PasswordMode
  loading: boolean
  message: MessageState
}

export function usePasswordAuthForm() {
  const router = useRouter()
  const [fields, setFields] = useState<FieldsState>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [ui, setUi] = useState<UiState>({
    passwordMode: 'sign-in',
    loading: false,
    message: null,
  })

  const updateField = (field: keyof FieldsState, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }))
  }

  const showMessage = (text: string, type: MessageType) => {
    setUi((prev) => ({ ...prev, message: { text, type } }))
  }

  const clearMessage = () => {
    setUi((prev) => ({ ...prev, message: null }))
  }

  const setPasswordMode = (nextMode: PasswordMode) => {
    setUi((prev) => ({ ...prev, passwordMode: nextMode, message: null }))

    if (nextMode === 'sign-in') {
      updateField('confirmPassword', '')
    }
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
    setUi((prev) => ({ ...prev, loading: true, message: null }))

    if (fields.password.length < 6) {
      showMessage('Password must be at least 6 characters long.', 'error')
      setUi((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      if (ui.passwordMode === 'sign-up') {
        if (fields.password !== fields.confirmPassword) {
          showMessage('Passwords must match.', 'error')
          setUi((prev) => ({ ...prev, loading: false }))
          return
        }

        const result = await signUpWithPassword(fields.email, fields.password)

        if (result.error) throw new Error(result.error)

        if (result.signedIn) {
          router.push('/')
          router.refresh()
          return
        }

        showMessage(result.message ?? 'Account created. Check your inbox to confirm your email address.', 'success')
        return
      }

      const result = await signInWithPassword(fields.email, fields.password)

      if (result.error) throw new Error(result.error)

      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while signing in.'
      showMessage(errorMessage, 'error')
    } finally {
      setUi((prev) => ({ ...prev, loading: false }))
    }
  }

  return {
    fields,
    ui,
    setPasswordMode,
    updateField,
    clearMessage,
    handleFormKeyDown,
    handlePasswordAuth,
  }
}
