import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

export default function HomeLoading() {
  return (
    <PageContainer className={styles.Home}>
      <header className={styles.HomeHero}>
        <h1 className={styles.HomeTitle}>Welcome back !</h1>
        <p className={styles.HomeSubtitle}>Every logged session moves you forward.</p>
      </header>
    </PageContainer>
  )
}
