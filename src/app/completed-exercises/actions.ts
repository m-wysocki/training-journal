'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import type { CompletedExerciseRow } from '@/lib/completedExercises'

type ActionResult<T = undefined> = Promise<{ data?: T; error?: string | null }>

export async function createCompletedExercise(values: CompletedExerciseFormValues): ActionResult {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in before logging an exercise.' }
  }

  const { error } = await supabase.from('completed_exercises').insert({
    exercise_id: values.exerciseId,
    sets: values.sets,
    reps_per_set: values.repsPerSet,
    duration_per_set_seconds: values.durationPerSetSeconds,
    load_kg: values.loadKg,
    distance_km: values.distanceKm,
    pace_min_per_km: values.paceMinPerKm,
    note: values.note,
    performed_at: values.performedAt,
    user_id: user.id,
  })

  if (error) {
    if (error.message.includes("Could not find the table 'public.completed_exercises'")) {
      return {
        error: 'The completed_exercises table is missing in the database. Add it in the Supabase SQL Editor.',
      }
    }

    if (error.message.includes('row-level security policy')) {
      return {
        error: 'Could not save the exercise because database access rules blocked it. Sign in again or update the completed_exercises RLS policy in Supabase.',
      }
    }

    return { error: 'Could not save the exercise. Check your database configuration.' }
  }

  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function updateCompletedExercise(
  entryId: string,
  values: CompletedExerciseFormValues,
): ActionResult {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in before saving changes.' }
  }

  const { error } = await supabase
    .from('completed_exercises')
    .update({
      exercise_id: values.exerciseId,
      sets: values.sets,
      reps_per_set: values.repsPerSet,
      duration_per_set_seconds: values.durationPerSetSeconds,
      load_kg: values.loadKg,
      distance_km: values.distanceKm,
      pace_min_per_km: values.paceMinPerKm,
      note: values.note,
      performed_at: values.performedAt,
    })
    .eq('id', entryId)

  if (error) {
    return { error: 'Could not save changes.' }
  }

  revalidatePath('/completed-exercises')
  revalidatePath(`/completed-exercises/${entryId}/edit`)
  revalidatePath('/stats')

  return {}
}

export async function deleteCompletedExercise(entryId: string): ActionResult {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in before deleting an entry.' }
  }

  const { error } = await supabase.from('completed_exercises').delete().eq('id', entryId)

  if (error) {
    return { error: 'Could not delete the entry.' }
  }

  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function copyCompletedExerciseCategory(
  entries: CompletedExerciseRow[],
  performedAt: string,
): ActionResult<{ copiedCount: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in before copying exercises.' }
  }

  const rowsToInsert = entries.map((entry) => ({
    exercise_id: entry.exercise_id,
    sets: entry.sets,
    reps_per_set: entry.reps_per_set,
    duration_per_set_seconds: entry.duration_per_set_seconds,
    load_kg: entry.load_kg,
    distance_km: entry.distance_km,
    pace_min_per_km: entry.pace_min_per_km,
    note: entry.note ?? '',
    performed_at: performedAt,
    user_id: user.id,
  }))

  const { error } = await supabase.from('completed_exercises').insert(rowsToInsert)

  if (error) {
    return { error: 'Could not copy exercises to the selected date.' }
  }

  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return { data: { copiedCount: rowsToInsert.length } }
}
