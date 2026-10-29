import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { AppNavigation } from './AppNavigation';
import { TemplateView, TemplatePortals, parseTemplate, installViewBridge } from './TemplateView';

let root, dispose;
afterEach(async () => {
  await act(async () => { dispose?.(); root?.unmount(); });
  document.body.replaceChildren();
});
it('keeps one top navbar and forwards back/actions exactly once as views and titles change', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  const markup = '<main id="app"><div id="appNavigation"></div><header class="top">平台头图</header><section id="home" class="view active"></section><section id="detail" class="view"><div class="list-toolbar"><button class="back" data-return aria-label="返回上一页">返回</button><h1 id="title">人员档案</h1><button data-save>保存</button></div></section></main>';
  await act(async () => root.render(<><TemplateView nodes={parseTemplate(markup)} /><AppNavigation /><TemplatePortals /></>));
  dispose = installViewBridge();
  expect(document.querySelector('#appNavigation h1').textContent).toBe('基层工作台');
  expect(document.querySelector('#app').firstElementChild.id).toBe('appNavigation');
  await act(async () => {
    document.getElementById('home').classList.remove('active');
    document.getElementById('detail').classList.add('active');
  });
  const save = vi.fn(); document.querySelector('[data-save]').addEventListener('click', save);
  await act(async () => document.querySelector('#appNavigation [aria-label="保存"]').click());
  expect(save).toHaveBeenCalledOnce();
  await act(async () => window.ReactView.text(document.getElementById('title'), '项目单位详情'));
  expect(document.querySelector('#appNavigation h1').textContent).toBe('项目单位详情');
  const back = vi.fn(() => {
    document.getElementById('detail').classList.remove('active');
    document.getElementById('home').classList.add('active');
  });
  document.querySelector('[data-return]').addEventListener('click', back);
  await act(async () => document.querySelector('#appNavigation [aria-label="返回上一页"]').click());
  expect(back).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('#appNavigation nav')).toHaveLength(1);
  expect(document.querySelector('#appNavigation h1').textContent).toBe('基层工作台');
});
