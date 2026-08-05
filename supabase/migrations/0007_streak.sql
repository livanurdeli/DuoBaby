-- =============================================================
-- DuoBaby — Ortak streak (G1-9)
-- Kural: bir gün "tamamlandı" sayılır ancak İKİSİ DE o gün en az bir
-- bakım aksiyonu yaptıysa (roadmap: "ikisi de aynı gün ilgilenirse").
-- =============================================================
--
-- security definer: `streaks` tablosunda insert/update policy'si YOK
-- (0002), yani client seriyi elle şişiremiyor. Yazma yetkisi sadece bu
-- fonksiyonda ve fonksiyon değerleri uydurmuyor, `care_actions`'tan
-- sayıyor — çağıran biri olsa bile gerçek olmayan bir seri üretemez.
--
-- Yine de pair üyeliği kontrol ediliyor: yabancı birinin başkasının
-- streak satırına dokunması (aynı değerle bile) gereksiz.

create or replace function public.update_streak(p_pair_id uuid)
returns public.streaks
language plpgsql
security definer set search_path = public
as $$
declare
  v_streak public.streaks;
  v_actors int;
  v_next   int;
begin
  if not public.is_pair_member(p_pair_id) then
    raise exception 'Bu cift senin degil.';
  end if;

  select * into v_streak from public.streaks where pair_id = p_pair_id;
  if not found then
    insert into public.streaks (pair_id) values (p_pair_id)
    returning * into v_streak;
  end if;

  -- Bugün zaten sayıldıysa tekrar sayma (her aksiyonda çağrılıyor).
  if v_streak.last_completed_date = current_date then
    return v_streak;
  end if;

  -- Bugün kaç FARKLI kişi bakım yaptı? İkisi de yapmadıysa gün tamam değil.
  select count(distinct ca.user_id)
  into v_actors
  from public.care_actions ca
  join public.children c on c.id = ca.child_id
  where c.pair_id = p_pair_id
    and ca.created_at >= current_date
    and ca.created_at < current_date + 1;

  if v_actors < 2 then
    return v_streak;
  end if;

  -- Dün de tamamlandıysa seri devam, değilse baştan başlar.
  v_next := case
    when v_streak.last_completed_date = current_date - 1 then v_streak.current_streak + 1
    else 1
  end;

  update public.streaks set
    current_streak      = v_next,
    longest_streak      = greatest(longest_streak, v_next),
    last_completed_date = current_date
  where pair_id = p_pair_id
  returning * into v_streak;

  return v_streak;
end;
$$;

-- ---------- apply_care_action: aksiyon sonrası streak'i tazele ----------
-- 0004'teki sürümün üstüne yazıyor; tek eklenen satır update_streak çağrısı.
create or replace function public.apply_care_action(
  p_child_id uuid,
  p_action   public.care_action_type
)
returns public.children
language plpgsql
set search_path = public
as $$
declare
  v_child public.children;
  d_hunger      int := 0;
  d_cleanliness int := 0;
  d_energy      int := 0;
  d_happiness   int := 0;
begin
  if auth.uid() is null then
    raise exception 'Oturum yok.';
  end if;

  v_child := public.sync_child(p_child_id);

  if v_child.status <> 'active' then
    raise exception 'Bu cocuk artik evde yasamiyor.';
  end if;

  -- lib/api/care.ts içindeki ACTION_EFFECTS ile aynı değerler. Client
  -- oradaki kopyayı yalnızca optimistic update için kullanıyor; geçerli
  -- sonuç her zaman burada hesaplanan ve geri dönen satır.
  case p_action
    when 'feed'  then d_hunger := 30; d_energy := -5;
    when 'clean' then d_cleanliness := 35;
    when 'sleep' then d_energy := 40; d_happiness := 5; d_hunger := -5;
    when 'play'  then d_happiness := 30; d_energy := -15; d_cleanliness := -5;
  end case;

  update public.children set
    hunger      = least(100, greatest(0, hunger      + d_hunger)),
    cleanliness = least(100, greatest(0, cleanliness + d_cleanliness)),
    energy      = least(100, greatest(0, energy      + d_energy)),
    happiness   = least(100, greatest(0, happiness   + d_happiness))
  where id = p_child_id
  returning * into v_child;

  insert into public.care_actions (child_id, user_id, action_type)
  values (p_child_id, auth.uid(), p_action);

  perform public.update_streak(v_child.pair_id);

  return v_child;
end;
$$;
