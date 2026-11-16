create table if not exists public.x_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  x_post_id text not null unique,
  content text not null,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists x_posts_user_posted_at_idx
  on public.x_posts (user_id, posted_at desc);

alter table public.x_posts enable row level security;

create policy "Users can read their own X posts"
  on public.x_posts for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes are performed by the authenticated Edge Function using the service role.
