export const localNotebookOrigin = "http://127.0.0.1:3000";

export const notebookKinds = {
  translate: "번역", correct: "일본어 교정", polish: "한국어 다듬기", report: "보고서", weekly: "주보", question: "표현 질문", word: "직접 등록한 단어"
};
export const issueTypes = {
  meaning: "번역 의미·문체",
  values: "수량·품번·일정",
  proofreading: "교정·수정 이유",
  vocabulary: "단어·읽기·뜻",
  storage: "저장·검색",
  other: "기타"
};
const backupType = "munkyeol-personal-notebook";
const issuePrefix = "issue:";
const finalPrefix = "final-document:";
const latestWork = "latest-saved-work";
const portableKey = id => "portable-html:" + id;
const validDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const plainString = (value, limit) => typeof value === "string" && value.length <= limit;
const compactKey = value => value.trim().replace(/\r\n?/gu,"\n").normalize("NFC");

export function recordKey(record) {
  return JSON.stringify([record.kind,record.lang,record.style,compactKey(record.source),
    record.kind==="word" ? [record.words[0]?.reading || "",record.words[0]?.meaning || ""] : record.kind==="question" ? "" : compactKey(record.output)]);
}

function cleanWords(words) {
  const seen = new Set();
  return words.filter(word => {
    const key = JSON.stringify([word.term,word.reading,word.meaning,word.sentence]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).map(({term,reading,meaning,sentence}) => ({term,reading,meaning,sentence}));
}

function validateRecord(data) {
  if (!data || !Object.hasOwn(notebookKinds,data.kind) || !["ko","ja"].includes(data.lang) ||
      !plainString(data.style,120) || !plainString(data.source,100_000) || !data.source.trim() ||
      !plainString(data.output,100_000) || !plainString(data.context,100_000) || !plainString(data.engine,160) ||
      !plainString(data.edited ?? "",100_000) || typeof data.confirmed !== "boolean" ||
      !validDate(data.created) || !validDate(data.updated) || !Array.isArray(data.reasons) ||
      !data.reasons.every(reason => plainString(reason,20_000)) || !Array.isArray(data.words) ||
      !data.words.every(w => w && plainString(w.term,200) && w.term.trim() && plainString(w.reading,200) &&
        plainString(w.meaning,1500) && w.meaning.trim() && plainString(w.sentence,100_000))) {
    throw new Error("예문장 기록의 형식이 맞지 않습니다.");
  }
  if((data.kind!=="question" && !data.output.trim()) || (data.kind==="word" && !data.words.length))
    throw new Error("예문 또는 단어의 결과가 비어 있습니다.");
  const record = {kind:data.kind,lang:data.lang,style:data.style,source:data.source,output:data.output,edited:data.edited ?? null,
    context:data.context,engine:data.engine,confirmed:data.confirmed,created:new Date(data.created).toISOString(),updated:new Date(data.updated).toISOString(),
    reasons:[...new Set(data.reasons)],words:cleanWords(data.words)};
  record.id = recordKey(record);
  return record;
}

export function newNotebookRecord(data) {
  const date = new Date().toISOString();
  return validateRecord({style:"",lang:"ko",output:"",context:"",engine:"직접 기록",reasons:[],words:[],
    edited:null,confirmed:false,created:date,updated:date,...data});
}

function validateIssue(data) {
  if (!data || typeof data.id !== "string" || !/^[a-f0-9-]{16,48}$/u.test(data.id) ||
      !Object.hasOwn(issueTypes,data.type) || typeof data.resolved !== "boolean" || !validDate(data.created) ||
      !validDate(data.updated) || !plainString(data.version,32) || !plainString(data.resolvedVersion,32) ||
      !plainString(data.work,32) || !plainString(data.lang,8) || !plainString(data.style,120) ||
      !plainString(data.engine,160) || !plainString(data.source,100_000) || !plainString(data.output,100_000) ||
      !plainString(data.expected,100_000) || !plainString(data.note,10_000) || !data.note.trim()) {
    throw new Error("개선 기록의 형식이 맞지 않습니다.");
  }
  const {id,type,resolved,version,resolvedVersion,work,lang,style,engine,source,output,expected,note}=data;
  return {id,type,resolved,version,resolvedVersion,work,lang,style,engine,source,output,expected,note,
    created:new Date(data.created).toISOString(),updated:new Date(data.updated).toISOString()};
}

export function newNotebookIssue(data) {
  const date=new Date().toISOString();
  const id=[...crypto.getRandomValues(new Uint8Array(12))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
  return validateIssue({id,created:date,updated:date,resolved:false,resolvedVersion:"",
    version:"",work:"",lang:"",style:"",engine:"",source:"",output:"",expected:"",...data});
}

export function notebookOutput(record) { return record.edited ?? record.output; }

const referenceKey = value => value.normalize("NFKC").trim().toLowerCase();

export function notebookReferenceIndex(records, termPairs) {
  const index = new Map();
  function include(label, record) {
    const key = referenceKey(label);
    if (key.length < 2 || !/\p{L}/u.test(key)) return;
    if (!index.has(key)) index.set(key, {label:label.trim(), records:new Set()});
    index.get(key).records.add(record);
  }
  for (const record of records) {
    const result = notebookOutput(record);
    if (!record.confirmed || !result.trim()) continue;
    const text = referenceKey([record.source, record.context, result].join("\n"));
    for (const [ko, ja] of termPairs) {
      if (text.includes(referenceKey(ko)) || text.includes(referenceKey(ja))) {
        include(ko, record);
        include(ja, record);
      }
    }
    for (const word of record.words) {
      include(word.term, record);
      for (const meaning of word.meaning.split(/[,，/·;]/u)) {
        if (/^[가-힣][가-힣 ]{1,19}$/u.test(meaning.trim())) include(meaning, record);
      }
    }
  }
  return index;
}

export function relatedNotebookRecords(index, source) {
  const query = referenceKey(source);
  if (query.length < 2) return [];
  const codes = new Set(query.match(/[a-z0-9_-]+/g));
  const hits = new Map();
  for (const [key, entry] of index) {
    const matched = /^[a-z0-9_-]+$/.test(key) ? codes.has(key) : query.includes(key);
    if (!matched) continue;
    for (const record of entry.records) {
      if (!hits.has(record)) hits.set(record, {record, terms:[]});
      hits.get(record).terms.push(entry.label);
    }
  }
  return [...hits.values()].sort((a,b) =>
    b.terms.length - a.terms.length || b.record.updated.localeCompare(a.record.updated)
  ).slice(0,3);
}

function wordsForCurrentText(record, words) {
  if(record.kind==="word")return cleanWords(words);
  const output=notebookOutput(record);
  let text=output;
  if(record.kind==="translate" && record.lang==="ja")text=record.source;
  if(record.kind==="question")text=[record.context,output,record.source].join("\n");
  return cleanWords(words.filter(word => text.includes(word.term) && (!word.sentence || text.includes(word.sentence))));
}

function revisedRecord(old, text, words, confirmed) {
  const revision={...old,edited:text,confirmed,updated:new Date().toISOString()};
  revision.words=wordsForCurrentText(revision,words);
  return revision;
}

export function mergeNotebookRecords(existing, added, fromBackup = false) {
  if (!existing) return added;
  // New machine output never replaces a human edit or confirmation. Backups use the last edit.
  const winner = fromBackup && added.updated > existing.updated ? added : existing;
  return {...winner,created:existing.created < added.created ? existing.created : added.created,
    words:wordsForCurrentText(winner,[...winner.words,...existing.words,...added.words])};
}

export function isReportKind(kind) { return kind === "report" || kind === "weekly"; }

export const finalSectors = {industrial:"산업기기", automotive:"차재"};

export function normalizeFinalText(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu," ").toLowerCase();
}

function classificationKey(entry) {
  return JSON.stringify([entry.sector,normalizeFinalText(entry.company)]);
}

export function cleanFinalClassifications(entries) {
  if (!Array.isArray(entries)) throw new Error("최종본의 분야·업체 목록을 확인해 주세요.");
  const unique=new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.sector!=="string" || !Object.hasOwn(finalSectors,entry.sector) || !plainString(entry.company,160))
      throw new Error("최종본의 분야와 업체명을 확인해 주세요.");
    const item={sector:entry.sector,company:entry.company.normalize("NFC").trim().replace(/\s+/gu," ")};
    const key=classificationKey(item);
    if (!unique.has(key)) unique.set(key,item);
  }
  return [...unique.values()];
}

function retainFinalClassifications(current,previous) {
  // Versions through 1.8.1 did not write this field. An explicit [] clears it.
  if (current.classifications===undefined && previous?.classifications!==undefined)
    return {...current,classifications:previous.classifications};
  return current;
}

export function finalSubject(doc) {
  const companies=(doc.classifications || []).map(classificationKey).sort();
  return JSON.stringify([doc.kind,doc.date,normalizeFinalText(doc.title),companies]);
}

function validateFinalDocument(doc) {
  if (!doc || !isReportKind(doc.kind) || typeof doc.id!=="string" || !/^[a-f0-9]{24}$/u.test(doc.id) ||
      typeof doc.date!=="string" || !/^\d{4}-\d\d-\d\d$/u.test(doc.date) || !validDate(doc.date) ||
      new Date(doc.date).toISOString().slice(0,10)!==doc.date ||
      !plainString(doc.title,160) || !doc.title.trim() || !plainString(doc.ko,100000) || !plainString(doc.ja,100000) ||
      !(doc.ko.trim() || doc.ja.trim()) || !validDate(doc.created) || !validDate(doc.updated) ||
      !Array.isArray(doc.origins) || !doc.origins.every(hash=>typeof hash==="string" && /^[a-f0-9]{64}$/u.test(hash))) {
    throw new Error("최종본의 문서 종류, 제목, 기준일과 본문을 확인해 주세요.");
  }
  return {id:doc.id,kind:doc.kind,date:doc.date,title:doc.title.trim(),ko:doc.ko,ja:doc.ja,
    ...(doc.classifications===undefined ? {} : {classifications:cleanFinalClassifications(doc.classifications)}),
    origins:[...new Set(doc.origins)],created:new Date(doc.created).toISOString(),updated:new Date(doc.updated).toISOString()};
}

export function notebookBackup(records, issues = [], finalDocuments = []) {
  return {type:backupType,version:1,exportedAt:new Date().toISOString(),records,issues,finalDocuments};
}

export function readNotebookArchive(text) {
  let file;
  try { file=JSON.parse(text); } catch { throw new Error("JSON 파일을 읽을 수 없습니다."); }
  return validateNotebookArchive(file);
}

export function validateNotebookArchive(file) {
  if (file?.type !== backupType || file.version !== 1 || !Array.isArray(file.records))
    throw new Error("문결 개인 예문장 백업 파일을 선택하세요.");
  if (file.issues !== undefined && !Array.isArray(file.issues)) throw new Error("백업의 개선 기록 목록을 확인해 주세요.");
  if (file.finalDocuments !== undefined && !Array.isArray(file.finalDocuments)) throw new Error("백업의 최종본 목록을 확인해 주세요.");
  return {records:file.records.map(validateRecord),issues:(file.issues || []).map(validateIssue),
    finalDocuments:(file.finalDocuments || []).map(validateFinalDocument)};
}

export function readNotebookBackup(text) {
  return readNotebookArchive(text).records;
}

export function notebookWords(records) {
  const words=new Map();
  for (const record of records) {
    for (const word of record.words) {
      const key=JSON.stringify([word.term.normalize("NFC"),word.reading.normalize("NFC")]);
      if (!words.has(key)) words.set(key,{term:word.term,reading:word.reading,meanings:new Set(),records:new Map()});
      const entry=words.get(key);
      entry.meanings.add(word.meaning);
      if (!entry.records.has(record.id)) entry.records.set(record.id,{record,examples:new Set()});
      if (word.sentence) entry.records.get(record.id).examples.add(word.sentence);
    }
  }
  return [...words.values()].sort((a,b)=>b.records.size-a.records.size || a.term.localeCompare(b.term,"ja"));
}

export class NotebookStore {
  constructor({memoryOnly=false} = {}) {
    this.memory=new Map();
    this.auto=true;
    this.ready=memoryOnly ? Promise.resolve(false) : this.open();
  }

  get persistent() { return Boolean(this.db); }

  async open() {
    try {
      this.db=await new Promise((resolve,reject)=>{
        const request=indexedDB.open("munkyeol.personal.notebook",1);
        request.onupgradeneeded=()=>{
          request.result.createObjectStore("examples",{keyPath:"id"});
          request.result.createObjectStore("preferences");
        };
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
        request.onblocked=()=>reject(new Error("다른 창을 닫고 다시 여세요."));
      });
      this.db.onversionchange=()=>this.db.close();
      const saved=await this.read("preferences","automatic");
      this.auto=saved !== false;
      return true;
    } catch {
      this.db?.close(); this.db=null;
      return false;
    }
  }

  read(store,key,all=key===undefined) {
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction(store);
      const records=tx.objectStore(store);
      const req=all ? records.getAll(key) : records.get(key);
      tx.oncomplete=()=>resolve(req.result);
      tx.onabort=()=>reject(tx.error || new Error("보관함을 읽을 수 없습니다."));
    });
  }

  async list() {
    await this.ready;
    return this.db ? this.read("examples") : [...this.memory].filter(([key])=>key.startsWith("[")).map(([,record])=>record);
  }

  async listIssues() {
    await this.ready;
    if (this.db) return this.read("preferences",IDBKeyRange.bound(issuePrefix,issuePrefix+"\uffff"),true);
    return [...this.memory].filter(([key])=>key.startsWith(issuePrefix)).map(([,issue])=>issue);
  }

  async listFinalDocuments() {
    await this.ready;
    if (this.db) return this.read("preferences",IDBKeyRange.bound(finalPrefix,finalPrefix+"\uffff"),true);
    return [...this.memory].filter(([key])=>key.startsWith(finalPrefix)).map(([,doc])=>doc);
  }

  async countFinalDocuments() {
    await this.ready;
    if(!this.db)return [...this.memory.keys()].filter(key=>key.startsWith(finalPrefix)).length;
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction("preferences");
      const request=tx.objectStore("preferences").count(IDBKeyRange.bound(finalPrefix,finalPrefix+"\uffff"));
      tx.oncomplete=()=>resolve(request.result);
      tx.onabort=()=>reject(tx.error || new Error("최종본 개수를 확인하지 못했습니다."));
    });
  }

  async saveFinalDocument(input, expected = null) {
    await this.ready;
    const now=new Date().toISOString();
    const validated=validateFinalDocument({...input,created:now,updated:now});
    function resolve(rows) {
      const old=rows.find(row=>row.id===validated.id);
      const doc=retainFinalClassifications(validated,old);
      const subject=finalSubject(doc);
      const collision=rows.find(row=>row.id!==doc.id && (finalSubject(row)===subject ||
        doc.origins.some(hash=>row.origins.includes(hash))));
      if(collision)throw new Error("이미 등록된 최종본입니다. 목록에서 해당 최종본을 열어 수정해 주세요.");
      if((old?.updated ?? null)!==expected)throw new Error("다른 창에서 최종본이 바뀌었습니다. 목록에서 다시 열어 확인해 주세요.");
      if(!old)return doc;
      const origins=[...new Set([...old.origins,...doc.origins])];
      if(old.kind===doc.kind && old.date===doc.date && old.title===doc.title && old.ko===doc.ko && old.ja===doc.ja &&
          origins.length===old.origins.length && JSON.stringify(old.classifications)===JSON.stringify(doc.classifications)) return old;
      return {...doc,origins,created:old.created,updated:new Date(Math.max(Date.now(),Date.parse(old.updated)+1)).toISOString()};
    }
    if(!this.db){
      const rows=[...this.memory].filter(([key])=>key.startsWith(finalPrefix)).map(([,row])=>row);
      const saved=resolve(rows);
      this.memory.set(finalPrefix+saved.id,saved);
      return saved;
    }
    // Check name collisions and competing edits in the same transaction as the commit.
    return new Promise((accept,reject)=>{
      const tx=this.db.transaction("preferences","readwrite");
      const table=tx.objectStore("preferences");
      const request=table.getAll(IDBKeyRange.bound(finalPrefix,finalPrefix+"\uffff"));
      let saved,error;
      request.onsuccess=()=>{
        try { saved=resolve(request.result); table.put(saved,finalPrefix+saved.id); }
        catch(e){error=e;tx.abort();}
      };
      tx.oncomplete=()=>accept(saved);
      tx.onabort=()=>reject(error || tx.error || new Error("최종본을 저장하지 못했습니다."));
    });
  }

  async get(id) {
    await this.ready;
    return this.db ? this.read("examples",id) : this.memory.get(id);
  }

  async lastSaved() {
    await this.ready;
    return this.db ? this.read("preferences",latestWork) : this.memory.get(latestWork);
  }

  async setAuto(value) {
    await this.ready;
    if (this.db) await new Promise((resolve,reject)=>{
      const tx=this.db.transaction("preferences","readwrite");
      tx.objectStore("preferences").put(value,"automatic");
      tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    else this.memory.set("automatic",value);
    this.auto=value;
  }

  // Every read-modify-write stays in one IDB transaction, including bulk imports.
  async apply(operations, automatic = false, once = null) {
    await this.ready;
    if (!operations.length) return true;
    if (!this.db) {
      if((automatic && !this.auto) || (once && this.memory.has(once))) return false;
      const next=new Map(this.memory);
      for(const {id,update} of operations) {
        const result=update(next.get(id));
        if(result===null || result===undefined) next.delete(id); else next.set(id,result);
      }
      this.memory=next; return true;
    }
    return new Promise((resolve,reject)=>{
      const tables=new Set(operations.map(operation=>operation.table || "examples"));
      if (automatic || once) tables.add("preferences");
      const tx=this.db.transaction([...tables],"readwrite");
      let saved=true, error;
      function run(index) {
        if(index>=operations.length)return;
        const {id,update,table="examples"}=operations[index];
        const store=tx.objectStore(table);
        const lookup=store.get(id);
        lookup.onsuccess=()=>{
          try {
            const next=update(lookup.result);
            const write=next===null || next===undefined ? store.delete(id) :
              table==="preferences" ? store.put(next,id) : store.put(next);
            write.onsuccess=()=>run(index+1);
          } catch(e) {error=e;tx.abort();}
        };
      }
      if(automatic || once) {
        const pref=tx.objectStore("preferences").get(automatic?"automatic":once);
        pref.onsuccess=()=>{
          const skip=automatic ? pref.result===false : pref.result===true;
          if(skip)saved=false;else run(0);
        };
      } else run(0);
      tx.oncomplete=()=>resolve(saved);
      tx.onabort=()=>reject(error || tx.error || new Error("예문장을 저장할 수 없습니다."));
    });
  }

  save(record, automatic = true, revision = null) {
    return this.apply([
      {id:record.id,update:old=>{
        const merged=mergeNotebookRecords(old,record);
        return revision ? revisedRecord(merged,revision.text,[...merged.words,...revision.words],false) : merged;
      }},
      {id:latestWork,table:"preferences",update:()=>({id:record.id,savedAt:new Date().toISOString()})}
    ],automatic);
  }

  update(id,change,automatic=false) {
    return this.apply([{id,update:old=>old ? change(old) : null}],automatic);
  }

  words(id, words, automatic = true) {
    return this.update(id,old=>({...old,words:wordsForCurrentText(old,[...old.words,...words])}),automatic);
  }

  revise(id,text,words,confirm,automatic=false,expected) {
    return this.update(id,old=>{
      if(expected && old.updated!==expected) throw new Error("다른 창에서 수정한 기록입니다. 다시 열어 확인하세요.");
      return revisedRecord(old,text,words,confirm);
    },automatic);
  }

  saveIssue(issue) {
    return this.apply([{id:issuePrefix+issue.id,table:"preferences",update:old=>old && old.updated>issue.updated ? old : issue}]);
  }

  resolveIssue(id, resolved, version) {
    return this.apply([{id:issuePrefix+id,table:"preferences",update:old=>old && {...old,resolved,
      resolvedVersion:resolved?version:"",updated:new Date().toISOString()}}]);
  }

  rememberPortable(id) {
    return this.apply([{id:portableKey(id),table:"preferences",update:()=>true}]);
  }

  async importRecords(records, issues = [], portable = null, finalDocuments = portable?.finalDocuments ?? []) {
    const operations=[
      ...records.map(entry=>({id:entry.id,update:old=>mergeNotebookRecords(old,entry,true)})),
      ...issues.map(issue=>({id:issuePrefix+issue.id,table:"preferences",update:old=>old && old.updated>=issue.updated ? old : issue})),
      ...finalDocuments.map(doc=>({id:finalPrefix+doc.id,table:"preferences",update:old=>old && old.updated>=doc.updated ?
        retainFinalClassifications(old,doc) : retainFinalClassifications(doc,old)}))
    ];
    if(!portable)return this.apply(operations);
    const key=portableKey(portable.id);
    operations.push(
      {id:key,table:"preferences",update:()=>true},
      {id:"automatic",table:"preferences",update:existing=>existing ?? portable.automatic}
    );
    const accepted=await this.apply(operations,false,key);
    if(accepted && !this.db)this.auto=this.memory.get("automatic")!==false;
    return accepted;
  }
}
