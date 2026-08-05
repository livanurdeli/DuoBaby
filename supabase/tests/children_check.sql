-- Çocuk oluşturma kontrolü (G1-6). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.
--
-- G1-6 ayrı bir RPC eklemiyor; client doğrudan `children`'a insert atıyor.
-- Bu test o insert'i koruyan iki güvenceyi doğruluyor:
--   1. children_insert policy'si (yabancı pair'e çocuk yazılamaz),
--   2. trg_children_active_limit trigger'ı (3 aktif çocuk sınırı).

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000021', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000022', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000023', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

create or replace function pg_temp.add_child(p_pair uuid, p_name text) returns uuid
language sql as $$
  insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
  values (p_pair, p_name, 'female', 'Siyah', 'Ela', 'Bugday')
  returning id;
$$;

set local role authenticated;

do $$
declare
  v_code  text;
  v_pair  uuid;
  v_child uuid;
begin
  -- --- A ve B eşleşiyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000021');
  v_code := public.create_pair();

  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000022');
  v_pair := public.join_pair(v_code);

  -- --- A çocuk oluşturuyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000021');
  v_child := pg_temp.add_child(v_pair, 'Mico');

  if (select life_stage from public.children where id = v_child) <> 'baby' then
    raise exception 'Yeni cocuk baby evresinde baslamadi';
  end if;

  if (select hunger from public.children where id = v_child) <> 100 then
    raise exception 'Baslangic barlari 100 degil';
  end if;

  -- Partner de aynı çocuğu görebilmeli (client getActiveChild() buna dayanıyor)
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000022');
  if not exists (
    select 1 from public.children where id = v_child and status = 'active'
  ) then
    raise exception 'Partner cocugu goremiyor';
  end if;

  -- --- C yabancı: bu pair'e çocuk yazamamalı ---
  perform pg_temp.login('cccccccc-0000-4000-8000-000000000023');
  begin
    perform pg_temp.add_child(v_pair, 'Sizinti');
    raise exception 'YABANCI kullanici baskasinin pair''ine cocuk yazdi';
  exception when insufficient_privilege then
    null; -- RLS engelledi, beklenen
  end;

  -- Yabancı çocuğu görememeli de
  if exists (select 1 from public.children where id = v_child) then
    raise exception 'Yabanci kullanici cocugu gorebiliyor';
  end if;

  -- --- 3 aktif çocuk sınırı ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000021');
  perform pg_temp.add_child(v_pair, 'Ikinci');
  perform pg_temp.add_child(v_pair, 'Ucuncu');

  begin
    perform pg_temp.add_child(v_pair, 'Dorduncu');
    raise exception '4. AKTIF cocuk olusturulabildi';
  exception when raise_exception then
    if sqlerrm <> 'Bir cift ayni anda en fazla 3 aktif cocuga bakabilir' then raise; end if;
  end;

  -- Biri evden ayrılınca yeni çocuğa yer açılmalı
  update public.children set status = 'left_home' where id = v_child;
  perform pg_temp.add_child(v_pair, 'Dorduncu');
end $$;

reset role;
rollback;
