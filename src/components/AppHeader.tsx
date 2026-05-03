import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import trainingJournalLogo from '../../public/training-journal-logo.png'
import AuthButton from '@/components/AuthButton'
import ButtonSquare from '@/components/ButtonSquare'
import PageContainer from '@/components/PageContainer'
import { createClient } from '@/lib/supabase/server'
import styles from './AppHeader.module.scss'

export default async function AppHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
          <ButtonSquare href="/completed-exercises/new" aria-label="Log exercise">
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </ButtonSquare>
          <AuthButton user={user} />
        </div>
      </PageContainer>
    </header>
  )
}
