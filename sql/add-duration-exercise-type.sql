alter table public.exercises
  drop constraint if exists exercises_exercise_type_check;

alter table public.exercises
  add constraint exercises_exercise_type_check
  check (exercise_type in ('strength', 'cardio', 'duration'));

alter table public.completed_exercises
  drop constraint if exists completed_exercises_duration_per_set_seconds_check;

alter table public.completed_exercises
  add constraint completed_exercises_duration_per_set_seconds_check
  check (
    duration_per_set_seconds is null
    or (
      array_position(duration_per_set_seconds, null) is null
      and 0 < all(duration_per_set_seconds)
      and 86400 >= all(duration_per_set_seconds)
    )
  );
