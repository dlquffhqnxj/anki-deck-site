(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const repo = 'https://github.com/dlquffhqnxj/anki-deck-project/blob/main/';
  function evidence(d,key) {
    const value=d.qa[key] || 'NOT_TESTED';
    let done='',left='',type='기존 제품별 검증 기록',date='원문 날짜 참조';
    if(!d.current) {done='해당 이전판의 Release 기록만 반영합니다.';left='현재판의 결과는 이전판에 적용하지 않습니다.';}
    else if(key==='STATIC') {
      done=value==='NOT_TESTED'?'이번 파일·카드 구성 검사는 수행하지 않았습니다.':d.product_id==='epd-auditor'?'단독 APKG 크기·SHA-256이 기존 CRC·SQLite 검증본과 일치합니다.':'기존 제품별 파일·카드 구조 검사 결과를 유지합니다.';
      left=value==='NOT_TESTED'?'사용자 요청에 따라 검사 보류. NOT_TESTED 자체는 오류 판정이 아닙니다.':d.product_id==='epd-auditor'?'미디어·필드 참조의 전수 확인이 남았습니다.':'내용 전수 감수와 실제 기기 동작은 별도 범위입니다.';
    } else if(key==='IMPORT') {done='새 Anki 프로필에 가져오기가 정상 완료되었다는 사용자 확인.';left='앱/OS 세부 버전·표본·전후 수량은 이번 보고에 없습니다.';type='사용자 보고';date=d.qa_reported_at+' 보고 · 실제 시험일 미기록';}
    else if(key==='DEVICE') {done=Object.entries(d.runtime_devices||{}).filter(([,v])=>v==='PASS').map(([k])=>k).join(' · ')+' 기본 실행 사용자 확인.';left='기능별 터치·미디어·왕복 동기화의 상세 증거는 별도입니다.';type='사용자 보고';date=d.qa_reported_at+' 보고 · 실제 시험일 미기록';}
    else if(key==='UPDATE') {
      if(d.product_id==='toeic-lab') {done='기존 버전 위 업데이트 정상·학습 기록 보존 사용자 확인.';left='이전 버전 번호가 특정되지 않아 모든 업데이트 경로로 확대하지 않습니다.';type='사용자 보고';date='2026-09-30 기존 보고 유지';}
      else if(d.product_id==='jlpt-vocabulary-grammar-lab') {done='RC1 → RC2 기존 노트 식별자와 기존 카드 행 해시 보존 검사.';left='파일 내부 비교의 PARTIAL입니다. 실제 앱 업데이트·동기화의 전체 확인은 남았습니다.';}
      else {done='해당 제품의 업데이트 전후 결과가 특정되지 않았습니다.';left='같은 제품의 이전판 → 현재판 경로와 학습 이력 보존 확인이 필요합니다.';}
    }
    return `<details class="qa-evidence"><summary>검증 근거 보기</summary><dl><dt>확인한 범위</dt><dd>${esc(done)}</dd><dt>남은 확인</dt><dd>${esc(left)}</dd><dt>근거·날짜</dt><dd>${esc(type)} · ${esc(date)}</dd></dl><a class="text-link" href="${esc(d.release_url)}" target="_blank" rel="noopener noreferrer">원문 기록 보기 · GitHub 접근 권한 필요</a></details>`;
  }
  function changes(d) {
    const x=d.learner;
    if(!x) return '';
    return `<details class="release-changes"><summary>${esc(x.change_title)}</summary><ul>${x.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><p class="scope">정리일 ${esc(x.reviewed_at)} · <a class="text-link" href="${esc(repo+x.source)}" target="_blank" rel="noopener noreferrer">버전 기록 원문</a></p></details>`;
  }
  function deck(d) {
    const x=d.learner;
    if(!x) return '';
    return `<section class="section" id="study-path"><div class="section-heading"><h2>이 순서로 학습해 보세요</h2><a class="text-link" href="study.html">새 학습 디자인 체험</a></div><ol class="study-path">${x.steps.map((s,i)=>`<li class="panel"><span class="step-number">0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol></section><section class="section panel body-copy" id="known-issues"><h2>알려진 문제와 대처법</h2>${x.issues.length?x.issues.map(i=>`<article class="known-issue"><div class="issue-heading"><h3>${esc(i.title)}</h3><span class="badge badge-muted">${esc(i.kind)}</span></div><dl><dt>학습에 미치는 영향</dt><dd>${esc(i.impact)}</dd><dt>지금 할 수 있는 일</dt><dd>${esc(i.workaround)}</dd><dt>진행 상태</dt><dd>${esc(i.status)}</dd></dl></article>`).join(''):'<p>현재 정리된 구체적 문제 제보가 없습니다. 발견한 내용은 아래 양식으로 남겨 주세요.</p>'}<p class="scope">정리일 ${esc(x.reviewed_at)} · 검사를 안 했다는 표시(NOT_TESTED)와 구체적인 문제 제보는 구분합니다.</p></section><section class="section panel body-copy"><h2>이번 버전의 기록</h2>${changes(d)}<p>업데이트 확인: <strong>${esc(d.qa.UPDATE)}</strong></p><p>${esc(d.update)}</p></section><section class="section panel body-copy" id="report-issue"><h2>오류 제보 양식</h2><p>덱과 버전은 자동으로 채웠습니다. 복사한 내용을 이 대화에 붙여 넣고 화면을 첨부해 주세요.</p><form id="issue-form" data-title="${esc(d.title)}" data-version="${esc(d.version)}"><div class="report-grid"><label>NoteID 또는 카드 ID<input name="note" placeholder="모르면 비워 두세요" maxlength="160"></label><label>기기·앱 버전<input name="device" placeholder="예: iPhone · AnkiMobile 버전" maxlength="160"></label><label>문제 종류<select name="kind"><option>화면·버튼</option><option>내용·정답·해설</option><option>가져오기·업데이트</option><option>이미지·소리</option></select></label><label>재현 순서<input name="steps" placeholder="예: 선택지 B를 누르고 답 보기" maxlength="400"></label></div><label>예상 결과와 실제 증상<textarea name="symptom" rows="3" placeholder="어떻게 보여야 하는지, 실제로는 어떻게 나오는지" maxlength="2000"></textarea></label><details><summary>복사할 내용 확인·직접 선택</summary><textarea id="issue-output" rows="10" readonly aria-label="오류 제보 내용"></textarea></details><div class="report-actions"><button class="button primary" type="submit">제보 양식 복사</button><p id="copy-status" role="status">자동 전송되지 않습니다.</p></div></form></section>`;
  }
  function bind() {
    const form=document.querySelector('#issue-form');if(!form)return;
    const output=form.querySelector('#issue-output'),status=form.querySelector('#copy-status');
    const update=()=>{const f=new FormData(form);output.value=`[Anki 오류 제보]\n덱: ${form.dataset.title}\n버전: ${form.dataset.version}\nNoteID / 카드 ID: ${f.get('note')||'미기록'}\n기기·앱 버전: ${f.get('device')||'미기록'}\n문제 종류: ${f.get('kind')}\n재현 순서: ${f.get('steps')||'미기록'}\n예상 결과 / 실제 증상: ${f.get('symptom')||'미기록'}\n스크린샷: 이 대화에 별도 첨부\n페이지: ${location.href}`;};
    form.addEventListener('input',update);form.addEventListener('change',update);update();
    form.addEventListener('submit',async e=>{e.preventDefault();update();try{await navigator.clipboard.writeText(output.value);status.textContent='복사했습니다. 이 대화에 붙여 넣어 주세요.';}catch{output.closest('details').open=true;output.focus();output.select();status.textContent='자동 복사가 허용되지 않았습니다. 선택된 내용을 직접 복사해 주세요.';}});
  }
  window.LibrarySupport={evidence,deck,changes,bind};
})();
