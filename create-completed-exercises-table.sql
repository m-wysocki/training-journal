create table if not exists public.completed_exercises (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sets integer not null check (sets between 1 and 5),
  reps_per_set integer[] not null,
  load_kg numeric(5,1) not null default 2.5,
  note text not null default '',
  performed_at date not null,
  created_at timestamptz not null default now()
);

alter table public.completed_exercises
  add column if not exists reps_per_set integer[];

alter table public.completed_exercises
  add column if not exists load_kg numeric(5,1);

update public.completed_exercises
set load_kg = 2.5
where load_kg is null;

alter table public.completed_exercises
  alter column load_kg set default 2.5;

alter table public.completed_exercises
  alter column load_kg set not null;

alter table public.completed_exercises
  add column if not exists note text;

update public.completed_exercises
set note = coalesce(note, '');

alter table public.completed_exercises
  alter column note set default '';

alter table public.completed_exercises
  alter column note set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'completed_exercises'
      and column_name = 'reps'
  ) then
    update public.completed_exercises
    set reps_per_set = array_fill(reps, array[sets])
    where reps_per_set is null
      and reps is not null;
  end if;
end
$$;

alter table public.completed_exercises
  alter column reps_per_set set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'completed_exercises_load_kg_check'
  ) then
    alter table public.completed_exercises
      add constraint completed_exercises_load_kg_check
      check (load_kg >= 2.5 and load_kg * 2 = trunc(load_kg * 2));
  end if;
end
$$;

alter table public.completed_exercises
  drop column if exists reps;

create index if not exists completed_exercises_exercise_id_idx
  on public.completed_exercises (exercise_id);

create index if not exists completed_exercises_performed_at_idx
  on public.completed_exercises (performed_at desc);
