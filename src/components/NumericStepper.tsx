'use client'

import { useState } from 'react'

import {
  BaseStepper,
  StepperButton,
  blurOnEnter,
  clamp,
  StepperInput,
  StepperInputShell,
  StepperUnitAdornment,
} from '@/components/BaseStepper'

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
  const [draftState, setDraftState] = useState(() => ({
    inputValue: String(value),
    lastSyncedValue: value,
  }))

  if (draftState.lastSyncedValue !== value) {
    setDraftState({
      inputValue: String(value),
      lastSyncedValue: value,
    })
  }

  const normalizeValue = (nextValue: number) => {
    const clamped = clamp(nextValue, min, max)
    return Number(clamped.toFixed(precision))
  }

  const commitInputValue = (rawValue: string) => {
    const parsed = Number(rawValue)
    const nextValue = Number.isNaN(parsed) ? min : normalizeValue(parsed)

    setDraftState({
      inputValue: String(nextValue),
      lastSyncedValue: nextValue,
    })
    onChange(nextValue)
  }

  const handleInputChange = (rawValue: string) => {
    setDraftState((current) => ({
      ...current,
      inputValue: rawValue,
    }))
  }

  const updateByStep = (direction: -1 | 1) => {
    const nextValue = normalizeValue(value + direction * step)

    setDraftState({
      inputValue: String(nextValue),
      lastSyncedValue: nextValue,
    })
    onChange(nextValue)
  }

  return (
    <BaseStepper
      leftControls={(
        <StepperButton
          onClick={() => updateByStep(-1)}
          disabled={disabled || value <= min}
          aria-label="Decrease value"
        >
          -
        </StepperButton>
      )}
      inputControl={(
        <StepperInputShell>
          <StepperInput
            id={id}
            className={inputClassName}
            type="number"
            inputMode={step % 1 === 0 ? 'numeric' : 'decimal'}
            min={min}
            max={max}
            step={step}
            value={draftState.inputValue}
            withUnit={Boolean(unit)}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={(e) => commitInputValue(e.target.value)}
            onKeyDown={blurOnEnter}
            disabled={disabled}
            required
            aria-label={displayValue ? `${displayValue}, editable value` : undefined}
          />
          {unit ? <StepperUnitAdornment>{unit}</StepperUnitAdornment> : null}
        </StepperInputShell>
      )}
      rightControls={(
        <StepperButton
          onClick={() => updateByStep(1)}
          disabled={disabled || value >= max}
          aria-label="Increase value"
        >
          +
        </StepperButton>
      )}
    />
  )
}
