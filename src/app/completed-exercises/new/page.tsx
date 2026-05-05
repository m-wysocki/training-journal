import { requireUser } from '@/lib/supabase/auth'
import { getCachedExerciseSetup } from '@/lib/supabase/cachedTrainingData'
import NewCompletedExerciseClient from './NewCompletedExerciseClient'

export default async function NewCompletedExercisePage() {
  const { user, accessToken } = await requireUser()
  const { exerciseCategories, exercises } = await getCachedExerciseSetup(user.id, accessToken)

  return (
    <NewCompletedExerciseClient
      exerciseCategories={exerciseCategories}
      exercises={exercises}
    />
  )
}
