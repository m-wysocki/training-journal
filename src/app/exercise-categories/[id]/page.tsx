import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
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
    <PageContainer className={styles.ExerciseCategoryContainer}>
      <BackLink href="/settings/exercise-categories" label="Back to Exercise Categories" />
      <PageHeader
        title="Exercise Category"
      />
      <LoadingSkeleton ariaLabel="Loading exercise category" count={4} />
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
