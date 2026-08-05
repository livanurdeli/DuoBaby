-- =============================================================
-- DuoBaby — Bakım logic'i (G1-7)
-- Client bu iki fonksiyonu rpc() ile çağırır, barlara elle yazmaz.
-- =============================================================
--
-- Neden RPC? Barları client hesaplarsa herkes kendi açlığını 100 yapar.
-- Aksiyon etkisi ve decay oranı sunucuda tek yerde duruyor.
--
-- Her iki fonksiyon da security INVOKER (default): children_update ve
-- care_actions_insert_own policy'leri devrede kalıyor, yani kullanıcı
-- yalnızca kendi pair'inin çocuğuna dokunabiliyor.

-- ---------- decay oranları (saat başına puan) ----------
-- Açlık en hızlı düşer (~25 saatte sıfır), mutluluk en yavaş.
-- Değerler burada sabit; dengeleme gerekirse tek yerden ayarlanır.

create or replace function public.sync_child(p_child_id uuid)
returns public.children
language plpgsql
set search_path = public
as $$
declare
  v_child public.children;
  v_ticks int;
begin
  select * into v_child from public.children where id = p_child_id;
  if not found then
    raise exception 'Cocuk bulunamadi.';
  end if;

  -- Sadece TAM saatler işlenir ve `last_decay_at` yalnızca işlenen kadar
  -- ilerletilir. Aksi halde uygulama dakikada bir açıldığında her seferinde
  -- round(0.02 * 4) = 0 puan düşer ama zaman damgası sıfırlanırdı — barlar
  -- hiç inmezdi.
  v_ticks := floor(extract(epoch from (now() - v_child.last_decay_at)) / 3600.0);

  if v_ticks < 1 then
    return v_child;
  end if;

  update public.children set
    hunger        = greatest(0, hunger      - v_ticks * 4),
    cleanliness   = greatest(0, cleanliness - v_ticks * 3),
    energy        = greatest(0, energy      - v_ticks * 3),
    happiness     = greatest(0, happiness   - v_ticks * 2),
    last_decay_at = last_decay_at + (v_ticks * interval '1 hour')
  where id = p_child_id
  returning * into v_child;

  return v_child;
end;
$$;

-- ---------- apply_care_action ----------
-- Önce decay'i işler (yoksa kullanıcı barları önce doldurup sonra
-- geçmiş saatlerin düşüşünü yiyor gibi tuhaf sonuçlar çıkardı),
-- sonra aksiyon etkisini uygular ve care_actions'a log atar.
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

  return v_child;
end;
$$;
