export const cacheTags = {
  exerciseCategories: (userId: string) => `exercise-categories:${userId}`,
  exercises: (userId: string) => `exercises:${userId}`,
  exerciseCategory: (userId: string, exerciseCategoryId: string) =>
    `exercise-category:${userId}:${exerciseCategoryId}`,
  completedExercises: (userId: string) => `completed-exercises:${userId}`,
  completedExercisesRange: (userId: string, dateFrom: string, dateTo: string) =>
    `completed-exercises:${userId}:${dateFrom}:${dateTo}`,
  stats: (userId: string) => `stats:${userId}`,
  statsRange: (userId: string, dateFrom: string, dateTo: string) => `stats:${userId}:${dateFrom}:${dateTo}`,
}
