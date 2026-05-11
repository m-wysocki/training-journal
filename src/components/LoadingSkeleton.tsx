import type { ReactNode } from 'react'
import styles from './LoadingSkeleton.module.scss'

type LoadingSkeletonVariant = 'block' | 'card' | 'line' | 'pill'

type LoadingSkeletonProps = {
  ariaLabel: string
  className?: string
  count?: number
  children?: ReactNode
  variant?: LoadingSkeletonVariant
}

export default function LoadingSkeleton({
  ariaLabel,
  className,
  count = 3,
  children,
  variant = 'block',
}: LoadingSkeletonProps) {
  const skeletonClassName = [
    styles.LoadingSkeleton,
    styles[`LoadingSkeleton${variant[0].toUpperCase()}${variant.slice(1)}`],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={skeletonClassName} aria-label={ariaLabel} role="status">
      {children}
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={styles.LoadingSkeletonItem} />
      ))}
    </div>
  )
}
