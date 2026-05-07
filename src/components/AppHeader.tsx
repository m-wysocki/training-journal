import Image from 'next/image'
import Link from 'next/link'
import trainingJournalLogo from '../../public/training-journal-logo.png'
import AppHeaderActions from '@/components/AppHeaderActions'
import { getAuthButtonUser } from '@/components/authActions'
import PageContainer from '@/components/PageContainer'
import styles from './AppHeader.module.scss'

export default async function AppHeader() {
  const user = await getAuthButtonUser()

  return (
    <header className={styles.AppHeader}>
      <PageContainer className={styles.AppHeaderInner}>
        <Link href="/" className={styles.AppHeaderBrand}>
          <Image
            src={trainingJournalLogo}
            alt="Training Journal"
            width={187}
            height={43}
            className={styles.AppHeaderBrandLogo}
            priority
          />
        </Link>

        <div className={styles.AppHeaderActions}>
          <AppHeaderActions key={user?.id ?? 'anonymous'} initialUser={user} />
        </div>
      </PageContainer>
    </header>
  )
}
