-- FareFair PostgreSQL Schema
-- Run this in your Supabase SQL editor to create the database schema.

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TRANSPORT TYPES
-- ============================================================
create table if not exists transport_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  icon text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table transport_types enable row level security;
create policy "Allow public read of active transport_types"
  on transport_types for select
  using (active = true);

-- ============================================================
-- LOCATIONS
-- ============================================================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  province text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table locations enable row level security;
create policy "Allow public read of active locations"
  on locations for select
  using (active = true);

-- ============================================================
-- SOURCES
-- ============================================================
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  title text not null,
  url text,
  source_type text not null check (source_type in (
    'government_document','official_website','news_article',
    'press_release','regulatory_order','law','other'
  )),
  publication_date date,
  effective_date date,
  checked_at timestamptz,
  information_supported text,
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  created_at timestamptz not null default now()
);

alter table sources enable row level security;
create policy "Allow public read of sources"
  on sources for select
  using (true);

-- ============================================================
-- ROUTES
-- ============================================================
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  transport_type_id uuid not null references transport_types(id),
  origin_location_id uuid not null references locations(id),
  destination_location_id uuid not null references locations(id),
  route_name text not null,
  distance_km numeric(8,2),
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table routes enable row level security;
create policy "Allow public read of routes"
  on routes for select
  using (true);

-- ============================================================
-- FARE RULES
-- ============================================================
create table if not exists fare_rules (
  id uuid primary key default gen_random_uuid(),
  transport_type_id uuid not null references transport_types(id),
  base_fare numeric(10,2) not null,
  included_distance_km numeric(8,2) not null default 4,
  additional_rate_per_km numeric(10,2) not null default 0,
  discounted_base_fare numeric(10,2),
  discounted_additional_rate numeric(10,2),
  rounding_rule text,
  effective_from date not null,
  effective_until date,
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  source_id uuid references sources(id),
  created_at timestamptz not null default now()
);

alter table fare_rules enable row level security;
create policy "Allow public read of fare_rules"
  on fare_rules for select
  using (true);

-- ============================================================
-- FARE MATRICES (route-specific)
-- ============================================================
create table if not exists fare_matrices (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id),
  fare_amount numeric(10,2) not null,
  discounted_fare_amount numeric(10,2),
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  effective_from date not null,
  effective_until date,
  source_id uuid references sources(id),
  created_at timestamptz not null default now()
);

alter table fare_matrices enable row level security;
create policy "Allow public read of fare_matrices"
  on fare_matrices for select
  using (true);

-- ============================================================
-- DISCOUNT TYPES
-- ============================================================
create table if not exists discount_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  percentage numeric(5,2) not null,
  eligibility text not null default '',
  required_documents text not null default '',
  citizenship_restrictions text,
  legal_basis text,
  applicable_transports text[],
  effective_from date,
  effective_until date,
  active boolean not null default true,
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  source_id uuid references sources(id),
  created_at timestamptz not null default now()
);

alter table discount_types enable row level security;
create policy "Allow public read of active discount_types"
  on discount_types for select
  using (active = true);

-- ============================================================
-- TOURISM PRICES
-- ============================================================
create table if not exists tourism_prices (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  establishment_name text not null,
  item_name text not null,
  price numeric(12,2),
  discounted_price numeric(12,2),
  price_type text not null default 'unverified' check (price_type in (
    'official','establishment_published','estimated','user_reported','unverified'
  )),
  location_id uuid references locations(id),
  verification_status text not null default 'unverified' check (verification_status in (
    'verified','calculated','check_source','conflicting_data','expired','unverified'
  )),
  checked_at timestamptz,
  source_id uuid references sources(id),
  created_at timestamptz not null default now()
);

alter table tourism_prices enable row level security;
create policy "Allow public read of tourism_prices"
  on tourism_prices for select
  using (true);

-- ============================================================
-- OVERCHARGE REPORTS
-- ============================================================
create table if not exists overcharge_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  transport_type_id uuid references transport_types(id),
  origin_location_id uuid references locations(id),
  destination_location_id uuid references locations(id),
  origin_text text,
  destination_text text,
  expected_fare numeric(10,2),
  charged_fare numeric(10,2) not null,
  difference numeric(10,2),
  vehicle_plate text,
  operator text,
  driver_details text,
  notes text,
  occurred_at timestamptz not null,
  status text not null default 'pending' check (status in (
    'pending','under_review','resolved','dismissed'
  )),
  created_at timestamptz not null default now()
);

alter table overcharge_reports enable row level security;
create policy "Allow public insert of overcharge_reports"
  on overcharge_reports for insert
  with check (true);
create policy "Allow authenticated users to read own reports"
  on overcharge_reports for select
  using (auth.uid() = user_id);

-- ============================================================
-- EVIDENCE FILES
-- ============================================================
create table if not exists evidence_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references overcharge_reports(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

alter table evidence_files enable row level security;
create policy "Allow public insert of evidence_files"
  on evidence_files for insert
  with check (true);
