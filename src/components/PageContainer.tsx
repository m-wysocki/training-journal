import type { ReactNode } from 'react'
import styles from './PageContainer.module.scss'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return <div className={[styles.PageContainer, className].filter(Boolean).join(' ')}>{children}</div>
}
