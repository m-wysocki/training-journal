import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import styles from './BaseStepper.module.scss'

type BaseStepperProps = {
  variant?: 'standard' | 'pace'
  leftControls: ReactNode
  inputControl: ReactNode
  rightControls: ReactNode
}

type StepperButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pace?: boolean
}

type StepperInputProps = InputHTMLAttributes<HTMLInputElement> & {
  withUnit?: boolean
  withClear?: boolean
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const blurOnEnter = (event: { key: string; currentTarget: { blur: () => void } }) => {
  if (event.key === 'Enter') {
    event.currentTarget.blur()
  }
}

export function BaseStepper({
  variant = 'standard',
  leftControls,
  inputControl,
  rightControls,
}: BaseStepperProps) {
  return (
    <div className={styles.BaseStepper}>
      <div
        className={[
          styles.BaseStepperRow,
          variant === 'pace' ? styles.BaseStepperRowPace : styles.BaseStepperRowStandard,
        ].join(' ')}
      >
        {leftControls}
        {inputControl}
        {rightControls}
      </div>
    </div>
  )
}

export function StepperButton({ pace = false, className, ...props }: StepperButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.BaseStepperButton,
        pace ? styles.BaseStepperButtonPace : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

export function StepperInputShell({ children }: { children: ReactNode }) {
  return <div className={styles.BaseStepperInputShell}>{children}</div>
}

export function StepperInput({ withUnit = false, withClear = false, className, ...props }: StepperInputProps) {
  return (
    <input
      className={[
        styles.BaseStepperValueInput,
        withUnit ? styles.BaseStepperValueInputWithUnit : null,
        withClear ? styles.BaseStepperValueInputWithClear : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

export function StepperUnitAdornment({ children }: { children: ReactNode }) {
  return (
    <span className={styles.BaseStepperUnitAdornment} aria-hidden="true">
      {children}
    </span>
  )
}

export function StepperClearAdornment(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={styles.BaseStepperClearAdornment} {...props} />
}
