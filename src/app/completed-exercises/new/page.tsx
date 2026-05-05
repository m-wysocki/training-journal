import { requireUser } from '@/lib/supabase/auth'
import NewCompletedExerciseClient from './NewCompletedExerciseClient'

export default async function NewCompletedExercisePage() {
  const { supabase, user } = await requireUser()
  const [categoriesResult, exercisesResult] = await Promise.all([
    supabase.from('exercise_categories').select('id, name').eq('user_id', user.id).order('created_at'),
    supabase
      .from('exercises')
      .select('id, name, exercise_category_id, exercise_type')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  return (
    <NewCompletedExerciseClient
      exerciseCategories={categoriesResult.data || []}
      exercises={exercisesResult.data || []}
    />
  )
}
