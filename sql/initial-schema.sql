-- Initial database setup for Training Journal.
-- Run this once in the Supabase SQL Editor for a fresh project.

create extension if not exists pgcrypto;

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  exercise_category_id uuid not null references public.exercise_categories(id) on delete cascade,
  name text not null,
  exercise_type text not null default 'strength',
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint exercises_exercise_type_check check (exercise_type in ('strength', 'cardio'))
);

create table if not exists public.completed_exercises (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sets integer check (sets is null or sets between 1 and 5),
  reps_per_set integer[],
  duration_per_set_seconds integer[],
  load_kg numeric(5,1),
  distance_km numeric(6,2),
  pace_min_per_km numeric(4,2),
  note text not null default '',
  performed_at date not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint completed_exercises_reps_per_set_check check (
    reps_per_set is null
    or (
      array_position(reps_per_set, null) is null
      and 1 <= all(reps_per_set)
      and 100 >= all(reps_per_set)
    )
  ),
  constraint completed_exercises_duration_per_set_seconds_check check (
    duration_per_set_seconds is null
    or (
      array_position(duration_per_set_seconds, null) is null
      and 0 < all(duration_per_set_seconds)
      and 3600 >= all(duration_per_set_seconds)
    )
  ),
  constraint completed_exercises_load_kg_check check (
    load_kg is null
    or (load_kg >= 2.5 and load_kg * 2 = trunc(load_kg * 2))
  ),
  constraint completed_exercises_distance_km_check check (
    distance_km is null or distance_km > 0
  ),
  constraint completed_exercises_pace_min_per_km_check check (
    pace_min_per_km is null or pace_min_per_km > 0
  )
);

create index if not exists exercise_categories_user_id_idx
  on public.exercise_categories (user_id);

create index if not exists exercises_exercise_category_id_idx
  on public.exercises (exercise_category_id);

create index if not exists exercises_user_id_idx
  on public.exercises (user_id);

create index if not exists completed_exercises_exercise_id_idx
  on public.completed_exercises (exercise_id);

create index if not exists completed_exercises_performed_at_idx
  on public.completed_exercises (performed_at desc);

create index if not exists completed_exercises_user_id_idx
  on public.completed_exercises (user_id);

alter table public.user_access enable row level security;
alter table public.exercise_categories enable row level security;
alter table public.exercises enable row level security;
alter table public.completed_exercises enable row level security;

create or replace function public.handle_new_user_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_access (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_access on auth.users;

create trigger on_auth_user_created_user_access
  after insert on auth.users
  for each row execute function public.handle_new_user_access();

insert into public.user_access (user_id, email)
select id, coalesce(email, '')
from auth.users
on conflict (user_id) do update
  set email = excluded.email;

create or replace function public.current_user_is_approved()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_access
    where user_access.user_id = auth.uid()
      and user_access.approved = true
  );
$$;

drop policy if exists user_access_authenticated_select on public.user_access;

create policy user_access_authenticated_select
  on public.user_access
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists exercise_categories_authenticated_select on public.exercise_categories;
drop policy if exists exercise_categories_authenticated_insert on public.exercise_categories;
drop policy if exists exercise_categories_authenticated_update on public.exercise_categories;
drop policy if exists exercise_categories_authenticated_delete on public.exercise_categories;

create policy exercise_categories_authenticated_select
  on public.exercise_categories
  for select
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

create policy exercise_categories_authenticated_insert
  on public.exercise_categories
  for insert
  to authenticated
  with check (user_id = auth.uid() and public.current_user_is_approved());

create policy exercise_categories_authenticated_update
  on public.exercise_categories
  for update
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved())
  with check (user_id = auth.uid() and public.current_user_is_approved());

create policy exercise_categories_authenticated_delete
  on public.exercise_categories
  for delete
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

drop policy if exists exercises_authenticated_select on public.exercises;
drop policy if exists exercises_authenticated_insert on public.exercises;
drop policy if exists exercises_authenticated_update on public.exercises;
drop policy if exists exercises_authenticated_delete on public.exercises;

create policy exercises_authenticated_select
  on public.exercises
  for select
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

create policy exercises_authenticated_insert
  on public.exercises
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and exists (
      select 1
      from public.exercise_categories
      where exercise_categories.id = exercises.exercise_category_id
        and exercise_categories.user_id = auth.uid()
    )
  );

create policy exercises_authenticated_update
  on public.exercises
  for update
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved())
  with check (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and exists (
      select 1
      from public.exercise_categories
      where exercise_categories.id = exercises.exercise_category_id
        and exercise_categories.user_id = auth.uid()
    )
  );

create policy exercises_authenticated_delete
  on public.exercises
  for delete
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

drop policy if exists completed_exercises_authenticated_select on public.completed_exercises;
drop policy if exists completed_exercises_authenticated_insert on public.completed_exercises;
drop policy if exists completed_exercises_authenticated_update on public.completed_exercises;
drop policy if exists completed_exercises_authenticated_delete on public.completed_exercises;

create policy completed_exercises_authenticated_select
  on public.completed_exercises
  for select
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

create policy completed_exercises_authenticated_insert
  on public.completed_exercises
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and exists (
      select 1
      from public.exercises
      where exercises.id = completed_exercises.exercise_id
        and exercises.user_id = auth.uid()
    )
  );

create policy completed_exercises_authenticated_update
  on public.completed_exercises
  for update
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved())
  with check (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and exists (
      select 1
      from public.exercises
      where exercises.id = completed_exercises.exercise_id
        and exercises.user_id = auth.uid()
    )
  );

create policy completed_exercises_authenticated_delete
  on public.completed_exercises
  for delete
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

-- Approve a user after they sign in for the first time:
-- update public.user_access
-- set approved = true, approved_at = now()
-- where email = 'candidate@example.com';
