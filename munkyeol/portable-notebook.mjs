import { notebookBackup, validateNotebookArchive } from "./notebook-store.mjs?v=1.11.1";

const dataSlot=/^([ \t]*<script type="application\/json" id="portable-notebook" data-format="1">)([^\r\n]*)(<\/script>[ \t]*\r?)$/m;
const versionTag=/\bid="app-version">v(\d+\.\d+\.\d+)<\/span>/u;

export function preparePortableUpdate(html) {
  const slot=dataSlot.exec(html);
  const version=versionTag.exec(html)?.[1];
  if(!slot || !version || !html.includes('id="furigana-worker-source">'))
    throw new Error("HTML 업데이트를 지원하는 문결 배포 HTML을 선택하세요.");
  if(slot[2].trim())throw new Error("기록을 담을 새 배포 HTML을 선택하세요. 개인용 HTML은 직접 열 수 있습니다.");
  const insertAt=slot.index+slot[1].length;
  return {html,version,insertAt,emptyLength:slot[2].length,
    supportsFinals:/^\s*<meta name="munkyeol-final-documents" content="1">\s*$/m.test(html),
    supportsClassifications:/^\s*<meta name="munkyeol-document-classifications" content="1">\s*$/m.test(html)};
}

export function makePortableHtml(target,records,issues,automatic,finalDocuments=[]) {
  if(finalDocuments.length && !target.supportsFinals)
    throw new Error("보고서·주보 최종본을 옮기려면 v1.8.0 이상 문결 배포 HTML을 선택하세요.");
  if(finalDocuments.some(doc=>doc.classifications?.length) && !target.supportsClassifications)
    throw new Error("분야·업체 분류까지 옮기려면 v1.9.0 이상 문결 배포 HTML을 선택하세요.");
  const id=[...crypto.getRandomValues(new Uint8Array(16))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
  const data=JSON.stringify({id,automatic,archive:notebookBackup(records,issues,finalDocuments)}).replaceAll("<","\\u003c");
  const {html,insertAt,emptyLength}=target;
  return {id,html:html.slice(0,insertAt)+data+html.slice(insertAt+emptyLength)};
}

export function readPortableNotebook(text) {
  if(!text?.trim())return null;
  let data;
  try {data=JSON.parse(text);}
  catch {throw new Error("개인용 HTML에 담긴 예문을 읽지 못했습니다.");}
  if(!data || typeof data.id!=="string" || !/^[a-f\d]{32}$/u.test(data.id) || typeof data.automatic!=="boolean")
    throw new Error("개인용 HTML의 기록 형식을 확인해 주세요.");
  return {id:data.id,automatic:data.automatic,...validateNotebookArchive(data.archive)};
}

export function readPortableFile(html) {
  const slot=dataSlot.exec(html);
  if(!versionTag.test(html) || !slot)throw new Error("문결에서 저장한 개인용 HTML을 선택하세요.");
  const data=readPortableNotebook(slot[2]);
  if(!data)throw new Error("이 파일은 배포용입니다. 쓰던 문결에서 ‘기록 포함 HTML 저장’으로 만든 개인용 파일을 선택하세요.");
  return data;
}
