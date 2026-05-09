import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import styles from './BackLink.module.scss'

type BackLinkProps = {
  href: string
  label: string
}

export default function BackLink({ href, label }: BackLinkProps) {
  const normalizedLabel = label.replace(/^\s*←\s*/, '')

  return (
    <Link href={href} className={styles.BackLink}>
      <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      <span>{normalizedLabel}</span>
    </Link>
  )
}
