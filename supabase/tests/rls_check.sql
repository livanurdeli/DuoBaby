-- RLS kontrolü (G1-3). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse policy'ler doğru.

begin;

-- 3 kullanıcı: A ve B eşleşmiş, C yabancı.
insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'authenticated', 'authenticated');

insert into public.pairs (id, user1_id, user2_id, pair_code) values
  ('11111111-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001',
   'bbbbbbbb-0000-4000-8000-000000000002', 'TEST01');

insert into public.children (id, pair_id, name, gender, hair_color, eye_color, skin_tone)
values ('22222222-0000-4000-8000-000000000001',
        '11111111-0000-4000-8000-000000000001',
        'Test', 'female', 'black', 'brown', 'light');

-- Kimliği değiştiren yardımcı
create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

set local role authenticated;

-- --- A (pair üyesi) ---
select pg_temp.login('aaaaaaaa-0000-4000-8000-000000000001');
do $$
begin
  if (select count(*) from public.children) <> 1 then
    raise exception 'A kendi cocugunu goremiyor';
  end if;
  if (select count(*) from public.users) <> 2 then
    raise exception 'A kendisi + partnerini goremiyor';
  end if;
end $$;

-- --- C (yabancı) ---
select pg_temp.login('cccccccc-0000-4000-8000-000000000003');
do $$
begin
  if (select count(*) from public.children) <> 0 then
    raise exception 'YABANCI baskasinin cocugunu goruyor';
  end if;
  if (select count(*) from public.pairs) <> 0 then
    raise exception 'YABANCI baskasinin pair''ini goruyor';
  end if;
  if (select count(*) from public.users) <> 1 then
    raise exception 'YABANCI baskasinin profilini goruyor';
  end if;

  begin
    insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
    values ('11111111-0000-4000-8000-000000000001', 'Hack', 'male', 'x', 'y', 'z');
    raise exception 'YABANCI baskasinin pairine cocuk ekleyebiliyor';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.children set hunger = 0;
    if found then raise exception 'YABANCI baskasinin cocugunu guncelleyebiliyor'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
rollback;
