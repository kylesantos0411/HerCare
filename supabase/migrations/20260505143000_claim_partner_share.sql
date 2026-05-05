create or replace function public.claim_partner_share(share_code_input text, partner_name_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    normalized_share_code text;
    current_user_id uuid;
    updated_row public.partner_shares%rowtype;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Missing authenticated user for partner claim.';
    end if;

    normalized_share_code := upper(regexp_replace(coalesce(share_code_input, ''), '[^A-Z0-9]', '', 'g'));

    if length(normalized_share_code) <> 8 then
        return null;
    end if;

    update public.partner_shares
    set
        partner_uid = current_user_id,
        partner_name = coalesce(nullif(trim(partner_name_input), ''), 'Kai'),
        updated_at = timezone('utc', now())
    where share_code = normalized_share_code
      and (partner_uid is null or partner_uid = current_user_id)
    returning *
    into updated_row;

    if not found then
        return null;
    end if;

    return jsonb_build_object(
        'shareCode', updated_row.share_code,
        'partnerUid', updated_row.partner_uid,
        'ownerName', updated_row.owner_name,
        'partnerName', updated_row.partner_name
    );
end;
$$;

grant execute on function public.claim_partner_share(text, text) to authenticated;
