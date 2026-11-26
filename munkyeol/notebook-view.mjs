import { NotebookStore, newNotebookRecord, newNotebookIssue, notebookOutput, notebookBackup, readNotebookArchive, notebookKinds, notebookWords, notebookReferenceIndex, relatedNotebookRecords, issueTypes, localNotebookOrigin, isReportKind } from "./notebook-store.mjs";
import { sentencePieces } from "./language-tools.mjs";
import { preparePortableUpdate, makePortableHtml, readPortableNotebook, readPortableFile } from "./portable-notebook.mjs";
import { startFinalDocuments } from "./final-documents.mjs";

export function startNotebook({collectWords, canAsk, ask, exportWords, reuse, currentSource, currentResult, changesFor, replay, copy, termPairs, store=new NotebookStore(),onStoreRefresh}) {
  const el=id=>document.getElementById(id);
  const dialog=el("notebook-dialog");
  const textNode=(tag,content,cls="")=>{const n=document.createElement(tag);n.textContent=content;if(cls)n.className=cls;return n;};
  const button=(caption,fn)=>{const b=textNode("button",caption,"editor-button");b.type="button";b.addEventListener("click",fn);return b;};
  const mainStatus=el("nb-indicator"), status=el("nb-status"), list=el("nb-list");
  const version=el("app-version").textContent;
  const normalize=text=>String(text).normalize("NFKC").trim().toLocaleLowerCase().replace(/[ァ-ヶ]/gu,letter=>String.fromCharCode(letter.charCodeAt(0)-0x60));
  const date=new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"short",day:"numeric"});
  const time=new Intl.DateTimeFormat("ko-KR",{hour:"numeric",minute:"2-digit",second:"2-digit"});
  let records=[],issues=[],totalWords=0,view="examples",shown=24,focusId=null,searchVersion=0,editing=false,asking=null,issueContext=null;
  let queue=Promise.resolve(), broadcast, portableRestored=false;
  let referenceIndex=new Map(), referenceSignature="";
  try {broadcast=new BroadcastChannel(store.account ? "munkyeol.account.notebook."+(store.account.session?.userId || "guest") : "munkyeol.notebook.changes");} catch { /* Reopening the panel reads fresh data. */ }

  function tell(text) {
    const suffix=store.persistent ? "" : " · 이 창에서만 보관 중입니다.";
    status.textContent=text+suffix;
  }

  function savedStatus() {
    const mode=store.persistent ? (store.account?"계정 · ":"")+(store.auto?"자동 저장 켜짐":"자동 저장 꺼짐") : store.account?"로그인 전 · 이 창에 임시 보관":"이 창에 임시 보관";
    mainStatus.textContent=mode+" · 예문장 기록 "+records.length+"건 · 누적 단어 "+totalWords+"개";
    mainStatus.dataset.storage=store.persistent?"ready":"temporary";
    const locationLabel=el("nb-storage-location");
    const locationHelp=el("nb-storage-help");
    if(store.account){
      locationLabel.textContent=store.persistent ? "내 문결 계정" : "로그인 전 · 이 창의 임시 보관함";
      locationHelp.textContent=store.persistent ? "다른 기기에서도 같은 계정으로 로그인하면 저장한 문서를 열 수 있습니다." : "로그인 후 수행한 작업은 내 계정에 저장됩니다. 로그인 전에 작성한 기록을 옮기려면 먼저 백업을 내려받으세요.";
    }else if(!store.db){
      locationLabel.textContent="현재 창의 임시 보관함";
      locationHelp.textContent="창을 닫기 전에 기록 포함 HTML이나 JSON 백업을 저장하세요.";
    }else if(location.origin===localNotebookOrigin){
      locationLabel.textContent="내 PC의 고정 주소 · "+localNotebookOrigin;
      locationHelp.textContent="다음 버전에서도 이 주소를 같은 브라우저 프로필로 열면 기록이 이어집니다.";
    }else if(location.protocol==="file:"){
      locationLabel.textContent="다운로드한 HTML · 이 브라우저";
      locationHelp.textContent="다음 버전으로 바꿀 때 ‘HTML 업데이트’에서 현재 기록을 함께 담을 수 있습니다.";
    }else{
      locationLabel.textContent="이 브라우저 · "+location.origin;
      locationHelp.textContent="같은 주소와 브라우저 프로필에서 새 버전을 열면 기록이 이어집니다.";
    }
    if(portableRestored) locationHelp.textContent="개인용 HTML의 기록을 불러왔습니다. "+locationHelp.textContent;
  }

  function storageError(error) {
    if(error?.name==="QuotaExceededError")return "브라우저 저장 공간이 부족합니다.";
    if(error?.name==="InvalidStateError" || error?.name==="SecurityError")return "브라우저 저장 공간에 접근할 수 없습니다.";
    return error?.message || "브라우저에서 기록을 확인하지 못했습니다.";
  }

  function queued(action) {
    const next=queue.then(action);
    queue=next.catch(error=>tell(storageError(error)));
    return next;
  }

  async function reload() {
    const token=++searchVersion;
    const [rows,problems]=await Promise.all([store.list(),store.listIssues()]);
    if(token!==searchVersion)return;
    records=rows.sort((a,b)=>b.updated.localeCompare(a.updated));
    issues=problems.sort((a,b)=>b.updated.localeCompare(a.updated));
    totalWords=notebookWords(records).length;
    referenceIndex=notebookReferenceIndex(records,termPairs);
    savedStatus();
    if(dialog.open && !editing) render();
    checkReuse();
    refreshReceipt();
  }

  async function changed(message) {
    if(message)tell(message);
    await reload();
    broadcast?.postMessage("changed");
  }
  async function refreshFromStorage() {
    await store.ready;
    if(store.refresh) await store.refresh();
    onStoreRefresh?.();
    if(store.db)store.auto=(await store.read("preferences","automatic"))!==false;
    el("nb-auto").checked=store.auto;
    el("nb-auto").disabled=false;
    await Promise.all([reload(),finals.refreshShortcuts()]);
  }
  function showStorageError(error) {
    tell(storageError(error));
    mainStatus.textContent="저장 공간 확인 실패 · "+storageError(error);
    mainStatus.dataset.storage="failed";
  }
  async function initialize() {
    let restoreError;
    try {
      const portable=readPortableNotebook(el("portable-notebook")?.textContent);
      if(portable)portableRestored=await store.importRecords(portable.records,portable.issues,portable);
    }catch(error){
      restoreError=error;
    }
    await refreshFromStorage();
    if(restoreError)showStorageError(restoreError);
  }
  const finals=startFinalDocuments({store,beforeRead:async()=>{await queue;if(store.refresh)await store.refresh();},copy,node:textNode,button,
    save:(values,expected)=>queued(async()=>{
      const saved=await store.saveFinalDocument(values,expected);
      await finals.refreshShortcuts();
      broadcast?.postMessage("changed");
      return saved;
    })
  });
  broadcast?.addEventListener("message",()=>{
    queue.then(refreshFromStorage).catch(showStorageError);
    finals.refresh();
  });
  queue=initialize().catch(showStorageError);

  function refreshReceipt() {
    const ref=currentResult(), area=el("nb-receipt"), message=el("nb-receipt-status"), action=el("nb-receipt-action");
    area.hidden=!ref;
    if(!ref)return;
    const empty=ref.revision && !ref.revision.text.trim();
    const state=empty?"empty":ref.status;
    const stamp=ref.acknowledged ? " · "+time.format(ref.acknowledged)+" · 연결 단어 "+ref.savedRecord.words.length+"개":"";
    area.dataset.state=state;
    message.textContent=({
      pending:"이번 결과의 저장을 확인하고 있습니다.",
      saved:"이번 결과 저장 확인됨"+stamp,
      temporary:"이 창에 임시 보관됨"+stamp+" · 닫기 전에 파일로 저장",
      off:"자동 저장 꺼짐 · 이번 결과 미저장",
      failed:"이번 결과 저장 실패 · "+(ref.error || ""),
      empty:"저장할 결과를 입력하세요."
    })[state];
    action.hidden=state==="pending" || state==="empty";
    const readable=state==="saved" || state==="temporary";
    action.textContent=readable?"이 기록 열기":state==="failed"?"다시 저장":"이 결과 저장";
    action.onclick=readable?()=>openRecord(ref.savedRecord.id).catch(error=>{
      ref.status="failed";ref.error=storageError(error);refreshReceipt();
    }):()=>saveCapture(ref,false);
  }

  async function confirmStored(ref,revision,attempt) {
    const stored=await store.get(ref.record.id);
    if(!stored || (revision && stored.edited!==revision.text))throw new Error("현재 결과와 같은 저장 기록을 다시 읽지 못했습니다.");
    ref.savedRecord=stored;
    ref.acknowledged=new Date();
    if(ref.attempt===attempt) ref.status=store.persistent?"saved":"temporary";
  }

  function saveCapture(ref,automatic) {
    const revision=ref.revision;
    const attempt={};
    ref.attempt=attempt;
    ref.status="pending";
    queueMicrotask(refreshReceipt);
    queued(async()=>{
      if(ref.attempt!==attempt || (revision && !revision.text.trim()))return false;
      try {
        const record=newNotebookRecord({...ref.data,created:ref.record?.created || new Date().toISOString(),
          words:ref.study?.words || ref.data.words || []});
        ref.record=record;
        if(!await store.save(record,automatic,revision)){
          if(ref.attempt===attempt) ref.status="off";
          return false;
        }
        if(!automatic) ref.manual=true;
        await confirmStored(ref,revision,attempt);
        await changed().catch(showStorageError);
        return true;
      } catch(error) {
        if(ref.attempt===attempt){ref.status="failed";ref.error=storageError(error);}
        return false;
      } finally {
        refreshReceipt();
      }
    });
  }

  function capture(data,study) {
    const ref={data,study,revision:null};
    if(study)study.notebookRef=ref;
    saveCapture(ref,true);
    return ref;
  }

  function appendWords(study) {
    const ref=study?.notebookRef;
    if(!ref)return;
    const words=[...study.words];
    queued(async()=>{
      if(!ref.savedRecord || !await store.words(ref.record.id,words,!ref.manual))return;
      const stored=await store.get(ref.record.id);
      if(stored) ref.savedRecord=stored;
      await changed();
    }).catch(error=>{
      ref.status="failed";
      ref.error="추가 단어를 저장하지 못했습니다. "+storageError(error);
      refreshReceipt();
    });
  }

  function editCapture(ref,text,words) {
    if(!ref)return;
    ref.revision={text,words};
    if(text.trim()) saveCapture(ref,true);
    else refreshReceipt();
  }

  function checkReuse() {
    const {task,source,lang,style}=currentSource();
    const options=task==="translate" && source.trim() ? records.filter(r=>r.kind==="translate" && r.confirmed && r.lang===lang && (r.style===style || !r.style) &&
      r.source.trim()===source.trim() && notebookOutput(r).trim()) : [];
    const unique=[...new Set(options.map(notebookOutput))];
    const b=el("nb-reuse");
    b.hidden=!source.trim() || unique.length!==1;
    b.onclick=b.hidden?null:()=>reuse(options[0]);
    const matches=task==="translate" || task==="correct" ? relatedNotebookRecords(referenceIndex,source) : [];
    const signature=JSON.stringify(matches.map(({record,terms})=>[record.id,record.updated,terms]));
    if(signature===referenceSignature)return;
    referenceSignature=signature;
    const panel=el("nb-related"), items=el("nb-related-list");
    panel.hidden=!matches.length;
    items.replaceChildren();
    if(panel.hidden){panel.open=false;return;}
    el("nb-related-count").textContent="· "+matches.length+"건";
    for(const {record,terms} of matches){
      const row=document.createElement("li"), result=notebookOutput(record);
      row.append(textNode("small",notebookKinds[record.kind]+" · 입력어 "+terms.slice(0,3).join(", ")),
        textNode("p",result.length<=180?result:result.slice(0,180)+"…"),
        button("원래 기록 보기",()=>openRecord(record.id).catch(showStorageError)));
      items.append(row);
    }
  }

  function caption(record) {
    if(["weekly","report"].includes(record.kind) && record.context) {
      const lines=record.context.split("\n").map(x=>x.trim()).filter(Boolean);
      const topic=lines.find(x=>/^[■]|^(?:안건|제목|업체·안건|활동 내용|개요)\s*[:：]/u.test(x)) || lines[0];
      if(topic)return topic.replace(/^(?:안건|제목|업체·안건|활동 내용|개요)\s*[:：]\s*/u,"");
    }
    return record.source.split("\n").find(x=>x.trim()) || record.source;
  }
  function display(record,expand=false) {
    const card=document.createElement("details"); card.className="nb-entry";card.open=expand;card.dataset.record=record.id;
    const summary=document.createElement("summary");
    const meta=[notebookKinds[record.kind],record.kind==="translate"?(record.lang==="ko"?"한→일":"일→한"):"",record.confirmed?"직접 확인":"검토 전",date.format(new Date(record.created))].filter(Boolean);
    summary.append(textNode("small",meta.join(" · ")),textNode("strong",caption(record).slice(0,110)));
    card.append(summary);
    const body=document.createElement("div");body.className="nb-body";
    function section(label,value) {if(!value)return;body.append(textNode("b",label),textNode("p",value));}
    section(record.kind==="question"?"질문":record.kind==="word"?"일본어 표기":"원문",record.source);
    if(record.context)section(record.kind==="report" || record.kind==="weekly" || record.kind==="polish"?"작성 메모":"참고 문장",record.context);
    section(record.kind==="question"?"답변·메모":record.kind==="word"?"읽기·뜻":"저장된 결과",notebookOutput(record) || "아직 답변을 기록하지 않았습니다.");
    if(record.edited!==null && record.edited!==record.output && record.output)section("처음 저장한 결과",record.output);
    if(record.kind==="correct") {
      const changes=changesFor(record.source,notebookOutput(record));
      for(const c of changes) section("수정",c.before.trim()+" → "+c.after.trim());
    }
    if(record.reasons.length)section("작업 당시 메모",record.reasons.join("\n"));
    if(record.engine)section("작성 방식",record.engine);
    const actions=document.createElement("div");actions.className="nb-tools";
    if(isReportKind(record.kind))actions.append(button("최종본으로 저장",()=>finals.open(record)));
    else if(["translate","correct","polish"].includes(record.kind))
      actions.append(button("보고서·주보로 보관",()=>finals.open(record)));
    if(record.kind!=="word")actions.append(button("결과 편집",()=>{
      editing=true;
      const field=document.createElement("textarea");field.rows=4;field.maxLength=100000;field.value=notebookOutput(record);field.setAttribute("aria-label","저장할 결과");
      const end=()=>{editing=false;};
      const save=button("편집 내용 저장",()=>{
        if(record.kind!=="question" && !field.value.trim()) {tell("저장할 결과를 입력하세요.");return;}
        const output=field.value;
        const words=collectWords(japaneseText(record,output));
        const keep=record.words.filter(w=>[record.source,record.context,output].some(x=>x.includes(w.term)));
        queued(async()=>{await store.revise(record.id,output,[...keep,...words],false,false,record.updated);end();await changed("편집 내용을 저장했습니다.");}).catch(()=>{end();reload();});
      });
      body.replaceChildren(textNode("b","결과 편집"),field,save,button("취소",()=>{end();render();}));field.focus();
    }));
    actions.append(button(record.confirmed?"직접 확인 해제":"직접 확인으로 표시",()=>{
      if(!notebookOutput(record).trim()){tell("먼저 답변을 입력하세요.");return;}
      queued(async()=>{
        await store.update(record.id,old=>{
          if(old.updated!==record.updated)throw new Error("다른 창에서 수정한 기록입니다. 다시 열어 확인하세요.");
          return {...old,confirmed:!record.confirmed,updated:new Date().toISOString()};
        });
        await changed("검토 상태를 저장했습니다.");
      });
    }),button("삭제",()=>{
      const rem=button("이 기록 삭제",()=>queued(async()=>{await store.update(record.id,()=>null);focusId=null;await changed("기록을 삭제했습니다.");}));
      actions.replaceChildren(textNode("span","예문장과 이 기록의 단어 연결을 삭제할까요?"),rem,button("취소",render));
    }));
    body.append(actions);card.append(body);return card;
  }

  function cleanWordUses(previous,additional) {
    return [...new Map([...previous,...additional].map(w=>[JSON.stringify([w.term,w.reading,w.meaning,w.sentence]),w])).values()];
  }
  function japaneseText(record,output=notebookOutput(record)) {
    if(record.kind==="translate")return record.lang==="ja"?record.source:output;
    if(record.kind==="question")return [record.context,output,record.source].join("\n");
    if(record.kind==="word")return record.context;
    return record.kind==="polish" && record.lang==="ko" && !/[ぁ-ゖァ-ヺ]/u.test(output)?"":output;
  }

  function switchView(next, resetSearch=false) {
    view=next;
    focusId=null;
    editing=false;
    shown=24;
    if(resetSearch) for(const id of ["nb-search","nb-reviewed","nb-kind","nb-issue-filter"])el(id).value="";
    render();
  }

  async function openNotebook(next, resetSearch=false) {
    if(!dialog.open)dialog.showModal();
    switchView(next,resetSearch);
    formLabels();
    await queue;
    await refreshFromStorage();
    if(store.account)tell(store.persistent ? (store.auto?"완료한 작업을 이 계정에 자동으로 저장합니다.":"자동 저장이 꺼져 있습니다. 필요한 결과를 직접 저장할 수 있습니다.") : "로그인하면 내 보관함을 사용할 수 있습니다.");
    else tell(!store.db?"브라우저 저장 공간을 열 수 없습니다.":store.auto?
      "완료한 작업을 이 브라우저에 자동으로 저장합니다.":"자동 저장이 꺼져 있습니다. 필요한 결과를 직접 저장할 수 있습니다.");
  }

  function showRecord(id) {
    switchView("examples",true);
    focusId=id;
    render();
    const summary=[...list.querySelectorAll("details[data-record]")].find(card=>card.dataset.record===id)?.querySelector("summary");
    summary?.focus();
  }

  async function openRecord(id) {
    await openNotebook("examples",true);
    const stored=await store.get(id);
    if(!stored){
      tell("이 기록이 보관함에 없습니다.");
      throw new Error("이 기록이 보관함에 없습니다.");
    }
    showRecord(id);
    tell((store.persistent?(store.account?"계정 저장 기록":"브라우저 저장 기록"):"이 창에 임시 보관 중인 기록")+"을 다시 읽었습니다.");
  }

  function wordEntry(word, open) {
    const card=document.createElement("details");
    card.className="nb-entry";
    card.dataset.word=JSON.stringify([word.term,word.reading]);
    const summary=document.createElement("summary");
    summary.append(textNode("small","사용 문장 · 관련 기록 "+word.records.size+"건"),
      textNode("strong",word.term+(word.reading?" · "+word.reading:"")+" — "+[...word.meanings].join(" / ")));
    card.append(summary);
    card.open=open;
    card.addEventListener("toggle",()=>{
      if(!card.open || card.children.length>1)return;
      const body=document.createElement("div");
      body.className="nb-body";
      for(const {record,examples} of word.records.values()){
        const sentences=sentencePieces(japaneseText(record)).map(line=>line.trim()).filter(line=>line.includes(word.term) && !/[가-힣]/u.test(line));
        const lines=new Set(sentences.length?sentences:examples);
        const use=document.createElement("div");
        use.className="nb-word-use";
        for(const line of lines)use.append(textNode("p",line));
        use.append(button("원래 기록 보기 · "+caption(record).slice(0,42),()=>showRecord(record.id)));
        body.append(use);
      }
      card.append(body);
    });
    return card;
  }

  function problemCard(issue) {
    const card=document.createElement("details");
    card.className="nb-entry";
    card.dataset.issue=issue.id;
    const summary=document.createElement("summary");
    const status=issue.resolved?"해결 확인 · "+issue.resolvedVersion:"확인 대기";
    summary.append(textNode("small",[issueTypes[issue.type],status,issue.version,date.format(new Date(issue.created))].join(" · ")),
      textNode("strong",issue.note.split("\n")[0].slice(0,110)));
    const body=document.createElement("div");
    body.className="nb-body";
    const parts=[["문제",issue.note],["원문",issue.source],["나온 결과",issue.output],["기대한 결과",issue.expected],["작업 방식",issue.engine]];
    for(const [label,value] of parts)if(value)body.append(textNode("b",label),textNode("p",value));
    const actions=document.createElement("div");
    actions.className="nb-tools";
    actions.append(button("재현 내용 복사",async event=>{
      const direction=issue.work==="translate"?(issue.lang==="ja"?"일본어 → 한국어":"한국어 → 일본어"):"";
      const header=["문결 "+issue.version,issueTypes[issue.type],notebookKinds[issue.work],direction,issue.style].filter(Boolean).join(" · ");
      const details=parts.filter(([,value])=>value).map(([label,value])=>label+"\n"+value);
      const done=await copy([header,...details].join("\n\n"),event.currentTarget);
      tell(done?"재현 내용을 복사했습니다.":"브라우저에서 복사를 허용해 주세요.");
    }));
    if(issue.source && issue.source.length<=4000 && ["translate","correct","polish","report","weekly"].includes(issue.work)){
      actions.append(button("원문 다시 입력",()=>{
        dialog.close();
        replay(issue);
      }));
    }
    actions.append(button(issue.resolved?"다시 확인 대기로":"해결로 표시",()=>{
      queued(async()=>{
        await store.resolveIssue(issue.id,!issue.resolved,version);
        await changed(issue.resolved?"확인 대기로 되돌렸습니다.":version+"에서 해결을 확인한 것으로 표시했습니다.");
      }).catch(()=>{});
    }));
    body.append(actions);
    card.append(summary,body);
    return card;
  }

  function render() {
    if(editing)return;
    const query=normalize(el("nb-search").value),kind=el("nb-kind").value,review=el("nb-reviewed").value;
    const matches=rows=>rows.filter(r=>(!kind || r.kind===kind) && (!review || r.confirmed===(review==="yes")));
    const openEntries=new Set([...list.querySelectorAll("details[open][data-record]")].map(n=>n.dataset.record));
    const openWords=new Set([...list.querySelectorAll("details[open][data-word]")].map(n=>n.dataset.word));
    const openIssues=new Set([...list.querySelectorAll("details[open][data-issue]")].map(n=>n.dataset.issue));
    const filtered=matches(records);
    list.replaceChildren();
    for(const name of ["examples","words","issues"])el("nb-"+name).setAttribute("aria-pressed",String(view===name));
    const issueView=view==="issues";
    el("nb-issue-compose").hidden=!issueView;
    el("nb-issue-filter-wrap").hidden=!issueView;
    el("nb-compose").hidden=issueView;
    el("nb-kind-wrap").hidden=issueView;
    el("nb-reviewed-wrap").hidden=issueView;
    el("nb-search-label").textContent=view==="words"?"단어 검색":issueView?"개선 기록 검색":"예문·질문 검색";
    el("nb-search").placeholder=view==="words"?"納期 · のうき · 납기":issueView?"문제·원문·기대한 결과":"원문·결과·단어";
    let total=0;
    if(view==="examples"){
      const rows=filtered.filter(r=>!query || normalize([r.source,notebookOutput(r),r.context,...r.words.map(w=>w.term+" "+w.reading+" "+w.meaning)].join(" ")).includes(query));
      total=rows.length;
      const selected=focusId && rows.find(r=>r.id===focusId);
      const ordered=selected ? [selected,...rows.filter(r=>r!==selected)] : rows;
      for(const r of ordered.slice(0,shown))list.append(display(r,r.id===focusId || openEntries.has(r.id)));
    }else if(view==="words"){
      const words=notebookWords(filtered).filter(w=>!query || normalize([w.term,w.reading,...w.meanings].join(" ")).includes(query));
      total=words.length;
      for(const w of words.slice(0,shown)){
        list.append(wordEntry(w,openWords.has(JSON.stringify([w.term,w.reading])) || Boolean(query && total===1)));
      }
      el("nb-export-words").disabled=!words.length;
      el("nb-export-words").onclick=()=>exportWords(words.map(w=>{
        const citations=[...w.records.values()].flatMap(r=>[...r.examples]);
        return {term:w.term,reading:w.reading,meaning:[...w.meanings].join(" / "),sentence:citations[0] || ""};
      }));
    }else{
      const filter=el("nb-issue-filter").value;
      const found=issues.filter(issue=>(!filter || issue.resolved===(filter==="resolved")) &&
        (!query || normalize([issueTypes[issue.type],issue.note,issue.source,issue.output,issue.expected].join(" ")).includes(query)));
      total=found.length;
      for(const issue of found.slice(0,shown)){
        const card=problemCard(issue);
        card.open=issue.id===focusId || openIssues.has(issue.id);
        list.append(card);
      }
    }
    el("nb-export-words").hidden=view!=="words";
    el("nb-more").hidden=shown>=total;
    el("nb-count").textContent=(view==="examples"?"예문·질문 "+total+"건":view==="words"?"단어 "+total+"개":"개선 기록 "+total+"건")+
      (shown<total?" · "+shown+"개 표시":"");
    if(!total){
      const message=query||(!issueView&&(kind||review))||issueView&&el("nb-issue-filter").value?"조건에 맞는 기록이 없습니다.":view==="words"?
        "번역·교정에서 읽기와 뜻을 확인한 단어가 여기에 쌓입니다.":issueView?
        "번역이나 저장에서 발견한 문제를 등록해 다시 확인할 수 있습니다.":"번역과 교정을 마치면 이곳에 쌓입니다. 이전 대화와 질문도 직접 추가할 수 있습니다.";
      list.append(textNode("p",message,"status"));
      if(query && view==="words")list.append(button("같은 내용으로 예문 검색",()=>switchView("examples")));
    }
  }

  function formLabels() {
    const kind=el("nb-new-kind").value,word=kind==="word",q=kind==="question";
    el("nb-source-label").textContent=q?"질문":word?"일본어 단어":"원문";
    el("nb-output-label").textContent=q?"답변·메모 (선택)":word?"한국어 뜻":kind==="correct"?"교정문":"번역문";
    el("nb-context-label").textContent=word?"사용 문장 (선택)":"참고 문장 (선택)";
    el("nb-output").required=!q;el("nb-reading-wrap").hidden=!word;
    el("nb-question-help").hidden=!q;
    el("nb-ask").hidden=!q || !canAsk();
  }

  async function startIssue(ref) {
    await openNotebook("issues",true);
    const data=ref.data;
    issueContext={work:data.work || data.kind,lang:data.lang,style:data.style,engine:data.engine};
    el("nb-issue-form").reset();
    el("nb-issue-type").value=ref.status==="failed" || ref.status==="temporary"?"storage":data.kind==="correct"?"proofreading":"meaning";
    el("nb-issue-source").value=data.context || data.source;
    el("nb-issue-output").value=ref.revision?.text ?? data.output;
    el("nb-issue-compose").open=true;
    el("nb-issue-note").focus();
  }

  async function saveIssue() {
    const note=el("nb-issue-note").value.trim();
    if(!note){tell("어떤 문제가 있었는지 적어 주세요.");return;}
    const issue=newNotebookIssue({...issueContext,version,type:el("nb-issue-type").value,note,
      source:el("nb-issue-source").value,output:el("nb-issue-output").value,expected:el("nb-issue-expected").value});
    await queued(async()=>{
      await store.saveIssue(issue);
      switchView("issues",true);
      focusId=issue.id;
      issueContext=null;
      el("nb-issue-form").reset();
      el("nb-issue-compose").open=false;
      await changed("개선 기록을 저장했습니다.");
    });
  }

  let portableTarget=null;
  const portableStatus=el("nb-portable-status");
  const portableSelect=el("nb-portable-select");
  const portableSave=el("nb-portable-save");

  function tellPortable(message) {
    portableStatus.hidden=false;
    portableStatus.textContent=message;
  }

  portableSelect.onclick=()=>el("nb-portable-file").click();
  el("nb-portable-file").onchange=async event=>{
    const file=event.target.files[0];
    event.target.value="";
    if(!file)return;
    portableTarget=null;
    portableSave.hidden=true;
    portableSelect.disabled=true;
    try{
      portableTarget=preparePortableUpdate(await file.text());
      tellPortable("v"+portableTarget.version+" 선택됨 · 개인용 HTML에 현재 기록을 담습니다.");
      portableSave.hidden=false;
    }catch(error){
      tellPortable(storageError(error));
    }finally{
      portableSelect.disabled=false;
    }
  };

  portableSave.onclick=async()=>{
    const target=portableTarget;
    if(!target)return;
    portableSave.disabled=true;
    portableSelect.disabled=true;
    try{
      await queued(async()=>{
        const [rows,problems,documents]=await Promise.all([store.list(),store.listIssues(),store.listFinalDocuments()]);
        const output=makePortableHtml(target,rows,problems,store.auto,documents);
        await store.rememberPortable(output.id);
        const name="Munkyeol_Personal.html";
        downloadNotebookFile(output.html,name,"text/html");
        tellPortable("예문·질문 "+rows.length+"건, 단어 "+notebookWords(rows).length+"개, 최종본 "+documents.length+"건을 담은 "+name+" 다운로드를 시작했습니다.");
      });
    }catch(error){
      tellPortable(storageError(error));
    }finally{
      portableSave.disabled=false;
      portableSelect.disabled=false;
    }
  };

  async function submit(remote=false) {
    const form=el("nb-form"), type=el("nb-new-kind").value;
    if(!form.reportValidity())return;
    const source=el("nb-source").value.trim(),context=el("nb-context").value.trim(),value=el("nb-output").value.trim();
    if(!source || type!=="question" && !value){tell("원문과 결과를 입력하세요.");return;}
    const kind=["ko","ja"].includes(type)?"translate":type;
    const base={kind,lang:type==="ja" || ["correct","word"].includes(type)?"ja":"ko",source,context,output:value};
    const reading=el("nb-reading").value.trim();
    if(kind==="word" && reading && !/^[ぁ-ゖァ-ヺー・ 　]+$/u.test(reading)){tell("읽기는 가나로 입력하세요.");return;}
    let ai;
    if(remote){
      if(asking)return;
      const job=new AbortController();asking=job;
      form.querySelectorAll("input,textarea,select,button").forEach(n=>n.disabled=true);
      try {tell("입력한 질문과 참고 문장을 AI에 보냅니다.");ai=await ask(source,context,job.signal);job.signal.throwIfAborted();}
      catch(e){if(!job.signal.aborted)tell(e.message);return;}
      finally{asking=null;form.querySelectorAll("input,textarea,select,button").forEach(n=>n.disabled=false);}
      base.output=ai.answer+(ai.example?"\n\n"+ai.example:"");base.engine="AI 표현 질문";
    }
    if(kind==="word"){
      base.words=[{term:source,reading,meaning:value,sentence:context}];base.output=(reading?reading+" · ":"")+value;
    }else base.words=collectWords(japaneseText(base,base.output),ai?.vocabulary);
    const record=newNotebookRecord(base);
    await queued(async()=>{
      if(["question","word"].includes(kind)){
        await store.apply([{id:record.id,update:old=>{
          if(!old)return record;
          if(kind==="question" && !base.output && notebookOutput(old))return old;
          if(kind==="word")return {...old,words:cleanWordUses(old.words,record.words),updated:record.updated};
          return {...record,created:old.created,confirmed:notebookOutput(old)===record.output && old.confirmed};
        }}]);
      }else await store.save(record,false);
      focusId=record.id;form.reset();el("nb-compose").open=false;formLabels();
      view=kind==="word"?"words":"examples";el("nb-kind").value="";el("nb-reviewed").value="";el("nb-search").value="";shown=24;
      await changed("기록을 저장했습니다.");
    });
  }

  for(const [key,value] of Object.entries(notebookKinds)){
    const opt=textNode("option",value);opt.value=key;el("nb-kind").append(opt);
  }
  for(const [key,value] of Object.entries(issueTypes)){
    const option=textNode("option",value);
    option.value=key;
    el("nb-issue-type").append(option);
  }
  el("nb-open").addEventListener("click",()=>openNotebook("examples",true).catch(showStorageError));
  function openFinal(draft) {
    const ref=currentResult();
    if(isReportKind(ref?.data.kind))finals.open(ref.record || newNotebookRecord(ref.data));
    else finals.open(null,draft);
  }
  el("nb-add-question").addEventListener("click",async()=>{
    try {
      await openNotebook("examples",true);
      if(!dialog.open)return;
      const kind=el("nb-new-kind");
      const hasDraft=["nb-source","nb-output","nb-context","nb-reading"].some(id=>el(id).value.trim());
      if(kind.value!=="question" && hasDraft){
        tell("작성 중인 기록이 있습니다. 새 질문은 이 기록을 저장한 뒤 추가할 수 있습니다.");
      }else{
        kind.value="question";
        formLabels();
      }
      el("nb-compose").open=true;
      el("nb-source").focus();
    }catch(error){showStorageError(error);}
  });
  el("nb-words-open").addEventListener("click",async()=>{
    try {await openNotebook("words",true);el("nb-search").focus();}
    catch(error){showStorageError(error);}
  });
  el("nb-receipt-issue").addEventListener("click",()=>{
    const ref=currentResult();
    if(ref)startIssue(ref).catch(showStorageError);
  });
  el("nb-verify").addEventListener("click",async()=>{
    try {
      await queue;
      await refreshFromStorage();
      if(!records.length){tell("저장한 예문·질문 기록이 0건입니다.");return;}
      const last=await store.lastSaved();
      const latest=last && last.savedAt>=records[0].updated ? await store.get(last.id) : null;
      const stored=latest || await store.get(records[0].id);
      if(!stored)throw new Error("최근 기록을 다시 읽지 못했습니다.");
      showRecord(stored.id);
      const savedAt=new Date(latest ? last.savedAt : stored.updated);
      tell((store.persistent?(store.account?"계정에서 다시 읽기 확인":"브라우저에서 다시 읽기 확인"):"이 창의 임시 기록 확인")+" · "+date.format(savedAt)+" "+time.format(savedAt)+" · "+records.length+"건");
    } catch(error){showStorageError(error);}
  });
  el("nb-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{asking?.abort();editing=false;});
  el("nb-auto").addEventListener("change",()=>{const value=el("nb-auto").checked;queued(async()=>{await store.setAuto(value);await changed(value?"자동 저장을 켰습니다.":"자동 저장을 껐습니다.");}).catch(()=>el("nb-auto").checked=store.auto);});
  for(const name of ["examples","words","issues"])el("nb-"+name).onclick=()=>switchView(name);
  for(const id of ["nb-search","nb-reviewed","nb-kind","nb-issue-filter"])el(id).addEventListener("input",()=>switchView(view));
  el("nb-more").onclick=()=>{shown+=24;render();};
  el("nb-new-kind").onchange=formLabels;el("nb-form").onsubmit=event=>{event.preventDefault();submit().catch(e=>tell(e.message));};
  el("nb-ask").onclick=()=>submit(true).catch(e=>tell(e.message));
  el("nb-issue-form").onsubmit=event=>{event.preventDefault();saveIssue().catch(e=>tell(storageError(e)));};
  el("nb-backup").onclick=async()=>{
    try {
      await queue;
      const [rows,problems,documents]=await Promise.all([store.list(),store.listIssues(),store.listFinalDocuments()]);
      const data=notebookBackup(rows,problems,documents);
      downloadNotebookFile(JSON.stringify(data),"Munkyeol_Notebook_"+new Date().toISOString().slice(0,10)+".json","application/json");
      tell("예문·질문 "+rows.length+"건, 개선 기록 "+problems.length+"건, 최종본 "+documents.length+"건을 백업했습니다.");
    } catch(error){tell(storageError(error));}
  };
  async function importFile(event,personalHtml) {
    const file=event.target.files[0];event.target.value="";if(!file)return;
    try {
      const source=await file.text();
      const added=personalHtml ? readPortableFile(source) : readNotebookArchive(source);
      await queued(async()=>{
        const applied=await store.importRecords(added.records,added.issues,personalHtml ? added : null,added.finalDocuments);
        if(!applied){tell("이미 불러온 개인용 HTML입니다.");return;}
        await refreshFromStorage();
        tell("예문·질문 "+added.records.length+"건, 개선 기록 "+added.issues.length+"건, 최종본 "+added.finalDocuments.length+"건을 대조해 합쳤습니다.");
        broadcast?.postMessage("changed");
      });
    }
    catch(e){tell(e.message);}
  }
  el("nb-restore").onclick=()=>el("nb-file").click();
  el("nb-file").onchange=event=>importFile(event,false);
  el("nb-import-html").onclick=()=>el("nb-import-html-file").click();
  el("nb-import-html-file").onchange=event=>importFile(event,true);
  return {capture,appendWords,editCapture,checkReuse,refreshReceipt,openFinal};
}

export function downloadNotebookFile(text,name,type) {
  const url=URL.createObjectURL(new Blob([text],{type:type+";charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
