-- Tests trusted backend transactions only; Edge validates user identity and content first.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','cloud-test-a@example.invalid',now()),
 ('22222222-2222-4222-8222-222222222222','cloud-test-b@example.invalid',now());
set local role service_role;
do $$ declare first jsonb; repeated jsonb; begin
 first:=public.pmforge_publish_portfolio('11111111-1111-4111-8111-111111111111','test-cloud-owner','link','{}',repeat('a',43),'fingerprint','request',now()+interval '30 days','[]');
 repeated:=public.pmforge_publish_portfolio('11111111-1111-4111-8111-111111111111','test-cloud-owner','link','{}',repeat('b',43),'fingerprint','request',now()+interval '30 days','[]');
 if first<>repeated then raise exception 'retry-not-idempotent'; end if;
 begin
  perform public.pmforge_publish_portfolio('22222222-2222-4222-8222-222222222222','test-cloud-owner','public','{}',repeat('c',43),'other','other',now()+interval '30 days','[]');
  raise exception 'handle-not-owned';
 exception when others then if sqlerrm<>'handle-owned' then raise; end if; end;
 begin
  perform public.pmforge_publish_portfolio('11111111-1111-4111-8111-111111111111','test-cloud-owner','link','{}',repeat('c',43),'changed','changed',now()+interval '30 days','[{"id":"artifact","mime":"text/html","data":"unsafe","bytes":6}]');
  raise exception 'bad-asset-accepted';
 exception when check_violation then null; end;
 if (select fingerprint from public.pmforge_portfolios where slug='test-cloud-owner')<>'fingerprint' then raise exception 'replacement-not-atomic'; end if;
 if public.pmforge_service_limit('11111111-1111-4111-8111-111111111111','publish',1) is not true then raise exception 'limit-first'; end if;
 if public.pmforge_service_limit('11111111-1111-4111-8111-111111111111','publish',1) is not false then raise exception 'limit-replay'; end if;
 if has_function_privilege('authenticated','public.pmforge_publish_portfolio(uuid,text,text,jsonb,text,text,text,timestamptz,jsonb)','EXECUTE') then raise exception 'privileged-rpc-exposed'; end if;
end $$;
reset role;
select 'PASS: publication retries, ownership, transaction rollback, shared counters and grants' as verification;
rollback;
