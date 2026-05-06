import Link from 'next/link'
import styles from './AccessPanel.module.scss'

type AccessPanelAction = {
  href: string
  label: string
}

type AccessPanelProps = {
  title: string
  description: string
  action?: AccessPanelAction
  variant?: 'default' | 'muted'
}

export default function AccessPanel({
  title,
  description,
  action,
  variant = 'default',
}: AccessPanelProps) {
  const panelClassName = [
    styles.AccessPanel,
    variant === 'muted' ? styles.AccessPanelMuted : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={panelClassName}>
      <h2 className={styles.AccessPanelTitle}>{title}</h2>
      <p className={styles.AccessPanelDescription}>{description}</p>
      {action ? (
        <Link href={action.href} prefetch={false} className={styles.AccessPanelAction}>
          {action.label}
        </Link>
      ) : null}
    </section>
  )
}
