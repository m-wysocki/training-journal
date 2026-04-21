-- Add timed-set support for exercises such as plank.
-- Existing rows keep their reps_per_set data unchanged.

alter table public.completed_exercises
  add column if not exists duration_per_set_seconds integer[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'completed_exercises_duration_per_set_seconds_check'
  ) then
    alter table public.completed_exercises
      add constraint completed_exercises_duration_per_set_seconds_check
      check (
        duration_per_set_seconds is null
        or (
          array_position(duration_per_set_seconds, null) is null
          and 0 < all(duration_per_set_seconds)
          and 3600 >= all(duration_per_set_seconds)
        )
      );
  end if;
end
$$;
