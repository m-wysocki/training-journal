import CompletedExercisesClient from './CompletedExercisesClient'

export default function CompletedExercisesLoading() {
  return (
    <CompletedExercisesClient
      initialDateFrom=""
      initialDateTo=""
      initialEntries={[]}
      initialExerciseCategories={[]}
      initialEntryComparisons={{}}
      initialIsLoading
    />
  )
}
