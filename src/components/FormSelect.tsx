'use client'

import type { SelectHTMLAttributes } from 'react'
import styles from './FormSelect.module.scss'

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>

export default function FormSelect({ className, children, ...props }: FormSelectProps) {
  const selectClassName = className ? `${styles.FormSelect} ${className}` : styles.FormSelect

  return (
    <select className={selectClassName} {...props}>
      {children}
    </select>
  )
}
