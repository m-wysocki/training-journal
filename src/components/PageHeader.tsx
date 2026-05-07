import type { LucideIcon } from 'lucide-react'
import BackLink from './BackLink'
import styles from './PageHeader.module.scss'

type PageHeaderProps = {
  backHref: string
  backLabel: string
  title: string
  description: string
  icon?: LucideIcon
  descriptionSize?: 'default' | 'large'
  titleRowMobileAlign?: 'center' | 'start'
}

export default function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  icon: Icon,
  descriptionSize = 'default',
  titleRowMobileAlign = 'center',
}: PageHeaderProps) {
  const titleRowClassName =
    titleRowMobileAlign === 'start'
      ? `${styles.PageHeaderTitleRow} ${styles.PageHeaderTitleRowMobileStart}`
      : styles.PageHeaderTitleRow
  const descriptionClassName =
    descriptionSize === 'large'
      ? `${styles.PageHeaderDescription} ${styles.PageHeaderDescriptionLarge}`
      : styles.PageHeaderDescription

  return (
    <div className={styles.PageHeader}>
      <BackLink href={backHref} label={backLabel} />
      <div className={titleRowClassName}>
        {Icon ? (
          <div className={styles.PageHeaderTitleIcon} aria-hidden="true">
            <Icon size={22} strokeWidth={1.9} />
          </div>
        ) : null}
        <h1 className={styles.PageHeaderTitle}>{title}</h1>
      </div>
      <p className={descriptionClassName}>{description}</p>
    </div>
  )
}
