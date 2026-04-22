'use client'

import { useState } from 'react'

import styles from './NumericStepper.module.scss'

type PaceStepperProps = {
  id: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  inputClassName?: string
  disabled?: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const formatPaceInput = (paceMinPerKm: number) => {
  const totalSeconds = Math.round(paceMinPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const normalizeDraft = (rawValue: string) => {
  const sanitized = rawValue.replace(/[^\d:]/g, '')
  const [minutes = '', seconds = ''] = sanitized.split(':')

  if (sanitized.includes(':')) {
    return `${minutes.slice(0, 2)}:${seconds.slice(0, 2)}`
  }

  if (sanitized.length <= 2) {
    return sanitized
  }

  return `${sanitized.slice(0, -2).slice(0, 2)}:${sanitized.slice(-2)}`
}

const parsePaceInput = (rawValue: string) => {
  const match = rawValue.match(/^(\d{1,2}):([0-5]\d)$/)

  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])

  return minutes + seconds / 60
}

export function PaceStepper({
  id,
  value,
  min,
  max,
  onChange,
  inputClassName,
  disabled = false,
}: PaceStepperProps) {
  const [inputValue, setInputValue] = useState(formatPaceInput(value))

  const commitInputValue = (rawValue: string) => {
    const parsed = parsePaceInput(rawValue)

    if (parsed === null) {
      setInputValue(formatPaceInput(value))
      return
    }

    const nextValue = clamp(parsed, min, max)

    setInputValue(formatPaceInput(nextValue))
    onChange(nextValue)
  }

  const updateBySeconds = (seconds: number) => {
    const nextValue = clamp(value + seconds / 60, min, max)

    setInputValue(formatPaceInput(nextValue))
    onChange(nextValue)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.paceStepper}>
        <button
          type="button"
          className={styles.paceStepButton}
          onClick={() => updateBySeconds(-10)}
          disabled={disabled || value <= min}
          aria-label="Decrease pace by 10 seconds"
        >
          -10s
        </button>
        <button
          type="button"
          className={styles.paceStepButton}
          onClick={() => updateBySeconds(-1)}
          disabled={disabled || value <= min}
          aria-label="Decrease pace by 1 second"
        >
          -1s
        </button>
        <div className={styles.inputShell}>
          <input
            id={id}
            className={[styles.valueInput, styles.valueInputWithUnit, inputClassName].filter(Boolean).join(' ')}
            type="text"
            inputMode="numeric"
            pattern="\\d{1,2}:\\d{2}"
            placeholder="6:30"
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
            aria-label={`${formatPaceInput(value)} min/km, editable pace`}
          />
          <span className={styles.unitAdornment} aria-hidden="true">
            min/km
          </span>
        </div>
        <button
          type="button"
          className={styles.paceStepButton}
          onClick={() => updateBySeconds(1)}
          disabled={disabled || value >= max}
          aria-label="Increase pace by 1 second"
        >
          +1s
        </button>
        <button
          type="button"
          className={styles.paceStepButton}
          onClick={() => updateBySeconds(10)}
          disabled={disabled || value >= max}
          aria-label="Increase pace by 10 seconds"
        >
          +10s
        </button>
      </div>
    </div>
  )
}
