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
}

export default function NavigationCard({
  href,
  title,
  description,
  icon: Icon,
  prefetch = true,
}: NavigationCardProps) {
  return (
    <Link href={href} prefetch={prefetch} className={styles.NavigationCard}>
      <div className={styles.NavigationCardInner}>
        <div className={styles.NavigationCardContent}>
          {Icon ? (
            <div className={styles.NavigationCardIcon} aria-hidden="true">
              <Icon size={20} strokeWidth={1.9} />
            </div>
          ) : null}
          <div>
            <h2 className={styles.NavigationCardTitle}>{title}</h2>
            <p className={styles.NavigationCardDescription}>{description}</p>
          </div>
        </div>
        <ChevronRight size={20} strokeWidth={2} className={styles.NavigationCardArrowIcon} aria-hidden="true" />
      </div>
    </Link>
  )
}
