-- =============================================================
-- DuoBaby — Kod sistemi + eşleştirme (G1-5)
-- Client bu iki fonksiyonu rpc() ile çağırır, pairs'e elle yazmaz.
-- =============================================================

-- Karışabilecek karakterler (0/O, 1/I) charset'te yok — frontend ile aynı.
create or replace function public.gen_pair_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
           1 + floor(random() * 32)::int, 1),
    '')
  from generate_series(1, 6);
$$;

-- ---------- create_pair: kod oluşturan taraf ----------
-- security invoker (default): insert'i pairs_insert policy'si denetler,
-- yani kullanıcı kendini user1 yapmaktan başka bir şey yapamaz.
create or replace function public.create_pair()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Oturum yok.';
  end if;

  -- Zaten bir pair'i varsa yenisini açma, mevcut kodu döndür.
  select pair_code into v_code
  from public.pairs
  where user1_id = auth.uid() and user2_id is null
  limit 1;

  if v_code is not null then
    return v_code;
  end if;

  if exists (select 1 from public.pairs
             where auth.uid() in (user1_id, user2_id) and user2_id is not null) then
    raise exception 'Zaten bir esin var.';
  end if;

  -- Kod çakışırsa unique index yakalar, yeniden dene.
  for i in 1..10 loop
    begin
      insert into public.pairs (user1_id, pair_code)
      values (auth.uid(), public.gen_pair_code())
      returning pair_code into v_code;
      return v_code;
    exception when unique_violation then
      null;
    end;
  end loop;

  raise exception 'Kod uretilemedi, tekrar dene.';
end;
$$;

-- ---------- join_pair: kodu giren taraf ----------
-- security definer şart: başkasının pair satırı RLS ile görünmez.
-- Hata mesajları kullanıcıya gösterilmek üzere yazıldı.
create or replace function public.join_pair(p_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_pair public.pairs;
begin
  if auth.uid() is null then
    raise exception 'Oturum yok.';
  end if;

  if exists (select 1 from public.pairs
             where auth.uid() in (user1_id, user2_id) and user2_id is not null) then
    raise exception 'Zaten bir esin var.';
  end if;

  select * into v_pair from public.pairs
  where pair_code = upper(trim(p_code))
  for update;

  if v_pair.id is null then
    raise exception 'Kod bulunamadi.';
  end if;
  if v_pair.user1_id = auth.uid() then
    raise exception 'Kendi kodunla eslesemezsin.';
  end if;
  if v_pair.user2_id is not null then
    raise exception 'Bu kod zaten kullanilmis.';
  end if;

  update public.pairs set user2_id = auth.uid() where id = v_pair.id;

  -- Eşleşme tamamlandı: streak satırı burada açılır (G1-9 bunu bekliyor).
  insert into public.streaks (pair_id) values (v_pair.id)
  on conflict (pair_id) do nothing;

  -- Kod artık işe yaramaz ama kayıtta kalıyor; tekrar kullanımı
  -- yukarıdaki user2_id kontrolü engelliyor.
  return v_pair.id;
end;
$$;

-- Definer fonksiyona sadece giriş yapmış kullanıcı erişsin.
revoke execute on function public.join_pair(text) from public, anon;
grant execute on function public.join_pair(text) to authenticated;
grant execute on function public.create_pair() to authenticated;
