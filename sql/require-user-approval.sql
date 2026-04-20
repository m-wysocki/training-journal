create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_access
  enable row level security;

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

drop policy if exists muscle_groups_authenticated_select on public.muscle_groups;
drop policy if exists muscle_groups_authenticated_insert on public.muscle_groups;
drop policy if exists muscle_groups_authenticated_update on public.muscle_groups;
drop policy if exists muscle_groups_authenticated_delete on public.muscle_groups;

create policy muscle_groups_authenticated_select
  on public.muscle_groups
  for select
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved());

create policy muscle_groups_authenticated_insert
  on public.muscle_groups
  for insert
  to authenticated
  with check (user_id = auth.uid() and public.current_user_is_approved());

create policy muscle_groups_authenticated_update
  on public.muscle_groups
  for update
  to authenticated
  using (user_id = auth.uid() and public.current_user_is_approved())
  with check (user_id = auth.uid() and public.current_user_is_approved());

create policy muscle_groups_authenticated_delete
  on public.muscle_groups
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
      from public.muscle_groups
      where muscle_groups.id = exercises.muscle_group_id
        and muscle_groups.user_id = auth.uid()
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
      from public.muscle_groups
      where muscle_groups.id = exercises.muscle_group_id
        and muscle_groups.user_id = auth.uid()
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

-- Approve a candidate:
-- update public.user_access
-- set approved = true, approved_at = now()
-- where email = 'candidate@example.com';
