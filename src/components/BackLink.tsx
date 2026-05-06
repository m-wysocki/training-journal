import Link from 'next/link'
import styles from './BackLink.module.scss'

type BackLinkProps = {
  href: string
  label: string
}

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link href={href} prefetch={false} className={styles.backLink}>
      {label}
    </Link>
  )
}
