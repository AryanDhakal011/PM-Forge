-- Managed cloud foundation. No existing local/device rows are overwritten.
create schema if not exists pmforge_private;
revoke all on schema pmforge_private from public, anon, authenticated;
grant usage on schema pmforge_private to authenticated, service_role;

create or replace function pmforge_private.member_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u join auth.sessions s on s.user_id=u.id
  where u.id=auth.uid() and s.id=nullif(auth.jwt()->>'session_id','')::uuid
    and u.is_anonymous is not true
$$;
revoke all on function pmforge_private.member_id() from public, anon;
grant execute on function pmforge_private.member_id() to authenticated, service_role;

create table public.pmforge_workspaces(
  owner_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null check(version>0), data jsonb not null,
  updated_at timestamptz not null default now(),
  check(octet_length(data::text)<=1048576),check(data->'profile'->>'id'=owner_id::text)
);
alter table public.pmforge_workspaces enable row level security;
revoke all on public.pmforge_workspaces from public,anon,authenticated;
grant select on public.pmforge_workspaces to authenticated;
grant all on public.pmforge_workspaces to service_role;
create policy workspace_owner_read on public.pmforge_workspaces for select to authenticated
  using(owner_id=(select pmforge_private.member_id()));

create table pmforge_private.request_limits(
  key text primary key,owner_id uuid references auth.users(id) on delete cascade,
  at timestamptz not null default now(), n integer not null default 1
);
create index request_limits_at on pmforge_private.request_limits(at);
alter table pmforge_private.request_limits enable row level security;
revoke all on pmforge_private.request_limits from public,anon,authenticated;

create or replace function pmforge_private.take_request(actor uuid,bucket text,maximum integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare total integer; cap integer; identity text;
begin
  cap:=least(greatest(maximum,0),case bucket when 'workspace' then 120 when 'profile-import' then 5 when 'publish' then 10 when 'public-read' then 1000 when 'public-event' then 1000 else 0 end);
  if cap=0 then return false; end if;
  identity:=coalesce(actor::text,'global')||':'||bucket;
  delete from pmforge_private.request_limits where at<now()-interval '1 hour';
  insert into pmforge_private.request_limits(key,owner_id,at,n) values(identity,actor,now(),1)
    on conflict(key) do update set at=case when pmforge_private.request_limits.at<=now()-interval '1 minute' then now() else pmforge_private.request_limits.at end,
      n=case when pmforge_private.request_limits.at<=now()-interval '1 minute' then 1 else pmforge_private.request_limits.n+1 end
    returning n into total;
  return total<=cap;
end $$;
revoke all on function pmforge_private.take_request(uuid,text,integer) from public,anon,authenticated;

create or replace function public.pmforge_take_request(bucket text,maximum integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=pmforge_private.member_id();
begin
  if actor is null then return false; end if;
  return pmforge_private.take_request(actor,bucket,maximum);
end $$;
revoke all on function public.pmforge_take_request(text,integer) from public,anon;
grant execute on function public.pmforge_take_request(text,integer) to authenticated;

create or replace function public.pmforge_save_workspace(expected bigint,document jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare actor uuid:=pmforge_private.member_id(); next_version bigint; previous_bytes bigint;
begin
  if actor is null then raise exception 'authentication-required'; end if;
  if expected<0 or jsonb_typeof(document) <> 'object' or document->'profile'->>'id' is distinct from actor::text or octet_length(document::text)>1048576 then raise exception 'invalid-workspace'; end if;
  perform pg_advisory_xact_lock(7046371001);
  select coalesce(octet_length(data::text),0) into previous_bytes from public.pmforge_workspaces where owner_id=actor;
  if (select coalesce(sum(octet_length(data::text)),0) from public.pmforge_workspaces)-coalesce(previous_bytes,0)+octet_length(document::text)>104857600 then raise exception 'cloud-capacity'; end if;
  if expected=0 then
    insert into public.pmforge_workspaces(owner_id,version,data) values(actor,1,document) on conflict(owner_id) do nothing returning version into next_version;
  else
    update public.pmforge_workspaces set data=document,version=version+1,updated_at=now() where owner_id=actor and version=expected returning version into next_version;
  end if;
  if next_version is null then raise exception 'workspace-conflict'; end if;
  return next_version;
end $$;
revoke all on function public.pmforge_save_workspace(bigint,jsonb) from public,anon;
grant execute on function public.pmforge_save_workspace(bigint,jsonb) to authenticated;

create table pmforge_private.password_recovery(
  owner_id uuid primary key references auth.users(id) on delete cascade,
  nonce_hash text not null,expires timestamptz not null
);
alter table pmforge_private.password_recovery enable row level security;
revoke all on pmforge_private.password_recovery from public,anon,authenticated;
create or replace function public.pmforge_begin_password_reset(nonce text) returns boolean
language plpgsql security definer set search_path='' as $$
declare actor uuid:=pmforge_private.member_id();
begin
  if actor is null or nonce !~ '^[a-f0-9]{48}$' then raise exception 'invalid-recovery'; end if;
  delete from pmforge_private.password_recovery where expires<now();
  insert into pmforge_private.password_recovery values(actor,encode(sha256(convert_to(nonce,'UTF8')),'hex'),now()+interval '15 minutes') on conflict(owner_id) do update set nonce_hash=excluded.nonce_hash,expires=excluded.expires;
  return true;
end $$;
create or replace function public.pmforge_claim_password_reset(nonce text) returns boolean
language plpgsql security definer set search_path='' as $$
declare actor uuid:=pmforge_private.member_id(); removed uuid;
begin
  if actor is null then return false; end if;
  delete from pmforge_private.password_recovery where owner_id=actor and expires>now() and nonce_hash=encode(sha256(convert_to(nonce,'UTF8')),'hex') returning owner_id into removed;
  return removed is not null;
end $$;
revoke all on function public.pmforge_begin_password_reset(text),public.pmforge_claim_password_reset(text) from public,anon;
grant execute on function public.pmforge_begin_password_reset(text),public.pmforge_claim_password_reset(text) to authenticated;

create table public.pmforge_portfolios(
  slug text primary key check(slug ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check(mode in ('public','link','review')),
  data jsonb not null check(octet_length(data::text)<=1048576),
  token text not null,token_hash text not null,fingerprint text not null,request_hash text not null,
  expires timestamptz not null,created_at timestamptz not null default now()
);
create index pmforge_portfolios_owner on public.pmforge_portfolios(owner_id);
create index pmforge_portfolios_expiry on public.pmforge_portfolios(expires);
create table public.pmforge_portfolio_assets(
  slug text not null references public.pmforge_portfolios(slug) on delete cascade,
  id text not null,mime text not null check(mime in ('image/png','audio/wav')),
  data text not null check(length(data)<=1398104),bytes integer not null check(bytes between 1 and 1048576),
  primary key(slug,id)
);
create table public.pmforge_portfolio_events(
  slug text not null references public.pmforge_portfolios(slug) on delete cascade,
  event text not null,day date not null default current_date,n integer not null default 1,
  primary key(slug,event,day)
);
create table public.pmforge_portfolio_comments(
  id uuid primary key default gen_random_uuid(),slug text not null references public.pmforge_portfolios(slug) on delete cascade,
  case_id text not null,author text not null check(length(author)<=100),body text not null check(length(body)<=3000),created_at timestamptz not null default now()
);
alter table public.pmforge_portfolios enable row level security;
alter table public.pmforge_portfolio_assets enable row level security;
alter table public.pmforge_portfolio_events enable row level security;
alter table public.pmforge_portfolio_comments enable row level security;
revoke all on public.pmforge_portfolios,public.pmforge_portfolio_assets,public.pmforge_portfolio_events,public.pmforge_portfolio_comments from public,anon,authenticated;
grant all on public.pmforge_portfolios,public.pmforge_portfolio_assets,public.pmforge_portfolio_events,public.pmforge_portfolio_comments to service_role;

-- Privileged functions are called only by the backend, after getUser and live-session checks.
create or replace function public.pmforge_validate_session(actor uuid,session uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id where s.id=session and s.user_id=actor and u.is_anonymous is not true)
$$;
create or replace function public.pmforge_service_limit(actor uuid,bucket text,maximum integer) returns boolean
language sql security definer set search_path='' as $$select pmforge_private.take_request(actor,bucket,maximum)$$;
revoke all on function public.pmforge_validate_session(uuid,uuid),public.pmforge_service_limit(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.pmforge_validate_session(uuid,uuid),public.pmforge_service_limit(uuid,text,integer) to service_role;

create or replace function public.pmforge_publish_portfolio(actor uuid,handle text,visibility text,snapshot jsonb,capability text,fingerprint_value text,request_value text,expiry timestamptz,assets jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.pmforge_portfolios; asset jsonb; incoming bigint; current_bytes bigint;
begin
  if not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null and is_anonymous is not true) then raise exception 'verified-account-required'; end if;
  if handle in ('admin','api','www','support','pmforge','login','signup','auth','settings','security','help','terms','privacy') or handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' then raise exception 'invalid-handle'; end if;
  if expiry<=now() or expiry>now()+interval '181 days' or length(capability)<32 or jsonb_typeof(assets)<>'array' then raise exception 'invalid-publication'; end if;
  perform pg_advisory_xact_lock(7046371002);
  delete from public.pmforge_portfolios where expires<=now();
  select * into existing from public.pmforge_portfolios where slug=handle;
  if existing.slug is not null and existing.owner_id<>actor then raise exception 'handle-owned'; end if;
  if existing.request_hash=request_value then return jsonb_build_object('token',existing.token,'expires',extract(epoch from existing.expires)*1000,'fingerprint',existing.fingerprint); end if;
  if existing.slug is null and (select count(*) from public.pmforge_portfolios where owner_id=actor)>=3 then raise exception 'portfolio-limit'; end if;
  select coalesce(sum((a->>'bytes')::bigint),0) into incoming from jsonb_array_elements(assets) a;
  if incoming>2097152 then raise exception 'artifact-limit'; end if;
  select coalesce(sum(bytes),0) into current_bytes from public.pmforge_portfolio_assets where slug=handle;
  if (select coalesce(sum(bytes),0) from public.pmforge_portfolio_assets)-current_bytes+incoming>262144000 then raise exception 'cloud-capacity'; end if;
  if (select coalesce(sum(a.bytes),0) from public.pmforge_portfolio_assets a join public.pmforge_portfolios p on p.slug=a.slug where p.owner_id=actor)-current_bytes+incoming>10485760 then raise exception 'account-storage-limit'; end if;
  insert into public.pmforge_portfolios(slug,owner_id,mode,data,token,token_hash,fingerprint,request_hash,expires)
  values(handle,actor,visibility,snapshot,capability,encode(sha256(convert_to(capability,'UTF8')),'hex'),fingerprint_value,request_value,expiry)
  on conflict(slug) do update set mode=excluded.mode,data=excluded.data,token=excluded.token,token_hash=excluded.token_hash,fingerprint=excluded.fingerprint,request_hash=excluded.request_hash,expires=excluded.expires;
  delete from public.pmforge_portfolio_assets where slug=handle;
  for asset in select * from jsonb_array_elements(assets) loop
    insert into public.pmforge_portfolio_assets values(handle,asset->>'id',asset->>'mime',asset->>'data',(asset->>'bytes')::integer);
  end loop;
  return jsonb_build_object('token',capability,'expires',extract(epoch from expiry)*1000,'fingerprint',fingerprint_value);
end $$;
revoke all on function public.pmforge_publish_portfolio(uuid,text,text,jsonb,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.pmforge_publish_portfolio(uuid,text,text,jsonb,text,text,text,timestamptz,jsonb) to service_role;

create or replace function public.pmforge_record_event(handle text,kind text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if kind not in ('view','scroll25','scroll50','scroll75','scroll100','audio','depth2','depth5') then return false; end if;
  insert into public.pmforge_portfolio_events(slug,event,day,n) values(handle,kind,current_date,1)
  on conflict(slug,event,day) do update set n=public.pmforge_portfolio_events.n+1;
  return true;
end $$;
revoke all on function public.pmforge_record_event(text,text) from public,anon,authenticated;
grant execute on function public.pmforge_record_event(text,text) to service_role;
create or replace function public.pmforge_health() returns jsonb
language sql stable security invoker set search_path='' as $$ select jsonb_build_object('status','ready','storage','postgres','schema',1) $$;
revoke all on function public.pmforge_health() from public;
grant execute on function public.pmforge_health() to anon,authenticated,service_role;
