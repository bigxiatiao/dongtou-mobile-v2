// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderHomeShellHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderHomeShellText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 首页行动与预警展示，不维护任务状态或辖区的副本。 */
(() => {
  function render() {
    const data = window.GridHomeData;
    if (!data) return;
    const action = data.getCurrentAction();
    const actionName = document.getElementById('homeActionName');
    const actionState = document.getElementById('homeActionState');
    const weather = document.getElementById('homeWeather');
    renderHomeShellText(actionName, action?.name || '当前暂无进行中的行动');
    actionName.classList.toggle('is-empty', !action);
    renderHomeShellText(actionState, action ? '进行中' : '');
    actionState.hidden = !action;
    const warnings = data.getActiveWarnings();
    const escape = value => String(value).replace(/[&"<>]/g, char => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[char]));
    renderHomeShellHTML(weather, warnings.length
      ? warnings.map(warning => `<span class="weather-warning ${escape(warning.level)}" role="img" aria-label="${escape(warning.label)}"><i data-tabler=${{typhoon:"storm",rainstorm:"cloud-rain",gale:"wind"}[warning.kind]}></i><span>${escape(warning.label)}</span></span>`).join('')
      : '<span class="home-weather-empty">暂无有效预警</span>');
  }
  window.GridHomeShell = { render };
  render();
})();
