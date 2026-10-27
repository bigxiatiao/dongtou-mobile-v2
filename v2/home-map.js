// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderHomeMapHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderHomeMapText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 首页辖区地图与既有业务页面之间的轻量入口，不维护任务状态。 */
(() => {
  const app = document.getElementById('app');
  const panel = document.getElementById('homeMapPanel');
  if (!app || !panel || !window.HomeMapData) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let mode = 'task', selected = null, lastScope = window.CollectionStore.scope().id;
  const sheet = document.createElement('div');
  sheet.id = 'homeMapSheet'; sheet.className = 'home-map-sheet hidden'; sheet.setAttribute('aria-hidden', 'true');
  app.appendChild(sheet);
  function close() { selected = null; sheet.classList.add('hidden'); sheet.setAttribute('aria-hidden', 'true'); }
  function render() {
    const scope = window.CollectionStore.scope().id;
    if (scope !== lastScope) { lastScope = scope; close(); }
    const groups = window.HomeMapData.groups(mode);
    document.querySelectorAll('[data-home-map-mode]').forEach(button => {
      const active = button.dataset.homeMapMode === mode;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    renderHomeMapHTML(panel, '<div class="home-map-land" aria-hidden="true"></div><span class="home-map-example">示意地图</span>' + groups.map(group => `<button type="button" class="home-map-marker ${group.color}" data-home-map-group="${esc(group.id)}" style="left:${group.x}%;top:${group.y}%" aria-label="${esc(group.items.map(item => item.name + '，' + item.status).join('；'))}"><span>${group.items.length > 1 ? group.items.length : mode === 'task' ? '<i data-tabler=user></i>' : group.items[0].type === 'door' ? '<i data-tabler=home></i>' : '<i data-tabler=building></i>'}</span></button>`).join('') + (groups.length ? '' : `<div class="home-map-empty">当前范围暂无${mode === 'task' ? '这三类待办任务' : '采集点位'}</div>`));
    const legend = document.getElementById('homeMapLegend');
    if (legend) renderHomeMapHTML(legend, window.HomeMapData.legends[mode].map(item => `<span><i class="home-map-dot ${item.color}"></i>${item.label}</span>`).join(''));
    if (selected && !groups.some(group => group.id === selected)) close();
  }
  function openGroup(id) {
    const group = window.HomeMapData.groups(mode).find(group => group.id === id);
    if (!group) return;
    if (mode === 'collection' && group.items.length === 1) {
      const item = group.items[0]; window.CollectionDemo?.openObject(item.type, item.id); return;
    }
    selected = id;
    renderHomeMapHTML(sheet, `<button type="button" class="home-map-backdrop" data-home-map-close aria-label="关闭点位详情"></button><section class="home-map-sheet-body" role="dialog" aria-modal="true" aria-labelledby="homeMapSheetTitle"><header><h2 id="homeMapSheetTitle">${mode === 'task' ? '点位任务' : '采集对象'}${group.items.length > 1 ? ' · ' + group.items.length : ''}</h2><button type="button" data-home-map-close aria-label="关闭"><i data-tabler=x></i></button></header><div class="home-map-choices">${group.items.map(item => `<button type="button" class="home-map-choice" data-home-map-item="${esc(item.id)}"><div><b>${esc(item.name)}</b><span class="home-map-status ${item.color}">${esc(item.status)}</span></div><small>${esc(item.address)}</small><span class="home-map-choice-action">${mode === 'task' ? item.status === '待复核' ? '进入复核' : '进入办理' : '查看详情'} <i data-tabler=chevron-right></i></span></button>`).join('')}</div></section>`);
    sheet.classList.remove('hidden'); sheet.setAttribute('aria-hidden', 'false');
  }
  app.addEventListener('click', event => {
    if (document.body.dataset.role !== 'grid') return;
    const button = event.target.closest('[data-home-map-mode],[data-home-map-group],[data-home-map-close],[data-home-map-item],[data-home-search]');
    if (!button) return;
    if (button.hasAttribute('data-home-map-mode')) { mode = button.dataset.homeMapMode; close(); render(); }
    else if (button.hasAttribute('data-home-map-group')) openGroup(button.dataset.homeMapGroup);
    else if (button.hasAttribute('data-home-map-close')) close();
    else if (button.hasAttribute('data-home-search')) window.CollectionDemo?.openSearch({ from: 'home' });
    else {
      const item = window.HomeMapData.groups(mode).flatMap(group => group.items).find(item => item.id === button.dataset.homeMapItem);
      close();
      if (!item) return;
      if (item.type === 'task') window.TransferDemo?.showPerson(item.id, 'home');
      else window.CollectionDemo?.openObject(item.type, item.id);
    }
  });
  const observer = new MutationObserver(records => {
    if (document.body.dataset.role !== 'grid') { close(); return; }
    if (records.some(record => record.target.id === 'scopePathText' || record.target.closest?.('#scopePathText') || record.target.classList?.contains('view')) && document.getElementById('home').classList.contains('active')) render();
  });
  app.querySelectorAll('.view').forEach(view => observer.observe(view, { attributes: true, attributeFilter: ['class'] }));
  const scopeText = document.getElementById('scopePathText');
  if (scopeText) observer.observe(scopeText, { childList: true, characterData: true, subtree: true });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  window.HomeMapDemo = { render, close };
  render();
})();
