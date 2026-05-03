import { createClient } from '@/lib/supabase/server'
import NewCompletedExerciseClient from './NewCompletedExerciseClient'

export default async function NewCompletedExercisePage() {
  const supabase = await createClient()
  const [categoriesResult, exercisesResult] = await Promise.all([
    supabase.from('exercise_categories').select('id, name').order('created_at'),
    supabase.from('exercises').select('id, name, exercise_category_id, exercise_type').order('created_at'),
  ])

  return (
    <NewCompletedExerciseClient
      exerciseCategories={categoriesResult.data || []}
      exercises={exercisesResult.data || []}
    />
  )
}
