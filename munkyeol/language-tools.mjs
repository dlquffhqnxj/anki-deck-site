import { technicalLine, electricalIssues } from "./technical-japanese.mjs";
export const coreWords = 20;
export const expandedWords = 100;

// Keep sentence-final punctuation and whitespace so the comparison can reconstruct both texts.
export function sentencePieces(value) {
  return value.match(/[^。！？!?\n]+(?:[。！？!?]+(?:[^\S\n]*[、，,]+)?[」』）”"]*)?[^\S\n]*\n*|[。！？!?]+[^\S\n]*\n*|\n+/gu) || [];
}

export function sentenceForTerm(value, term) {
  const candidates=sentencePieces(value).filter(sentence=>sentence.includes(term));
  return (candidates.find(sentence=>!/[가-힣]/u.test(sentence)) || candidates[0] || "").trim();
}

// Prefix and suffix trimming makes small edits in long paragraphs inexpensive.
// A large, unrelated middle block is shown in full as one replacement.
function diffSequence(a, b) {
  const edits = [];
  function push(type, values) {
    if (!values.length) return;
    const last = edits.at(-1);
    if (last?.type === type) last.values = last.values.concat(values);
    else edits.push({ type, values });
  }
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let endA = a.length, endB = b.length;
  while (endA > head && endB > head && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  push("same", a.slice(0, head));
  const rows = endA - head, cols = endB - head;
  if (!rows || !cols || rows * cols > 1_200_000) {
    push("remove", a.slice(head, endA));
    push("add", b.slice(head, endB));
  } else {
    const stride = cols + 1;
    const chain = new Uint16Array((rows + 1) * stride);
    for (let i = rows - 1; i >= 0; i--) {
      for (let j = cols - 1; j >= 0; j--) {
        const k = i * stride + j;
        chain[k] = a[head + i] === b[head + j] ? 1 + chain[k + stride + 1] : Math.max(chain[k + stride], chain[k + 1]);
      }
    }
    let i = 0, j = 0;
    while (i < rows || j < cols) {
      const k = i * stride + j;
      if (i < rows && j < cols && a[head + i] === b[head + j]) {
        push("same", [a[head + i]]); i++; j++;
      } else if (j === cols || (i < rows && chain[k + stride] >= chain[k + 1])) {
        push("remove", [a[head + i]]); i++;
      } else {
        push("add", [b[head + j]]); j++;
      }
    }
  }
  push("same", a.slice(endA));
  return edits;
}

export function proofreadingChanges(original, revised, hints = []) {
  const differences = [];
  let removed = [], added = [];
  function record(before, after) {
    const parts = diffSequence([...before], [...after]).map(({type, values}) => ({type, text: values.join("")}));
    const reasons = [...new Set(hints.filter(hint => (hint.before || hint.after) &&
      (!hint.before || before.includes(hint.before)) && (!hint.after || after.includes(hint.after))).map(hint => hint.reason))];
    differences.push({before, after, parts, reasons});
  }
  function flush() {
    if (removed.length === added.length) removed.forEach((value, i) => record(value, added[i]));
    else if (removed.length || added.length) record(removed.join(""), added.join(""));
    removed = []; added = [];
  }
  for (const block of diffSequence(sentencePieces(original), sentencePieces(revised))) {
    if (block.type === "same") flush();
    else if (block.type === "remove") removed.push(...block.values);
    else added.push(...block.values);
  }
  flush();
  return differences;
}

const mechanicalRules = [
  [/(確認|検討|評価|手配|提出|送付|調整|連絡)しで(います|いました|おり|いる)/gu, "$1して$2", "‘する’의 て형은 ‘して’입니다. 진행 상태와 시제는 유지했습니다."],
  [/(?<!お)(教え|伝え|知らせ|見せ|送っ|待っ)いただけ/gu, "$1ていただけ", "상대의 행동을 정중하게 요청할 때는 동사의 て형에 ‘いただける’를 연결합니다."],
  [/(各位)(?:様|さま)(?:[。．](?=[^\S\n]*(?:\n|$)))?/gu, "$1", "‘各位’는 여러 수신자를 높이는 호칭이므로 ‘様’를 덜었습니다."],
  [/(株式会社[^\s、。]{1,20}御中)様/gu, "$1", "조직 앞으로 보내는 ‘御中’에 겹친 ‘様’를 덜었습니다."],
  [/(?:おくり|送り)ので/gu, "お送りしますので", "이유를 잇는 ‘ので’ 앞에 동사의 종지형 ‘お送りします’를 썼습니다."],
  [/ご参考(?:を)?お願い(?:致|いた)?します/gu, "ご参考になさってください", "받는 사람이 참고하도록 부탁하는 표현으로 조사와 서술어를 갖췄습니다."],
  [/をご(確認|検討|提出)(?:を)?お願い(?:致|いた)?します/gu, "をご$1ください", "목적어에 이미 붙은 ‘を’는 유지하고, 뒤의 요청은 ‘ご～ください’로 연결했습니다."],
  [/ご(確認|検討|対応|返信|連絡|協力|提出)お願い(?:致|いた)?します/gu, "ご$1をお願いします", "요청 대상을 나타내는 조사 ‘を’를 보완했습니다."],
  [/一緒(使[うえわ]|使用|検討)/gu, "一緒に$1", "뒤의 동사를 꾸미는 ‘一緒に’에 필요한 조사 ‘に’를 넣었습니다."],
  [/(を|に|が|で|は)\1(?=[\p{Script=Han}ァ-ヺ])/gu, "$1", "연속해서 두 번 쓰인 조사를 한 번으로 줄였습니다."],
  [/確認いる(?=[。．、，\s]|$)/gu, "確認している", "진행 상태를 나타내는 ‘する’ 동사의 ‘ている’형을 복원했습니다."],
  [/(確認|検討|依頼|提出|送付|回答|評価)しまた/gu, "$1しました", "과거 정중형 ‘しました’의 빠진 음절을 보완했습니다."],
  [/(確認|検討|依頼|提出|送付|回答|評価)しますた/gu, "$1しました", "동사의 과거 정중형을 ‘しました’로 고쳤습니다."],
  [/して頂だき/gu, "していただき", "‘いただき’의 중복 표기를 바로잡았습니다."],
  [/させていだた/gu, "させていただ", "‘いただく’의 음절 순서를 바로잡았습니다."],
  [/させて頂きたく存じ上げます/gu, "させていただきたく存じます", "자신의 의향을 나타내는 겸양 표현 ‘存じます’를 썼습니다."],
  [/拝見させていただきました/gu, "拝見しました", "보았다는 사실과 시제를 유지하면서 겹친 겸양 표현을 덜었습니다."],
  [/おっしゃられ(た|ました|ます|る)/gu, "おっしゃ$1", "‘おっしゃる’에 겹친 존경 표현을 정리했습니다.", "respect"],
  [/お伺いさせていただきます/gu, "伺います", "방문하거나 묻는 주체의 겸양 표현을 간결하게 정리했습니다."],
  [/(ありがと|おめでと)うございましだ/gu, "$1うございました", "정중한 과거형 끝소리를 바로잡았습니다."],
  [/に関しましてはは/gu, "に関しましては", "주제 조사 ‘は’의 중복을 바로잡았습니다."],
  [/に関するについて/gu, "について", "같은 기능을 하는 두 연결 표현을 하나로 정리했습니다."],
  [/(進捗と状況|Biz規模|CLV管理番号)[；;]/gu, "$1：", "항목명과 내용 사이에 구분 기호를 썼습니다."],
  [/(は|を)(?=[、，][。．])/gu, "$1", ""],
  [/。[\t 　]*[、，,]+/gu, "。", "마침표 다음에 중복된 쉼표를 덜었습니다."],
  [/[、，]{2,}/gu, "、", "연속된 쉼표를 하나로 정리했습니다."],
  [/。{2,}/gu, "。", "연속된 마침표를 하나로 정리했습니다."]
];

const registerRules = [
  [/((?:教えて|お教え|お知らせ|ご教示)いただけ)ますでしょうか(?=[？?。]|$)/gu, "$1ますか", "상대에 대한 정중함을 유지하면서 의문형을 ‘いただけますか’로 간결하게 했습니다.", "email"],
  [/細かい内容は下記をご確認ください/gu, "詳細は下記をご確認ください", "세부 정보를 안내하는 상투 표현을 간결한 확인 요청으로 다듬었습니다."],
  [/細かい内容は/gu, "詳細は", "보고·안내 문장에서 ‘세부 내용’을 뜻하는 간결한 표현을 썼습니다."],
  [/ご参考になさってください/gu, "ご参考にしていただけますと幸いです", "참고를 부탁하는 메일 표현을 완곡하게 다듬었습니다.", "email"],
  [/(ご(?:確認|検討|対応|返信|連絡|協力|提出))をお願いします/gu, "$1をお願いいたします", "부탁의 대상을 유지하고 대외 메일의 정중한 종결형을 썼습니다.", "email"],
  [/宜しくお願い(?:致|いた)?します|よろしくお願い致します/gu, "よろしくお願いいたします", "업무 메일 맺음말의 보조동사와 인사말 표기를 통일했습니다."],
  [/よろしくお願いします/gu, "よろしくお願いいたします", "대외 메일의 맺음말을 한 단계 정중하게 다듬었습니다.", "email"],
  [/(ご確認|ご検討|ご連絡|ご対応|ご返信)(?:のほど|の程)[、，]?\s*宜しく/gu, "$1のほど、よろしく", "요청 표현의 표기와 끊어 읽는 위치를 정리했습니다."],
  [/競合社(?=[：:、。\sのはが])/gu, "競合他社", "경쟁 업체를 가리키는 자연스러운 업무 용어를 썼습니다."],
  [/を探し中(?=[。．、\s]|$)/gu, "を探している", "찾고 있는 상태를 보고 문체의 동사형으로 적었습니다.", "report"],
  [/([0-9０-９]{1,4}年[0-9０-９]{1,2}月)から始まりで[、，]/gu, "$1開始で、", "원문의 시작 시점을 유지하고 뒤 문장과의 연결을 다듬었습니다.", "report"],
  [/([A-Za-z][A-Za-z0-9_.-]*[0-9][A-Za-z0-9_.-]*)検討希望/gu, "$1の検討を希望", "검토 대상과 희망 사항 사이에 필요한 조사를 보완했습니다.", "report"],
  [/検討が多くなるサポートしていきます/gu, "検討が増えるよう支援していきます", "지원의 목적을 ‘～よう’로 이어 앞으로의 지원 방침을 표현했습니다.", "report"],
  [/今回Projectは/gu, "今回のProjectは", "지시 표현과 프로젝트명 사이에 연체 조사 ‘の’를 보완했습니다."],
  [/と一緒に使える/gu, "と併用できる", "두 장치를 함께 사용할 수 있음을 기술 문서의 ‘併用できる’로 표현했습니다.", "report"],
  [/も紹介希望(?=[。．、\s]|$)/gu, "についても紹介を希望", "추가 소개를 희망한다는 요청의 내용과 서술 관계를 명확히 했습니다.", "report"],
  [/下記を確認してください/gu, "下記をご確認ください", "메일 수신자에게 요청하는 확인 동작을 높였습니다.", "email"]
];

export function proofReviewFlags(value) {
  const checks = [
    [/(?:先方|顧客|担当者|お客様)から[^。\n]{0,36}てくださいました/u, "‘から’가 자료의 출처인지, ‘～てくださいました’의 행위 주체인지 확인하세요. 상대가 직접 해 준 일이라면 ‘が’가 자연스럽습니다."],
    [/[^。\n、]{0,14}以外[、\s]*(?:博士|学生|教授|担当者)[^。\n、]{0,12}/u, "‘以外’는 제외를 뜻합니다. 참석자에 포함하려던 뜻이면 ‘ほか’인지 확인하세요."],
    [/限り[\s～〜~]*[0-9０-９][^。\n）)]{0,16}/u, "기한인지 유효 기간인지 확인한 뒤 ‘まで’ 또는 ‘に限り’로 정하세요."],
    [/採用狙いで/u, "누구의 채택을 목표로 하는지 확인하면 주어와 조사를 정확히 정할 수 있습니다."],
    [/紹介と情報確認に行/u, "누가 누구에게 소개했고 누구에게서 정보를 확인했는지 점검하세요."],
    [/Air Suspation/u, "본문에 쓰인 영문 기술명과 철자가 같은지 확인하세요."],
    [/始まりで/u, "시작 일정이 확정인지 예정인지 원문 작성자에게 확인하세요."]
  ];
  return checks.flatMap(([pattern, message]) => {
    const match = value.match(pattern);
    return match ? [match[0].trim() + " — " + message] : [];
  });
}

export function correctLocally(original, strength = "minimal", style = "email") {
  const changes = [];
  const rules = strength === "business" ? [...mechanicalRules,...registerRules] : mechanicalRules;
  const corrected = sentencePieces(original).map(sentence => {
    let result = sentence;
    const reasons = new Set();
    for (const [pattern, replacement, reason, register] of rules) {
      if (register && register !== "respect" && register !== style) continue;
      result = result.replace(pattern, (before, ...groups) => {
        let after = replacement.replace(/\$(\d)/gu, (_, n) => groups[Number(n) - 1]);
        if (register === "respect") after = ({た:"おっしゃった", ました:"おっしゃいました", ます:"おっしゃいます", る:"おっしゃる"})[groups[0]];
        if (before !== after) reasons.add(reason);
        return after;
      });
    }
    for (const reason of reasons) changes.push({before:sentence.trimEnd(), after:result.trimEnd(), reason});
    return result;
  }).join("");
  return {corrected, changes};
}

export function cleanGlossary(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.flatMap(row => {
    const fields = ["ko","ja","reading","context"].map(k => typeof row?.[k] === "string" ? row[k].trim() : "");
    const [ko, ja, reading, context] = fields;
    if (!ko || !ja || ko.length > 64 || ja.length > 64 || reading.length > 80 || context.length > 100 ||
        fields.some(v => /[\u0000-\u001f]/u.test(v)) || reading && !/^[ぁ-ゖァ-ヺゝゞヽヾー・ 　]+$/u.test(reading)) return [];
    const id = JSON.stringify([ko, ja, context]);
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ko, ja, reading, context}];
  });
}

export function matchedGlossary(text, direction, glossary) {
  const groups = new Map();
  for (const entry of glossary) {
    const term = entry[direction];
    if (!text.includes(term)) continue;
    const cues = entry.context.split(/[,、，]/u).map(v => v.trim()).filter(Boolean);
    if (cues.length && !cues.some(cue => text.includes(cue))) continue;
    if (!groups.has(term)) groups.set(term, []);
    groups.get(term).push(entry);
  }
  const selected = [];
  for (const group of groups.values()) {
    const contextual = group.filter(e => e.context);
    const chosen = contextual.length ? contextual : group;
    const targets = new Set(chosen.map(e => e[direction === "ko" ? "ja" : "ko"]));
    if (targets.size === 1) selected.push(chosen[0]);
  }
  const occupied = [];
  return selected.sort((a,b) => b[direction].length - a[direction].length).filter(entry => {
    const term = entry[direction];
    let usable = false, start = 0;
    while ((start = text.indexOf(term,start)) >= 0) {
      const end = start + term.length;
      if (!occupied.some(span => start < span.end && end > span.start)) {
        occupied.push({start,end});
        usable = true;
      }
      start = end;
    }
    return usable;
  });
}

export function glossaryInText(text, direction, entries) {
  return [...new Set(auditSentences(text).flatMap(line => matchedGlossary(line, direction, entries)))];
}

function particlesFor(replacement, originalTail) {
  const tail = replacement.at(-1)?.charCodeAt(0) - 0xac00;
  if (!(tail >= 0 && tail <= 11171)) return originalTail;
  const final = tail % 28;
  const forms = {은:["는","은"], 는:["는","은"], 가:["가","이"], 이:["가","이"], 를:["를","을"], 을:["를","을"], 와:["와","과"], 과:["와","과"]};
  return forms[originalTail]?.[Number(Boolean(final))] || originalTail;
}

// Substitute a preferred term only at a known equivalent in the translated sentence.
export function applyPreferredTerm(text, equivalent, preferred, target) {
  if (!equivalent || equivalent === preferred || text.includes(preferred) || !text.includes(equivalent)) return text;
  const escaped = equivalent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = target === "ko"
    ? new RegExp("(?<![가-힣A-Za-z0-9])" + escaped + "(?:(은|는|이|가|을|를|과|와)(?=$|[^가-힣A-Za-z0-9])|(?=$|[^가-힣A-Za-z0-9])|(?=에서|으로|에게|까지|부터|에|의|도|만))", "gu")
    : new RegExp("(?<![\\p{Script=Han}A-Za-z0-9])" + escaped + "(?![\\p{Script=Han}A-Za-z0-9])", "gu");
  return text.replace(pattern, (_, particle) => preferred + (target === "ko" && typeof particle === "string" ? particlesFor(preferred, particle) : ""));
}

const meaningChecks = [
  ["납기", /납기|납품\s*(?:일|기한|일정)/u, /納期|納入(?:日|期|期限|予定)|納品(?:日|期|期限|予定)|引き渡し日|リードタイム|提出期限/u],
  ["예정·계획", /예정|계획/u, /予定|計画|つもり|方針/u],
  ["추정·예상", /추정|추측|예상|전망|것으로\s*(?:보|판단)|것\s*같/u, /推測|推定|予想|見込|見通し|とみられ|と見られ|と思われ|と考えられ|よう(?:です|だ)/u],
  ["검토 중", /검토\s*(?:중|하고\s*있)/u, /検討中|検討.{0,6}(?:てい|ており|ておる|ております)|検討段階/u],
  ["요청·의뢰", /요청|의뢰|부탁/u, /依頼|要請|要望|要求|お願|求め|いただきたい|いただけ|ください|頂け/u],
  ["미확정·미정", /미확정|미정|확정되지\s*않|확정되지\s*못/u, /未確定|未定|確定していな|決まっていな|確定しておらず|確定しておりません/u],
  ["완료·대응 완료", /완료|마쳤|마쳤으|이미.{0,12}(?:했|하였|해\s*두)/u, /完了|終了|済[みむん]?|終え/u],
  ["부정·미실시", /아직.{0,22}(?:않|못|없|미신청)|하지\s*않|되지\s*않|미신청|미실시|미확정|미정/u, /未[申実確定]|[てで](?:いな|おらず|おりません)|[しせ]ない|しません|されず|していません|なかった/u],
  ["각각의 수량", /각각|각\s*\d|\d+\s*(?:개|대|장)씩/u, /各(?:々|自)?|ずつ|づつ|それぞれ/u],
  ["선행 조건", /(?:한|된|받은|받으신|마친|한\s*다음)\s*(?:후|뒤|다음)에만/u, /(?:後|場合)(?:に限り|に?のみ|に?だけ|でなければ|でないと)|て初めて|てから(?:でなければ|でないと|のみ)|てからしか|までは.{0,20}できな/u],
  ["기한", /까지/u, /まで|迄|期限|締[切め]|期日/u],
  ["고객", /고객|상대(?:방|\s*측)|거래처/u, /顧客|お客|先方|得意先|取引先|客先|クライアント/u],
  ["자사", /당사|자사|저희/u, /当社|弊社|自社|当方|弊方|私ども/u],
  ["조건", /경우|다면|이라면/u, /場合|とき|なら|たら|れば|際/u],
  ["희망", /희망|원하/u, /希望|望ん|望む|ご意向/u]
];

export function technicalValues(text) {
  const weeks = {첫:1,첫째:1,둘째:2,셋째:3,넷째:4,다섯째:5,一:1,二:2,三:3,四:4,五:5};
  const normalized = text.normalize("NFKC").replaceAll("−","-")
    .replace(/제?([1-4])\s*분기|第?([1-4])四半期/gu, (_,ko,ja)=>(ko || ja)+"Q")
    .replace(/(첫째|첫|둘째|셋째|넷째|다섯째)\s*주/gu, (_,ordinal) => weeks[ordinal] + "주")
    .replace(/第([一二三四五])週/gu, (_,ordinal) => "第" + weeks[ordinal] + "週");
  const number = "[+±−-]?\\d+(?:,\\d{3})*(?:\\.\\d+)?";
  const unit = "(?:VAC|VDC|kV|mV|V|kA|mA|A|kW|mW|W|ms|[µμ]s|ns|MHz|kHz|Hz|°C|°F|mΩ|kΩ|Ω|mF|[µμ]F|EA|[Pp][Cc][Ss]?|%)";
  const code = "(?=[A-Za-z0-9._-]*[A-Za-z])(?=[A-Za-z0-9._-]*\\d)[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*";
  const pattern = new RegExp("(?<![A-Za-z0-9_])(?:\\$" + number + "[KM]?|" + number + "[ \\t]*" + unit + "|" + code +
    "|" + number + "|[A-Z]{2,}(?:-[A-Z]{2,})*)(?![A-Za-z0-9_])","gu");
  return [...normalized.matchAll(pattern)].map(m => m[0].replace(/\s/gu,"").replace(/(?<=\d),(?=\d{3}(?:\D|$))/gu,""));
}

function unmatchedValues(left, right) {
  const remaining = [...right];
  return left.filter(value => {
    const index = remaining.indexOf(value);
    if (index < 0) return true;
    remaining.splice(index,1);
    return false;
  });
}

export function verifyProofFacts(original, corrected) {
  const before = technicalValues(original), after = technicalValues(corrected);
  const missing = unmatchedValues(before, after), extra = unmatchedValues(after, before);
  return [...new Set([...missing, ...extra])];
}

export function proofMeaningAlerts(original, revised) {
  const alerts = [];
  for (const change of proofreadingChanges(original,revised)) {
    const a = change.before, b = change.after;
    const plan = /予定|計画|見込|つもり/u;
    const done = /完了|対応済|提出済|送付済|確認済|(?:確認|送付|提出|決定|確定|対応)(?:した|しました|いたしました)/u;
    const neg = /未(?:定|確認|確定|登録|実施|申請|提出|対応)|(?:確認|確定|登録|実施|申請|提出|対応)(?:していな|しておらず|しておりません|していません)/u;
    const settled = /(?:確認|確定|登録|実施|申請|提出|対応)(?:した|しました|いたしました|済)/u;
    if (plan.test(a) && !plan.test(b) && done.test(b) || done.test(a) && !done.test(b) && plan.test(b)) alerts.push("예정·완료");
    if (neg.test(a) && !neg.test(b) && settled.test(b) || settled.test(a) && !settled.test(b) && neg.test(b)) alerts.push("부정·완료");
    const requester = /(?:顧客|客先|先方|お客様)(?:から|より|が).{0,24}(?:依頼|要請)/u;
    const recipient = /(?:顧客|客先|先方|お客様)に.{0,24}(?:依頼|要請)/u;
    if (requester.test(a) && recipient.test(b) || recipient.test(a) && requester.test(b)) alerts.push("요청 주체");
  }
  return [...new Set(alerts)];
}

const proofKinds = {
  particle:"조사와 서술어의 연결", spelling:"철자와 표기", syntax:"문장 구조", honorific:"경어와 행위 주체",
  register:"문서 유형에 맞는 문체", punctuation:"문장 부호"
};

export function applyJapaneseSuggestions(baseline, suggestions, strength) {
  const lines = sentencePieces(baseline.corrected);
  const reasons = [...baseline.changes];
  const notes = new Map();
  let withheld = 0;
  for (const edit of Array.isArray(suggestions) ? suggestions : []) {
    const index = edit?.line;
    if (!Number.isInteger(index) || !Object.hasOwn(lines,index) || typeof edit.before !== "string" || !edit.before.trim() ||
        typeof edit.after !== "string" || !edit.after.trim() || edit.before === edit.after ||
        !Object.hasOwn(proofKinds,edit.kind) || (strength === "minimal" && edit.kind === "register")) continue;
    const value = lines[index];
    if (value.indexOf(edit.before) < 0 || value.indexOf(edit.before) !== value.lastIndexOf(edit.before) ||
        edit.after.length > edit.before.length * 3 + 20 || /[\r\n]/u.test(edit.after) || !/[ぁ-ゖァ-ヺ\p{Script=Han}]/u.test(edit.after) ||
        proofReviewFlags(value).length) continue;
    const revised = value.replace(edit.before, () => edit.after);
    if (verifyProofFacts(value,revised).length || proofMeaningAlerts(value,revised).length) { withheld++; continue; }
    lines[index] = revised;
    const description = proofKinds[edit.kind] + " 수정 · " + edit.before + " → " + edit.after;
    if (!notes.has(index)) notes.set(index,[]);
    notes.get(index).push(description);
  }
  for (const [i, hints] of notes) {
    for (const reason of hints) reasons.push({before:"",after:lines[i].trim(),reason});
  }
  return {corrected:lines.join(""),changes:reasons,withheld};
}

export function auditPair(before, after, direction, glossary = [], label = "") {
  const issues = electricalIssues(before,after,direction);
  const source = direction === "ko" ? 1 : 2, target = source === 1 ? 2 : 1;
  const originalValues = technicalValues(before), resultValues = technicalValues(after);
  const missing = unmatchedValues(originalValues, resultValues), extra = unmatchedValues(resultValues, originalValues);
  if (missing.length) issues.push("원문 수치·품번 " + [...new Set(missing)].join(", "));
  if (extra.length) issues.push("번역문에 추가된 수치·품번 " + [...new Set(extra)].join(", "));
  for (const check of meaningChecks) {
    if (check[source].test(before) && !check[target].test(after)) issues.push(check[0] + " 표현 확인");
  }
  const weekdays = [["월요일","月曜"],["화요일","火曜"],["수요일","水曜"],["목요일","木曜"],["금요일","金曜"],["토요일","土曜"],["일요일","日曜"]];
  for (const day of weekdays) {
    const [from,to] = direction === "ko" ? day : [day[1],day[0]];
    if (before.includes(from) && !after.includes(to)) issues.push("요일 확인 · " + from);
  }
  const sourcePlanned = meaningChecks[1][source].test(before);
  const targetDone = meaningChecks[6][target].test(after);
  if (sourcePlanned && !meaningChecks[6][source].test(before) && targetDone) issues.push("예정 사항이 완료로 표현됐는지 확인");
  const subjectRequest = {ko:/고객(?:사|측|사 측)?(?:이|가|에서).{0,32}(?:요청|의뢰)|고객.{0,4}(?:으로부터|에게서).{0,24}(?:요청|의뢰)/u,
    ja:/(?:顧客|客先|先方|お客(?:様|さま))(?:が|から|より).{0,32}(?:依頼|要請|要望)/u};
  const recipientRequest = {ko:/고객(?:사|측)?(?:에게|에).{0,26}(?:요청|의뢰)/u,
    ja:/(?:顧客|客先|先方|お客(?:様|さま))に.{0,26}(?:依頼|要請|お願)/u};
  const other = direction === "ko" ? "ja" : "ko";
  if ((subjectRequest[direction].test(before) && recipientRequest[other].test(after)) ||
      (recipientRequest[direction].test(before) && subjectRequest[other].test(after))) issues.push("요청한 쪽과 요청받은 쪽 확인");
  for (const entry of glossary) {
    const expected = entry[direction === "ko" ? "ja" : "ko"];
    if (before.includes(entry[direction]) && !after.includes(expected)) issues.push("용어집 표기 확인 · " + expected);
  }
  return issues.length ? [{before, after, label, issues}] : [];
}

function auditSentences(text) {
  // Periods inside identifiers, decimals and e-mail addresses stay in the same sentence.
  return text.split(/\n+|(?<=[。！？!?])\s*|(?<=\.)\s+(?=[^\s])/u).map(s => s.trim()).filter(Boolean);
}

export function auditTranslation(before, after, direction, glossary = [], label = "") {
  const a = auditSentences(before), b = auditSentences(after);
  if (a.length !== b.length || !a.length) return auditPair(before, after, direction, glossary, label);
  return a.flatMap((sentence, i) => auditPair(sentence, b[i], direction, matchedGlossary(sentence, direction, glossary), a.length > 1 ? [label, (i + 1) + "번째 문장"].filter(Boolean).join(" · ") : label));
}

export function ankiTsv(words) {
  const field = value => String(value || "").replace(/[\r\n\t]+/gu, " ").trim().replaceAll('"','""');
  const rows = words.map(word => [word.term, word.reading, word.meaning, word.sentence].map(v => '"' + field(v) + '"').join("\t"));
  return ["#separator:Tab", "#html:false", "#columns:단어\t읽기\t뜻\t사용 문장", ...rows].join("\n") + "\n";
}

// Match only complete, unambiguous business sentences. Dates, identifier strings and quantities are carried as slots.
export function translationPieces(source) {
  return source.split(/(\r?\n|(?<=[。！？!?])[ \t]*|(?<=\.)[ \t]+)/u);
}

export function businessDocumentTranslation(source,lang,style="email",apply=(_,result)=>result) {
  const output=[];
  for (const piece of translationPieces(source)) {
    if (!piece.trim()) {output.push(piece);continue;}
    const value=businessPhraseTranslation(piece,lang,style);
    if (!value) return null;
    output.push(apply(piece,value));
  }
  return output.join("") || null;
}

export function businessPhraseTranslation(source,lang,style="email") {
  const electrical=technicalLine(source,lang);
  if(electrical) return electrical;
  const value=source.trim().replace(/[。.]$/u,"").trim();
  if (!value || /[\r\n]/u.test(value)) return null;
  const pairs=[["샘플","サンプル"],["시제품","試作品"],["평가 보드","評価ボード"],["대체품","代替品"],["부품","部品"]];
  const days=["월","화","수","목","금","토","일"], jpDays=["月","火","水","木","金","土","日"];
  const item=(name,from)=>pairs.find(p=>p[from]===name)?.[1-from];
  const nouns=pairs.map(p=>p[lang==="ko"?0:1]).join("|");
  const id="(?:([A-Za-z][A-Za-z0-9._-]*[0-9][A-Za-z0-9._-]*)[ 　]*)?";
  let m;
  if(lang==="ko") {
    const rule=new RegExp("^"+id+"("+nouns+")(?:\\s+(각\\s*)?(\\d+(?:,\\d{3})*)\\s*(EA|개|대|세트))?(?:의)?\\s*납기(?:를|는)\\s*(?:([월화수목금토일])요일까지\\s*)?확인할\\s*예정(?:입니다|이다|임)?$","u");
    if ((m=value.match(rule))) {
      const [,part,noun,each,qty,unit,day]=m;
      const amount=qty ? (each ? "各" : "")+qty+({EA:" EA",개:"個",대:"台",세트:"セット"})[unit] : "";
      return (part?part+"の":"")+item(noun,0)+amount+"の納期を"+(day?jpDays[days.indexOf(day)]+"曜日までに":"")+"確認する予定"+(style==="report"?"。":"です。");
    }
    const production=/^(시제품|샘플|부품|평가 보드)(?:은|는|을|를)\s+(?:(\d{2,4})년\s*)?(1[012]|[1-9])월에\s*(약\s*)?(\d+(?:,\d{3})*)\s*(대|개|세트|EA)(?:를|을)?\s*(제작|출하|생산|제출)할\s*예정(?:이며,?\s*(양산|출하|제출)\s*일정(?:은|이)\s*(미확정|미정|미확인)(?:입니다|이다|임)?|입니다|이다|임)?$/u;
    if((m=value.match(production))) {
      const [,noun,year,month,approx,quantity,unit,action,next,status]=m;
      const schedule=(year?year+"年":"")+month+"月に"+item(noun,0)+"を"+(approx?"約":"")+quantity+
        ({대:"台",개:"個",세트:"セット",EA:" EA"})[unit]+({제작:"製作",출하:"出荷",생산:"生産",제출:"提出"})[action]+"する予定";
      const follow=next?"で、"+({양산:"量産",출하:"出荷",제출:"提出"})[next]+"日程は"+({미확정:"未確定",미정:"未定",미확인:"未確認"})[status]:"";
      return schedule+follow+(style==="report"?"。":"です。");
    }
    m=value.match(/^(샘플|시제품|부품)\s*(제작|평가|제출|발송)\s*(?:의뢰|요청)(?:는|은)\s*아직\s*신청하지\s*(?:않은|않으신)\s*(?:것으로\s*보입니다|것\s*같습니다)$/u);
    if(m)return item(m[1],0)+({제작:"製作",평가:"評価",제출:"提出",발송:"発送"})[m[2]]+"の依頼は、まだ申請されていないよう"+(style==="report"?"だ。":"です。");
    m=value.match(/^(고객(?:사)?|당사)(?:가|이)\s*(고객(?:사)?|당사)에\s*(대체품|샘플|시제품|부품|평가 보드)(?:의)?\s*(검토|평가|제출|발송)(?:를|을)\s*(?:요청|의뢰)(?:했습니다|하였다|했다|함)$/u);
    if(m && (m[1]==="당사") !== (m[2]==="당사")) {
      const party=v=>v==="당사"?(style==="email"?"弊社":"当社"):(style==="email"?"お客様":"顧客");
      return party(m[1])+"が"+party(m[2])+"に"+item(m[3],0)+"の"+({검토:"検討",평가:"評価",제출:"提出",발송:"発送"})[m[4]]+"を依頼"+(style==="report"?"した。":"しました。");
    }
  }else if(lang==="ja") {
    const japanesePart="(?:([A-Za-z][A-Za-z0-9._-]*[0-9][A-Za-z0-9._-]*)[ 　]*(?:の)?)?";
    const rule=new RegExp("^"+japanesePart+"("+nouns+")(?:(各)?(\\d+(?:,\\d{3})*)[ 　]*(EA|個|台|セット))?の納期を(?:([月火水木金土日])曜(?:日)?までに)?確認する予定(?:です|だ)?$","u");
    if((m=value.match(rule))) {
      const [,part,noun,each,qty,unit,day]=m;
      return (part?part+" ":"")+item(noun,1)+(qty?" "+(each?"각 ":"")+qty+({EA:" EA",個:"개",台:"대",セット:"세트"})[unit]:"")+"의 납기를 "+(day?days[jpDays.indexOf(day)]+"요일까지 ":"")+"확인할 예정입니다.";
    }
    m=value.match(/^(\d{2,4})年(?:第([1-4])四半期|([1-4])Q)の(採用|量産|出荷|提出|評価)は(?:難しい|困難だ)と(?:見込んでいます|見込んでいる|予想しています)$/u);
    if(m)return m[1]+"년 "+(m[2]||m[3])+"분기에 "+({採用:"채택",量産:"양산",出荷:"출하",提出:"제출",評価:"평가"})[m[4]]+"하기는 어려울 것으로 예상하고 있습니다.";
    m=value.match(/^(先方|顧客|客先|お客様)(?:から|より)(代替品|サンプル|試作品|部品|評価ボード)の(評価|検討|提出|発送)を(?:依頼されました|依頼された|依頼されております)$/u);
    if(m) return (m[1]==="先方"?"상대 측":"고객")+"으로부터 "+item(m[2],1)+" "+({評価:"평가",検討:"검토",提出:"제출",発送:"발송"})[m[3]]+(["提出","発送"].includes(m[3])?"을":"를")+" 의뢰받"+(value.endsWith("おります")?"은 상태입니다.":"았습니다.");
    m=value.match(/^(サンプル|試作品|代替品|部品)は手配済み(?:です)?(?:が|だが)、?納期はまだ確定して(?:いません|いない|おりません)$/u);
    if(m) return item(m[1],1)+"은"+" 이미 수배했지만 납기는 아직 확정되지 않았습니다.";
    m=value.match(/^(サンプル|試作品|代替品|部品)は(各)?(\d+(?:,\d{3})*)\s*(個|台|セット|EA)を希望して(?:おり|いて)、?発注は(まだ)?(?:未確定です|確定していません|確定しておりません)$/u);
    if(m){
      const [,noun,each,count,unit,yet]=m;
      const quantity=(each?"각 ":"")+count+({個:"개",台:"대",セット:"세트",EA:" EA"})[unit];
      return item(noun,1)+"은 "+quantity+"를 희망하며, 발주는 "+(yet?"아직 ":"")+"미확정입니다.";
    }
  }
  return null;
}
