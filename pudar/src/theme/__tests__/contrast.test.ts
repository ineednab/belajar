import { contrastRatio } from '../contrast';
import { colors } from '../tokens';

const TEXT_AA = 4.5;
const NON_TEXT_AA = 3;

describe('Blush Peach contrast (WCAG AA)', () => {
  it.each([
    ['text on background', colors.text, colors.background],
    ['text on surface', colors.text, colors.surface],
    ['text on secondary', colors.text, colors.secondary],
    ['mutedInk on background', colors.mutedInk, colors.background],
    ['mutedInk on surface', colors.mutedInk, colors.surface],
    ['primaryInk on background', colors.primaryInk, colors.background],
    ['button label on primaryInk', colors.onPrimaryInk, colors.primaryInk],
  ])('%s ≥ 4.5:1', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(TEXT_AA);
  });

  it.each([
    ['neutral quick-log icon', colors.neutralIcon, colors.neutralBg],
    ['Chose myself icon', colors.selfGreenInk, colors.selfGreenBg],
  ])('%s ≥ 3:1', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(NON_TEXT_AA);
  });

  it('matches known reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
