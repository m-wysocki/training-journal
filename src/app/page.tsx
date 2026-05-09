import PageContainer from '@/components/PageContainer'
import { getHomeAccessState } from './homeActions'
import HomeClient from './HomeClient'
import styles from './page.module.scss'

export default async function Home() {
  const accessState = await getHomeAccessState()

  return (
    <PageContainer className={styles.Home}>
      <header className={styles.HomeHero}>
        <h1 className={styles.HomeTitle}>Training Journal</h1>
        <p className={styles.HomeSubtitle}>Calmly track workouts and see steady progress.</p>
      </header>
      <HomeClient accessState={accessState} />
    </PageContainer>
  )
}
