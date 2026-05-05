import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
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
  const { data, error } = await supabase
    .from('exercise_categories')
    .select(`
      id,
      name,
      exercises (
        id,
        name,
        exercise_type
      )
    `)
    .eq('user_id', user.id)
    .eq('id', id)
    .single()

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
        <BackLink href="/exercise-categories" label="← Back to Exercise Categories" />
        <div className={styles.titleSkeleton} aria-label="Loading exercise category" />
      </div>

      <div className={styles.listSkeleton} aria-busy="true">
        <span />
        <span />
        <span />
      </div>

      <button type="button" className={styles.primaryButton} disabled>
        Add Exercise
      </button>
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
