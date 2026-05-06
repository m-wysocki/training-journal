'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { cacheTags } from '@/lib/cacheTags'
import { isExerciseType, type ExerciseType } from '@/lib/exerciseTypes'
import { requireUser } from '@/lib/supabase/auth'
import { getCachedExerciseSetup } from '@/lib/supabase/cachedTrainingData'

type ActionResult<T = undefined> = Promise<{
  data?: T
  error?: string | null
}>

type ExerciseSetupCategory = {
  id: string
  name: string
}

type ExerciseSetupExercise = {
  id: string
  name: string
  exercise_category_id: string
  exercise_type: ExerciseType
}

export async function loadExerciseSetup(): ActionResult<{
  exerciseCategories: ExerciseSetupCategory[]
  exercises: ExerciseSetupExercise[]
}> {
  try {
    const { user, accessToken } = await requireUser()
    const { exerciseCategories, exercises, error } = await getCachedExerciseSetup(user.id, accessToken)

    if (error) {
      return { error: 'Could not load exercise setup.' }
    }

    return {
      data: {
        exerciseCategories,
        exercises,
      },
    }
  } catch {
    return { error: 'Could not load exercise setup.' }
  }
}

const getRlsErrorMessage = (errorMessage: string, resource: string, action: string) =>
  errorMessage.includes('row-level security policy')
    ? `Could not ${action} the ${resource} because database access rules blocked it.`
    : `Could not ${action} the ${resource}.`

const validateExerciseType = (exerciseType: unknown): ExerciseType | null =>
  isExerciseType(exerciseType) ? exerciseType : null

export async function addExerciseCategory(name: string): ActionResult<{ id: string; name: string }> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return { error: 'Enter an exercise category name.' }
  }

  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('exercise_categories')
    .insert({
      name: trimmedName,
      user_id: user.id,
    })
    .select('id, name')
    .single()

  if (error || !data) {
    return {
      error: error
        ? getRlsErrorMessage(error.message, 'exercise category', 'add')
        : 'Could not add the exercise category.',
    }
  }

  updateTag(cacheTags.exerciseCategories(user.id))
  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises/new')
  revalidatePath('/completed-exercises/[id]/edit', 'page')

  return { data }
}

export async function updateExerciseCategory(id: string, name: string): ActionResult {
  const trimmedName = name.trim()

  if (!trimmedName) return { error: 'Enter an exercise category name.' }

  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('exercise_categories')
    .update({ name: trimmedName })
    .eq('user_id', user.id)
    .eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise category', 'update') }
  }

  updateTag(cacheTags.exerciseCategories(user.id))
  updateTag(cacheTags.exerciseCategory(user.id, id))
  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function deleteExerciseCategory(id: string): ActionResult {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('exercise_categories').delete().eq('user_id', user.id).eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise category', 'delete') }
  }

  updateTag(cacheTags.exerciseCategories(user.id))
  updateTag(cacheTags.exercises(user.id))
  updateTag(cacheTags.exerciseCategory(user.id, id))
  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function addExercise(
  exerciseCategoryId: string,
  name: string,
  exerciseType: ExerciseType,
): ActionResult<ExerciseSetupExercise> {
  const trimmedName = name.trim()
  const validExerciseType = validateExerciseType(exerciseType)

  if (!exerciseCategoryId) return { error: 'Select an exercise category first.' }
  if (!trimmedName) return { error: 'Enter an exercise name.' }
  if (!validExerciseType) return { error: 'Select a valid exercise type.' }

  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: trimmedName,
      exercise_category_id: exerciseCategoryId,
      exercise_type: validExerciseType,
      user_id: user.id,
    })
    .select('id, name, exercise_category_id, exercise_type')
    .single()

  if (error || !data) {
    return {
      error: error
        ? getRlsErrorMessage(error.message, 'exercise', 'add')
        : 'Could not add the exercise.',
    }
  }

  updateTag(cacheTags.exercises(user.id))
  updateTag(cacheTags.exerciseCategory(user.id, exerciseCategoryId))
  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises/new')
  revalidatePath('/completed-exercises/[id]/edit', 'page')

  return { data: data as ExerciseSetupExercise }
}

export async function updateExercise(
  id: string,
  exerciseCategoryId: string,
  name: string,
  exerciseType: ExerciseType,
): ActionResult {
  const trimmedName = name.trim()
  const validExerciseType = validateExerciseType(exerciseType)

  if (!trimmedName) return { error: 'Enter an exercise name.' }
  if (!validExerciseType) return { error: 'Select a valid exercise type.' }

  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('exercises')
    .update({
      name: trimmedName,
      exercise_type: validExerciseType,
    })
    .eq('user_id', user.id)
    .eq('id', id)
    .eq('exercise_category_id', exerciseCategoryId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise', 'update') }
  }

  if (!data) {
    return { error: 'Could not update the exercise.' }
  }

  updateTag(cacheTags.exercises(user.id))
  updateTag(cacheTags.exerciseCategory(user.id, exerciseCategoryId))
  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function deleteExercise(id: string, exerciseCategoryId: string): ActionResult {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('exercises')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
    .eq('exercise_category_id', exerciseCategoryId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise', 'delete') }
  }

  if (!data) {
    return { error: 'Could not delete the exercise.' }
  }

  updateTag(cacheTags.exercises(user.id))
  updateTag(cacheTags.exerciseCategory(user.id, exerciseCategoryId))
  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}
