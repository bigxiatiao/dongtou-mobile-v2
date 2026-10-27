import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { TemplateView, TemplatePortals, parseTemplate, installViewBridge } from './TemplateView';

let root, host, dispose;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia = vi.fn(() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { dispose?.(); root.unmount(); });
  document.body.replaceChildren(); dispose = undefined;
});
async function mount(markup) {
  await act(async () => root.render(<ConfigProvider theme={{ token: { motion: false } }}><TemplateView nodes={parseTemplate(markup)} /><TemplatePortals /></ConfigProvider>));
  dispose = installViewBridge();
}

describe('React migration compatibility', () => {
  it('renders official Tabler icons in initial templates and dynamic sheets without losing action semantics', async () => {
    await mount('<main id="app"><button data-save="icon" aria-label="搜索"><i data-tabler=search></i></button><section id="sheet"></section></main>');
    const search = document.querySelector('[data-save] svg');
    expect(search.classList.contains('tabler-icon-search')).toBe(true);
    expect(search.getAttribute('width')).toBe('20');
    expect(search.getAttribute('stroke-width')).toBe('1.5');
    expect(search.getAttribute('stroke')).toBe('currentColor');
    expect(search.getAttribute('aria-hidden')).toBe('true');
    await act(async () => window.ReactView.html(document.getElementById('sheet'), '<button data-choice="selected" aria-pressed="true"><i data-tabler=check></i>已选择</button>'));
    expect(document.querySelector('#sheet svg').classList.contains('tabler-icon-check')).toBe(true);
    expect(document.querySelector('#sheet button').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-tabler]')).toBeNull();
  });

  it('retains delegated action attributes and replaces buttons with real Ant controls', async () => {
    await mount('<main id="app"><button class="btn" data-save="submit">保存</button><div id="result"></div></main>');
    const app = document.getElementById('app');
    const handler = vi.fn(event => { if (event.target.closest('[data-save]')) window.ReactView.text(document.getElementById('result'), '已保存'); });
    app.addEventListener('click', handler);
    await act(async () => document.querySelector('[data-save]').click());
    expect(handler).toHaveBeenCalledOnce();
    expect(document.getElementById('result').textContent).toBe('已保存');
    expect(document.querySelector('[data-save]').classList.contains('ant-btn')).toBe(true);
  });
  it('preserves schema defaults and applies new values on conditional form rerenders', async () => {
    await mount('<main id="app"><section id="form"></section></main>');
    await act(async () => window.ReactView.html(document.getElementById('form'), '<input data-field="note" value="已有说明"><select data-field="type"><option>A</option><option selected>B</option></select>'));
    const input = document.querySelector('input');
    expect(input.value).toBe('已有说明');
    expect(document.querySelector('select').value).toBe('B');
    input.value = '现场补充';
    await act(async () => window.ReactView.html(document.getElementById('form'), '<input data-field="note" value="现场补充"><select data-field="type"><option selected>A</option><option>B</option></select>'));
    expect(document.querySelector('input').value).toBe('现场补充');
    expect(document.querySelector('select').value).toBe('A');
  });
  it('renders dynamically created sheets inside the same React provider', async () => {
    await mount('<main id="app"></main>');
    const sheet = document.createElement('section');
    document.getElementById('app').append(sheet);
    await act(async () => window.ReactView.html(sheet, '<h2>选择安置方式</h2><button data-choice="a">集中安置</button>'));
    expect(sheet.querySelector('button').textContent).toBe('集中安置');
    expect(sheet.querySelector('button').classList.contains('ant-btn')).toBe(true);
    await act(async () => window.ReactView.html(sheet, ''));
    expect(sheet.children).toHaveLength(0);
  });
  it('keeps multi-line business cards in native flow instead of a fixed-height action button', async () => {
    await mount('<main id="app"><button data-dp="tasks"><span>转移任务<strong>14<small>人次</small></strong><em>待转移 7 · 待复核 2</em></span></button></main>');
    const card = document.querySelector('[data-dp="tasks"]');
    expect(card.tagName).toBe('BUTTON');
    expect(card.classList.contains('ant-btn')).toBe(false);
    expect(card.querySelector('strong').textContent).toBe('14人次');
    expect(card.querySelector('em').textContent).toBe('待转移 7 · 待复核 2');
  });
  it('keeps checkbox, file input, escaped copy and SVG semantics intact', async () => {
    await mount('<main id="app"><label><input type="checkbox" checked>已选择</label><input type="file" multiple><p>甲 &amp; 乙 &lt;说明&gt;</p><svg viewBox="0 0 24 24"><path stroke-width="1.5" d="M1 1L2 2"></path></svg></main>');
    expect(document.querySelector('[type="checkbox"]').checked).toBe(true);
    expect(document.querySelector('[type="file"]').multiple).toBe(true);
    expect(document.querySelector('p').textContent).toBe('甲 & 乙 <说明>');
    expect(document.querySelector('svg').getAttribute('viewBox')).toBe('0 0 24 24');
    expect(document.querySelector('path').getAttribute('stroke-width')).toBe('1.5');
  });
});

describe('standard control business bridges', () => {
  it('routes Ant tab clicks to existing filters and reflects controller selection/count updates', async () => {
    await mount('<main id="app"><div class="tabs" id="filters"><button class="active" data-filter="pending">待核查 3</button><button data-filter="done">已核查 2</button></div></main>');
    const filters = document.getElementById('filters');
    const handler = vi.fn(event => {
      const target = event.target.closest('[data-filter]');
      if (!target) return;
      filters.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button === target));
    });
    filters.addEventListener('click', handler);
    await act(async () => filters.querySelectorAll('[role="tab"]')[1].click());
    expect(filters.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('已核查 2');
    expect(handler.mock.calls.some(([event]) => event.target.closest('[data-filter="done"]'))).toBe(true);
    await act(async () => window.ReactView.text(filters.querySelector('[data-filter="done"]'), '已核查 3'));
    expect(filters.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('已核查 3');
  });
  it('writes standard Select changes into the schema field and dispatches its delegated event', async () => {
    await mount('<main id="app"><select data-field="depth"><option value="none">无积水</option><option value="deep">30厘米以上</option></select></main>');
    const native = document.querySelector('select');
    const handler = vi.fn(); native.addEventListener('change', handler);
    const combobox = document.querySelector('[role="combobox"]');
    await act(async () => combobox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    const option = [...document.querySelectorAll('.ant-select-item-option')].find(node => node.textContent === '30厘米以上');
    await act(async () => option.click());
    expect(native.value).toBe('deep');
    expect(handler).toHaveBeenCalledOnce();
  });
});

it('mounts schema photo fields through the template parser and retains the file contract', async () => {
  await mount('<main id="app"><input type="file" accept="image/*" multiple data-field="photo"></main>');
  const field = document.querySelector('[data-field="photo"]');
  expect(field.type).toBe('file');
  expect(field.multiple).toBe(true);
  expect(field.hidden).toBe(true);
  expect(document.querySelector('[aria-label="上传照片"]')).not.toBeNull();
});
