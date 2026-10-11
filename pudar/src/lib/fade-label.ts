import type { FadeState } from './fading';

export type FadeTone = 'rose' | 'peach' | 'neutral';

/** The status label shown on timeline cards and entry detail (PRD D10: always as text). */
export function fadeLabel(state: FadeState): { text: string; tone: FadeTone } {
  switch (state.status) {
    case 'active':
      return { text: 'Baru', tone: 'rose' };
    case 'fading':
      return { text: `Pudar dalam ${state.daysLeft} hari`, tone: 'peach' };
    case 'near_expiry':
      return {
        text: state.daysLeft === 1 ? 'Hampir pudar · besok' : `Hampir pudar · ${state.daysLeft} hari lagi`,
        tone: 'peach',
      };
    case 'faded':
      return { text: 'Sudah pudar', tone: 'neutral' };
  }
}
