'use client'

import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import styles from './FormDialog.module.scss'

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  trigger?: ReactNode
  children: ReactNode
  size?: 'default' | 'small'
  cancelLabel?: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  primaryActionDisabled?: boolean
  primaryActionTone?: 'primary' | 'danger'
}

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  size = 'default',
  cancelLabel = 'Cancel',
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionTone = 'primary',
}: FormDialogProps) {
  const contentClassName =
    size === 'small'
      ? `${styles.FormDialogContent} ${styles.FormDialogContentSmall}`
      : styles.FormDialogContent
  const primaryButtonClassName =
    primaryActionTone === 'danger'
      ? `${styles.FormDialogPrimaryButton} ${styles.FormDialogPrimaryButtonDanger}`
      : styles.FormDialogPrimaryButton

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className={styles.FormDialogOverlay} />
        <Dialog.Content className={contentClassName}>
          <Dialog.Title className={styles.FormDialogTitle}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className={styles.FormDialogDescription}>{description}</Dialog.Description>
          ) : null}
          {children}
          {primaryActionLabel && onPrimaryAction ? (
            <div className={styles.FormDialogActions}>
              <Dialog.Close asChild>
                <button type="button" className={styles.FormDialogGhostButton}>
                  {cancelLabel}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={onPrimaryAction}
                className={primaryButtonClassName}
                disabled={primaryActionDisabled}
              >
                {primaryActionLabel}
              </button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
