// Electrical quantities retain their engineering role as well as their written value.
const amount = String.raw`[+−-]?(?:\d+(?:[.,]\d+)?|\.\d+)\s*`;
const voltage = amount + "(?:mV|kV|V)";
const frequency = amount + "(?:GHz|MHz|kHz|Hz)";
const sideNames = {좌측:"左側",왼쪽:"左側",우측:"右側",오른쪽:"右側"};
const comparators = {
  초과:"を超える", 넘는:"を超える", 이상:"以上の", 미만:"未満の", 이하:"以下の"
};
const electricalNames = {
  "과도 역전압":"過渡的な逆電圧", "과도 과전압":"過渡的な過電圧",
  "과도 전압":"過渡電圧", 역전압:"逆電圧", 과전압:"過電圧", 전압:"電圧"
};
const parameterNames = {
  "허용 피크 전압":"許容ピーク電圧", "허용 피크값":"許容ピーク値", "피크 전압":"ピーク電圧",
  "지속 시간":"印加時間", "펄스 폭":"パルス幅", "인가 시간":"印加時間",
  "반복 주파수":"繰り返し周波数", "스위칭 주파수":"スイッチング周波数", "접합 온도":"接合温度"
};
const kind = "(BJT|MOSFET|IGBT|SiC MOSFET|Si MOSFET|다이오드|트랜지스터)";
const circuitHeader = new RegExp("^([A-Za-z0-9][A-Za-z0-9 ._+/−-]{0,75}?)\\s*회로에\\s*(?:적용된|사용된|사용되는|채택된|탑재된)\\s*"+kind+"의\\s*스위칭\\s*시(?:의)?\\s*(역전압|과전압|과도 전압)(?:과|와|에)\\s*(?:관련하여|관련해|관해|대해)\\s*(?:문의드립니다|문의드리고 싶습니다|문의드리고자 합니다)$","u");
const peak = new RegExp("^(좌측|왼쪽|우측|오른쪽)\\s*(PNP|NPN|MOSFET|IGBT|BJT)\\s+([A-Za-z0-9][A-Za-z0-9._/-]*)\\s*(?:[·:：,]|의)?\\s*(VBE|VCE|VGS|VDS|VGE)\\s*피크(?:값|치| 값)?\\s*[:：]?\\s*(약\\s*)?("+voltage+")$","iu");
const frequencyField = new RegExp("^(스위칭 주파수|반복 주파수)\\s*[:：]?\\s*("+frequency+")$","u");
const threshold = "("+voltage+")(?:을|를)?\\s*(초과|넘는|이상|미만|이하)(?:하는|인|의)?";
const stress = "("+Object.keys(electricalNames).join("|")+")";
const condition = new RegExp("^(?:(위와 같이|상기와 같이|아래와 같이)[,，]?\\s*)?"+threshold+"\\s*"+stress+"(?:이|가)\\s*("+frequency+")(?:로|으로|에서)\\s*반복(?:적으로)?\\s*인가되는\\s*조건(?:에 대해(?:서)?|에|에서|에 대하여)\\s*(별도로?\\s*)?(?:적용(?:할 수 있는| 가능한)\\s*)?(제조사(?:의)?\\s*)?보증\\s*기준이\\s*있는지\\s*확인(?:을)?\\s*(?:부탁드립니다|해\\s*주시기 바랍니다|해\\s*주실 수 (?:있을까요|있습니까))$","u");
const parameterRequest = /^(?:(보증\s*)?기준이\s*(?:있다면|있는 경우|있을 경우)[,，]?\s*)(.+?)(?:의)?\s*조건(?:을|들을)\s*(?:공유해|알려|안내해)\s*주시면\s*감사하겠습니다$/u;
const endurance = /^(보증\s*기준이\s*(?:없다면|없는 경우|없을 경우))[,，]?\s*(몇\s*회|어느 정도)\s*반복\s*인가(?:했을 때|하면|할 경우)\s*(소손|파손|고장)이\s*(?:발생할 수 있는지|발생할 가능성이 있는지)에\s*대한\s*(실력치|실측값|시험 데이터|실측 데이터)(?:를|을)\s*(?:추가로|함께|별도로)?\s*확인(?:해|하여)\s*(?:주실 수 있을까요|주실 수 있습니까|주시기 바랍니다|주세요)$/u;

const components={게이트:"ゲート",베이스:"ベース",컬렉터:"コレクタ",이미터:"エミッタ",소스:"ソース",드레인:"ドレイン",입력단:"入力端",출력단:"出力端"};
const application=new RegExp("^("+Object.keys(components).join("|")+")에\\s*("+voltage+")(?:의)?\\s*(과도 역전압|역전압|과전압|전압)(?:을|를)\\s*(반복(?:적으로)?\\s*)?인가(했습니다|할 예정입니다|해도 되는지 확인 부탁드립니다)$","u");
const measurement=new RegExp("^(VBE|VCE|VGS|VDS|VGE)(?:의)?\\s*피크(?:값|치)?(?:은|는|이|가)\\s*(약\\s*)?("+voltage+")(?:로|으로)\\s*측정(?:되었습니다|됐습니다)$","u");

function translateElectricalLine(text) {
  let match=circuitHeader.exec(text);
  if (match) {
    const component=({다이오드:"ダイオード",트랜지스터:"トランジスタ"})[match[2]] || match[2];
    return match[1].trim()+"回路に使用されている"+component+"のスイッチング時の"+electricalNames[match[3]]+"について、お伺いいたします。";
  }
  match=application.exec(text);
  if (match) {
    const end={했습니다:"しました。","할 예정입니다":"する予定です。","해도 되는지 확인 부탁드립니다":"してもよいか、ご確認をお願いいたします。"};
    return components[match[1]]+"に"+match[2]+"の"+electricalNames[match[3]]+"を"+(match[4]?"繰り返し":"")+"印加"+end[match[5]];
  }
  match=measurement.exec(text);
  if (match) return match[1]+"のピーク値は、測定の結果、"+(match[2]?"約":"")+match[3]+"でした。";
  match=peak.exec(text);
  if (match) return sideNames[match[1]]+"の"+match[2]+" "+match[3]+"（"+match[4]+"ピーク値："+(match[5]?"約":"")+match[6]+"）";
  match=frequencyField.exec(text);
  if (match) return parameterNames[match[1]]+"："+match[2];
  match=condition.exec(text);
  if (match) {
    const [,lead,limit,comparison,signal,rate,separate,maker]=match;
    const intro=lead ? (lead==="아래와 같이"?"下記":"上記")+"のように、" : "";
    return intro+limit+comparators[comparison]+electricalNames[signal]+"が"+rate+"で繰り返し印加される条件について、"+
      (separate?"別途":"")+"適用できる"+(maker?"メーカーの":"")+"保証基準があるか、ご確認をお願いいたします。";
  }
  match=parameterRequest.exec(text);
  if (match) {
    const parameters=match[2].split(/\s*[,、，]\s*|\s+(?:및|그리고|또는)\s+/u);
    if (parameters.every(p=>parameterNames[p]) && !match[2].includes("또는")) {
      const names=parameters.map(p=>parameterNames[p]);
      const list=names.length>1 ? names.slice(0,-1).join("、")+"および"+names.at(-1) : names[0];
      return (match[1]?"保証基準":"基準")+"がございましたら、"+list+"について、"+(names.length>1?"それぞれの":"")+"条件をご教示いただけますと幸いです。";
    }
  }
  match=endurance.exec(text);
  if (match) {
    const failure={소손:"焼損",파손:"破損",고장:"故障"}[match[3]];
    const data=({"실력치":"実測データなど","실측값":"実測値","시험 데이터":"試験データ","실측 데이터":"実測データ"})[match[4]];
    return "保証基準がない場合は、何回程度の繰り返し印加で"+failure+"に至る可能性があるか、"+data+"も併せてご確認いただけますでしょうか。";
  }
  return null;
}

export function technicalLine(source,lang) {
  if (lang!=="ko" || /[\r\n]/u.test(source)) return null;
  const parts=source.match(/^(\s*(?:[-‐–•・]\s+)?)\s*(.*?)\s*[.。?!？]?\s*$/u);
  if (!parts) return null;
  const result=translateElectricalLine(parts[2].replace(/[ \t]+/gu," "));
  return result ? parts[1]+result : null;
}

const jpRelations={
  초과:"(?:を)?(?:超える|超えた|超えて|上回る|上回った|超過する)", 넘는:"(?:を)?(?:超える|超えた|超えて|上回る|上回った|超過する)",
  이상:"以上|を下回らない", 미만:"未満|を下回", 이하:"以下|を超えない"
};

function escaped(value) {return value.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");}
function quantityPattern(value) {
  return "(?<![0-9.,+−-])"+escaped(value.replace(/\s/gu,"")).replace(/(?=[A-Za-z])/u,"\\s*");
}

export function electricalIssues(original,translation,direction) {
  if (direction!=="ko") return [];
  const issues=[];
  for (const match of original.matchAll(new RegExp(threshold,"gu"))) {
    const expected=new RegExp(quantityPattern(match[1])+"\\s*(?:"+jpRelations[match[2]]+")","u");
    if (!expected.test(translation)) issues.push("전압 기준과 비교 조건 확인 · "+match[1]+" "+match[2]);
  }
  const rateSource=new RegExp("("+frequency+")(?:로|으로|에서)\\s*반복(?:적으로)?\\s*인가","gu");
  for (const match of original.matchAll(rateSource)) {
    const q=quantityPattern(match[1]);
    const linked=new RegExp(q+"\\s*(?:(?:の(?:繰[り返]し?[^。、]{0,8}周波数|周波数))?(?:で|にて)|において)[^。、\\n]{0,25}(?:印加|加わ)|(?:繰り返し|繰返し)(?:印加)?(?:周波数)?[：:\\s]*"+q,"u");
    if (!linked.test(translation)) issues.push("반복 인가 주파수 확인 · "+match[1]);
  }
  const outputLines=translation.split(/\r?\n/u);
  for (const line of original.split(/\r?\n/u)) {
    const field=peak.exec(line.trim().replace(/^[-‐–•・]\s+/u,""));
    if (!field) continue;
    const side=sideNames[field[1]].slice(0,1);
    const assigned=outputLines.find(row=>row.includes(field[3]) && row.includes(side));
    if (!assigned || !new RegExp(quantityPattern(field[6])+"(?![a-zA-Z0-9])","u").test(assigned))
      issues.push("좌우 소자의 품번·피크 전압·극성 확인 · "+field[3]);
  }
  const wrongTerms=[
    [/소손/u,/燃え尽き症候群|バーンアウト症候群/u,"소손은 부품의 焼損"],
    [/(?:회로|전압|인가|측정|시험|소손)[\s\S]*실력치/u,/スキル(?:レベル)?|技能レベル/u,"실력치는 시험·실측 문맥"],
    [/(?:전압|반복|펄스)\s*인가/u,/(?:繰り返し|反復|電圧|パルス)[のを ]*申請/u,"전압·펄스 인가는 印加"],
    [/회로에\s*(?:적용된|사용된|채택된)/u,/回路に印加された/u,"회로에 사용된 부품의 표현"],
    [/(?:보증\s*)?기준이\s*있다면/u,/規格をお持ちの方/u,"기준의 유무를 묻는 조건"]
  ];
  for (const [from,to,description] of wrongTerms) if (from.test(original)&&to.test(translation)) issues.push(description);
  return issues;
}

export function refineElectricalTerms(original,translation,direction) {
  if (direction!=="ko") return translation;
  let result=translation;
  if (/소손/u.test(original) && !/번아웃|심리|증후군/u.test(original)) result=result.replace(/燃え尽き症候群|バーンアウト症候群/gu,"焼損");
  if (/(?:전압|펄스|소손|반복\s*인가)[^。.!?\n]*실력치/u.test(original)) result=result.replace(/スキルレベル|技能レベル/gu,"実測値");
  if (/(?:전압|펄스)\s*(?:을|를)?\s*반복\s*인가|반복\s*인가(?:되는|했을|할 때)/u.test(original))
    result=result.replace(/(繰り返し|反復)(の?)申請/gu,"$1$2印加");
  return result;
}
