'use client'

import { useState } from 'react'

import styles from './NumericStepper.module.scss'

type NumericStepperProps = {
  id: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  inputClassName?: string
  disabled?: boolean
  displayValue?: string
  unit?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getPrecision = (step: number) => {
  const stepAsString = step.toString()
  const decimalIndex = stepAsString.indexOf('.')
  return decimalIndex === -1 ? 0 : stepAsString.length - decimalIndex - 1
}

export function NumericStepper({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  inputClassName,
  disabled = false,
  displayValue,
  unit,
}: NumericStepperProps) {
  const precision = getPrecision(step)
  const [inputValue, setInputValue] = useState(String(value))

  const normalizeValue = (nextValue: number) => {
    const clamped = clamp(nextValue, min, max)
    return Number(clamped.toFixed(precision))
  }

  const commitInputValue = (rawValue: string) => {
    const parsed = Number(rawValue)
    const nextValue = Number.isNaN(parsed) ? min : normalizeValue(parsed)

    setInputValue(String(nextValue))
    onChange(nextValue)
  }

  const handleInputChange = (rawValue: string) => {
    setInputValue(rawValue)
  }

  const updateByStep = (direction: -1 | 1) => {
    const nextValue = normalizeValue(value + direction * step)

    setInputValue(String(nextValue))
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
          aria-label="Decrease value"
        >
          -
        </button>
        <div className={styles.inputShell}>
          <input
            id={id}
            className={[styles.valueInput, unit ? styles.valueInputWithUnit : null, inputClassName]
              .filter(Boolean)
              .join(' ')}
            type="number"
            inputMode={step % 1 === 0 ? 'numeric' : 'decimal'}
            min={min}
            max={max}
            step={step}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={(e) => commitInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            disabled={disabled}
            required
            aria-label={displayValue ? `${displayValue}, editable value` : undefined}
          />
          {unit && (
            <span className={styles.unitAdornment} aria-hidden="true">
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => updateByStep(1)}
          disabled={disabled || value >= max}
          aria-label="Increase value"
        >
          +
        </button>
      </div>
    </div>
  )
}
