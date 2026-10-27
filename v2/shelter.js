// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderShelterHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderShelterText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 安置点页面和交互：部门角色下统一处理导航、登记、核验与转点。 */
(()=> {
  const app=document.getElementById('app');
  if(!app)return;
  function go(id) {
    app.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    app.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.shelterPage===id));
    scrollTo(0,0)
  }
  function popup(t,x) {
    const m=document.getElementById('modal');
    renderShelterText(document.getElementById('mt'), t);
    renderShelterText(document.getElementById('mx'), x);
    m.classList.add('open')
  }
  app.addEventListener('click',e=> {
    if(document.body.dataset.role!=='dept')return;
    const page=e.target.closest('[data-shelter-page]');
    if(page) {
      go(page.dataset.shelterPage);
      return
    }
    const action=e.target.closest('[data-action]');
    if(!action)return;
    switch(action.dataset.action) {
      case 'manual-shelter': go('shelter-register');
      break;
      case 'shelter-scan': go('shelter-scan-result');
      break;
      case 'shelter-confirm': popup('安置点接收已确认','已记录与转移任务 RW-018 的匹配和到位情况；独立复核仍由对应复核责任人办理。');
      break;
      case 'shelter-family-edit': popup('随行家属核对','请核对姓名、证件号与本人关系；本次仅演示核对提示。');
      break;
      case 'shelter-transfer-draft': popup('转点信息待执行','当前填写内容会保留到页面刷新前，可继续补充。');
      break;
      case 'shelter-family-add': popup('添加随行家属','填写姓名、身份证号、与本人关系和联系电话后加入本次登记。');
      break;
      case 'shelter-save-draft': popup('草稿已保存','本人及3名随行家属信息已暂存，可继续补充。');
      break;
      case 'shelter-register-submit': popup('登记已提交','4人已计入安置点在住人数；因未匹配转移任务，进入待人工核对清单。');
      break;
      case 'shelter-scan-confirm': popup('接收已确认','已按非目标人员登记4人，并同步安置点容量和行动统计。');
      break;
      case 'shelter-transfer-submit': go('shelter-transfer-receive');
      break;
      case 'shelter-receive-confirm': popup('转点交接完成','原点签出、目标点接收和关联任务状态已同步回写。');
      break;
      case 'shelter-receive-abnormal': popup('交接异常已上报','人员仍保持转点中状态，原点和目标点负责人同时收到待办。');
      break;
    }
  });
}
)();
