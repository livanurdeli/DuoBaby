-- Mod girişi kontrolü (G2-8 backend tarafı). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.
--
-- Client `moods` tablosuna doğrudan upsert atıyor. Bu test o upsert'i
-- koruyan kuralları doğruluyor:
--   1. moods_one_per_day unique (user_id, date) → günde tek kayıt,
--   2. moods_insert_own → kimse başkasının adına mod yazamaz,
--   3. moods_select → partner modu görünür, yabancıya görünmez.

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000031', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000032', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000033', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

-- Client'ın attığı upsert'in birebir aynısı (onConflict: user_id,date).
create or replace function pg_temp.save_mood(
  p_user uuid, p_pair uuid, p_color public.mood_color, p_note text
) returns void
language sql as $$
  insert into public.moods (user_id, pair_id, color, note, date)
  values (p_user, p_pair, p_color, p_note, current_date)
  on conflict (user_id, date) do update
    set color = excluded.color, note = excluded.note;
$$;

set local role authenticated;

do $$
declare
  v_code text;
  v_pair uuid;
begin
  -- --- A ve B eşleşiyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000031');
  v_code := public.create_pair();

  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000032');
  v_pair := public.join_pair(v_code);

  -- --- A modunu giriyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000031');
  perform pg_temp.save_mood(
    'aaaaaaaa-0000-4000-8000-000000000031', v_pair, 'green', 'Iyi gecti'
  );

  -- Aynı gün tekrar giriş yeni satır DEĞİL, düzeltme olmalı
  perform pg_temp.save_mood(
    'aaaaaaaa-0000-4000-8000-000000000031', v_pair, 'blue', 'Aksama dogru bozuldu'
  );

  if (select count(*) from public.moods
      where user_id = 'aaaaaaaa-0000-4000-8000-000000000031') <> 1 then
    raise exception 'Ayni gun icin ikinci mod satiri olustu';
  end if;

  if (select color from public.moods
      where user_id = 'aaaaaaaa-0000-4000-8000-000000000031') <> 'blue' then
    raise exception 'Mod duzeltmesi uzerine yazmadi';
  end if;

  -- A, B'nin adına mod yazamamalı
  begin
    perform pg_temp.save_mood(
      'bbbbbbbb-0000-4000-8000-000000000032', v_pair, 'red', 'Sahte'
    );
    raise exception 'Kullanici PARTNERININ adina mod yazdi';
  exception when insufficient_privilege then
    null; -- RLS engelledi, beklenen
  end;

  -- --- B kendi modunu giriyor, A'nınkini görebilmeli ---
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000032');
  perform pg_temp.save_mood(
    'bbbbbbbb-0000-4000-8000-000000000032', v_pair, 'pink', 'Ozledim'
  );

  -- getTodayMoods() tek sorguyla iki satiri da cekiyor
  if (select count(*) from public.moods where date = current_date) <> 2 then
    raise exception 'Partner modu gorunmuyor';
  end if;

  -- --- C yabancı: hiçbirini görmemeli ---
  perform pg_temp.login('cccccccc-0000-4000-8000-000000000033');
  if exists (select 1 from public.moods) then
    raise exception 'Yabanci kullanici baskasinin modlarini gorebiliyor';
  end if;

  -- 200 karakter üstü not reddedilmeli
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000031');
  begin
    perform pg_temp.save_mood(
      'aaaaaaaa-0000-4000-8000-000000000031', v_pair, 'green', repeat('x', 201)
    );
    raise exception '200 karakterden uzun not kabul edildi';
  exception when check_violation then
    null; -- beklenen
  end;
end $$;

reset role;
rollback;
