-- =============================================================
-- DuoBaby — Realtime yayını (G1-11)
-- Karşı tarafın yaptığı işlem anında görünsün.
-- =============================================================
--
-- Postgres Changes RLS'e saygı duyar: abone olan kullanıcı satırı
-- `select` policy'siyle göremiyorsa olay ona hiç ulaşmaz. Yani pair
-- dışına veri sızmaz, ekstra bir filtre kurmaya gerek yok.
--
-- Yayına yalnızca canlı izlenen tablolar giriyor:
--   children     → bakım barları, evre değişimi
--   moods        → partnerin günlük modu
--   care_actions → "Ayşe Miço'yu besledi" bildirimi (G1-10 kullanacak)
--   pairs        → kod ekranında partnerin katılmasını beklemek
-- users/streaks eklenmedi; ekranda anlık takip edilen veri değiller.

alter publication supabase_realtime add table public.children;
alter publication supabase_realtime add table public.moods;
alter publication supabase_realtime add table public.care_actions;
alter publication supabase_realtime add table public.pairs;
