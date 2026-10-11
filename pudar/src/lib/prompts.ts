import { diffCalendarDays, type LocalDate } from './date';

/**
 * Gentle opening questions for the journal editor (PRD §6 Journal editor). They never name the
 * person, never judge, and never ask for a score. One is shown per day; "Pertanyaan lain" steps on.
 */
export const WRITING_PROMPTS: readonly string[] = [
  'Apa yang ingin kamu katakan, tapi tidak bisa?',
  'Apa yang paling terasa berat hari ini?',
  'Hal kecil apa yang membuatmu bertahan hari ini?',
  'Kalau perasaanmu sekarang punya warna, warnanya apa?',
  'Apa yang kamu rindukan, dan apa yang tidak?',
  'Apa yang ingin kamu maafkan dari dirimu sendiri?',
  'Kapan hari ini kamu merasa sedikit lebih ringan?',
  'Apa yang sedang kamu pelajari tentang dirimu?',
  'Kalau sahabatmu ada di posisimu, apa yang akan kamu katakan padanya?',
  'Kenangan apa yang hari ini muncul tiba-tiba?',
  'Apa yang kamu butuhkan malam ini?',
  'Apa yang sudah kamu lakukan untuk dirimu hari ini, sekecil apa pun?',
  'Pikiran apa yang terus berputar di kepalamu?',
  'Apa yang ingin kamu lepaskan minggu ini?',
  'Bagian mana dari hidupmu yang tetap milikmu?',
  'Apa yang membuatmu marah, dan apa yang ada di baliknya?',
  'Apa yang kamu harapkan akan kamu rasakan sebulan lagi?',
  'Siapa atau apa yang membuatmu merasa aman?',
  'Kalimat apa yang ingin kamu dengar dari seseorang hari ini?',
  'Apa yang dulu kamu korbankan, dan ingin kamu ambil kembali?',
  'Apa yang sedang kamu syukuri, walau hanya sedikit?',
  'Apa yang ingin kamu katakan pada dirimu yang dulu?',
  'Perasaan apa yang paling sulit kamu akui?',
  'Apa yang akan kamu lakukan besok untuk dirimu?',
  'Di mana kamu merasakan sedihmu di tubuhmu?',
  'Apa yang kamu pelajari dari hubungan itu?',
  'Kapan terakhir kali kamu tertawa?',
  'Apa yang ingin kamu mulai lagi, untuk dirimu sendiri?',
];

/** The prompt for a day, stepping `offset` places on when the person asks for another one. */
export function promptFor(date: LocalDate, offset = 0): string {
  const n = WRITING_PROMPTS.length;
  const index = (((diffCalendarDays('2026-01-01', date) + offset) % n) + n) % n;
  return WRITING_PROMPTS[index];
}
