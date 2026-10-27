// One root ConfigProvider. Component tokens inherit the local Radix palette.
export function createTheme() {
  const css = getComputedStyle(document.documentElement);
  const color = name => css.getPropertyValue(`--${name}`).trim();
  return {
    token: {
      colorPrimary: color('blue-9'), colorSuccess: color('green-9'), colorWarning: color('orange-9'), colorError: color('red-9'),
      colorText: color('slate-12'), colorTextSecondary: color('slate-11'), colorTextPlaceholder: color('slate-11'),
      colorBgContainer: color('surface'), colorBgLayout: color('slate-2'), colorBorder: color('slate-7'), colorBorderSecondary: color('slate-6'),
      fontFamily: '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif',
      fontSize: 14, fontSizeSM: 12, fontSizeLG: 18, fontSizeXL: 18,
      fontSizeHeading1: 18, fontSizeHeading2: 18, fontSizeHeading3: 18, fontSizeHeading4: 18, fontSizeHeading5: 14,
      borderRadius: 6, borderRadiusLG: 8, borderRadiusSM: 4, lineWidth: 0.5, controlHeight: 40,
      controlHeightLG: 40, controlHeightSM: 32, motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    components: {
      Button: { defaultShadow: 'none', primaryShadow: 'none', dangerShadow: 'none', contentFontSize: 14, fontWeight: 400, paddingInline: 15 },
      Input: { inputFontSize: 14, activeShadow: 'none', paddingBlock: 10, paddingInline: 12 },
      Card: { bodyPadding: 16, headerPadding: 16, headerFontSize: 14 },
      Tag: { defaultBg: color('slate-3'), defaultColor: color('slate-11') },
    },
  };
}
