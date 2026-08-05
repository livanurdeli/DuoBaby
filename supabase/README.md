# supabase/

- `migrations/` → SQL migration dosyaları (şema, RLS policy'leri, RPC'ler)
- `functions/` → Supabase Edge Functions
- `tests/` → SQL kontrol dosyaları

## Migration'lar

Sırayla, SQL Editor'e yapıştırıp çalıştır:

| Dosya | İçerik |
|---|---|
| `0001_initial_schema.sql` | Tablolar, enum'lar, trigger'lar |
| `0002_rls_policies.sql` | Pair bazlı RLS policy'leri |
| `0003_pairing.sql` | `create_pair`, `join_pair` |
| `0004_care.sql` | `sync_child` (decay), `apply_care_action` |
| `0005_realtime.sql` | Realtime yayını |
| `0006_growth.sql` | Evre türetme, `sync_child` güncellemesi |
| `0007_streak.sql` | `update_streak`, `apply_care_action` güncellemesi |

`0006` ve `0007` daha önceki fonksiyonların üstüne yazıyor (`create or replace`),
o yüzden sıra önemli.

## Testler

`tests/` altındaki her dosya kendi başına çalışır ve sonunda `rollback` yapar —
hiçbir kayıt bırakmaz. Hata vermiyorsa o adım doğru.

```
pairing_check.sql   rls_check.sql    children_check.sql
moods_check.sql     care_check.sql   growth_check.sql
streak_check.sql    realtime_check.sql
```

## Edge Functions

```
supabase functions deploy notify-partner
```

`notify-partner` partnere push bildirimi gönderir (G1-10). Ortam değişkenleri
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) Supabase tarafından otomatik
sağlanır, elle eklemeye gerek yok.
