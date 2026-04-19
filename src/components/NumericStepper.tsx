'use client'

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
}: NumericStepperProps) {
  const precision = getPrecision(step)

  const normalizeValue = (nextValue: number) => {
    const clamped = clamp(nextValue, min, max)
    return Number(clamped.toFixed(precision))
  }

  const handleInputChange = (rawValue: string) => {
    const parsed = Number(rawValue)
    onChange(Number.isNaN(parsed) ? min : normalizeValue(parsed))
  }

  const updateByStep = (direction: -1 | 1) => {
    onChange(normalizeValue(value + direction * step))
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
        <div className={styles.valueBadge}>{displayValue ?? value}</div>
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

      <input
        id={id}
        className={[styles.hiddenInput, inputClassName].filter(Boolean).join(' ')}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={disabled}
        required
      />
    </div>
  )
}
