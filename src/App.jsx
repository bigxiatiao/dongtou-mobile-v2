import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { TemplateView, TemplatePortals, parseTemplate } from './components/TemplateView';
import shell from './templates/app-shell.html?raw';
import { createTheme } from './theme';

// Parse the preserved shell once; updates stay local to the relevant React view.
const nodes = parseTemplate(shell);
const theme = createTheme();
export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <TemplateView nodes={nodes} />
      <TemplatePortals />
    </ConfigProvider>
  );
}
