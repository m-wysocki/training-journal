import FormDialog from '@/components/FormDialog'
import FormSelect from '@/components/FormSelect'
import SurfaceCard from '@/components/SurfaceCard'
import { EXERCISE_TYPE_OPTIONS } from '@/lib/exerciseTypeOptions'
import type { ExerciseType } from '@/lib/exerciseTypes'
import type { ExerciseSelectionState } from '../_hooks/useExerciseSelectionState'
import styles from './ExerciseSelectionSection.module.scss'

type Props = {
  form: ExerciseSelectionState
  isExerciseSetupLoading: boolean
}

export default function ExerciseSelectionSection({ form, isExerciseSetupLoading }: Props) {
  const {
    exerciseCategories,
    filteredExercises,
    selectedExerciseCategoryId,
    selectedExerciseId,
    isExerciseCategoryDialogOpen,
    isExerciseDialogOpen,
    isAddingExerciseCategory,
    isAddingExercise,
    newExerciseCategoryName,
    newExerciseName,
    newExerciseType,
    setSelectedExerciseCategoryId,
    setSelectedExerciseId,
    setIsExerciseCategoryDialogOpen,
    setIsExerciseDialogOpen,
    setNewExerciseCategoryName,
    setNewExerciseName,
    setNewExerciseType,
    handleAddExerciseCategory,
    handleAddExercise,
  } = form

  return (
    <SurfaceCard as="section" className={styles.ExerciseSelectionSection}>
      <div className={styles.ExerciseSelectionSectionHeader}>
        <h2 className={styles.ExerciseSelectionSectionTitle}>Exercise</h2>
        <p className={styles.ExerciseSelectionSectionDescription}>
          Start by choosing an exercise category and a specific exercise.
        </p>
      </div>

      <div className={styles.ExerciseSelectionSectionBody}>
        <div className={styles.ExerciseSelectionSectionBadgeField}>
          <p className={styles.ExerciseSelectionSectionLabel}>Exercise Category</p>
          <div className={styles.ExerciseSelectionSectionBadgeGroup} role="group" aria-label="Exercise category">
            {isExerciseSetupLoading ? (
              <div className={styles.ExerciseSelectionSectionFormDataSkeleton} aria-label="Loading exercise categories">
                <span />
                <span />
                <span />
              </div>
            ) : exerciseCategories.length === 0 ? (
              <p className={styles.ExerciseSelectionSectionBadgeEmpty}>No exercise categories yet.</p>
            ) : null}
            {exerciseCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={styles.ExerciseSelectionSectionChoiceBadge}
                aria-pressed={selectedExerciseCategoryId === category.id}
                data-selected={selectedExerciseCategoryId === category.id ? 'true' : undefined}
                onClick={() => {
                  setSelectedExerciseCategoryId(category.id)
                  setSelectedExerciseId('')
                }}
              >
                {category.name}
              </button>
            ))}
            <FormDialog
              open={isExerciseCategoryDialogOpen}
              onOpenChange={setIsExerciseCategoryDialogOpen}
              title="Add Exercise Category"
              description="Enter the name of the new exercise category."
              trigger={(
                <button type="button" className={styles.ExerciseSelectionSectionAddBadge}>
                  Add
                </button>
              )}
              primaryActionLabel={isAddingExerciseCategory ? 'Adding...' : 'Add'}
              onPrimaryAction={handleAddExerciseCategory}
              primaryActionDisabled={isAddingExerciseCategory}
            >
              <div className={styles.ExerciseSelectionSectionDialogBody}>
                <input
                  className={styles.ExerciseSelectionSectionInput}
                  value={newExerciseCategoryName}
                  onChange={(e) => setNewExerciseCategoryName(e.target.value)}
                  placeholder="e.g. Back"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAddExerciseCategory()
                    }
                  }}
                />
              </div>
            </FormDialog>
          </div>
        </div>

        <div className={styles.ExerciseSelectionSectionBadgeField}>
          <p className={styles.ExerciseSelectionSectionLabel}>Exercise</p>
          <div className={styles.ExerciseSelectionSectionBadgeGroup} role="group" aria-label="Exercise">
            {!selectedExerciseCategoryId ? (
              <p className={styles.ExerciseSelectionSectionBadgeEmpty}>Select an exercise category first.</p>
            ) : filteredExercises.length === 0 ? (
              <p className={styles.ExerciseSelectionSectionBadgeEmpty}>No exercises in this category yet.</p>
            ) : (
              filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  className={styles.ExerciseSelectionSectionChoiceBadge}
                  aria-pressed={selectedExerciseId === exercise.id}
                  data-selected={selectedExerciseId === exercise.id ? 'true' : undefined}
                  onClick={() => setSelectedExerciseId(exercise.id)}
                >
                  {exercise.name}
                </button>
              ))
            )}
            <FormDialog
              open={isExerciseDialogOpen}
              onOpenChange={setIsExerciseDialogOpen}
              title="Add Exercise"
              description="Add a new exercise to the selected exercise category."
              trigger={(
                <button
                  type="button"
                  className={styles.ExerciseSelectionSectionAddBadge}
                  disabled={!selectedExerciseCategoryId}
                >
                  Add
                </button>
              )}
              primaryActionLabel={isAddingExercise ? 'Adding...' : 'Add'}
              onPrimaryAction={handleAddExercise}
              primaryActionDisabled={isAddingExercise}
            >
              <div className={styles.ExerciseSelectionSectionDialogBody}>
                <input
                  className={styles.ExerciseSelectionSectionInput}
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Barbell Row"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAddExercise()
                    }
                  }}
                />
                <label htmlFor="newExerciseType" className={styles.ExerciseSelectionSectionLabel}>
                  Type
                </label>
                <FormSelect
                  id="newExerciseType"
                  value={newExerciseType}
                  onChange={(e) => setNewExerciseType(e.target.value as ExerciseType)}
                  options={EXERCISE_TYPE_OPTIONS}
                />
              </div>
            </FormDialog>
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}
