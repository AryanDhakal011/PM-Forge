-- Run with the SQL tool against the project. Fixtures are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','cloud-test-a@example.invalid',now()),
 ('22222222-2222-4222-8222-222222222222','cloud-test-b@example.invalid',now());
insert into auth.sessions(id,user_id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
do $$ begin
 if not public.pmforge_session_active() then raise exception 'active-session'; end if;
 if public.pmforge_save_workspace(0,'{"profile":{"id":"11111111-1111-4111-8111-111111111111"}}')<>1 then raise exception 'first-version'; end if;
 if public.pmforge_save_workspace(1,'{"profile":{"id":"11111111-1111-4111-8111-111111111111"}}')<>2 then raise exception 'second-version'; end if;
 if (select count(*) from public.pmforge_workspaces)<>1 then raise exception 'owner-read'; end if;
 begin
  perform public.pmforge_save_workspace(1,'{"profile":{"id":"11111111-1111-4111-8111-111111111111"}}');
  raise exception 'conflict-not-enforced';
 exception when others then if sqlerrm<>'workspace-conflict' then raise; end if; end;
 begin
  perform public.pmforge_save_workspace(2,'{"profile":{"id":"22222222-2222-4222-8222-222222222222"}}');
  raise exception 'owner-not-enforced';
 exception when others then if sqlerrm<>'invalid-workspace' then raise; end if; end;
 if has_table_privilege('authenticated','public.pmforge_workspaces','INSERT') then raise exception 'direct-write'; end if;
 if has_table_privilege('anon','public.pmforge_portfolios','SELECT') then raise exception 'public-token-leak'; end if;
 perform public.pmforge_begin_password_reset(repeat('a',48));
 if not public.pmforge_claim_password_reset(repeat('a',48)) then raise exception 'recovery-first-use'; end if;
 if public.pmforge_claim_password_reset(repeat('a',48)) then raise exception 'recovery-replay'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin if (select count(*) from public.pmforge_workspaces)<>0 then raise exception 'cross-account-read'; end if; end $$;
reset role;
delete from auth.sessions where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
do $$ begin
 if (select count(*) from public.pmforge_workspaces)<>0 then raise exception 'revoked-session-read'; end if;
 if public.pmforge_session_active() then raise exception 'revoked-session-status'; end if;
 if public.pmforge_take_request('workspace',120) then raise exception 'revoked-session-write'; end if;
end $$;
reset role;
select 'PASS: ownership, RLS, CAS conflicts, recovery replay, revoked sessions' as verification;
rollback;
