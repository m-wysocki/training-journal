import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import styles from './NavigationCard.module.scss'

type NavigationCardProps = {
  href: string
  title: string
  description: string
  icon?: LucideIcon
  prefetch?: boolean | null
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  iconClassName?: string
  arrowClassName?: string
  iconTone?: 'sage' | 'sand' | 'mist'
}

export default function NavigationCard({
  href,
  title,
  description,
  icon: Icon,
  prefetch,
  className,
  titleClassName,
  descriptionClassName,
  iconClassName,
  arrowClassName,
  iconTone = 'sage',
}: NavigationCardProps) {
  const iconToneClassName = {
    sage: styles.NavigationCardIconToneSage,
    sand: styles.NavigationCardIconToneSand,
    mist: styles.NavigationCardIconToneMist,
  }[iconTone]

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={[styles.NavigationCard, className].filter(Boolean).join(' ')}
    >
      <div className={styles.NavigationCardInner}>
        <div className={styles.NavigationCardContent}>
          {Icon ? (
            <div
              className={[styles.NavigationCardIcon, iconToneClassName, iconClassName].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={1.9} />
            </div>
          ) : null}
          <div>
            <h2 className={[styles.NavigationCardTitle, titleClassName].filter(Boolean).join(' ')}>{title}</h2>
            <p className={[styles.NavigationCardDescription, descriptionClassName].filter(Boolean).join(' ')}>
              {description}
            </p>
          </div>
        </div>
        <ChevronRight
          size={20}
          strokeWidth={2}
          className={[styles.NavigationCardArrowIcon, arrowClassName].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
