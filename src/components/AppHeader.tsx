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
    <header className={styles.appHeader}>
      <PageContainer className={styles.appHeaderInner}>
        <Link href="/" className={styles.appHeaderBrand}>
          <Image
            src={trainingJournalLogo}
            alt="Training Journal"
            width={187}
            height={43}
            className={styles.appHeaderBrandLogo}
            priority
          />
        </Link>

        <div className={styles.appHeaderActions}>
          <AppHeaderActions key={user?.id ?? 'anonymous'} initialUser={user} />
        </div>
      </PageContainer>
    </header>
  )
}
