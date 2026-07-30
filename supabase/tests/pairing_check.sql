-- Eşleştirme kontrolü (G1-5). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000011', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000013', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

set local role authenticated;

do $$
declare
  v_code   text;
  v_code2  text;
  v_pair   uuid;
begin
  -- --- A kod oluşturuyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000011');
  v_code := public.create_pair();

  if v_code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
    raise exception 'Kod formati yanlis: %', v_code;
  end if;

  -- Tekrar çağırınca yeni pair açmamalı, aynı kodu vermeli
  v_code2 := public.create_pair();
  if v_code2 <> v_code then
    raise exception 'Ikinci create_pair yeni pair acti: % / %', v_code, v_code2;
  end if;

  -- Kendi koduyla eşleşememeli
  begin
    perform public.join_pair(v_code);
    raise exception 'Kullanici KENDI koduyla eslesebildi';
  exception when raise_exception then
    if sqlerrm <> 'Kendi kodunla eslesemezsin.' then raise; end if;
  end;

  -- --- B kodu giriyor (küçük harf + boşlukla, normalize edilmeli) ---
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000012');
  v_pair := public.join_pair('  ' || lower(v_code) || ' ');

  if (select user2_id from public.pairs where id = v_pair)
     <> 'bbbbbbbb-0000-4000-8000-000000000012' then
    raise exception 'user2_id dolmadi';
  end if;

  if not exists (select 1 from public.streaks where pair_id = v_pair) then
    raise exception 'streak satiri acilmadi';
  end if;

  -- B artık eşli: ikinci kez katılamamalı
  begin
    perform public.join_pair(v_code);
    raise exception 'Esli kullanici tekrar eslesebildi';
  exception when raise_exception then
    if sqlerrm <> 'Zaten bir esin var.' then raise; end if;
  end;

  -- --- C kullanılmış kodu deniyor ---
  perform pg_temp.login('cccccccc-0000-4000-8000-000000000013');
  begin
    perform public.join_pair(v_code);
    raise exception 'KULLANILMIS kod tekrar kabul edildi';
  exception when raise_exception then
    if sqlerrm <> 'Bu kod zaten kullanilmis.' then raise; end if;
  end;

  -- Olmayan kod
  begin
    perform public.join_pair('ZZZZZZ');
    raise exception 'Olmayan kod kabul edildi';
  exception when raise_exception then
    if sqlerrm <> 'Kod bulunamadi.' then raise; end if;
  end;
end $$;

reset role;
rollback;
