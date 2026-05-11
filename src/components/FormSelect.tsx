'use client'

import type { SelectHTMLAttributes } from 'react'
import styles from './FormSelect.module.scss'

type FormSelectOption = {
  value: string
  label: string
}

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: FormSelectOption[]
}

export default function FormSelect({ className, options, ...props }: FormSelectProps) {
  const selectClassName = className ? `${styles.FormSelect} ${className}` : styles.FormSelect

  return (
    <select className={selectClassName} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}
