import type { ReactNode } from 'react'
import styles from './SurfaceCard.module.scss'

type SurfaceCardTag = 'div' | 'section' | 'article' | 'li'

type SurfaceCardProps = {
  as?: SurfaceCardTag
  tone?: 'low' | 'mid'
  className?: string
  children: ReactNode
}

export default function SurfaceCard({
  as: Component = 'div',
  tone = 'low',
  className = '',
  children,
}: SurfaceCardProps) {
  return (
    <Component
      className={[styles.SurfaceCard, tone === 'mid' ? styles.SurfaceCardToneMid : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  )
}
