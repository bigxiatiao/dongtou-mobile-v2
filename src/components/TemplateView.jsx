import React, { memo, useCallback, useState, useSyncExternalStore } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Button, Input } from 'antd';
import { AppIcon } from './AppIcon';
import { ChoiceControl, ScopeControl, SelectControl, PhotoControl, FileControl } from './StandardControls';

// Business controllers keep their field schemas and event delegation. React owns
// every template update, including dynamically created sheets. No eval or scripts.
const slots = new WeakMap();
const portals = new Map();
const listeners = new Set();
let version = 0;
let portalId = 0;
const emit = () => { version += 1; listeners.forEach(listener => listener()); };
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => version;
const booleanAttributes = new Set(['disabled', 'hidden', 'multiple', 'required', 'autofocus', 'readonly', 'checked', 'selected', 'open', 'controls', 'loop', 'muted', 'novalidate']);
const attributes = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  autofocus: 'autoFocus', novalidate: 'noValidate', maxlength: 'maxLength', minlength: 'minLength',
  inputmode: 'inputMode', autocomplete: 'autoComplete', colspan: 'colSpan',
  rowspan: 'rowSpan', viewbox: 'viewBox', 'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', preserveaspectratio: 'preserveAspectRatio',
};
const voidElements = new Set(['input', 'img', 'br', 'hr', 'area', 'base', 'col', 'embed', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function nodeSpec(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE'].includes(node.tagName)) return null;
  const tag = node.tagName.toLowerCase();
  const props = {};
  for (const { name, value } of node.attributes) {
    if (/^on/i.test(name)) continue;
    if (name === 'style') {
      props.style = Object.fromEntries([...node.style].map(property => [
        property.startsWith('--') ? property : property.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
        node.style.getPropertyValue(property),
      ]));
    } else props[attributes[name.toLowerCase()] || name] = booleanAttributes.has(name) ? true : value;
  }
  if (tag === 'input') {
    if (props.type !== 'file' && 'value' in props) { props.defaultValue = props.value; delete props.value; }
    if ('checked' in props) { props.defaultChecked = props.checked; delete props.checked; }
  }
  if (tag === 'textarea') props.defaultValue = node.textContent;
  if (tag === 'select') props.defaultValue = node.multiple ? [...node.selectedOptions].map(option => option.value) : node.value;
  if (tag === 'option') delete props.selected;
  return { tag, props, children: tag === 'textarea' || voidElements.has(tag) ? [] : [...node.childNodes].map(nodeSpec).filter(value => value !== null) };
}
export function parseTemplate(markup) {
  const template = document.createElement('template');
  template.innerHTML = String(markup ?? '');
  return [...template.content.childNodes].map(nodeSpec).filter(value => value !== null);
}
function childrenFor(nodes, revision) {
  return nodes.map((node, index) => typeof node === 'string' ? node : <TemplateElement key={`${revision}:${node.props.id || index}`} spec={node} />);
}
function hasFlowContent(nodes) {
  return nodes.some(node => typeof node !== 'string' && (
    ['div', 'h1', 'h2', 'h3', 'section', 'article', 'p', 'strong', 'small', 'em'].includes(node.tag)
    || hasFlowContent(node.children)
  ));
}
// Auxiliary actions share a small semantic icon map. Primary submissions keep
// their original copy, data attributes and event delegation.
function auxiliaryIcon(spec) {
  if (spec.children.some(node => typeof node !== 'string' && (node.props?.['data-tabler'] || node.tag === 'svg' || node.tag === 'img'))) return null;
  const text = spec.children.filter(node => typeof node === 'string').join('').trim();
  const rules = [
    [/暂存|保存草稿/, 'device-floppy'], [/批量办理|编辑|修改资料|编辑资料/, 'edit'],
    [/人员与家庭|人员档案|同单位人员/, 'users'], [/转交|移交/, 'user-share'],
    [/调整所属单位/, 'building-cog'], [/电话|联系$/, 'phone'], [/导航|定位|选址/, 'map-pin'],
    [/核查|确认/, 'circle-check'], [/新增|添加/, 'plus'], [/清空|删除|解除/, 'trash'],
    [/刷新|重试/, 'rotate-clockwise'], [/更多/, 'dots'], [/取消|关闭/, 'x'],
    [/拍照|选图|照片/, 'camera'], [/语音|说话/, 'microphone'], [/展开/, 'chevron-down'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] || null;
}
const TemplateElement = memo(function TemplateElement({ spec }) {
  const [content, setContent] = useState(() => ({ nodes: spec.children, revision: 0 }));
  const ref = useCallback(handle => {
    // Public antd refs point to the actual native input/button.
    const element = handle?.input || handle?.nativeElement || handle;
    if (!(element instanceof Element)) return;
    slots.set(element, nodes => setContent(previous => ({ nodes, revision: previous.revision + 1 })));
  }, []);
  const { tag, props } = spec;
  const children = childrenFor(content.nodes, content.revision);
  if (props['data-tabler']) return <AppIcon name={props['data-tabler']} />;
  const classes = (props.className || '').split(/\s+/);
  if (props.id === 'scopeOptions') return <ScopeControl props={props} elementRef={ref}>{children}</ScopeControl>;
  if (classes.some(name => ['tabs', 'dp-tabs', 'detail-switch', 'building-unit-tabs', 'role-switch', 'home-map-switch', 'dp-map-switch', 'view-switch', 'search-targets', 'transfer-grouping', 'scenario-tabs'].includes(name)) && spec.children.some(node => node.tag === 'button')) {
    const segmented = classes.some(name => ['role-switch', 'home-map-switch', 'dp-map-switch', 'view-switch', 'search-targets', 'transfer-grouping', 'scenario-tabs'].includes(name));
    return <ChoiceControl props={props} elementRef={ref} segmented={segmented}>{children}</ChoiceControl>;
  }
  if (tag === 'input' && props.type === 'file' && props.accept?.includes('image') && !props.hidden) return <FileControl props={props} elementRef={ref} />;
  if (tag === 'select') return <SelectControl props={props} elementRef={ref}>{children}</SelectControl>;
  if (classes.includes('photo') && props['data-action'] === 'camera') return <PhotoControl props={props}>{children}</PhotoControl>;
  // Structural row buttons keep their native flow layout; actual action controls
  // use Ant Button without changing the original data attributes or click path.
  const actionButton = tag === 'button' && !hasFlowContent(spec.children)
    && !/(?:map-marker|dp-marker|collection-marker|transfer-picker-trigger|dp-picker|transfer-option|dp-option|room-option|home-map-backdrop|brand-scope|transfer-group-head|dp-unit-progress|dp-group-label|home-shortcut)/.test(props.className || '')
    && props['data-workbench'] !== 'notice-list' && props['data-dp'] !== 'notices';
  if (actionButton) {
    const { type, ...buttonProps } = props;
    const back = /\b(back|dp-back|gs-back)\b/.test(props.className || '');
    const iconOnly = spec.children.filter(node => typeof node !== 'string' || node.trim()).every(node => node.props?.['data-tabler']);
    const fallbackLabel = iconOnly ? ({ 'chevron-left':'返回上一页', x:'关闭', plus:'新增', search:'搜索', dots:'更多操作', camera:'拍照', check:'确认' }[spec.children.find(node=>node.props?.['data-tabler'])?.props['data-tabler']] || '更多操作') : undefined;
    const primary = /\bprimary\b/.test(props.className || '');
    const danger = /\bdanger\b/.test(props.className || '') || props['data-action'] === 'apply-release';
    const leadingIcon = !primary && !iconOnly ? auxiliaryIcon(spec) : null;
    return <Button {...buttonProps} className={`${props.className || ''} design-button${iconOnly ? ' standard-icon-button' : ''}`}
      data-kind={danger ? 'danger' : primary ? 'primary' : 'light-blue'} aria-label={props['aria-label'] || fallbackLabel} ref={ref} htmlType={type || 'button'}
      type={back ? 'text' : primary || danger ? 'primary' : 'default'} danger={danger}
      icon={leadingIcon ? <AppIcon name={leadingIcon} /> : undefined} autoInsertSpace={false}>
      {children.filter(child => typeof child !== 'string' || child.trim())}
    </Button>;
  }
  if (tag === 'input' && !['checkbox', 'radio', 'file', 'range', 'hidden', 'color'].includes(props.type)) {
    return <Input {...props} ref={ref} />;
  }
  // Keep native textarea semantics for the existing delegated change and
  // file/checkbox workflows. Their visuals share the same token system.
  return React.createElement(tag, { ...props, ref }, voidElements.has(tag) || tag === 'textarea' ? undefined : children);
});
export const TemplateView = memo(function TemplateView({ nodes }) {
  return childrenFor(nodes, 0);
});
export function TemplatePortals() {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return [...portals].map(([element, entry]) => createPortal(childrenFor(entry.nodes, entry.revision), element, entry.id));
}
function renderNodes(element, nodes) {
  if (!element) return;
  const update = slots.get(element);
  flushSync(() => {
    if (update) update(nodes);
    else {
      const previous = portals.get(element);
      if (!previous) element.replaceChildren();
      portals.set(element, { nodes, revision: (previous?.revision || 0) + 1, id: previous?.id || `portal-${++portalId}` });
      emit();
    }
  });
}
export function installViewBridge() {
  const bridge = {
    html(element, markup) { renderNodes(element, parseTemplate(markup)); return markup; },
    text(element, value) {
      if (element?.nodeType === Node.TEXT_NODE) element.textContent = String(value ?? '');
      else renderNodes(element, [String(value ?? '')]);
      return value;
    },
  };
  window.ReactView = bridge;
  const observer = new MutationObserver(records => {
    if (!records.some(record => record.removedNodes.length)) return;
    let changed = false;
    for (const element of portals.keys()) if (!element.isConnected) { portals.delete(element); changed = true; }
    if (changed) emit();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => { observer.disconnect(); delete window.ReactView; portals.clear(); emit(); };
}
