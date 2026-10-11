import { contrastRatio } from '../contrast';
import { PROFILE_COLORS } from '../profile-style';
import { darkColors, lightColors, type ColorTokens } from '../tokens';

const TEXT_AA = 4.5;
const NON_TEXT_AA = 3;

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as [string, ColorTokens][])('Blush Peach contrast, %s palette (WCAG AA)', (_palette, colors) => {
  it.each([
    ['text on background', colors.text, colors.background],
    ['text on surface', colors.text, colors.surface],
    ['text on secondary', colors.text, colors.secondary],
    ['primaryInk on surface', colors.primaryInk, colors.surface],
    ['dangerInk on surface', colors.dangerInk, colors.surface],
    ['mutedInk on background', colors.mutedInk, colors.background],
    ['mutedInk on surface', colors.mutedInk, colors.surface],
    ['primaryInk on background', colors.primaryInk, colors.background],
    ['button label on primaryInk', colors.onPrimaryInk, colors.primaryInk],
    ['dangerInk on background', colors.dangerInk, colors.background],
    ['button label on dangerInk', colors.onPrimaryInk, colors.dangerInk],
    ['rose pill', colors.primaryInk, colors.roseBg],
    ['peach pill', colors.peachInk, colors.peachBg],
    ['neutral pill', colors.text, colors.neutralBg],
  ])('%s ≥ 4.5:1', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(TEXT_AA);
  });

  it.each([
    ['neutral quick-log icon', colors.neutralIcon, colors.neutralBg],
    ['Chose myself icon', colors.selfGreenInk, colors.selfGreenBg],
    ['selected neutral quick-log icon', colors.onPrimaryInk, colors.neutralIcon],
    ['selected Chose myself icon', colors.onPrimaryInk, colors.selfGreenInk],
  ])('%s ≥ 3:1', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(NON_TEXT_AA);
  });

  it.each(PROFILE_COLORS.map((c) => [c.label, c.hex]))(
    'profile avatar icon on %s ≥ 3:1',
    (_, hex) => {
      expect(contrastRatio(colors.onAccent, hex)).toBeGreaterThanOrEqual(NON_TEXT_AA);
    },
  );

  it('avatar initial on the default (no accent) fill ≥ 3:1', () => {
    expect(contrastRatio(colors.text, colors.secondary)).toBeGreaterThanOrEqual(NON_TEXT_AA);
  });
});

describe('contrastRatio', () => {
  it('matches known reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
