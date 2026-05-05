import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/auth'
import { getCachedExerciseCategoryDetail } from '@/lib/supabase/cachedTrainingData'
import ExerciseCategoryClient, { type ExerciseCategory } from './ExerciseCategoryClient'

type ExerciseCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ExerciseCategoryPage({ params }: ExerciseCategoryPageProps) {
  const { id } = await params
  const { user, accessToken } = await requireUser()
  const { data, error } = await getCachedExerciseCategoryDetail(user.id, accessToken, id)

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
