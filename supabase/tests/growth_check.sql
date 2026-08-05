-- Büyüme / evre kontrolü (G1-8). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.
--
-- Zaman ileri sarma: `birth_date`'i geriye çekiyoruz. Oran 1 gerçek gün =
-- 1 oyun yılı olduğu için 13 gün geriye çekmek çocuğu 13 yaşına getirir.
-- Test modunda uygulamada da aynısı yapılır, ayrı bir debug RPC'si yok.

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000051', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000052', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

create or replace function pg_temp.age_to(p_child uuid, p_years int) returns void
language sql as $$
  update public.children
     set birth_date = now() - (p_years * interval '1 day')
   where id = p_child;
$$;

set local role authenticated;

do $$
declare
  v_code  text;
  v_pair  uuid;
  v_child uuid;
  v_row   public.children;
begin
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000051');
  v_code := public.create_pair();

  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000052');
  v_pair := public.join_pair(v_code);

  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000051');
  insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
  values (v_pair, 'Mico', 'female', 'Sari', 'Mavi', 'Acik')
  returning id into v_child;

  -- --- eşik tablosu: 0-3 bebek, 3-12 çocuk, 12-18 ergen, 18+ yetişkin ---
  if public.life_stage_for_age(0)  <> 'baby'  then raise exception '0 yas baby degil';  end if;
  if public.life_stage_for_age(2)  <> 'baby'  then raise exception '2 yas baby degil';  end if;
  if public.life_stage_for_age(3)  <> 'child' then raise exception '3 yas child degil'; end if;
  if public.life_stage_for_age(11) <> 'child' then raise exception '11 yas child degil';end if;
  if public.life_stage_for_age(12) <> 'teen'  then raise exception '12 yas teen degil';  end if;
  if public.life_stage_for_age(17) <> 'teen'  then raise exception '17 yas teen degil';  end if;
  if public.life_stage_for_age(18) <> 'adult' then raise exception '18 yas adult degil'; end if;

  -- --- yeni çocuk bebek ---
  v_row := public.sync_child(v_child);
  if v_row.life_stage <> 'baby' then
    raise exception 'Yeni cocuk baby degil: %', v_row.life_stage;
  end if;

  -- --- 5 gün = 5 oyun yılı → çocuk ---
  perform pg_temp.age_to(v_child, 5);
  v_row := public.sync_child(v_child);
  if v_row.life_stage <> 'child' then
    raise exception '5 yasinda child degil: %', v_row.life_stage;
  end if;

  -- Evre geçişi bar decay'inden BAĞIMSIZ işlemeli: `last_decay_at`
  -- taze olsa bile (yani 1 saat dolmamışken) evre güncellenmeli.
  perform pg_temp.age_to(v_child, 13);
  update public.children set last_decay_at = now() where id = v_child;
  v_row := public.sync_child(v_child);
  if v_row.life_stage <> 'teen' then
    raise exception 'Decay tick yokken evre guncellenmedi: %', v_row.life_stage;
  end if;

  -- --- 18 yaş: evden ayrılır ---
  perform pg_temp.age_to(v_child, 18);
  v_row := public.sync_child(v_child);
  if v_row.life_stage <> 'adult' or v_row.status <> 'left_home' then
    raise exception '18 yasinda evden ayrilmadi: % / %', v_row.life_stage, v_row.status;
  end if;

  -- Ayrılan çocuğa bakım yapılamaz
  begin
    perform public.apply_care_action(v_child, 'feed');
    raise exception 'Evden ayrilmis cocuga aksiyon uygulandi';
  exception when raise_exception then
    if sqlerrm <> 'Bu cocuk artik evde yasamiyor.' then raise; end if;
  end;

  -- Ayrılan çocuk aktif sayılmadığı için yerine yenisi gelebilir
  insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
  values (v_pair, 'Yeni', 'male', 'Siyah', 'Ela', 'Esmer');
end $$;

reset role;
rollback;
