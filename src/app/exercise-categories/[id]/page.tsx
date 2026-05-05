import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/auth'
import ExerciseCategoryClient, { type ExerciseCategory } from './ExerciseCategoryClient'

type ExerciseCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ExerciseCategoryPage({ params }: ExerciseCategoryPageProps) {
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
