import Link from 'next/link'
import SurfaceCard from './SurfaceCard'
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
  return (
    <SurfaceCard
      as="section"
      tone={variant === 'muted' ? 'mid' : 'low'}
      className={[styles.AccessPanel, className ?? ''].filter(Boolean).join(' ')}
    >
      <h2 className={[styles.AccessPanelTitle, titleClassName].filter(Boolean).join(' ')}>{title}</h2>
      <p className={[styles.AccessPanelDescription, descriptionClassName].filter(Boolean).join(' ')}>
        {description}
      </p>
      {action ? (
        <Link href={action.href} className={[styles.AccessPanelAction, actionClassName].filter(Boolean).join(' ')}>
          {action.label}
        </Link>
      ) : null}
    </SurfaceCard>
  )
}
