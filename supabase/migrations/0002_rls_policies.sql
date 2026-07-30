-- =============================================================
-- DuoBaby — RLS Policy'leri (G1-3)
-- Kural: her satıra sadece o satırın pair'ine ait 2 kullanıcı erişir.
-- =============================================================

-- ---------- yardımcı fonksiyonlar ----------
-- security definer: policy içinden pairs/children okurken o tabloların
-- RLS'ine takılmamak (ve sonsuz döngüye girmemek) için şart.

create or replace function public.is_pair_member(p_pair_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.pairs
    where id = p_pair_id
      and auth.uid() in (user1_id, user2_id)
  );
$$;

create or replace function public.is_child_caretaker(p_child_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.children c
    join public.pairs p on p.id = c.pair_id
    where c.id = p_child_id
      and auth.uid() in (p.user1_id, p.user2_id)
  );
$$;

create or replace function public.is_partner(p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.pairs
    where auth.uid() in (user1_id, user2_id)
      and p_user_id in (user1_id, user2_id)
  );
$$;

-- ---------- users ----------
-- Kendi profilini ve partnerinin profilini görür (isim/avatar UI'da gerekli).
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_partner(id));

create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- insert yok: satırı on_auth_user_created trigger'ı (security definer) açıyor.

-- ---------- pairs ----------
create policy pairs_select on public.pairs
  for select to authenticated
  using (auth.uid() in (user1_id, user2_id));

-- Sadece kendini user1 yaparak boş bir pair açabilir.
create policy pairs_insert on public.pairs
  for insert to authenticated
  with check (user1_id = auth.uid() and user2_id is null);

-- update/delete yok: koda göre eşleşme (user2_id yazma) G1-5'te
-- security definer RPC ile yapılacak — yoksa client başkasının pair'ine
-- kendini yazabilir ya da partneri düşürebilir.

-- ---------- children ----------
create policy children_select on public.children
  for select to authenticated
  using (public.is_pair_member(pair_id));

create policy children_insert on public.children
  for insert to authenticated
  with check (public.is_pair_member(pair_id));

-- Bakım aksiyonları stat'ları güncelliyor; pair_id değiştirilemez.
create policy children_update on public.children
  for update to authenticated
  using (public.is_pair_member(pair_id))
  with check (public.is_pair_member(pair_id));

-- delete yok: çocuk silinmez, status = 'left_home' olur.

-- ---------- moods ----------
create policy moods_select on public.moods
  for select to authenticated
  using (public.is_pair_member(pair_id));

create policy moods_insert_own on public.moods
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_pair_member(pair_id));

-- Aynı gün modunu düzeltebilir; başkasının modunu değiştiremez.
create policy moods_update_own on public.moods
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy moods_delete_own on public.moods
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------- care_actions ----------
create policy care_actions_select on public.care_actions
  for select to authenticated
  using (public.is_child_caretaker(child_id));

create policy care_actions_insert_own on public.care_actions
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_child_caretaker(child_id));

-- update/delete yok: log kaydı, değişmez.

-- ---------- streaks ----------
create policy streaks_select on public.streaks
  for select to authenticated
  using (public.is_pair_member(pair_id));

-- insert/update yok: streak'i sunucu (G1-9) service_role ile yazar,
-- yoksa client kendi streak'ini şişirir.
