/**
 * Takvim grid'i (G2-9).
 * ------------------------------------------------------------------
 * Ekrandan ayrı duruyor çünkü tek zor kısım burası: ayın 1'inin haftanın
 * kaçıncı gününe denk geldiği, artık yıl, 30/31 gün. Saf fonksiyon
 * olduğu için de test edilebiliyor: `lib/calendar.check.ts`.
 */

/** Ayın grid hücreleri: baştaki boşluklar `null`, sonra günler sırayla. */
export function buildMonthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  // getDay() pazar = 0 döner; takvim pazartesi başladığı için kaydırılıyor.
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const cells: (Date | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}
