'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ExerciseType } from '@/components/CompletedExerciseForm'

type ActionResult<T = undefined> = Promise<{
  data?: T
  error?: string | null
}>

const getCurrentUser = async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

const getRlsErrorMessage = (errorMessage: string, resource: string, action: string) =>
  errorMessage.includes('row-level security policy')
    ? `Could not ${action} the ${resource} because database access rules blocked it.`
    : `Could not ${action} the ${resource}.`

export async function addExerciseCategory(name: string): ActionResult<{ id: string; name: string }> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return { error: 'Enter an exercise category name.' }
  }

  const { supabase, user } = await getCurrentUser()

  if (!user) {
    return { error: 'Sign in before adding an exercise category.' }
  }

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

  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises/new')
  revalidatePath('/completed-exercises/[id]/edit', 'page')

  return { data }
}

export async function updateExerciseCategory(id: string, name: string): ActionResult {
  const trimmedName = name.trim()

  if (!trimmedName) return { error: 'Enter an exercise category name.' }

  const { supabase, user } = await getCurrentUser()

  if (!user) return { error: 'Sign in before updating an exercise category.' }

  const { error } = await supabase
    .from('exercise_categories')
    .update({ name: trimmedName })
    .eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise category', 'update') }
  }

  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function deleteExerciseCategory(id: string): ActionResult {
  const { supabase, user } = await getCurrentUser()

  if (!user) return { error: 'Sign in before deleting an exercise category.' }

  const { error } = await supabase.from('exercise_categories').delete().eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise category', 'delete') }
  }

  revalidatePath('/settings/exercise-categories')
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function addExercise(
  exerciseCategoryId: string,
  name: string,
  exerciseType: ExerciseType,
): ActionResult<{
  id: string
  name: string
  exercise_category_id: string
  exercise_type: ExerciseType
}> {
  const trimmedName = name.trim()

  if (!exerciseCategoryId) return { error: 'Select an exercise category first.' }
  if (!trimmedName) return { error: 'Enter an exercise name.' }

  const { supabase, user } = await getCurrentUser()

  if (!user) return { error: 'Sign in before adding an exercise.' }

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: trimmedName,
      exercise_category_id: exerciseCategoryId,
      exercise_type: exerciseType,
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

  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises/new')
  revalidatePath('/completed-exercises/[id]/edit', 'page')

  return { data: data as { id: string; name: string; exercise_category_id: string; exercise_type: ExerciseType } }
}

export async function updateExercise(
  id: string,
  exerciseCategoryId: string,
  name: string,
  exerciseType: ExerciseType,
): ActionResult {
  const trimmedName = name.trim()

  if (!trimmedName) return { error: 'Enter an exercise name.' }

  const { supabase, user } = await getCurrentUser()

  if (!user) return { error: 'Sign in before updating an exercise.' }

  const { error } = await supabase
    .from('exercises')
    .update({
      name: trimmedName,
      exercise_type: exerciseType,
    })
    .eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise', 'update') }
  }

  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function deleteExercise(id: string, exerciseCategoryId: string): ActionResult {
  const { supabase, user } = await getCurrentUser()

  if (!user) return { error: 'Sign in before deleting an exercise.' }

  const { error } = await supabase.from('exercises').delete().eq('id', id)

  if (error) {
    return { error: getRlsErrorMessage(error.message, 'exercise', 'delete') }
  }

  revalidatePath(`/exercise-categories/${exerciseCategoryId}`)
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}
