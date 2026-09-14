-- GourmetQR — Milestone 1 schema
-- Paste this entire file into the Supabase SQL Editor (SQL Editor -> New query) and run once.
-- Safe to re-run: uses `create table if not exists` / `drop policy if exists` guards throughout.

-- ============================================================================
-- 1. profiles (auth.users -> role mapping)
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'owner' check (role in ('owner', 'super_admin')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "profiles_update_own_display_name" on profiles;
create policy "profiles_update_own_display_name" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- 2. businesses (tenant root — owner_id is NOT unique: multi-business support)
-- ============================================================================

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  -- References profiles(id) rather than auth.users(id) directly (both are
  -- 1:1 with auth.users) so PostgREST/Supabase-js can embed the owner's
  -- profile in a single query, e.g. .select('*, owner:profiles(email)').
  -- Safe because handle_new_user() creates the profiles row synchronously
  -- as part of the auth.users insert, before any business can be created.
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  type text,
  description text not null default '',
  currency text not null default '$',
  theme_color text not null default '#ea580c',
  theme_template text not null default 'modern' check (theme_template in ('modern', 'classic', 'dark', 'minimal')),
  logo_url text,
  wifi_ssid text,
  wifi_password text,
  primary_language text not null default 'en',
  languages jsonb not null default '[]'::jsonb,
  promotion jsonb,
  enable_smart_waiter boolean not null default true,
  enable_lead_capture boolean not null default true,
  enable_feedback boolean not null default true,
  google_review_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_owner_id_idx on businesses(owner_id);

alter table businesses enable row level security;

drop policy if exists "businesses_select" on businesses;
create policy "businesses_select" on businesses
  for select using (
    is_published = true
    or owner_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "businesses_insert_own" on businesses;
create policy "businesses_insert_own" on businesses
  for insert with check (owner_id = auth.uid());

drop policy if exists "businesses_update_own" on businesses;
create policy "businesses_update_own" on businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "businesses_delete_own" on businesses;
create policy "businesses_delete_own" on businesses
  for delete using (owner_id = auth.uid());

-- ============================================================================
-- 3. categories
-- ============================================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists categories_business_id_idx on categories(business_id);

alter table categories enable row level security;

drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories
  for select using (
    exists (
      select 1 from businesses b
      where b.id = categories.business_id
        and (b.is_published = true or b.owner_id = auth.uid())
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "categories_write_owner" on categories;
create policy "categories_write_owner" on categories
  for all using (
    exists (select 1 from businesses b where b.id = categories.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from businesses b where b.id = categories.business_id and b.owner_id = auth.uid())
  );

-- ============================================================================
-- 4. menu_items
-- ============================================================================

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  image_url text,
  dietary text[] not null default '{}',
  is_available boolean not null default true,
  translations jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_business_id_idx on menu_items(business_id);
create index if not exists menu_items_category_id_idx on menu_items(category_id);

alter table menu_items enable row level security;

drop policy if exists "menu_items_select" on menu_items;
create policy "menu_items_select" on menu_items
  for select using (
    exists (
      select 1 from businesses b
      where b.id = menu_items.business_id
        and (b.is_published = true or b.owner_id = auth.uid())
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "menu_items_write_owner" on menu_items;
create policy "menu_items_write_owner" on menu_items
  for all using (
    exists (select 1 from businesses b where b.id = menu_items.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from businesses b where b.id = menu_items.business_id and b.owner_id = auth.uid())
  );

-- ============================================================================
-- 5. leads (anon INSERT-only mailbox)
-- ============================================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  name text,
  source text not null default 'menu_popup',
  created_at timestamptz not null default now()
);

create index if not exists leads_business_id_idx on leads(business_id);

alter table leads enable row level security;

drop policy if exists "leads_select_owner" on leads;
create policy "leads_select_owner" on leads
  for select using (
    exists (select 1 from businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "leads_insert_public" on leads;
create policy "leads_insert_public" on leads
  for insert with check (
    exists (select 1 from businesses b where b.id = leads.business_id and b.is_published = true)
  );

drop policy if exists "leads_delete_owner" on leads;
create policy "leads_delete_owner" on leads
  for delete using (
    exists (select 1 from businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  );

-- ============================================================================
-- 6. service_requests (anon INSERT-only mailbox; owner can update status)
-- ============================================================================

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null check (type in ('waiter', 'bill', 'water', 'other')),
  table_number text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists service_requests_business_id_idx on service_requests(business_id);

alter table service_requests enable row level security;

drop policy if exists "service_requests_select_owner" on service_requests;
create policy "service_requests_select_owner" on service_requests
  for select using (
    exists (select 1 from businesses b where b.id = service_requests.business_id and b.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "service_requests_insert_public" on service_requests;
create policy "service_requests_insert_public" on service_requests
  for insert with check (
    exists (select 1 from businesses b where b.id = service_requests.business_id and b.is_published = true)
  );

drop policy if exists "service_requests_update_owner" on service_requests;
create policy "service_requests_update_owner" on service_requests
  for update using (
    exists (select 1 from businesses b where b.id = service_requests.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from businesses b where b.id = service_requests.business_id and b.owner_id = auth.uid())
  );

-- ============================================================================
-- 7. feedback (anon INSERT-only mailbox)
-- ============================================================================

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  contact text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_business_id_idx on feedback(business_id);

alter table feedback enable row level security;

drop policy if exists "feedback_select_owner" on feedback;
create policy "feedback_select_owner" on feedback
  for select using (
    exists (select 1 from businesses b where b.id = feedback.business_id and b.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "feedback_insert_public" on feedback;
create policy "feedback_insert_public" on feedback
  for insert with check (
    exists (select 1 from businesses b where b.id = feedback.business_id and b.is_published = true)
  );

-- ============================================================================
-- 8. menu_views / item_clicks (append-only event logs, anon INSERT-only)
-- ============================================================================

create table if not exists menu_views (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists menu_views_business_id_idx on menu_views(business_id);

alter table menu_views enable row level security;

drop policy if exists "menu_views_select_owner" on menu_views;
create policy "menu_views_select_owner" on menu_views
  for select using (
    exists (select 1 from businesses b where b.id = menu_views.business_id and b.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "menu_views_insert_public" on menu_views;
create policy "menu_views_insert_public" on menu_views
  for insert with check (
    exists (select 1 from businesses b where b.id = menu_views.business_id and b.is_published = true)
  );

create table if not exists item_clicks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  item_id uuid references menu_items(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists item_clicks_business_id_idx on item_clicks(business_id);

alter table item_clicks enable row level security;

drop policy if exists "item_clicks_select_owner" on item_clicks;
create policy "item_clicks_select_owner" on item_clicks
  for select using (
    exists (select 1 from businesses b where b.id = item_clicks.business_id and b.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "item_clicks_insert_public" on item_clicks;
create policy "item_clicks_insert_public" on item_clicks
  for insert with check (
    exists (select 1 from businesses b where b.id = item_clicks.business_id and b.is_published = true)
  );

-- Aggregation views for the Insights tab. `security_invoker = on` is critical —
-- without it, views run as the view owner and silently bypass RLS.
create or replace view v_item_click_counts
  with (security_invoker = on) as
  select business_id, item_id, count(*) as clicks
  from item_clicks
  group by business_id, item_id;

create or replace view v_business_view_counts
  with (security_invoker = on) as
  select business_id, count(*) as total_views
  from menu_views
  group by business_id;

-- Used by the Super Admin overview and the owner's own dashboard header.
create or replace view v_business_summary
  with (security_invoker = on) as
  select
    b.id as business_id,
    (select count(*) from categories c where c.business_id = b.id) as category_count,
    (select count(*) from menu_items m where m.business_id = b.id) as item_count
  from businesses b;

-- ============================================================================
-- 9. ai_usage (per-business daily rate limiting for the AI proxy)
-- ============================================================================

create table if not exists ai_usage (
  business_id uuid not null references businesses(id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (business_id, day)
);

alter table ai_usage enable row level security;

drop policy if exists "ai_usage_select_owner" on ai_usage;
create policy "ai_usage_select_owner" on ai_usage
  for select using (
    exists (select 1 from businesses b where b.id = ai_usage.business_id and b.owner_id = auth.uid())
  );

-- No insert/update/delete policies for ai_usage: only the service-role key
-- (used exclusively by Vercel serverless functions, never the browser) may
-- write to this table, since service-role bypasses RLS entirely.

-- Atomically increments today's AI usage counter for a business and reports
-- whether it's still within the given daily limit. Called by the AI proxy's
-- serverless functions via the service-role key.
create or replace function increment_ai_usage(p_business_id uuid, p_limit int)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_count int;
begin
  insert into ai_usage (business_id, day, count)
  values (p_business_id, current_date, 1)
  on conflict (business_id, day) do update set count = ai_usage.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- ============================================================================
-- 10. import_scanned_menu RPC — atomic bulk insert for the AI menu-scan import
-- ============================================================================

create or replace function import_scanned_menu(p_business_id uuid, p_payload jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_category jsonb;
  v_item jsonb;
  v_category_id uuid;
  v_is_owner boolean;
begin
  select exists (
    select 1 from businesses where id = p_business_id and owner_id = auth.uid()
  ) into v_is_owner;

  if not v_is_owner then
    raise exception 'Not authorized to modify this business';
  end if;

  for v_category in select * from jsonb_array_elements(p_payload)
  loop
    insert into categories (business_id, name, sort_order)
    values (p_business_id, v_category->>'categoryName', 0)
    returning id into v_category_id;

    for v_item in select * from jsonb_array_elements(v_category->'items')
    loop
      insert into menu_items (business_id, category_id, name, description, price, dietary)
      values (
        p_business_id,
        v_category_id,
        v_item->>'name',
        coalesce(v_item->>'description', ''),
        coalesce((v_item->>'price')::numeric, 0),
        coalesce(
          (select array_agg(x) from jsonb_array_elements_text(coalesce(v_item->'dietary', '[]'::jsonb)) as x),
          '{}'
        )
      );
    end loop;
  end loop;
end;
$$;

-- ============================================================================
-- 11. Storage bucket for menu images
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read" on storage.objects
  for select using (bucket_id = 'menu-images');

-- Ownership convention: object path is "{business_id}/{filename}" — the first
-- path segment must match a business owned by the uploading user.
drop policy if exists "menu_images_owner_write" on storage.objects;
create policy "menu_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "menu_images_owner_update" on storage.objects;
create policy "menu_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "menu_images_owner_delete" on storage.objects;
create policy "menu_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );
