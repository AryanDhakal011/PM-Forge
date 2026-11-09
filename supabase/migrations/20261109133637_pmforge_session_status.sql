-- Expose a boolean session check, never session records or other user identities.
create or replace function public.pmforge_session_active() returns boolean
language sql stable security invoker set search_path='' as $$
 select pmforge_private.member_id() is not null
$$;
revoke all on function public.pmforge_session_active() from public,anon;
grant execute on function public.pmforge_session_active() to authenticated;
