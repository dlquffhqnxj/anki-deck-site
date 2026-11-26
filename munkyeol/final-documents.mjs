import { isReportKind, finalSubject, notebookKinds, notebookOutput, finalSectors, normalizeFinalText, cleanFinalClassifications } from "./notebook-store.mjs?v=1.11.1";

function companyNames(rows,sector) {
  const names=new Map();
  for(const row of rows) {
    for(const entry of row.classifications || []) {
      const key=normalizeFinalText(entry.company);
      if(entry.sector===sector && !names.has(key))names.set(key,entry.company);
    }
  }
  return [...names].sort(([,a],[,b])=>a && b ? a.localeCompare(b,"ko",{numeric:true}) : Number(!a)-Number(!b));
}

function filingPath(entry) {
  return finalSectors[entry.sector]+" › "+(entry.company || "업체 미지정");
}

function localDay(value = new Date()) {
  const day=new Date(value);
  return [day.getFullYear(),String(day.getMonth()+1).padStart(2,"0"),String(day.getDate()).padStart(2,"0")].join("-");
}

function recordTitle(record) {
  if(record.kind==="weekly")return localDay(record.created)+" 주보";
  const candidates=[record.source.match(/^■\s*([^\n]+)/mu)?.[1],
    record.context.match(/^(?:제목|건명|안건)\s*[:：]\s*([^\n]+)/mu)?.[1],
    notebookOutput(record).match(/^■\s*([^\n]+)/mu)?.[1]];
  return (candidates.map(value=>value?.trim()).find(value=>value && value!=="—") || localDay(record.created)+" 보고서").slice(0,160);
}

function workingBodies(record) {
  const result=notebookOutput(record);
  if(record.kind==="correct")return {ko:"",ja:result};
  if(record.kind==="polish")return {ko:result,ja:""};
  if(record.kind==="translate" && record.lang==="ja")return {ko:result,ja:record.source};
  return {ko:record.source,ja:result};
}

async function recordFingerprint(record) {
  if(!globalThis.crypto?.subtle)return "";
  try {
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(record.id));
    return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
  }catch{return "";}
}

export function startFinalDocuments({store,beforeRead,save,copy,node,button}) {
  const el=id=>document.getElementById(id);
  const dialog=el("final-dialog"), browse=el("final-browse"), form=el("final-form"), list=el("final-list");
  const query=el("final-search"), kindField=el("final-kind"), dateField=el("final-date"), titleField=el("final-title");
  const koField=el("final-ko"), jaField=el("final-ja"), submit=el("final-save");
  const companyFilter=el("final-company-filter"), companyRows=el("final-company-rows");
  let docs=[], records=[], picking=false, filter="all", shown=24, editor=null, saving=false, sequence=0, openId=null;
  let sector="all", selectedCompany=null;
  let recentRequest=0, recentSignature="";

  async function refreshShortcuts() {
    const request=++recentRequest;
    const saved=await store.listFinalDocuments();
    if(request!==recentRequest)return;
    el("final-total").textContent=saved.length+"건";
    const recent=saved.sort((a,b)=>b.updated.localeCompare(a.updated) || b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0,3);
    const signature=JSON.stringify(recent.map(doc=>[doc.id,doc.updated]));
    if(signature===recentSignature)return;
    recentSignature=signature;
    const items=recent.map(doc=>{
      const item=node("li",""), link=button("",()=>open(null,null,{id:doc.id}).catch(onError));
      link.setAttribute("aria-haspopup","dialog");link.setAttribute("aria-controls","final-dialog");
      const meta=[notebookKinds[doc.kind],doc.date,doc.classifications?.[0]?.company].filter(Boolean).join(" · ");
      link.append(node("strong",doc.title),node("small",meta));
      link.title=doc.title;
      item.append(link);
      return item;
    });
    el("menu-recent-list").replaceChildren(...items);
    el("menu-recent-empty").hidden=Boolean(items.length);
  }

  function status(message="",error=false) {
    const output=el("final-status");
    output.textContent=message;
    output.dataset.error=String(error);
  }
  function onError(error) { status(error?.message || "문서 보관함을 열지 못했습니다.",true); }

  function appendBody(container,label,value,lang) {
    if(!value)return;
    const body=node("p",value);body.lang=lang;
    container.append(node("b",label),body);
  }

  function card(row,expanded) {
    const details=document.createElement("details"), summary=document.createElement("summary");
    details.className="nb-entry";details.open=expanded;details.dataset.docId=row.id;
    summary.append(node("small",notebookKinds[row.kind]+" · "+row.date),node("strong",row.title));
    if(!picking)summary.append(node("span",row.classifications?.length ?
      row.classifications.map(filingPath).join(" · ") : "미분류","final-filing-path"));
    details.append(summary);
    function fill() {
      if(!details.open || details.childElementCount>1)return;
      const body=node("div","","nb-body"), actions=node("div","","final-tools");
      appendBody(body,"한국어 검토본",row.ko,"ko");
      appendBody(body,picking?"저장된 일본어":"일본어 최종본",row.ja,"ja");
      if(picking){
        actions.append(button("최종본으로 저장",()=>editRecord(row.record).catch(onError)));
      }else{
        actions.append(button("최종본 수정",()=>edit(row,row)));
        for(const [label,text] of [["일본어 복사",row.ja],["한국어 복사",row.ko]]){
          if(text)actions.append(button(label,async event=>status(await copy(text,event.currentTarget)?"복사했습니다.":"브라우저에서 복사를 허용하지 않았습니다.")));
        }
      }
      body.append(actions);details.append(body);
    }
    details.addEventListener("toggle",fill);fill();
    return details;
  }

  function updateFolders(rows) {
    el("final-folders").hidden=picking;
    if(picking)return;
    for(const tab of dialog.querySelectorAll("[data-final-sector]"))
      tab.setAttribute("aria-pressed",String(tab.dataset.finalSector===sector));
    const hasSector=Object.hasOwn(finalSectors,sector);
    el("final-company-filter-wrap").hidden=sector==="unclassified";
    if(!hasSector) {
      companyFilter.replaceChildren(new Option("먼저 분야를 선택하세요",""));
      companyFilter.disabled=true;
      delete companyFilter.dataset.choices;
      return;
    }
    const names=companyNames(rows,sector);
    if(!names.some(([key])=>key===selectedCompany))selectedCompany=null;
    const signature=JSON.stringify(names);
    if(companyFilter.dataset.choices!==signature) {
      companyFilter.replaceChildren(new Option(names.length ? "전체 업체" : "등록된 업체 없음",""));
      for(const [key,label] of names)companyFilter.add(new Option(label || "업체 미지정","c:"+key));
      companyFilter.dataset.choices=signature;
    }
    companyFilter.disabled=!names.length;
    companyFilter.value=selectedCompany===null ? "" : "c:"+selectedCompany;
  }

  function matchesFolder(row) {
    if(picking || sector==="all")return true;
    const entries=row.classifications || [];
    if(sector==="unclassified")return !entries.length;
    return entries.some(entry=>entry.sector===sector && (selectedCompany===null || normalizeFinalText(entry.company)===selectedCompany));
  }

  function render() {
    const expanded=new Set([...list.querySelectorAll("details[open]")].map(item=>item.dataset.docId));
    const text=normalizeFinalText(query.value);
    const byKind=(picking?records:docs).filter(row=>filter==="all" || row.kind===filter);
    updateFolders(byKind);
    const rows=byKind.filter(row=>matchesFolder(row) && (!text ||
      normalizeFinalText([row.title,row.date,row.ko,row.ja,...(row.classifications || []).map(filingPath)].join("\n")).includes(text)));
    const index=rows.findIndex(row=>row.id===openId);
    if(index>=shown)shown=index+1;
    list.replaceChildren();
    for(const row of rows.slice(0,shown))list.append(card(row,row.id===openId || expanded.has(row.id)));
    el("final-more").hidden=rows.length<=shown;
    el("final-heading").textContent=picking?"기존 보고서·주보 기록":"보고서·주보 최종본";
    el("final-pick").textContent=picking?"최종본 목록으로":"기존 기록에서 선택";
    el("final-search-label").textContent=picking?"기존 기록 검색":"최종본 검색";
    el("final-count").textContent=picking ? "기존 기록 "+rows.length+"건 · 최근 수정순" :
      "최종본 "+rows.length+"건 · 문서 기준일 최신순";
    for(const tab of dialog.querySelectorAll("[data-final-kind]"))tab.setAttribute("aria-pressed",String(tab.dataset.finalKind===filter));
    if(!rows.length)list.append(node("p",text?"검색 결과가 없습니다.":picking?"저장한 보고서·주보 작업 기록이 없습니다.":
      sector!=="all"?"이 분류에 등록된 최종본이 없습니다.":
      "아직 등록된 최종본이 없습니다. 기존 기록에서 선택하거나 완성한 문서를 직접 등록하세요.","status"));
    openId=null;
  }

  function showList() {
    editor=null; form.hidden=true; browse.hidden=false; render();
  }
  async function load(ticket) {
    await beforeRead();
    const [saved,work]=await Promise.all([store.listFinalDocuments(),picking?store.list():[]]);
    if(ticket!==sequence || !dialog.open)return false;
    docs=saved.sort((a,b)=>b.date.localeCompare(a.date) || b.updated.localeCompare(a.updated));
    el("final-total").textContent=docs.length+"건";
    records=work.filter(record=>isReportKind(record.kind)).sort((a,b)=>b.updated.localeCompare(a.updated)).map(record=>({
      id:record.id,kind:record.kind,date:localDay(record.created),title:recordTitle(record),ko:record.source,ja:notebookOutput(record),record}));
    return true;
  }

  function editNew(draft) {
    edit({date:localDay(),title:"",ko:"",ja:"",...draft});
  }
  async function open(record=null,draft=null,view={}) {
    const ticket=++sequence;
    if(!dialog.open)dialog.showModal();
    editor=null;form.hidden=true;browse.hidden=true;filter="all";sector=view.sector || "all";selectedCompany=null;picking=false;query.value="";shown=24;openId=view.id || null;
    list.replaceChildren();status("저장한 문서를 읽고 있습니다.");
    if(!await load(ticket))return;
    status(store.persistent?"":store.account?"로그인 전입니다. 지금 작성한 기록은 이 창에 임시 보관됩니다.":"현재 창에 임시 보관 중입니다. 닫기 전에 기록 포함 HTML을 저장하세요.");
    if(record)await editRecord(record);
    else if(draft)editNew(draft);
    else {
      showList();
      const opened=view.id && list.querySelector("details[open] summary");
      if(opened)opened.focus();
      else query.focus();
    }
  }
  async function refresh() {
    if(!dialog.open || editor || browse.hidden)return;
    const ticket=++sequence;
    if(await load(ticket) && !editor)render();
  }

  function addCompanyRow(entry={sector:"",company:""}) {
    const row=node("div","","final-company-row");
    const sectorLabel=node("label","분야"), companyLabel=node("label","업체명");
    const select=document.createElement("select"), company=document.createElement("input");
    select.add(new Option("분야 선택",""));
    for(const [key,name] of Object.entries(finalSectors))select.add(new Option(name,key));
    select.value=entry.sector;
    company.type="text";company.maxLength=160;company.value=entry.company;
    company.placeholder="업체명 입력 또는 선택";
    function updateRow() {
      if(select.value)company.setAttribute("list","final-companies-"+select.value);
      else company.removeAttribute("list");
      select.setCustomValidity(company.value.trim() && !select.value ? "업체가 속할 분야를 선택하세요." : "");
    }
    select.onchange=company.oninput=()=>{updateRow();showSaveAction();};
    updateRow();
    const remove=button("제외",()=>{
      const adjacent=row.nextElementSibling || row.previousElementSibling;
      row.remove();
      (adjacent?.querySelector("select") || addCompanyRow()).focus();
      showSaveAction();
    });
    remove.setAttribute("aria-label","분야·업체 행 제외");
    sectorLabel.append(select);companyLabel.append(company);
    row.append(sectorLabel,companyLabel,remove);companyRows.append(row);
    return select;
  }

  function setCompanies(entries) {
    for(const sectorKey of Object.keys(finalSectors)) {
      const options=companyNames(docs,sectorKey).filter(([,name])=>name).map(([,name])=>new Option(name,name));
      el("final-companies-"+sectorKey).replaceChildren(...options);
    }
    companyRows.replaceChildren();
    if(entries?.length)entries.forEach(addCompanyRow);
    else addCompanyRow();
  }

  function readCompanies() {
    const entries=[];
    for(const row of companyRows.children) {
      const selected=row.querySelector("select").value;
      if(selected)entries.push({sector:selected,company:row.querySelector("input").value});
    }
    return cleanFinalClassifications(entries);
  }

  function matchingDocument() {
    if(editor.base)return editor.base;
    const key=finalSubject({kind:kindField.value,date:dateField.value,title:titleField.value,classifications:readCompanies()});
    return editor.choices.find(doc=>finalSubject(doc)===key);
  }
  function showSaveAction() {
    const target=matchingDocument();
    submit.textContent=target?"기존 최종본 갱신":"최종본 저장";
    el("final-save-hint").textContent=target?
      "‘"+target.title+"’의 최종본 한 건을 갱신합니다.":"한국어와 일본어 중 한 가지 이상을 입력하세요.";
  }
  function edit(values,base=null,hash="") {
    const id=[...crypto.getRandomValues(new Uint8Array(12))].map(x=>x.toString(16).padStart(2,"0")).join("");
    editor={base,hash,id,choices:docs.slice(),work:values.work};
    browse.hidden=true;form.hidden=false;
    kindField.value=values.kind;kindField.disabled=Boolean(base || values.lockKind);
    dateField.value=values.date;titleField.value=values.title;koField.value=values.ko;jaField.value=values.ja;
    setCompanies(base?.classifications ?? values.classifications);
    el("final-work-choice").hidden=!(base && values.work &&
      (base.ko!==values.work.ko || base.ja!==values.work.ja));
    el("final-heading").textContent=base?"최종본 수정":"최종본 등록";
    status();showSaveAction();dialog.scrollTop=0;titleField.focus();
  }
  async function editRecord(record) {
    const ticket=++sequence;
    const hash=await recordFingerprint(record);
    if(ticket!==sequence || !dialog.open)return;
    const base=hash && docs.find(doc=>doc.origins.includes(hash));
    const lockKind=isReportKind(record.kind);
    const work=workingBodies(record);
    edit({kind:base?.kind || (lockKind?record.kind:"report"),date:base?.date || localDay(record.created),
      title:base?.title ?? (lockKind?recordTitle(record):""),ko:base?.ko ?? work.ko,ja:base?.ja ?? work.ja,
      lockKind,work},base || null,hash);
  }

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(saving || !editor || !form.reportValidity())return;
    if(!titleField.value.trim()){status("보관할 제목을 입력하세요.",true);titleField.focus();return;}
    if(!koField.value.trim() && !jaField.value.trim()){status("한국어 또는 일본어 본문을 입력하세요.",true);jaField.focus();return;}
    const target=matchingDocument();
    const values={id:target?.id || editor.id,kind:kindField.value,date:dateField.value,title:titleField.value.trim(),
      ko:koField.value,ja:jaField.value,classifications:readCompanies(),origins:editor.hash?[editor.hash]:[]};
    const ticket=++sequence;
    saving=true;form.inert=true;
    try {
      const saved=await save(values,target?.updated ?? null);
      if(!await load(ticket))return;
      const stored=docs.find(doc=>doc.id===saved.id);
      if(!stored || stored.updated!==saved.updated)throw new Error("최신 최종본을 목록에서 다시 확인해 주세요.");
      picking=false;filter=saved.kind;query.value="";shown=24;openId=saved.id;list.replaceChildren();
      const first=saved.classifications?.[0];
      sector=first?.sector || "unclassified";
      selectedCompany=first ? normalizeFinalText(first.company) : null;
      showList();status(store.persistent?"최종본을 저장하고 다시 읽었습니다.":"최종본을 이 창에 임시 보관했습니다. 닫기 전에 백업을 저장하세요.");
      list.querySelector("details[open] summary")?.focus();
    }catch(error){onError(error);}
    finally{saving=false;form.inert=false;}
  });
  el("final-company-add").onclick=()=>addCompanyRow().focus();
  for(const field of [kindField,dateField,titleField])field.addEventListener("input",showSaveAction);
  el("final-use-work").onclick=()=>{
    if(!editor?.work)return;
    koField.value=editor.work.ko;jaField.value=editor.work.ja;
    el("final-work-choice").hidden=true;
    status("작업 기록의 본문을 불러왔습니다. 검토한 뒤 갱신하세요.");
  };
  el("final-open").onclick=()=>open().catch(onError);
  for(const shortcut of document.querySelectorAll("[data-archive-sector]"))
    shortcut.onclick=()=>open(null,null,{sector:shortcut.dataset.archiveSector}).catch(onError);
  el("final-pick").onclick=async()=>{
    const ticket=++sequence;
    picking=!picking;query.value="";shown=24;list.replaceChildren();status();render();
    try {if(await load(ticket) && !editor){render();query.focus();}}
    catch(error){onError(error);}
  };
  el("final-new").onclick=()=>{
    const classifications=!picking && Object.hasOwn(finalSectors,sector) ? [{sector,company:
      selectedCompany ? companyFilter.selectedOptions[0].textContent : ""}] : [];
    editNew({kind:filter==="weekly"?"weekly":"report",classifications});
  };
  el("final-cancel").onclick=()=>{status();showList();refresh().catch(onError);query.focus();};
  el("final-close").onclick=()=>dialog.close();
  dialog.addEventListener("close",()=>{sequence++;editor=null;});
  for(const tab of dialog.querySelectorAll("[data-final-kind]"))tab.onclick=()=>{filter=tab.dataset.finalKind;shown=24;render();};
  for(const tab of dialog.querySelectorAll("[data-final-sector]"))tab.onclick=()=>{
    sector=tab.dataset.finalSector;selectedCompany=null;shown=24;render();
  };
  companyFilter.onchange=()=>{selectedCompany=companyFilter.value ? companyFilter.value.slice(2) : null;shown=24;render();};
  query.oninput=()=>{shown=24;render();};
  el("final-more").onclick=()=>{shown+=24;render();};
  return {open:(record,draft)=>open(record,draft).catch(onError),refresh:()=>refresh().catch(onError),refreshShortcuts};
}
