import { font, theme } from '../index';

describe('mobile theme', () => {
  it('matches the canonical SOVS navy and gold web tokens', () => {
    expect(theme.colors.background).toBe('#fafaf8');
    expect(theme.colors.surface).toBe('#ffffff');
    expect(theme.colors.navy).toBe('#10223d');
    expect(theme.colors.gold).toBe('#c08b10');
    expect(theme.colors.goldSoft).toBe('#faf1d8');
  });

  it('exposes semantic status colors from the web skin', () => {
    expect(theme.colors.success).toBe('#15803d');
    expect(theme.colors.warning).toBe('#b45309');
    expect(theme.colors.info).toBe('#1e5fbf');
    expect(theme.colors.danger).toBe('#b42318');
  });

  it('uses the loaded DM Sans font families', () => {
    expect(font('regular')).toEqual({ fontFamily: 'DMSans_400Regular' });
    expect(font('medium')).toEqual({ fontFamily: 'DMSans_500Medium' });
    expect(font('semibold')).toEqual({ fontFamily: 'DMSans_600SemiBold' });
    expect(font('bold')).toEqual({ fontFamily: 'DMSans_700Bold' });
  });
});
