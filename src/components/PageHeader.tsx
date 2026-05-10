import type { LucideIcon } from 'lucide-react'
import styles from './PageHeader.module.scss'

type PageHeaderProps = {
  title: string
  description?: string
  icon?: LucideIcon
  descriptionSize?: 'default' | 'large'
  titleRowMobileAlign?: 'center' | 'start'
}

export default function PageHeader({
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
      <div className={titleRowClassName}>
        {Icon ? (
          <div className={styles.PageHeaderTitleIcon} aria-hidden="true">
            <Icon size={22} strokeWidth={1.9} />
          </div>
        ) : null}
        <h1 className={styles.PageHeaderTitle}>{title}</h1>
      </div>
      {description ? <p className={descriptionClassName}>{description}</p> : null}
    </div>
  )
}
