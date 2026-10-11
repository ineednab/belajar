import { diffCalendarDays, type LocalDate } from './date';

/**
 * Gentle opening questions for the journal editor (PRD §6 Journal editor). nabila's principles:
 * gentle, not probing; present-focused; no pressure to improve; room for lightness; always
 * optional. They never name the person or ask for a score.
 *
 * Three tones take turns, so opening Pudar doesn't always mean facing something heavy.
 */
export const PROMPTS_BY_TONE = {
  /** Ringan: noticing small things. */
  light: [
    'Hal kecil apa yang membuatmu bertahan hari ini?',
    'Kalau perasaanmu sekarang punya warna, warnanya apa?',
    'Kapan hari ini kamu merasa sedikit lebih ringan?',
    'Apa yang sudah kamu lakukan untuk dirimu hari ini, sekecil apa pun?',
    'Apa yang sedang kamu syukuri, walau hanya sedikit?',
    'Kapan terakhir kali kamu tertawa?',
    'Kalau hari ini berjalan tanpa tuntutan, apa yang ingin kamu nikmati?',
    'Apa yang ingin kamu lakukan sesuai keinginanmu sendiri?',
    'Hal apa yang kamu sukai dari dirimu?',
    'Kalau bisa beristirahat sejenak, apa yang ingin kamu nikmati?',
    'Hal kecil apa yang membuatmu bangga pada dirimu sendiri?',
    'Apa yang ingin kamu lakukan hanya karena kamu menikmatinya?',
    'Hal sederhana apa yang membuatmu merasa seperti di rumah?',
  ],
  /** Reflektif: understanding yourself. */
  reflect: [
    'Apa yang ingin kamu katakan, tapi tidak bisa?',
    'Apa yang paling terasa berat hari ini?',
    'Apa yang kamu rindukan, dan apa yang tidak?',
    'Apa yang ingin kamu maafkan dari dirimu sendiri?',
    'Apa yang sedang kamu pelajari tentang dirimu?',
    'Kalau sahabatmu ada di posisimu, apa yang akan kamu katakan padanya?',
    'Kenangan apa yang hari ini muncul tiba-tiba?',
    'Pikiran apa yang terus berputar di kepalamu?',
    'Apa yang ingin kamu lepaskan minggu ini?',
    'Bagian mana dari hidupmu yang tetap milikmu?',
    'Apa yang membuatmu marah, dan apa yang ada di baliknya?',
    'Apa yang kamu harapkan akan kamu rasakan sebulan lagi?',
    'Kalimat apa yang ingin kamu dengar dari seseorang hari ini?',
    'Apa yang dulu kamu korbankan, dan ingin kamu ambil kembali?',
    'Apa yang ingin kamu katakan pada dirimu yang dulu?',
    'Perasaan apa yang paling sulit kamu akui?',
    'Di mana kamu merasakan sedihmu di tubuhmu?',
    'Apa yang kamu pelajari dari hubungan itu?',
    'Apa yang ingin kamu mulai lagi, untuk dirimu sendiri?',
    'Apa yang sedang memenuhi pikiranmu hari ini?',
    'Apa yang ingin kamu ceritakan, jika kamu sedang ingin bercerita?',
    'Hal apa yang membuatmu merasa dimengerti?',
    'Apa hal baru yang kamu sadari belakangan ini?',
    'Perubahan kecil apa yang ingin kamu coba, jika kamu sudah siap?',
    'Hal apa dari dirimu yang ingin kamu apresiasi?',
    'Apa yang membantumu merasa terhubung dengan orang lain?',
    'Apa yang ingin kamu ungkapkan, jika kamu merasa nyaman melakukannya?',
    'Kebiasaan kecil apa yang ingin kamu ubah dengan perlahan?',
    'Apa yang ingin kamu pahami lebih baik tentang dirimu sendiri?',
    'Apa yang bisa membuatmu lebih nyaman meminta bantuan saat membutuhkannya?',
  ],
  /** Menenangkan: giving yourself room. */
  comfort: [
    'Apa yang kamu butuhkan malam ini?',
    'Siapa atau apa yang membuatmu merasa aman?',
    'Apa yang akan kamu lakukan besok untuk dirimu?',
    'Kapan kamu merasa nyaman menjadi dirimu sendiri?',
    'Apa yang bisa membuat harimu terasa sedikit lebih ringan?',
    'Perasaan apa yang ingin kamu beri ruang hari ini?',
    'Apa yang ingin kamu ingatkan kepada dirimu sendiri?',
    'Kalimat sederhana apa yang ingin kamu dengar hari ini?',
    'Apa yang membuatmu merasa nyaman dengan dirimu sendiri?',
    'Apa yang kamu butuhkan lebih banyak hari ini: istirahat, ruang, atau teman?',
    'Apa hal sederhana yang bisa kamu berikan kepada dirimu hari ini?',
    'Kapan kamu merasa cukup menjadi dirimu sendiri?',
    'Apa yang bisa kamu terima tentang dirimu hari ini?',
    'Apa yang ingin kamu jalani dengan lebih santai?',
    'Apa yang bisa kamu izinkan berjalan sesuai waktunya sendiri?',
    'Hal apa yang ingin kamu jaga agar tetap menjadi bagian dari hidupmu?',
    'Kalau bisa memberi dirimu sendiri satu hal malam ini, apa yang akan kamu pilih?',
  ],
} as const;

export type PromptTone = keyof typeof PROMPTS_BY_TONE;

/**
 * Every prompt in rotation order. Each tone is spread evenly across the cycle (item i of a tone
 * with n items sits at (i + 0.5) / n), so the tones take turns instead of coming in runs.
 */
export const WRITING_PROMPTS: readonly { text: string; tone: PromptTone }[] = (
  Object.entries(PROMPTS_BY_TONE) as [PromptTone, readonly string[]][]
)
  .flatMap(([tone, list], order) =>
    list.map((text, i) => ({ text, tone, position: (i + 0.5) / list.length, order })),
  )
  .sort((a, b) => a.position - b.position || a.order - b.order)
  .map(({ text, tone }) => ({ text, tone }));

/** The prompt for a day, stepping `offset` places on when the person asks for another one. */
export function promptFor(date: LocalDate, offset = 0): string {
  const n = WRITING_PROMPTS.length;
  const index = (((diffCalendarDays('2026-01-01', date) + offset) % n) + n) % n;
  return WRITING_PROMPTS[index].text;
}
