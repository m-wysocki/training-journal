import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import { getExerciseCategoryDetail } from '@/lib/supabase/trainingData'
import ExerciseCategoryClient, { type ExerciseCategory } from './ExerciseCategoryClient'
import styles from './page.module.scss'

type ExerciseCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

async function ExerciseCategoryData({ params }: ExerciseCategoryPageProps) {
  const { id } = await params
  const { supabase, user } = await requireUser()
  const { data, error } = await getExerciseCategoryDetail(supabase, user.id, id)

  if (error || !data) {
    notFound()
  }

  return (
    <ExerciseCategoryClient
      exerciseCategoryId={id}
      initialCategory={data as ExerciseCategory}
    />
  )
}

function ExerciseCategoryFallback() {
  return (
    <PageContainer className={styles.container}>
      <div className={styles.header}>
        <BackLink href="/settings/exercise-categories" label="← Back to Exercise Categories" />
        <h1 className={styles.title}>Loading exercise category...</h1>
      </div>
    </PageContainer>
  )
}

export default function ExerciseCategoryPage(props: ExerciseCategoryPageProps) {
  return (
    <Suspense fallback={<ExerciseCategoryFallback />}>
      <ExerciseCategoryData {...props} />
    </Suspense>
  )
}
