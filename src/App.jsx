import React from 'react';
import { ConfigProvider } from 'tdesign-mobile-react';
import { TemplateView, TemplatePortals, parseTemplate } from './components/TemplateView';
import { AppNavigation } from './components/AppNavigation';
import shell from './templates/app-shell.html?raw';

const nodes = parseTemplate(shell);
export default function App() {
  return <ConfigProvider><TemplateView nodes={nodes} /><AppNavigation /><TemplatePortals /></ConfigProvider>;
}
