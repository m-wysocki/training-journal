'use server'

import { revalidatePath, updateTag } from 'next/cache'
import type { CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import { cacheTags } from '@/lib/cacheTags'
import { requireUser } from '@/lib/supabase/auth'
import { getCachedCompletedExercisesPayload } from '@/lib/supabase/cachedTrainingData'
import {
  type CompletedExerciseRow,
  type EntryComparisons,
  type RecentCompletedExercise,
} from '@/lib/completedExercises'

type ActionResult<T = undefined> = Promise<{ data?: T; error?: string | null }>

const getCompletedExercisePayload = async (
  dateFrom: string,
  dateTo: string,
): Promise<{
  entries: CompletedExerciseRow[]
  entryComparisons: EntryComparisons
}> => {
  const { user, accessToken } = await requireUser()
  const payload = await getCachedCompletedExercisesPayload(user.id, accessToken, dateFrom, dateTo)

  return {
    entries: payload.entries,
    entryComparisons: payload.entryComparisons,
  }
}

export async function loadCompletedExercisesForRange(
  dateFrom: string,
  dateTo: string,
): ActionResult<{
  entries: CompletedExerciseRow[]
  entryComparisons: EntryComparisons
}> {
  try {
    return { data: await getCompletedExercisePayload(dateFrom, dateTo) }
  } catch {
    return { error: 'Could not load data.' }
  }
}

export async function loadRecentCompletedExercises(
  exerciseId: string,
): ActionResult<RecentCompletedExercise[]> {
  if (!exerciseId) {
    return { data: [] }
  }

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('completed_exercises')
    .select(
      `
        id,
        performed_at,
        sets,
        reps_per_set,
        duration_per_set_seconds,
        load_kg,
        distance_km,
        pace_min_per_km
      `,
    )
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .order('performed_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    return { error: 'Could not load recent exercise history.' }
  }

  return { data: (data as RecentCompletedExercise[]) || [] }
}

export async function createCompletedExercise(values: CompletedExerciseFormValues): ActionResult {
  const { supabase, user } = await requireUser()

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

  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function updateCompletedExercise(
  entryId: string,
  values: CompletedExerciseFormValues,
): ActionResult {
  const { supabase, user } = await requireUser()

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
    .eq('user_id', user.id)
    .eq('id', entryId)

  if (error) {
    return { error: 'Could not save changes.' }
  }

  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/completed-exercises')
  revalidatePath(`/completed-exercises/${entryId}/edit`)
  revalidatePath('/stats')

  return {}
}

export async function deleteCompletedExercise(entryId: string): ActionResult {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('completed_exercises').delete().eq('user_id', user.id).eq('id', entryId)

  if (error) {
    return { error: 'Could not delete the entry.' }
  }

  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return {}
}

export async function copyCompletedExerciseCategory(
  entries: CompletedExerciseRow[],
  performedAt: string,
): ActionResult<{ copiedCount: number }> {
  const { supabase, user } = await requireUser()

  const sourceEntryIds = Array.from(new Set(entries.map((entry) => entry.id)))

  if (sourceEntryIds.length === 0) {
    return { error: 'Choose exercises to copy.' }
  }

  const { data: sourceEntries, error: sourceError } = await supabase
    .from('completed_exercises')
    .select(
      `
        exercise_id,
        sets,
        reps_per_set,
        duration_per_set_seconds,
        load_kg,
        distance_km,
        pace_min_per_km,
        note
      `,
    )
    .eq('user_id', user.id)
    .in('id', sourceEntryIds)

  if (sourceError || !sourceEntries?.length) {
    return { error: 'Could not load exercises to copy.' }
  }

  const rowsToInsert = sourceEntries.map((entry) => ({
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

  updateTag(cacheTags.completedExercises(user.id))
  updateTag(cacheTags.stats(user.id))
  revalidatePath('/completed-exercises')
  revalidatePath('/stats')

  return { data: { copiedCount: rowsToInsert.length } }
}
