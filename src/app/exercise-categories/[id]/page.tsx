import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExerciseCategoryClient, { type ExerciseCategory } from './ExerciseCategoryClient'

type ExerciseCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ExerciseCategoryPage({ params }: ExerciseCategoryPageProps) {
  const { id } = await params
  const supabase = await createClient()
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
