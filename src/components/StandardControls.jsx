import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Input, Textarea, Popover, Popup, Cell, Tabs, Upload } from 'tdesign-mobile-react';
import { AppIcon } from './AppIcon';

// Existing controllers remain the source of selection and business events.
// Observe only the hidden compatibility nodes, never the TDesign component tree.
function useChoices(source) {
  const [choices, setChoices] = useState([]);
  useEffect(() => {
    const read = () => {
      const next = [...source.current.querySelectorAll('button')].map((button, index) => ({
        key: String(index), label: button.textContent.trim(),
        depth: button.textContent.match(/^　*/)[0].length,
        selected: button.matches('.active,.on,.selected'), disabled: button.disabled,
      }));
      setChoices(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(source.current, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => observer.disconnect();
  }, [source]);
  return choices;
}
export function ChoiceControl({ props, children, elementRef, segmented }) {
  const source = useRef(null);
  const choices = useChoices(source);
  const value = choices.find(choice => choice.selected)?.key || choices[0]?.key;
  const choose = key => source.current.querySelectorAll('button')[Number(key)]?.click();
  useEffect(() => {
    const container = source.current.parentElement;
    container.querySelector('.t-tabs__wrapper')?.setAttribute('role', 'tablist');
    const tabs = container.querySelectorAll('.t-tabs__item');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(choices[index]?.key === value));
      tab.setAttribute('aria-disabled', String(Boolean(choices[index]?.disabled)));
      tab.tabIndex = choices[index]?.key === value ? 0 : -1;
    });
  }, [choices, value]);
  return <div {...props} role={props.role === 'tablist' ? 'group' : props.role} ref={elementRef} data-standard-choice={segmented ? 'segmented' : 'tabs'} onKeyDown={event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    const enabled = [...source.current.parentElement.querySelectorAll('[role="tab"]')].filter(item => item.getAttribute('aria-disabled') !== 'true');
    const index = enabled.indexOf(tab);
    const next = { ArrowRight: (index + 1) % enabled.length, ArrowLeft: (index - 1 + enabled.length) % enabled.length, Home: 0, End: enabled.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); enabled[next]?.focus(); enabled[next]?.click(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tab.click(); }
  }}>
    <div ref={source} hidden>{children}</div>
    <Tabs className={segmented ? 'standard-segmented' : undefined} theme={segmented ? 'tag' : 'line'}
      stickyProps={{ disabled: true }} split={false} showBottomLine={!segmented} swipeable={false} value={value} onChange={choose}
      list={choices.map(item => ({ value: item.key, label: item.label, disabled: item.disabled }))} />
  </div>;
}
export function ScopeControl({ props, children, elementRef }) {
  const source = useRef(null);
  const outer = useRef(null);
  const choices = useChoices(source);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const read = () => setOpen(!outer.current.classList.contains('hidden'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(outer.current, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const close = () => outer.current.classList.add('hidden');
  useEffect(() => {
    if (!open) return;
    const escape = event => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  return <div {...props} ref={node => { outer.current = node; elementRef(node); }} data-standard-scope>
    <div hidden ref={source}>{children}</div>
    <Popover visible={open} placement="bottom-left" theme="light" onVisibleChange={next => { if (!next) close(); }}
      content={<div className="scope-choice-list">{choices.map(({ key, label, disabled, depth }) =>
        <Cell key={key} title={<span style={{ paddingInlineStart: depth * 12 }}>{label}</span>}
          onClick={() => { if (disabled) return; source.current.querySelectorAll('button')[Number(key)]?.click(); close(); }} />)}</div>}>
      <span className="scope-popover-anchor" />
    </Popover>
  </div>;
}
export function SelectControl({ props, children, elementRef }) {
  const source = useRef(null);
  const [value, setValue] = useState(props.defaultValue);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(props['aria-label']);
  const [validation, setValidation] = useState({ invalid: props['aria-invalid'], describedBy: props['aria-describedby'] });
  useEffect(() => {
    // Controllers validate the preserved native field; reflect that feedback on
    // the visible Select and its accessible input without duplicating values.
    const read = () => {
      const next = { invalid: source.current.getAttribute('aria-invalid'), describedBy: source.current.getAttribute('aria-describedby') };
      setValidation(previous => previous.invalid === next.invalid && previous.describedBy === next.describedBy ? previous : next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(source.current, { attributes: true, attributeFilter: ['aria-invalid', 'aria-describedby'] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const fieldLabel = source.current.labels?.[0];
    const text = fieldLabel && [...fieldLabel.childNodes]
      .filter(node => node !== source.current.parentElement)
      .map(node => node.textContent).join('').trim();
    setLabel(props['aria-label'] || text || props.name || props['data-field'] || props['data-create-field'] || '请选择');
  }, [props]);
  const options = children.filter(React.isValidElement).map(child => ({
    value: child.props.spec?.props.value ?? child.props.spec?.children.join(''),
    label: child.props.spec?.children.join(''), disabled: child.props.spec?.props.disabled,
  }));
  return <span className="standard-select">
    <select {...props} hidden ref={node => { source.current = node; elementRef(node); }}>{children}</select>
    <Button className="standard-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
      aria-required={props['aria-required']} aria-invalid={validation.invalid} aria-describedby={validation.describedBy}
      disabled={props.disabled} variant="outline" suffix={<AppIcon name="chevron-down" />} onClick={() => setOpen(true)}>
      {options.find(option => option.value === value)?.label || '请选择'}
    </Button>
    <Popup visible={open} placement="bottom" onClose={() => setOpen(false)}>
      <section className="standard-option-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="standard-option-heading"><b>{label}</b><Button variant="text" aria-label="关闭选择" onClick={() => setOpen(false)} icon={<AppIcon name="x" />} /></div>
        <div role="listbox" aria-label={label}>{options.map(option => <button type="button" key={option.value} role="option" disabled={option.disabled}
          aria-selected={value === option.value}
          className={option.disabled ? 'is-disabled' : ''} onClick={() => {
            if (option.disabled) return;
            setValue(option.value); source.current.value = option.value;
            source.current.dispatchEvent(new Event('change', { bubbles: true })); setOpen(false);
          }}><Cell title={option.label} rightIcon={value === option.value ? <AppIcon name="check" /> : null} /></button>)}</div>
      </section>
    </Popup>
  </span>;
}
export function PhotoControl({ props, children }) {
  const [files, setFiles] = useState([]);
  const isRisk = props['data-upload-purpose'] === 'risk';
  const { className, 'data-action': action, ...rest } = props;
  return <div {...rest} className="standard-photo-upload">
    {isRisk && <div className="upload-description">拍摄房屋外观、积水、裂缝和道路</div>}
    <Upload accept="image/*" multiple autoUpload={false} files={files} onChange={setFiles} preview={false}
      removeBtn={false} addContent={<button type="button" className="upload-trigger" aria-label="上传照片"><AppIcon name="plus" /><span>{isRisk ? '上传照片' : children.filter(child => !child.props?.spec?.props['data-tabler'])}</span></button>} />
    <UploadActions files={files} onChange={setFiles} />
  </div>;
}

export function FileControl({ props, elementRef }) {
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  const changeFiles = next => {
    const transfer = new DataTransfer();
    next.forEach(file => { if (file.raw) transfer.items.add(file.raw); });
    input.current.files = transfer.files; setFiles(next);
    input.current.dispatchEvent(new Event('change', { bubbles: true }));
  };
  return <div className="standard-photo-upload">
    <input {...props} hidden ref={node => { input.current = node; elementRef(node); }} />
    <Upload accept={props.accept} multiple={props.multiple} disabled={props.disabled} capture={props.capture}
      files={files} autoUpload={false} onChange={changeFiles} preview={false} removeBtn={false}
      addContent={<button type="button" className="upload-trigger" aria-label="上传照片"><AppIcon name="plus" /><span>上传照片</span></button>} />
    <UploadActions files={files} onChange={changeFiles} disabled={props.disabled} />
  </div>;
}

// TDesign exposes a component handle; business schemas need the native field.
// Apply schema IDs, data attributes and accessibility to that field exactly once.
export function TextControl({ props, elementRef, multiline = false }) {
  const host = useRef(null);
  useLayoutEffect(() => {
    const field = host.current.querySelector(multiline ? 'textarea' : 'input');
    for (const [key, value] of Object.entries(props)) {
      if (['defaultValue', 'style', 'className'].includes(key) || key.startsWith('on')) continue;
      const attr = ({ readOnly: 'readonly', maxLength: 'maxlength', minLength: 'minlength', tabIndex: 'tabindex', autoComplete: 'autocomplete', inputMode: 'inputmode' })[key] || key;
      if (value === false || value == null) field.removeAttribute(attr);
      else field.setAttribute(attr, value === true ? '' : String(value));
    }
    if (props.style) Object.assign(field.style, props.style);
    if (props.className) field.classList.add(...props.className.split(/\s+/).filter(Boolean));
    elementRef(field);
  }, [props, elementRef, multiline]);
  const Control = multiline ? Textarea : Input;
  return <span className={`standard-text-control${multiline ? ' is-multiline' : ''}`} ref={host}>
    <Control defaultValue={props.defaultValue} type={props.type} placeholder={props.placeholder}
      disabled={props.disabled} readonly={props.readOnly} name={props.name} maxlength={props.maxLength}
      autofocus={props.autoFocus} autocomplete={props.autoComplete} borderless clearable={false} />
  </span>;
}

function UploadActions({ files, onChange, disabled }) {
  return files.length ? <div className="upload-file-actions">{files.map((file, index) =>
    <Button key={`${file.name}-${index}`} size="small" theme="light" disabled={disabled}
      aria-label={`删除照片${index + 1}`} icon={<AppIcon name="trash" />}
      onClick={() => onChange(files.filter((_, i) => i !== index))}>删除照片{index + 1}</Button>
  )}</div> : null;
}
