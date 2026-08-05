-- Streak kontrolü (G1-9). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.
--
-- Kural: gün ancak İKİSİ DE bakım yaptıysa tamamlanır. Geçmiş günleri
-- simüle etmek için `care_actions.created_at` ve `last_completed_date`
-- doğrudan geri çekiliyor.

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000061', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000062', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

-- `care_actions` ve `streaks` client'a KAPALI (update policy'si yok) — bu
-- doğru olan. Geçmişi simüle edebilmek için o iki yazma işi security
-- definer yardımcılarına alındı; test dışında böyle bir kapı yok.
create or replace function pg_temp.rewind_actions(p_child uuid, p_days int)
returns void language sql security definer as $$
  update public.care_actions
     set created_at = created_at - (p_days * interval '1 day')
   where child_id = p_child;
$$;

create or replace function pg_temp.set_streak(
  p_pair uuid, p_last date, p_current int, p_longest int
) returns void language sql security definer as $$
  update public.streaks
     set last_completed_date = p_last,
         current_streak = p_current,
         longest_streak = p_longest
   where pair_id = p_pair;
$$;

set local role authenticated;

do $$
declare
  v_code   text;
  v_pair   uuid;
  v_child  uuid;
  v_streak public.streaks;
begin
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000061');
  v_code := public.create_pair();

  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000062');
  v_pair := public.join_pair(v_code);

  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000061');
  insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
  values (v_pair, 'Mico', 'male', 'Siyah', 'Ela', 'Acik')
  returning id into v_child;

  -- --- tek kişi baktı: gün TAMAM DEĞİL ---
  perform public.apply_care_action(v_child, 'feed');

  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 0 or v_streak.last_completed_date is not null then
    raise exception 'Tek kisi bakinca seri isledi: % / %',
      v_streak.current_streak, v_streak.last_completed_date;
  end if;

  -- Aynı kişi tekrar baksa da fark etmez
  perform public.apply_care_action(v_child, 'play');
  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 0 then
    raise exception 'Ayni kisinin iki aksiyonu gunu tamamladi';
  end if;

  -- --- partner de baktı: gün tamam, seri 1 ---
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000062');
  perform public.apply_care_action(v_child, 'clean');

  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 1 or v_streak.longest_streak <> 1
     or v_streak.last_completed_date <> current_date then
    raise exception 'Ikisi de bakinca seri 1 olmadi: % / % / %',
      v_streak.current_streak, v_streak.longest_streak, v_streak.last_completed_date;
  end if;

  -- Aynı gün fazladan aksiyon seriyi ikinci kez artırmamalı
  perform public.apply_care_action(v_child, 'sleep');
  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 1 then
    raise exception 'Ayni gun seri iki kez artti: %', v_streak.current_streak;
  end if;

  -- --- dün tamamlanmış gibi yap → bugün tamamlanınca seri 2 ---
  perform pg_temp.set_streak(v_pair, current_date - 1, 1, 1);
  perform pg_temp.rewind_actions(v_child, 1);

  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000061');
  perform public.apply_care_action(v_child, 'feed');
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000062');
  perform public.apply_care_action(v_child, 'play');

  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 2 or v_streak.longest_streak <> 2 then
    raise exception 'Ardisik gun serisi 2 olmadi: % / %',
      v_streak.current_streak, v_streak.longest_streak;
  end if;

  -- --- seri kopması: son tamamlanan gün 3 gün önce, en uzun korunur ---
  perform pg_temp.set_streak(v_pair, current_date - 3, 2, 7);
  perform pg_temp.rewind_actions(v_child, 3);

  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000061');
  perform public.apply_care_action(v_child, 'feed');
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000062');
  perform public.apply_care_action(v_child, 'clean');

  select * into v_streak from public.streaks where pair_id = v_pair;
  if v_streak.current_streak <> 1 then
    raise exception 'Kopan seri 1''e donmedi: %', v_streak.current_streak;
  end if;
  if v_streak.longest_streak <> 7 then
    raise exception 'En uzun seri bozuldu: %', v_streak.longest_streak;
  end if;
end $$;

reset role;
rollback;
