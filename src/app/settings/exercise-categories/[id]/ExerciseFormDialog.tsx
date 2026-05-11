'use client'

import FormDialog from '@/components/FormDialog'
import FormSelect from '@/components/FormSelect'
import { EXERCISE_TYPE_OPTIONS } from '@/lib/exerciseTypeOptions'
import type { ExerciseType } from '@/lib/exerciseTypes'
import type { ReactNode } from 'react'
import styles from './page.module.scss'

type ExerciseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  name: string
  onNameChange: (name: string) => void
  exerciseType: ExerciseType
  onExerciseTypeChange: (exerciseType: ExerciseType) => void
  primaryActionLabel: string
  onPrimaryAction: () => void
  primaryActionDisabled?: boolean
  trigger?: ReactNode
}

export default function ExerciseFormDialog({
  open,
  onOpenChange,
  title,
  description,
  name,
  onNameChange,
  exerciseType,
  onExerciseTypeChange,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled,
  trigger,
}: ExerciseFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      trigger={trigger}
      primaryActionLabel={primaryActionLabel}
      onPrimaryAction={onPrimaryAction}
      primaryActionDisabled={primaryActionDisabled}
    >
      <div className={styles.ExerciseCategoryDialogBody}>
        <input
          className={styles.ExerciseCategoryInput}
          placeholder="e.g. Biceps Curls"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onPrimaryAction()
            }
          }}
        />
        <FormSelect
          value={exerciseType}
          onChange={(e) => onExerciseTypeChange(e.target.value as ExerciseType)}
          options={EXERCISE_TYPE_OPTIONS}
        />
      </div>
    </FormDialog>
  )
}
