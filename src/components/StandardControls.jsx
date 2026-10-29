import React, { useEffect, useRef, useState } from 'react';
import { Button, Menu, Popover, Segmented, Select, Tabs, Upload } from 'antd';
import { AppIcon } from './AppIcon';

// Existing controllers remain the source of selection and business events.
// Observe only the hidden compatibility nodes, never the Ant component tree.
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
  return <div {...props} role={props.role === 'tablist' ? 'group' : props.role} ref={elementRef} data-standard-choice={segmented ? 'segmented' : 'tabs'}>
    <div ref={source} hidden>{children}</div>
    {segmented
      ? <Segmented classNames={{ root: 'standard-segmented', label: 'standard-segment-label' }} aria-label={props['aria-label'] || '切换视图'} block options={choices.map(item => ({ ...item, value: item.key }))} value={value} onChange={choose} />
      : <Tabs activeKey={value} items={choices} onChange={choose} tabBarGutter={24} />}
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
    <Popover open={open} placement="bottomLeft" trigger="click" onOpenChange={next => { if (!next) close(); }}
      styles={{ container: { padding: 4 } }}
      content={<Menu style={{ width: 220, border: 0 }} selectedKeys={choices.filter(item => item.selected).map(item => item.key)}
        items={choices.map(({ key, label, disabled, depth }) => ({ key, label: <span style={{ paddingInlineStart: depth * 12 }}>{label}</span>, disabled }))}
        onClick={({ key }) => { source.current.querySelectorAll('button')[Number(key)]?.click(); close(); }} />}>
      <span className="scope-popover-anchor" />
    </Popover>
  </div>;
}
export function SelectControl({ props, children, elementRef }) {
  const source = useRef(null);
  const [value, setValue] = useState(props.defaultValue);
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
    <Select aria-label={label} aria-required={props['aria-required']} aria-invalid={validation.invalid} aria-describedby={validation.describedBy}
      status={validation.invalid === 'true' ? 'error' : undefined} style={{ width: '100%' }} value={value} options={options}
      disabled={props.disabled} suffixIcon={<AppIcon name="chevron-down" />}
      onChange={next => { setValue(next); source.current.value = next; source.current.dispatchEvent(new Event('change', { bubbles: true })); }} />
  </span>;
}
export function PhotoControl({ props, children }) {
  const [files, setFiles] = useState([]);
  const isRisk = props['data-upload-purpose'] === 'risk';
  const { className, 'data-action': action, ...rest } = props;
  return <div {...rest} className="standard-photo-upload">
    {isRisk && <div className="upload-description">拍摄房屋外观、积水、裂缝和道路</div>}
    <Upload accept="image/*" multiple listType="picture-card" fileList={files} beforeUpload={() => false}
      onChange={({ fileList }) => setFiles(fileList)} showUploadList={{ showPreviewIcon: false, removeIcon: <AppIcon name="trash" /> }}>
      <Button type="text" className="upload-trigger" aria-label="上传照片"><AppIcon name="plus" /><span>{isRisk ? '上传照片' : children.filter(child => !child.props?.spec?.props['data-tabler'])}</span></Button>
    </Upload>
  </div>;
}

export function FileControl({ props, elementRef }) {
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  return <div className="standard-photo-upload">
    <input {...props} hidden ref={node => { input.current = node; elementRef(node); }} />
    <Upload accept={props.accept} multiple={props.multiple} disabled={props.disabled} listType="picture-card"
      fileList={files} beforeUpload={() => false} onChange={({ fileList }) => {
        const transfer = new DataTransfer();
        fileList.forEach(file => transfer.items.add(file.originFileObj || file));
        input.current.files = transfer.files;
        setFiles(fileList);
        input.current.dispatchEvent(new Event('change', { bubbles: true }));
      }} showUploadList={{ showPreviewIcon: false, removeIcon: <AppIcon name="trash" /> }}>
      <Button type="text" className="upload-trigger" aria-label="上传照片"><AppIcon name="plus" /><span>上传照片</span></Button>
    </Upload>
  </div>;
}
