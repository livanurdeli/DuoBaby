/**
 * `buildMonthCells` self-check'i (G2-9).
 * Çalıştır:  node --experimental-strip-types lib/calendar.check.ts
 *
 * Ayrı dosyada çünkü uygulama bundle'ına girmesine gerek yok.
 */

// @ts-expect-error — node --experimental-strip-types uzantı istiyor, tsc istemiyor
import { buildMonthCells } from './calendar.ts';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

const days = (cells: (Date | null)[]) => cells.filter(Boolean).length;
const leadingOf = (cells: (Date | null)[]) => cells.findIndex(Boolean);

// Ağustos 2026: 1'i cumartesi → 5 boş hücre, 31 gün
const aug = buildMonthCells(new Date(2026, 7, 1));
assert(leadingOf(aug) === 5, `Agustos 2026 basi kaymis: ${leadingOf(aug)}`);
assert(days(aug) === 31, `Agustos 31 gun degil: ${days(aug)}`);

// Şubat 2024 artık yıl → 29 gün, 1'i perşembe → 3 boş hücre
const feb2024 = buildMonthCells(new Date(2024, 1, 1));
assert(days(feb2024) === 29, `Artik yil subati 29 gun degil: ${days(feb2024)}`);
assert(leadingOf(feb2024) === 3, `Subat 2024 basi kaymis: ${leadingOf(feb2024)}`);

// Şubat 2025 artık yıl değil → 28 gün
assert(days(buildMonthCells(new Date(2025, 1, 1))) === 28, 'Subat 2025 28 gun degil');

// Pazartesi başlayan ay hiç boşluk bırakmamalı (Haziran 2026)
assert(leadingOf(buildMonthCells(new Date(2026, 5, 1))) === 0, 'Pazartesi ayinda bosluk var');

// Pazar başlayan ay 6 boşluk bırakmalı (Kasım 2026)
const nov = buildMonthCells(new Date(2026, 10, 1));
assert(leadingOf(nov) === 6, `Pazar baslayan ayda 6 bosluk yok: ${leadingOf(nov)}`);

console.log('calendar self-check OK');
