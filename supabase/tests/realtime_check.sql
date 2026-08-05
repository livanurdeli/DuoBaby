-- Realtime yayını kontrolü (G1-11). SQL Editor'de olduğu gibi çalıştır.
-- Değişiklik yapmaz, sadece doğrular.
--
-- Client'ın dinlediği tablolar `supabase_realtime` publication'ında değilse
-- abonelik sessizce hiç olay almaz — hata da vermez. Bu yüzden kontrol
-- ediliyor: en sinsi hata türü.

do $$
declare
  v_missing text;
begin
  select string_agg(t, ', ')
  into v_missing
  from unnest(array['children', 'moods', 'care_actions', 'pairs']) as t
  where not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = t
  );

  if v_missing is not null then
    raise exception 'Realtime yayininda olmayan tablolar: %', v_missing;
  end if;

  raise notice 'Realtime yayini tamam: children, moods, care_actions, pairs';
end $$;
