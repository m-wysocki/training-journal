import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import trainingJournalLogo from '../../public/training-journal-logo.png'
import AuthButton from '@/components/AuthButton'
import ButtonSquare from '@/components/ButtonSquare'
import PageContainer from '@/components/PageContainer'
import { getCurrentUser } from '@/lib/supabase/auth'
import styles from './AppHeader.module.scss'

async function AppHeaderActions() {
  const user = await getCurrentUser()

  return (
    <>
      <ButtonSquare href="/completed-exercises/new" aria-label="Log exercise">
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
      </ButtonSquare>
      <AuthButton user={user} />
    </>
  )
}

function AppHeaderActionsFallback() {
  return (
    <>
      <ButtonSquare href="/completed-exercises/new" aria-label="Log exercise">
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
      </ButtonSquare>
      <ButtonSquare href="/login" aria-label="Sign in">
        <span aria-hidden="true" />
      </ButtonSquare>
    </>
  )
}

export default function AppHeader() {
  return (
    <header className={styles.appHeader}>
      <PageContainer className={styles.appHeaderInner}>
        <Link href="/" prefetch className={styles.appHeaderBrand}>
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
          <Suspense fallback={<AppHeaderActionsFallback />}>
            <AppHeaderActions />
          </Suspense>
        </div>
      </PageContainer>
    </header>
  )
}
