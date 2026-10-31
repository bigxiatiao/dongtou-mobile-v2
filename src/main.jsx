import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { loadStyles } from './styles';
import { installViewBridge } from './components/TemplateView';
import { bootstrapBusiness } from './legacy/bootstrap';

await import('tdesign-mobile-react/es/style/index.css');
await loadStyles();
await import('./icon-system.css');
await import('./standard-controls.css');
await import('./home-figma.css');
await import('./design-system.css');
await import('./tdesign-theme.css');
await import('./page-layout.css');
document.body.dataset.role = 'grid';
// Theme reads the loaded local palette. No duplicated initialization in effects.
const { default: App } = await import('./App');
const root = createRoot(document.getElementById('root'));
flushSync(() => root.render(<App />));
installViewBridge();
await bootstrapBusiness();
