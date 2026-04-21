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

-- Approve a candidate:
-- update public.user_access
-- set approved = true, approved_at = now()
-- where email = 'candidate@example.com';
