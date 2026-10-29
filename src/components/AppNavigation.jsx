import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Navbar } from 'tdesign-mobile-react';
import { AppIcon } from './AppIcon';

const sourceSelector = '.list-toolbar,.dp-title,.gs-title,.head:has(.back)';
// Controllers keep their original navigation nodes and return stacks. The one
// visible navbar forwards actions to those nodes, preserving delegated events.
export function AppNavigation() {
  const [navigation, setNavigation] = useState(null);
  useLayoutEffect(() => {
    const app = document.getElementById('app');
    const read = () => {
      const view = app.querySelector('.view.active');
      if (!view) return;
      const source = view.querySelector(sourceSelector);
      const buttons = source ? [...source.querySelectorAll('button')].filter(button => !button.closest('[hidden],.hidden')) : [];
      const back = buttons.find(button => button.matches('.back,.dp-back,.gs-back'));
      const actions = buttons.filter(button => button !== back);
      const title = source?.querySelector('h1')?.textContent.trim() || ({home:'基层工作台',dept:'部门工作台','collection-search':'找人找房',mine:'我的'})[view.id] || view.querySelector('h1')?.textContent.trim() || '洞头网格+应急工作端';
      const summary = actions.map(button => ({ element:button, label:button.textContent.trim(), aria:button.getAttribute('aria-label'), disabled:button.disabled, icon:button.querySelector('svg')?.getAttribute('class')?.match(/tabler-icon-([\w-]+)/)?.[1] }));
      const next = { view:view.id, title, back, actions:summary, status:source?.querySelector('.status-count')?.textContent || '' };
      setNavigation(old => old && old.view === next.view && old.title === title && old.back === back && old.status === next.status && old.actions.length === summary.length && old.actions.every((item,index) => Object.keys(item).every(key => item[key] === summary[index][key])) ? old : next);
    };
    read();
    const observer = new MutationObserver(records => {
      if (records.some(record => !record.target.closest?.('#appNavigation'))) read();
    });
    observer.observe(app, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled','aria-label']});
    return () => observer.disconnect();
  }, []);
  const target = document.getElementById('appNavigation');
  if (!navigation || !target) return null;
  return createPortal(<nav aria-label="页面导航" data-view={navigation.view}>
    <Navbar fixed={false} animation={false} title={<h1>{navigation.title}</h1>}
      left={navigation.back ? <Button variant="text" className="navigation-back" aria-label={navigation.back.getAttribute('aria-label') || '返回上一页'} onClick={() => navigation.back.click()} icon={<AppIcon name="chevron-left" />} /> : null}
      right={<div className="navigation-actions">{navigation.status && <span>{navigation.status}</span>}{navigation.actions.map((action,index) => <Button key={index} variant="text" disabled={action.disabled} aria-label={action.aria || action.label} onClick={() => action.element.click()} icon={action.icon ? <AppIcon name={action.icon} /> : undefined}>{action.label}</Button>)}</div>} />
  </nav>, target);
}
