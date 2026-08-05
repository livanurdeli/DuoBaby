-- =============================================================
-- DuoBaby — Büyüme / evre logic'i (G1-8)
-- Yaş `birth_date`'ten türetilir, ayrı bir age kolonu YOK.
-- =============================================================
--
-- Hızlandırılmış zaman: gerçek 18 yıl beklemek anlamsız (roadmap bölüm 8).
-- Oran: 1 GERÇEK GÜN = 1 OYUN YILI. Yani çocuk 18 günde evden ayrılır,
-- 3 günde bebeklikten çıkar. Dogfooding haftasında evre geçişini görmek
-- için yeterince hızlı, günde birkaç kez bakmayı anlamsız kılmayacak
-- kadar da yavaş.
--
-- Test sırasında zamanı ileri sarmak için ayrı bir debug RPC'si YOK:
-- SQL Editor'den `update children set birth_date = now() - interval '13 days'`
-- aynı işi görüyor ve production'da kapatılacak bir kapı bırakmıyor.

create or replace function public.game_age_years(p_birth_date timestamptz)
returns int
language sql
stable -- now() kullanıyor: immutable OLAMAZ, yoksa planlayıcı sonucu dondurur
as $$
  select greatest(0, floor(extract(epoch from (now() - p_birth_date)) / 86400.0)::int);
$$;

-- Roadmap MVP'si 3 evre + ayrılış: Bebek 0-3, Çocuk 3-12, Ergen 12-18.
create or replace function public.life_stage_for_age(p_age int)
returns public.life_stage
language sql
immutable
as $$
  select case
    when p_age < 3  then 'baby'
    when p_age < 12 then 'child'
    when p_age < 18 then 'teen'
    else 'adult'
  end::public.life_stage;
$$;

-- ---------- sync_child: decay + evre birlikte ----------
-- 0004'teki sürümün üstüne yazıyor. İkisi tek fonksiyonda çünkü ikisi de
-- "geçen zamanı işle" işi ve client zaten her açılışta bunu çağırıyor;
-- ayrı bir cron/Edge Function gerekmiyor.
create or replace function public.sync_child(p_child_id uuid)
returns public.children
language plpgsql
set search_path = public
as $$
declare
  v_child public.children;
  v_ticks int;
  v_stage public.life_stage;
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

  v_stage := public.life_stage_for_age(public.game_age_years(v_child.birth_date));

  if v_ticks < 1 and v_stage = v_child.life_stage then
    return v_child;
  end if;

  update public.children set
    hunger        = greatest(0, hunger      - v_ticks * 4),
    cleanliness   = greatest(0, cleanliness - v_ticks * 3),
    energy        = greatest(0, energy      - v_ticks * 3),
    happiness     = greatest(0, happiness   - v_ticks * 2),
    last_decay_at = last_decay_at + (v_ticks * interval '1 hour'),
    life_stage    = v_stage,
    -- 18 yaşında evden ayrılır; artık bakım aksiyonu kabul etmez ve
    -- yerine yeni çocuk evlat edinilebilir (3 aktif çocuk sınırı boşalır).
    status        = case when v_stage = 'adult' then 'left_home'::public.child_status
                         else status end
  where id = p_child_id
  returning * into v_child;

  return v_child;
end;
$$;
