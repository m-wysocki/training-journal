import PageContainer from '@/components/PageContainer'
import { getHomeAccessState } from './homeActions'
import HomeClient from './HomeClient'
import styles from './page.module.scss'

export default async function Home() {
  const accessState = await getHomeAccessState()

  return (
    <PageContainer className={styles.Home}>
      <header className={styles.HomeHero}>
        <h1 className={styles.HomeTitle}>Welcome back !</h1>
        <p className={styles.HomeSubtitle}>Every logged session moves you forward.</p>
      </header>
      <HomeClient accessState={accessState} />
    </PageContainer>
  )
}
