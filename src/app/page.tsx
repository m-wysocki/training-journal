import PageContainer from '@/components/PageContainer'
import HomeClient from './HomeClient'
import styles from './page.module.scss'

export default function Home() {
  return (
    <PageContainer className={styles.Home}>
      <h1 className={styles.HomeTitle}>Training Journal</h1>
      <HomeClient />
    </PageContainer>
  )
}
