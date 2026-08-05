-- Bakım logic'i kontrolü (G1-7). SQL Editor'de olduğu gibi çalıştır.
-- Sonunda rollback var: hiçbir kayıt kalmaz. Hata vermezse akış doğru.

begin;

insert into auth.users (id, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000041', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000042', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000043', 'authenticated', 'authenticated');

create or replace function pg_temp.login(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
end $$;

set local role authenticated;

do $$
declare
  v_code  text;
  v_pair  uuid;
  v_child uuid;
  v_row   public.children;
begin
  -- --- A ve B eşleşiyor, A çocuk oluşturuyor ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000041');
  v_code := public.create_pair();

  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000042');
  v_pair := public.join_pair(v_code);

  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000041');
  insert into public.children (pair_id, name, gender, hair_color, eye_color, skin_tone)
  values (v_pair, 'Mico', 'male', 'Siyah', 'Ela', 'Acik')
  returning id into v_child;

  -- --- decay: 1 saatten kısa sürede hiçbir şey düşmemeli ---
  v_row := public.sync_child(v_child);
  if v_row.hunger <> 100 then
    raise exception '1 saat dolmadan bar dustu: %', v_row.hunger;
  end if;

  -- --- 10 saat geri sar: hunger -40, cleanliness -30, energy -30, happiness -20
  update public.children
    set last_decay_at = now() - interval '10 hours'
  where id = v_child;

  v_row := public.sync_child(v_child);
  if v_row.hunger <> 60 or v_row.cleanliness <> 70
     or v_row.energy <> 70 or v_row.happiness <> 80 then
    raise exception 'Decay yanlis: % % % %',
      v_row.hunger, v_row.cleanliness, v_row.energy, v_row.happiness;
  end if;

  -- Hemen tekrar çağırmak bir şey değiştirmemeli (last_decay_at ilerledi)
  v_row := public.sync_child(v_child);
  if v_row.hunger <> 60 then
    raise exception 'Tekrar sync ikinci kez decay uyguladi: %', v_row.hunger;
  end if;

  -- --- kısa aralıklarla sync barları dondurmamalı ---
  -- Yalnızca TAM saatler işlendiği için 90 dakikada 1 saatlik düşüş olur,
  -- kalan 30 dakika `last_decay_at`'te birikir.
  update public.children
    set last_decay_at = now() - interval '90 minutes'
  where id = v_child;

  v_row := public.sync_child(v_child);
  if v_row.hunger <> 56 then
    raise exception '90 dakikada 1 saatlik decay islenmedi: %', v_row.hunger;
  end if;

  -- --- aksiyon: feed +30 hunger, -5 energy ---
  v_row := public.apply_care_action(v_child, 'feed');
  if v_row.hunger <> 86 or v_row.energy <> 62 then
    raise exception 'feed etkisi yanlis: % / %', v_row.hunger, v_row.energy;
  end if;

  if not exists (
    select 1 from public.care_actions
    where child_id = v_child
      and user_id = 'aaaaaaaa-0000-4000-8000-000000000041'
      and action_type = 'feed'
  ) then
    raise exception 'care_actions log kaydi olusmadi';
  end if;

  -- --- clamp: üst üste besleme 100'ü aşmamalı ---
  perform public.apply_care_action(v_child, 'feed');
  v_row := public.apply_care_action(v_child, 'feed');
  if v_row.hunger <> 100 then
    raise exception 'hunger 100 uzerine cikti: %', v_row.hunger;
  end if;

  -- --- partner de bakabilmeli ---
  perform pg_temp.login('bbbbbbbb-0000-4000-8000-000000000042');
  v_row := public.apply_care_action(v_child, 'clean');
  if v_row.cleanliness <> 100 then
    raise exception 'Partner temizleyemedi: %', v_row.cleanliness;
  end if;

  -- --- yabancı dokunamamalı ---
  perform pg_temp.login('cccccccc-0000-4000-8000-000000000043');
  begin
    perform public.apply_care_action(v_child, 'feed');
    raise exception 'YABANCI kullanici baskasinin cocuguna baktir';
  exception when raise_exception then
    if sqlerrm <> 'Cocuk bulunamadi.' then raise; end if;
  end;

  -- --- evden ayrılmış çocuğa bakılamaz ---
  perform pg_temp.login('aaaaaaaa-0000-4000-8000-000000000041');
  update public.children set status = 'left_home' where id = v_child;
  begin
    perform public.apply_care_action(v_child, 'play');
    raise exception 'Evden ayrilmis cocuga aksiyon uygulandi';
  exception when raise_exception then
    if sqlerrm <> 'Bu cocuk artik evde yasamiyor.' then raise; end if;
  end;
end $$;

reset role;
rollback;
