-- Rename the old muscle group model to exercise categories without losing data.
-- Run this once before deploying the app code that reads exercise_categories.

begin;

do $$
begin
  if to_regclass('public.exercise_categories') is null
     and to_regclass('public.muscle_groups') is not null then
    alter table public.muscle_groups
      rename to exercise_categories;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'muscle_group_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'exercise_category_id'
  ) then
    alter table public.exercises
      rename column muscle_group_id to exercise_category_id;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.muscle_groups_user_id_idx') is not null
     and to_regclass('public.exercise_categories_user_id_idx') is null then
    alter index public.muscle_groups_user_id_idx
      rename to exercise_categories_user_id_idx;
  end if;

  if to_regclass('public.muscle_groups_pkey') is not null
     and to_regclass('public.exercise_categories_pkey') is null then
    alter index public.muscle_groups_pkey
      rename to exercise_categories_pkey;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'exercises_muscle_group_id_fkey'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'exercises_exercise_category_id_fkey'
  ) then
    alter table public.exercises
      rename constraint exercises_muscle_group_id_fkey to exercises_exercise_category_id_fkey;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'muscle_groups_authenticated_select'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'exercise_categories_authenticated_select'
  ) then
    alter policy muscle_groups_authenticated_select
      on public.exercise_categories
      rename to exercise_categories_authenticated_select;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'muscle_groups_authenticated_insert'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'exercise_categories_authenticated_insert'
  ) then
    alter policy muscle_groups_authenticated_insert
      on public.exercise_categories
      rename to exercise_categories_authenticated_insert;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'muscle_groups_authenticated_update'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'exercise_categories_authenticated_update'
  ) then
    alter policy muscle_groups_authenticated_update
      on public.exercise_categories
      rename to exercise_categories_authenticated_update;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'muscle_groups_authenticated_delete'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exercise_categories'
      and policyname = 'exercise_categories_authenticated_delete'
  ) then
    alter policy muscle_groups_authenticated_delete
      on public.exercise_categories
      rename to exercise_categories_authenticated_delete;
  end if;
end
$$;

commit;
