'use client'

import { useState } from 'react'

import styles from './NumericStepper.module.scss'

type DurationStepperProps = {
  id: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  inputClassName?: string
  disabled?: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const roundToStep = (value: number, step: number) => Math.round(value / step) * step

const formatDurationInput = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const normalizeDraft = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

const parseDurationInput = (rawValue: string) => {
  const match = rawValue.match(/^(\d{1,2}):(\d{2})$/)

  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (minutes > 59) return null
  if (hours > 24) return null
  if (hours === 24 && minutes !== 0) return null

  return hours * 3600 + minutes * 60
}

export function DurationStepper({
  id,
  value,
  min,
  max,
  step = 300,
  onChange,
  inputClassName,
  disabled = false,
}: DurationStepperProps) {
  const [inputValue, setInputValue] = useState(formatDurationInput(value))

  const commitInputValue = (rawValue: string) => {
    const parsed = parseDurationInput(rawValue)

    if (parsed === null) {
      setInputValue(formatDurationInput(value))
      return
    }

    const nextValue = clamp(roundToStep(parsed, step), min, max)

    setInputValue(formatDurationInput(nextValue))
    onChange(nextValue)
  }

  const updateByStep = (direction: -1 | 1) => {
    const nextValue = clamp(value + direction * step, min, max)

    setInputValue(formatDurationInput(nextValue))
    onChange(nextValue)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => updateByStep(-1)}
          disabled={disabled || value <= min}
          aria-label="Decrease duration by 5 minutes"
        >
          -
        </button>
        <div className={styles.inputShell}>
          <input
            id={id}
            className={[styles.valueInput, styles.valueInputWithUnit, inputClassName].filter(Boolean).join(' ')}
            type="text"
            inputMode="numeric"
            placeholder="00:10"
            value={inputValue}
            onChange={(e) => setInputValue(normalizeDraft(e.target.value))}
            onBlur={(e) => commitInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            disabled={disabled}
            required
            aria-label={`${formatDurationInput(value)} hh:mm, editable duration`}
          />
          <span className={styles.unitAdornment} aria-hidden="true">
            hh:mm
          </span>
        </div>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => updateByStep(1)}
          disabled={disabled || value >= max}
          aria-label="Increase duration by 5 minutes"
        >
          +
        </button>
      </div>
    </div>
  )
}
