import type { ReactNode } from 'react'
import styles from './StatusPanel.module.scss'

type StatusPanelVariant = 'info' | 'loading' | 'success' | 'error'

type StatusPanelProps = {
  children: ReactNode
  variant: StatusPanelVariant
  withTopSpacing?: boolean
  withBottomSpacing?: boolean
}

export default function StatusPanel({
  children,
  variant,
  withTopSpacing = false,
  withBottomSpacing = false,
}: StatusPanelProps) {
  const variantClassName = {
    info: styles.StatusPanelInfo,
    loading: styles.StatusPanelLoading,
    success: styles.StatusPanelSuccess,
    error: styles.StatusPanelError,
  }[variant]

  const panelClassName = [
    styles.StatusPanel,
    variantClassName,
    withTopSpacing ? styles.StatusPanelWithTopSpacing : '',
    withBottomSpacing ? styles.StatusPanelWithBottomSpacing : '',
  ].filter(Boolean).join(' ')

  return <div className={panelClassName}>{children}</div>
}
