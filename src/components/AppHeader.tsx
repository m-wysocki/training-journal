import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import trainingJournalLogo from '../../public/training-journal-logo.png'
import AppHeaderActions from '@/components/AppHeaderActions'
import { getAuthButtonUser } from '@/components/authActions'
import PageContainer from '@/components/PageContainer'
import styles from './AppHeader.module.scss'

async function AppHeaderUser() {
  const user = await getAuthButtonUser()

  return <AppHeaderActions key={user?.id ?? 'anonymous'} initialUser={user} />
}

function AppHeaderUserFallback() {
  // Same dimensions as the loaded actions to avoid layout shift on first paint.
  return (
    <>
      <span aria-hidden="true" style={{ width: '2.25rem', height: '2.25rem' }} />
      <span aria-hidden="true" style={{ width: '2.25rem', height: '2.25rem' }} />
    </>
  )
}

export default function AppHeader() {
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
          <Suspense fallback={<AppHeaderUserFallback />}>
            <AppHeaderUser />
          </Suspense>
        </div>
      </PageContainer>
    </header>
  )
}
