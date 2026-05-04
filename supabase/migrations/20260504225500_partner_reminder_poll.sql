create or replace function public.get_partner_reminder_poll(share_code_input text, role_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    normalized_share_code text;
    reminder_row public.partner_shares%rowtype;
    reminder_payload jsonb;
    reminder_type text;
    launch_target text;
begin
    normalized_share_code := upper(regexp_replace(coalesce(share_code_input, ''), '[^A-Z0-9]', '', 'g'));

    if normalized_share_code = '' then
        return null;
    end if;

    select *
    into reminder_row
    from public.partner_shares
    where share_code = normalized_share_code
    limit 1;

    if not found then
        return null;
    end if;

    if lower(coalesce(role_input, '')) = 'owner' then
        reminder_payload := reminder_row.latest_partner_nudge;
        reminder_type := coalesce(reminder_payload ->> 'type', '');
        launch_target := case when reminder_type = 'meals' then 'meals' else 'hydration' end;
    elsif lower(coalesce(role_input, '')) = 'partner' then
        reminder_payload := reminder_row.latest_owner_nudge;
        reminder_type := coalesce(reminder_payload ->> 'type', '');
        launch_target := 'partner_dashboard';
    else
        return null;
    end if;

    if reminder_payload is null then
        return null;
    end if;

    return jsonb_build_object(
        'shareCode', reminder_row.share_code,
        'type', reminder_type,
        'title', coalesce(reminder_payload ->> 'title', 'HerCare'),
        'message', coalesce(reminder_payload ->> 'message', 'Open HerCare for the latest reminder.'),
        'createdAtIso', coalesce(reminder_payload ->> 'createdAtIso', ''),
        'launchTarget', launch_target
    );
end;
$$;

grant execute on function public.get_partner_reminder_poll(text, text) to anon, authenticated;
