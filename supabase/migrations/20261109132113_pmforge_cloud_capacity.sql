-- Bound free storage and atomically limit direct workspace RPC calls.
create or replace function public.pmforge_save_workspace(expected bigint,document jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare actor uuid:=pmforge_private.member_id(); next_version bigint; previous_bytes bigint;
begin
  if actor is null then raise exception 'authentication-required'; end if;
  if expected<0 or jsonb_typeof(document) <> 'object' or document->'profile'->>'id' is distinct from actor::text or octet_length(document::text)>1048576 then raise exception 'invalid-workspace'; end if;
  if not pmforge_private.take_request(actor,'workspace',120) then raise exception 'request-limit'; end if;
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
  if (select coalesce(sum(bytes),0) from public.pmforge_portfolio_assets)-current_bytes+incoming>104857600 then raise exception 'cloud-capacity'; end if;
  if (select coalesce(sum(a.bytes),0) from public.pmforge_portfolio_assets a join public.pmforge_portfolios p on p.slug=a.slug where p.owner_id=actor)-current_bytes+incoming>10485760 then raise exception 'account-storage-limit'; end if;
  if (select coalesce(sum(octet_length(data::text)),0) from public.pmforge_portfolios where slug<>handle)+octet_length(snapshot::text)>52428800 then raise exception 'cloud-capacity'; end if;
  insert into public.pmforge_portfolios(slug,owner_id,mode,data,token,token_hash,fingerprint,request_hash,expires)
  values(handle,actor,visibility,snapshot,capability,encode(sha256(convert_to(capability,'UTF8')),'hex'),fingerprint_value,request_value,expiry)
  on conflict(slug) do update set mode=excluded.mode,data=excluded.data,token=excluded.token,token_hash=excluded.token_hash,fingerprint=excluded.fingerprint,request_hash=excluded.request_hash,expires=excluded.expires;
  delete from public.pmforge_portfolio_assets where slug=handle;
  for asset in select * from jsonb_array_elements(assets) loop
    insert into public.pmforge_portfolio_assets values(handle,asset->>'id',asset->>'mime',asset->>'data',(asset->>'bytes')::integer);
  end loop;
  return jsonb_build_object('token',capability,'expires',extract(epoch from expiry)*1000,'fingerprint',fingerprint_value);
end $$;

create or replace function public.pmforge_add_comment(handle text,case_identifier text,reviewer text,message text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(7046371003);
  if length(reviewer)>100 or length(message) not between 1 and 3000 then raise exception 'invalid-comment'; end if;
  if not exists(select 1 from public.pmforge_portfolios where slug=handle and mode='review' and expires>now()) then raise exception 'review-required'; end if;
  if (select count(*) from public.pmforge_portfolio_comments where slug=handle)>=100 or (select coalesce(sum(octet_length(body)+octet_length(author)),0) from public.pmforge_portfolio_comments)>10485760 then raise exception 'comment-capacity'; end if;
  insert into public.pmforge_portfolio_comments(slug,case_id,author,body) values(handle,case_identifier,reviewer,message);
  return true;
end $$;
revoke all on function public.pmforge_add_comment(text,text,text,text) from public,anon,authenticated;
grant execute on function public.pmforge_add_comment(text,text,text,text) to service_role;
