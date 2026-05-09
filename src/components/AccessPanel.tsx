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
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  actionClassName?: string
}

export default function AccessPanel({
  title,
  description,
  action,
  variant = 'default',
  className,
  titleClassName,
  descriptionClassName,
  actionClassName,
}: AccessPanelProps) {
  const panelClassName = [
    styles.AccessPanel,
    variant === 'muted' ? styles.AccessPanelMuted : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <section className={panelClassName}>
      <h2 className={[styles.AccessPanelTitle, titleClassName].filter(Boolean).join(' ')}>{title}</h2>
      <p className={[styles.AccessPanelDescription, descriptionClassName].filter(Boolean).join(' ')}>
        {description}
      </p>
      {action ? (
        <Link href={action.href} className={[styles.AccessPanelAction, actionClassName].filter(Boolean).join(' ')}>
          {action.label}
        </Link>
      ) : null}
    </section>
  )
}
