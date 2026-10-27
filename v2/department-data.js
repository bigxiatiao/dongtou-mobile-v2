/* 部门字段、名册与指令示例；页面和存储规则不在这里维护。 */
(() => {
  const options = window.TransferDemoData.formOptions;
  const field = (key, label, group, extra = {}) => ({ key, label, group, type: 'text', ...extra });
  const pick = (key, label, group, values, extra = {}) => field(key, label, group, { type: 'choice', options: values, ...extra });
  const yesNo = ['是', '否', '未知'];
  const definitions = [
    { id: 'housing', name: '住建', fullName: '区住建局', user: '陈海宁', phone: '0577-60001001', type: 'site', unitLabel: '项目', identities: ['工人','管理人员','其他'], measure: ['stopWork','停工落实'] },
    { id: 'education', name: '教育局', fullName: '区教育局', user: '李晓芸', phone: '0577-60001002', type: 'school', unitLabel: '学校', identities: ['学生','教职工','其他'], measure: ['suspendClasses','停课落实'] },
    { id: 'agriculture', name: '农业农村', fullName: '区农业农村局', user: '周海波', phone: '0577-60001003', type: 'sea', unitLabel: '海上点位', identities: ['船员','养殖人员','其他作业人员'], measure: ['stopOperation','停止作业落实'] },
    { id: 'economy', name: '经信局', fullName: '区经信局', user: '王思敏', phone: '0577-60001004', type: 'enterprise', unitLabel: '企业', identities: ['员工','其他'], measure: ['stopProduction','停工停产落实'] }
  ];
  const labels = { site:'工地', school:'学校', sea:'海上单位', enterprise:'企业', vessel:'船舶', raft:'渔排', worksite:'海上作业点' };
  const base = [
    field('name', '单位名称', '基本信息', { required: true }),
    field('departmentId','所属部门','基本信息',{ readonly:true }),
    field('unitType','特殊网格类型','基本信息',{ readonly:true }),
    field('streetId','所在街道','基本信息',{ type:'street' }),
    field('address','详细地址','基本信息',{ required:true }),
    field('location','地图位置','基本信息',{ type:'location' }),
    field('principalName','负责人','负责人及联系',{ required:true }),
    field('principalPhone','负责人联系电话','负责人及联系',{ type:'tel',required:true }),
    field('contactName','备用联系人','负责人及联系'),
    field('contactPhone','备用联系电话','负责人及联系',{ type:'tel' })
  ];
  const extensions = {
    site: [field('constructionExtent','施工范围说明','项目资料',{type:'textarea'}),pick('projectType','项目类型','项目资料',['房建','市政','其他']),pick('projectStage','项目阶段','项目资料',['基础施工','主体施工','装饰施工','停工维护','已竣工']),field('ownerCompany','建设单位','项目资料'),field('contractorCompany','施工单位','项目资料'),pick('hasPit','是否涉及深基坑','项目资料',yesNo),pick('hasCrane','是否涉及塔吊','项目资料',yesNo),pick('hasTemporaryStructure','是否涉及临建设施','项目资料',yesNo)],
    school: [pick('schoolType','学校类型','学校资料',['幼儿园','小学','初中','高中','其他']),pick('boarding','是否寄宿','学校资料',yesNo),field('buildingCount','校舍数量','学校资料',{type:'integer'})],
    sea: [field('operatorName','经营或管理主体','管理资料')],
    enterprise: [field('enterpriseType','企业类型','企业资料'),field('creditCode','统一社会信用代码','企业资料',{type:'credit'}),pick('hasHazardousMaterial','是否涉及危化品','企业资料',yesNo)]
  };
  const systemFields = [field('id','资料编号','维护记录',{readonly:true}),field('verification.status','数据核查状态','维护记录',{readonly:true}),field('verification.by','核查人','维护记录',{readonly:true}),field('verification.at','核查时间','维护记录',{readonly:true}),field('updatedAt','更新时间','维护记录',{readonly:true})];
  function unitFields(dept, record = {}) {
    const rows = base.map(f => ({...f}));
    rows[0].label = `${dept.unitLabel === '海上点位' ? '对象' : dept.unitLabel}名称`;
    if (dept.type === 'site') {
      rows.find(f=>f.key==='streetId').label='项目部所在街道';
      Object.assign(rows.find(f=>f.key==='address'),{label:'项目部地址',required:false});
      rows.find(f=>f.key==='location').label='项目部位置';
      rows.find(f=>f.key==='principalName').label='项目负责人';
    }
    if (dept.type === 'school' || dept.type === 'enterprise') {
      const school = dept.type === 'school';
      rows.splice(1,0,field(school?'campusName':'plantName',school?'校区名称':'厂区名称','基本信息'));
      rows.find(f=>f.key==='address').label=school?'学校地址':'生产经营地址';
      rows.find(f=>f.key==='location').label=school?'学校位置':'厂区位置';
      rows.find(f=>f.key==='principalName').label=school?'学校负责人':'企业负责人';
      rows.find(f=>f.key==='contactName').label='应急联系人'; rows.find(f=>f.key==='contactPhone').label='应急联系电话';
    }
    if (dept.type === 'sea') {
      rows.unshift(pick('objectType','对象类型','基本信息',[{value:'vessel',label:'船舶'},{value:'raft',label:'渔排'},{value:'worksite',label:'海上作业点'}],{required:true,immutable:true}));
      rows.splice(2,0,field(record.objectType==='vessel'?'vesselNumber':'pointNumber',record.objectType==='vessel'?'船名船号':'点位编号','基本信息',{required:record.objectType==='vessel',when:r=>!!r.objectType}));
      rows.splice(rows.findIndex(f=>f.key==='streetId'),1);
      rows.splice(rows.findIndex(f=>f.key==='address'),0,field('portOrSeaArea','所属港区/海域','位置资料'));
      rows.find(f=>f.key==='address').label='位置说明';
      rows.find(f=>f.key==='location').label=record.objectType==='vessel'?'登记位置（非实时）':'作业位置';
      rows.find(f=>f.key==='principalName').label=record.objectType==='vessel'?'船长':'作业负责人';
    }
    return [...rows,...extensions[dept.type],field('note','备注','资料',{type:'textarea'}),...systemFields];
  }
  function personFields(dept, record = {}) {
    const student = dept.type==='school' && record.membership?.identity==='学生';
    return [field('name','姓名','人员信息',{required:true}),field('membership.unitId',`所属${dept.unitLabel}`,'人员信息',{readonly:true,required:true}),pick('membership.identity','人员身份','人员信息',dept.identities,{required:true}),field('phone','联系电话','人员信息',{type:'tel'}),pick('documentType','证件类型','人员信息',['居民身份证','护照','其他证件']),field('documentNumber','证件号码','人员信息',{when:r=>!!r.documentType,type:'document'}),pick('membership.status','与单位关联状态','单位关系',['在册','已离开'],{required:true}),field('emergencyContact.name',student?'监护人姓名':'紧急联系人姓名','联系信息'),pick('emergencyContact.relationship','与本人关系','联系信息',options.relationship),field('emergencyContact.phone',student?'监护人联系电话':'紧急联系电话','联系信息',{type:'tel'}),field('membership.grade','年级','学校信息',{when:r=>dept.type==='school'&&r.membership?.identity==='学生'}),field('membership.className','班级','学校信息',{when:r=>dept.type==='school'&&r.membership?.identity==='学生'}),field('membership.position','部门/岗位','任职信息',{when:()=>dept.type==='enterprise'}),field('tagIds','人员标签','补充信息',{type:'tags'}),field('note','备注','补充信息',{type:'textarea'}),field('id','人员资料编号','维护记录',{readonly:true}),field('membership.id','单位关联编号','维护记录',{readonly:true}),field('membership.verification.status','人员资料核查状态','维护记录',{readonly:true}),field('membership.verification.by','核查人','维护记录',{readonly:true}),field('membership.verification.at','核查时间','维护记录',{readonly:true}),field('updatedAt','资料更新时间','维护记录',{readonly:true})];
  }
  const inspect = (key,label,type,values,when) => field(`inspection.${key}`,label,'现场检查',{type,options:values,when});
  const inspections = {
    site:[inspect('pit','深基坑现场情况','choice',['正常','需关注','积水需处置','边坡变形','已封闭','不涉及'],u=>u.hasPit!=='否'),inspect('crane','塔吊设备情况','choice',['已降节/加固','部分未落实','停电锁定','存在倾覆风险','不涉及'],u=>u.hasCrane!=='否'),inspect('temporaryStructure','临建设施情况','choice',['已加固','部分加固','需拆除','存在倒塌风险','不涉及'],u=>u.hasTemporaryStructure!=='否'),inspect('electricity','施工用电','choice',['已断电','保留应急电源','未断电','漏电风险']),inspect('presentCount','本次现场人数','integer')],
    school:[inspect('building','校舍检查','choice',['安全','轻微渗水','局部受损','禁止使用','待专业鉴定']),inspect('underground','地下空间','choice',['正常','局部渗水','积水','已封闭','不涉及']),inspect('materials','物资保障','choice',['充足','满足24小时','不足需补充','严重不足']),inspect('remainingCount','本次留校人数','integer')],
    sea:[inspect('raft','渔排状态','choice',['已加固','部分加固','需撤离','损坏','不涉及'],u=>u.objectType==='raft'),inspect('navigationBan','禁航落实','choice',['已落实','部分落实','未落实','发现违规'],(u,e)=>!!e?.navigationBanApplicable&&u.objectType!=='raft'),inspect('returnPort','本次回港位置说明','text',null,u=>u.objectType==='vessel'),inspect('landingPlace','本次上岸地点说明','text')],
    enterprise:[inspect('production','本次生产状态','choice',['正常生产','部分停产','全面停产','应急值守']),inspect('hazardousMaterial','危化品情况','choice',['无危化品','已转移','已加固','存在泄漏风险','需专业处置'],u=>u.hasHazardousMaterial!=='否'),inspect('power','配电设施','choice',['正常','已抬高防护','已断电','进水风险','设备受损']),inspect('materials','应急物资','choice',['充足','基本充足','不足需调拨','严重不足']),inspect('onDutyCount','本次在岗人数','integer'),inspect('guardCount','本次值守人数','integer')]
  };
  const destinationFields = {
    center: [['placeId','安置点选择','shelter'],['detail','区域/床位','text',true],['careNeed','特殊照护需求','textarea',true]],
    relative:[['contact','亲友姓名'],['relationship','亲友关系','relationship'],['phone','亲友电话','tel'],['address','详细地址'],['location','地址选点','location'],['careNeed','特殊照护需求','textarea',true]],
    hotel:[['placeName','酒店/民宿名称'],['address','详细地址'],['location','地址选点','location'],['contact','联系人'],['phone','电话','tel'],['detail','房间号','text',true],['residentCount','入住人数','positive',true],['careNeed','特殊照护需求','textarea',true]],
    care:[['placeName','机构名称'],['address','详细地址'],['location','地址选点','location'],['contact','联系人'],['phone','电话','tel'],['careLevel','护理等级','careLevel',true],['careNeed','特殊照护需求','textarea',true]],
    other:[['customType','安置类型'],['placeName','地点名称'],['address','详细地址'],['location','地址选点','location'],['contact','联系人'],['phone','电话','tel'],['transport','交通方式','text',true],['careNeed','特殊照护需求','textarea',true]],
    unknown:[['followupAt','后续跟进时间','datetime',true]]
  };
  function seed() {
    const units=[], people=[], memberships=[], instructions=[], executions=[], tasks=[];
    const date='2026-09-16 10:00';
    const names={housing:['滨海安居工程','全区供水管道改造项目部','新城综合体项目','市政道路维护项目','海堤加固项目'],education:['东屏实验小学','北岙中心学校','海霞幼儿园','城东学校','海湾学校'],agriculture:['浙洞渔示例01','东岙养殖渔排','海湾作业点','浙洞渔示例02','西湾养殖渔排'],economy:['海洋食品示例企业','新城机电示例企业','海湾包装示例企业','港区冷链示例企业','东岙制造示例企业']};
    const peopleNames=['陈志明','王建平','林晓东','周秀兰','郑海强','吴美琴','李海燕','孙志远','黄小宇','徐文静','方建华','叶晓宁','赵丽','许海峰'];
    definitions.forEach((dept,di)=>{
      for(let n=0;n<5;n++) {
        const id=`${dept.id}-u${n+1}`;
        const unit={id,departmentId:dept.id,unitType:dept.type,name:names[dept.id][n],streetId:n===1?'bq':'dp',address:`洞头区${n===1?'北岙':'东屏'}街道${['海滨路18号','霞晖大道66号','育才路16号','港区路26号','海霞路38号'][n]}`,location:{lng:121.15+n*.002,lat:27.83+n*.001},mapPoint:{x:20+n*14,y:28+(n%2)*30},principalName:['陈建华','李海平','周晓梅','王国强','林秀琴'][n],principalPhone:n===1?'0577-60002001':`1380000${di}${n}01`,contactName:'',contactPhone:'',note:'演示单位资料，可在编辑中补充。',verification:{status:n%2?'verified':'pending',by:n%2?dept.user:'',at:n%2?date:''},updatedAt:date};
        if(dept.type==='site') Object.assign(unit,{constructionExtent:n===1?'全区管道分段施工，点位仅为项目部':'本项目施工区域',projectType:n===1?'市政':'房建',projectStage:'主体施工',ownerCompany:'洞头示例建设单位',contractorCompany:'示例施工单位',hasPit:n===1?'否':'是',hasCrane:n===1?'否':'未知',hasTemporaryStructure:'是'});
        if(dept.type==='school')Object.assign(unit,{campusName:n===1?'主校区':'',schoolType:n===2?'幼儿园':'小学',boarding:'否',buildingCount:'2'});
        if(dept.type==='sea')Object.assign(unit,{objectType:['vessel','raft','worksite','vessel','raft'][n],vesselNumber:n===0||n===3?`浙洞渔示例0${n+1}`:'',pointNumber:n===1||n===2||n===4?`HY-${n+1}`:'',portOrSeaArea:'东屏近海',operatorName:'示例作业合作社'});
        if(dept.type==='enterprise')Object.assign(unit,{plantName:'',enterpriseType:'生产制造',creditCode:'',hasHazardousMaterial:n===1?'否':'未知'});
        units.push(unit);
        const instrId=`${dept.id}-i${n+1}`;
        const measures=dept.type==='sea'?(unit.objectType==='vessel'?[['returnToPort','回港落实'],['stopSeaOperation','停止出海作业落实']]:[['stopOperation','停止作业落实']]):[dept.measure];
        const instruction={id:instrId,actionId:window.TransferDemoData.action.id,type:'转移',departmentId:dept.id,name:`${unit.name}：${dept.type==='sea'?measures[0][1]:dept.measure[1]}`,requirement:`请落实${measures.map(x=>x[1]).join('、')}，逐人记录转移去向并确认安置。`,deadline:'2026-09-16 16:00',targetUnitTypes:[dept.type],targetObjectTypes:dept.type==='sea'?[unit.objectType]:[],unitIds:[id],personnelMode:n===3?'none':'roster'};
        instructions.push(instruction);
        const exec={id:`${id}-execution`,unitId:id,instructionId:instrId,departmentId:dept.id,actionId:instruction.actionId,measures:measures.map(([key,label])=>({key,label,result:n===1||n===3?'已落实':n===2?'未落实':''})),noTransferRequired:n===3,personTaskIds:[],note:'',photos:[],inspection:{},events:[],navigationBanApplicable:unit.objectType==='vessel'};
        executions.push(exec);
        const count=n<2?6:n===2?2:0;
        for(let p=0;p<count;p++) {
          const personId=`${dept.id}-p${n*6+p+1}`,memberId=`${personId}-membership`,identity=dept.type==='school'?(p<4?'学生':'教职工'):dept.type==='sea'?(unit.objectType==='vessel'?'船员':'养殖人员'):dept.identities[0];
          people.push({id:personId,departmentId:dept.id,name:peopleNames[n*6+p],phone:identity==='学生'?'':`139000${di}${n}${String(p+1).padStart(3,'0')}`,documentType:'',documentNumber:'',emergencyContact:{name:identity==='学生'?'家长王女士':'林女士',relationship:identity==='学生'?'父母':'其他亲属',phone:'13700001111'},tagIds:p===3&&dept.type!=='school'?['person-elder']:[],note:'',updatedAt:date});
          memberships.push({id:memberId,personId,departmentId:dept.id,unitId:id,identity,status:'在册',grade:identity==='学生'?'三年级':'',className:identity==='学生'?'1班':'',position:dept.type==='enterprise'?'生产部':'',verification:{status:p%2?'verified':'pending',by:p%2?dept.user:'',at:p%2?date:''}});
          const status=n===0?'待转移':n===2?'已复核':['待转移','转移途中','待复核','已复核','异常跟进','待复核'][p];
          const tid=`${personId}-task`,settled=['待复核','已复核'].includes(status);
          const reviewRecords=status==='已复核'?[{id:`${tid}-r1`,at:date,result:'通过',actorId:dept.id,actorName:dept.user,note:'已联系本人，确认安置情况。',photos:[]}]:[];
          const pendingCorrections=n===2&&p===0?[{id:`${tid}-correction`,reviewId:reviewRecords[0].id,taskId:tid,status:'pending',note:'联系人电话待补充，请核实后确认处理。',at:date}]:[];
          tasks.push({id:tid,departmentId:dept.id,personId,membershipId:memberId,unitId:id,unitName:unit.name,instructionId:instrId,executionId:exec.id,actionId:instruction.actionId,status,transferResult:status==='转移途中'?'转移途中':settled?'已落实安置':status==='异常跟进'?'拒绝转移':'',destination:settled?{type:'center',placeId:'shelter-001'}:null,plannedDestination:null,note:status==='异常跟进'?'本人暂不愿离开，已联系负责人共同劝导。':'',photos:[],reviewRecords,pendingCorrections,events:[{id:`${tid}-e1`,at:date,actorName:dept.user,type:'指令下发',detail:`本次依据：${instruction.name}；所属单位：${unit.name}`},...(settled?[{id:`${tid}-e2`,at:date,actorName:dept.user,type:'已落实安置',detail:'已联系本人确认在东屏避灾安置中心安置，等待或已完成明确复核。'}]:[])]});
          exec.personTaskIds.push(tid);
        }
      }
      const unit=units.find(u=>u.id===`${dept.id}-u4`),original=executions.find(e=>e.unitId===unit.id);
      const id=`${dept.id}-supplement`;
      instructions.push({id,actionId:window.TransferDemoData.action.id,type:'转移',departmentId:dept.id,name:`${unit.name}补充措施检查`,requirement:'本次明确无需转移人员，确认适用单位措施。',deadline:'2026-09-16 18:00',targetUnitTypes:[dept.type],targetObjectTypes:unit.objectType?[unit.objectType]:[],unitIds:[unit.id],personnelMode:'none'});
      executions.push({...JSON.parse(JSON.stringify(original)),id:`${unit.id}-supplement`,instructionId:id,measures:original.measures.map(m=>({...m,result:''})),events:[]});
    });
    const accounts=definitions.map(dept=>({...dept,accountId:`account-${dept.id}`,authorizedUnitIds:units.filter(u=>u.departmentId===dept.id).map(u=>u.id)}));
    return {accounts,units,people,memberships,instructions,executions,tasks,contacts:[{id:'public-emergency',visibility:'public',name:'区应急值班室（示例）',organization:'区应急管理部门',position:'应急值班',phone:'0577-60000000'},{id:'public-reserve',visibility:'public',name:'备用联络岗（示例）',organization:'公共应急联络',position:'备用联络',phone:''}]};
  }
  window.DepartmentData={definitions,labels,unitFields,personFields,inspections,destinationFields,seed};
})();
