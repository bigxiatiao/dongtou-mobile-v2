// One provider supplies the design.md palette to official Ant controls.
export function createTheme() {
  const css = getComputedStyle(document.documentElement);
  const color = name => css.getPropertyValue(`--color-${name}`).trim();
  return {
    token: {
      colorPrimary:color('primary-solid'), colorSuccess:color('success'),
      colorWarning:color('warning'), colorError:color('danger-solid'),
      colorText:color('text-primary'), colorTextSecondary:color('text-secondary'),
      colorTextPlaceholder:color('text-secondary'), colorTextDisabled:color('text-disabled'),
      colorBgContainer:color('surface'), colorBgLayout:color('page'),
      colorBgContainerDisabled:color('page'), colorBorder:color('border'), colorBorderSecondary:color('divider'),
      fontFamily:css.getPropertyValue('--font-family').trim(),
      fontSize:14,fontSizeSM:12,fontSizeLG:16,fontSizeXL:20,
      fontSizeHeading1:20,fontSizeHeading2:18,fontSizeHeading3:16,fontSizeHeading4:16,fontSizeHeading5:14,
      borderRadius:8,borderRadiusLG:12,borderRadiusSM:4,lineWidth:.5,
      controlHeight:44,controlHeightLG:48,controlHeightSM:32,
      motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    components: {
      Button:{borderRadius:4,defaultShadow:'none',primaryShadow:'none',dangerShadow:'none',
        defaultBg:color('primary-soft'),defaultColor:color('primary-solid'),defaultBorderColor:'transparent',
        defaultHoverBg:color('primary-soft-pressed'),defaultHoverColor:color('primary-solid'),defaultHoverBorderColor:'transparent',
        defaultActiveBg:color('primary-soft-pressed'),defaultActiveColor:color('primary-pressed'),defaultActiveBorderColor:'transparent',
        contentFontSize:14,contentFontSizeLG:16,contentFontSizeSM:12,fontWeight:500,paddingInline:12},
      Input:{inputFontSize:14,activeShadow:'none',paddingBlock:10,paddingInline:12,borderRadius:8},
      Card:{bodyPadding:16,headerPadding:16,headerFontSize:18,borderRadiusLG:12},
      Tag:{defaultBg:color('page'),defaultColor:color('text-secondary'),borderRadiusSM:4},
      Segmented:{trackBg:color('page'),trackPadding:3,itemColor:color('text-secondary'),
        itemSelectedBg:color('primary-solid'),itemSelectedColor:'#fff',itemHoverBg:color('primary-soft'),itemHoverColor:color('primary-solid')},
      Tabs:{horizontalMargin:'0 0 16px 0',horizontalItemPadding:'12px 0',inkBarColor:color('brand'),itemSelectedColor:color('primary-solid')},
      Modal:{borderRadiusLG:16,boxShadow:css.getPropertyValue('--shadow-dialog').trim()},
    },
  };
}
