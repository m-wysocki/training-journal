import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import { getExerciseCategoryDetail } from '@/lib/supabase/trainingData'
import ExerciseCategoryClient from './ExerciseCategoryClient'
import { type ExerciseCategory } from './_hooks/useExerciseCategoryManager'
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
  return <LoadingSkeleton ariaLabel="Loading exercise category" count={4} />
}

export default function ExerciseCategoryPage(props: ExerciseCategoryPageProps) {
  return (
    <PageContainer className={styles.ExerciseCategoryContainer}>
      <BackLink href="/settings/exercise-categories" label="Back to Exercise Categories" />
      <Suspense fallback={<ExerciseCategoryFallback />}>
        <ExerciseCategoryData {...props} />
      </Suspense>
    </PageContainer>
  )
}
