(() => {
  'use strict';
  const data = window.ANKI_LIBRARY;
  const main = document.querySelector('#main');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = (url, text, cls = 'text-link') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  const size = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MiB` : `${(n / 1024).toFixed(1)} KiB`;
  const detailUrl = d => `deck.html?id=${encodeURIComponent(d.id)}`;
  const badge = d => `<span class="badge ${d.blocked ? 'badge-fail' : ''}">${d.blocked ? '설치 보류' : d.prerelease ? '배포 후보' : '정식 릴리스'}</span>`;
  const accessNote = `<div class="access-note"><strong>다운로드 안내</strong><p>GitHub 저장소는 비공개입니다. 파일을 받으려면 저장소 접근 권한이 있는 계정으로 로그인해 주세요.</p></div>`;
  const title = (kicker, heading, copy) => `<div class="page-title"><div><p class="kicker">${esc(kicker)}</p><h1>${esc(heading)}</h1>${copy ? `<p class="intro">${esc(copy)}</p>` : ''}</div></div>`;
  function shots(d, large = false) {
    return `<div class="shot-pair ${large ? 'detail-pair' : ''}">${d.shots.map((s, i) => `<figure class="shot"><button class="shot-button" type="button" data-image="${esc(s.path)}" data-caption="${esc(d.title + ' · ' + s.caption)}" aria-label="${esc(d.title + ' · ' + s.caption + ' 크게 보기')}"><img src="${esc(s.path)}" alt="${esc(d.title + ' ' + d.version + ' · ' + s.caption)}" loading="${large || i === 0 ? 'eager' : 'lazy'}" width="750" height="550"></button><figcaption class="shot-caption">${esc(s.caption)}</figcaption></figure>`).join('')}</div>`;
  }
  function catalog() {
    const current = data.decks.filter(d => d.current);
    main.innerHTML = `<div class="page-title"><div><p class="kicker">DECK LIBRARY</p><h1>학습할 덱을 골라보세요</h1><p class="intro">실제 카드 화면을 먼저 확인하고, 나에게 맞는 덱을 선택하세요.</p></div><div class="page-meta"><div><strong>${current.length}</strong><span>현재 덱</span></div><div><strong>${data.decks.length}</strong><span>등록 릴리스</span></div></div></div>${accessNote}<div class="filter-bar"><div class="filters" role="group" aria-label="과목별 덱"><button class="filter" type="button" data-filter="all" aria-pressed="true">전체</button><button class="filter" type="button" data-filter="japanese" aria-pressed="false">일본어</button><button class="filter" type="button" data-filter="english" aria-pressed="false">영어·TOEIC</button><button class="filter" type="button" data-filter="electrical-engineer" aria-pressed="false">전기기사</button><button class="filter" type="button" data-filter="certifications" aria-pressed="false">환경성적표지</button></div><span class="result-count" id="results" aria-live="polite">현재 덱 ${current.length}개</span></div><section class="deck-grid" aria-label="현재 덱">${current.map(d => `<article class="deck-card" data-subject="${esc(d.subject)}"><div class="card-head"><div class="card-top"><span class="subject">${esc(d.subject_label)}</span><span class="version">${esc(d.version)}</span></div><h2 class="card-title"><a href="${detailUrl(d)}">${esc(d.title)}</a></h2><p class="card-description">${esc(d.purpose)}</p></div>${shots(d)}<div class="card-bottom">${badge(d)}<a class="card-action" href="${detailUrl(d)}">상세·미리보기</a></div></article>`).join('')}</section><div class="section panel preview-launch"><div><h2>이전판을 찾고 있나요?</h2><p>등록된 이전 릴리스의 화면과 파일은 릴리스 기록에 보관되어 있습니다.</p></div><a class="button" href="releases.html">릴리스 기록 보기</a></div>`;
    document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      let count = 0;
      document.querySelectorAll('.deck-card').forEach(c => { c.hidden = b.dataset.filter !== 'all' && c.dataset.subject !== b.dataset.filter; if (!c.hidden) count++; });
      document.querySelector('#results').textContent = `현재 덱 ${count}개`;
    }));
  }
  const statusClass = v => v === 'PASS' || v === 'STATIC_PASS' ? 'pass' : v === 'FAIL' ? 'fail' : 'pending';
  const qaLabels = {STATIC:'파일·카드 구성 검사', IMPORT:'새 프로필 가져오기', UPDATE:'기존 덱 업데이트', DEVICE:'기기별 실행·동작'};
  const statusLabels = {PASS:'확인한 범위 통과', PARTIAL:'일부 확인', NOT_TESTED:'아직 검사 안 함', FAIL:'문제 발견'};
  function qaBoxes(d) {
    return `<div class="qa-grid">${Object.entries(qaLabels).map(([key, label]) => `<div class="qa-box"><span class="qa-label">${label} · ${key}</span><strong class="${statusClass(d.qa[key])}">${esc(d.qa[key] || 'NOT_TESTED')}</strong><p>${esc(statusLabels[d.qa[key]] || '아직 검사 안 함')}</p></div>`).join('')}</div>`;
  }
  function runtimeDevices(d) {
    const devices = Object.entries(d.runtime_devices || {});
    if (!devices.length) return '';
    return `<div class="panel body-copy"><h3>기기별 기본 실행 확인</h3><p>${devices.map(([device, status]) => `${esc(device)} <strong class="${statusClass(status)}">${esc(status === 'PASS' ? 'PASS · 사용자 확인' : 'NOT_TESTED · 미확인')}</strong>`).join(' / ')}</p><p class="scope">${esc(d.runtime_scope)}. 기기별 실행 PASS와 전체 DEVICE QA는 확인 범위가 다릅니다.</p></div>`;
  }
  function downloads(d) {
    return `<div class="table-wrap"><table><thead><tr><th>배포 파일</th><th>용량</th><th>다운로드</th></tr></thead><tbody>${d.assets.map(a => `<tr><td><span class="file-name">${esc(a.name)}</span><span class="hash">SHA-256: ${esc(a.sha256 || '등록된 해시 없음')}</span></td><td>${size(a.size)}</td><td>${a.blocked ? '<span class="download-unavailable">손상 기록 · 보류</span>' : external(a.url, a.kind, 'download-link')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function countLine(d) {
    const parts = [['notes','노트'],['cards','카드'],['media','미디어']].filter(([k]) => Number.isInteger(d.counts?.[k])).map(([k,label]) => `${label} ${d.counts[k].toLocaleString('ko-KR')}${k==='notes'?'개':k==='media'?'개':'장'}`);
    return parts.length ? `<p class="scope">등록 수량 · ${parts.join(' · ')}</p>` : '';
  }
  function detail(d) {
    document.title = `${d.title} ${d.version} · Anki 덱 라이브러리`;
    main.innerHTML = `<a class="back" href="${d.current ? 'index.html' : 'releases.html'}">${d.current ? '덱 라이브러리' : '릴리스 기록'}로 돌아가기</a><div class="detail-header"><div class="detail-title"><p class="kicker">${esc(d.subject_label)}</p><h1>${esc(d.title)}</h1><div class="detail-badges"><span class="version">${esc(d.version)}</span>${badge(d)}${!d.current ? '<span class="badge badge-muted">이전판</span>' : ''}</div><p class="detail-description">${esc(d.purpose)}</p>${countLine(d)}</div></div><div class="detail-actions">${d.preview ? `<a class="button primary" href="preview.html?id=${encodeURIComponent(d.id)}">카드 직접 보기</a>` : ''}${external(d.release_url, 'GitHub 릴리스', 'button')}${external(d.release_url + '#release-assets', '배포 파일 확인', 'button')}</div><section class="section"><div class="section-heading"><h2>실제 카드 화면 2컷</h2><span class="section-note">눌러서 크게 보기</span></div>${shots(d, true)}<p class="scope">${esc(d.shot_scope)}</p></section>${d.blocked ? '<div class="section access-note"><strong>설치 보류</strong><p>기존 배포 ZIP에 손상 기록이 있습니다. 복구한 내부 카드의 미리보기는 확인할 수 있지만, 정상 배포 패키지가 확인되기 전에는 새 설치에 사용하지 마세요.</p></div>' : ''}<section class="section"><div class="section-heading"><h2>다운로드</h2><span class="section-note">등록된 릴리스 자산</span></div>${accessNote}${d.download_note ? `<p class="device-note">${esc(d.download_note)}</p>` : ''}${downloads(d)}</section><section class="section"><div class="section-heading"><h2>기록된 검증 상태</h2></div>${qaBoxes(d)}${runtimeDevices(d)}<p class="device-note">${esc(d.qa_note)}</p>${d.device_note ? `<p class="device-note">${esc(d.device_note)}</p>` : ''}<p class="scope">이 표는 GitHub에 기록된 Anki 검증 상태입니다. 사이트의 화면 확인으로 상태를 올리지 않습니다.</p></section><section class="section guide-grid"><article class="panel body-copy"><h2>학습 방법</h2><p>${esc(d.study)}</p>${d.structure.length ? `<ul>${d.structure.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}</article><article class="panel body-copy"><h2>업데이트</h2><p>${esc(d.update)}</p><p><a href="guide.html#update">공통 설치·업데이트 안내</a></p></article></section>`;
  }
  function releases() {
    main.innerHTML = `${title('RELEASES', '릴리스 기록', '현재판과 이전판의 화면·배포 파일을 확인할 수 있습니다.')}${accessNote}<div class="section-heading"><h2>현재판</h2><span class="section-note">${data.decks.filter(d=>d.current).length}개</span></div><section class="release-list">${data.decks.filter(d=>d.current).map(releaseRow).join('')}</section><h2 class="previous-heading">이전판</h2><section class="release-list">${data.decks.filter(d=>!d.current).map(releaseRow).join('')}</section>`;
  }
  function releaseRow(d) { return `<article class="release-row"><div><h2><a href="${detailUrl(d)}">${esc(d.title)}</a> <span class="version">${esc(d.version)}</span></h2><p>${esc(d.subject_label)} · 게시 ${esc(d.published_at.slice(0,10))} · ${d.blocked ? '설치 보류' : d.prerelease ? '배포 후보' : '정식 릴리스'}</p></div><a class="text-link" href="${detailUrl(d)}">화면·파일 보기</a></article>`; }
  function guide() {
    main.innerHTML = `${title('START HERE', '설치·업데이트 안내', '기존 학습 기록이 있다면 백업부터 진행하세요.')}<div class="guide-grid"><article class="panel body-copy"><span class="guide-number">01 · 덱 선택</span><h2>화면과 버전 확인</h2><p>덱 상세에서 실제 화면 2컷과 카드 동작을 확인합니다. 배포 후보의 미검증 항목과 설치 보류 여부도 확인해 주세요.</p><p>GitHub 릴리스에서 APKG 또는 배포 ZIP을 받습니다. ZIP은 압축을 푼 뒤 내부 설치 안내를 확인합니다.</p></article><article class="panel body-copy"><span class="guide-number">02 · 새 설치</span><h2>Anki에 가져오기</h2><p>PC Anki의 <strong>파일 → 가져오기</strong>에서 APKG를 선택합니다. 새 노트 수와 덱 구성을 확인하고 대표 카드 몇 장을 열어보세요.</p><p>다른 사람의 학습 이력을 가져올 목적이 아니라면 가져오기 창에서 학습 진행 상황 가져오기를 선택하지 않습니다.</p></article><article class="panel body-copy" id="update"><span class="guide-number">03 · 기존 덱 업데이트</span><h2>백업 후 기존 덱 위에 적용</h2><ol><li>먼저 모든 기기의 학습 내용을 동기화하고, 학습 일정·미디어가 포함된 컬렉션 백업을 저장합니다.</li><li>제품별 업데이트 안내를 확인한 뒤 같은 제품의 새 APKG를 가져옵니다. 사용 중인 덱을 먼저 삭제하지 마세요.</li><li>기존 노트의 업데이트 수와 새 노트 수, 대표 카드의 복습 예정일을 확인합니다.</li><li>정상 적용을 확인한 뒤 다른 기기로 동기화합니다.</li></ol><p>노트 유형이나 직접 수정한 내용이 있다면 가져오기 설정에 따라 덮어쓰기·병합 결과가 달라집니다. 검증 상태가 NOT_TESTED 또는 PARTIAL인 업데이트는 별도 테스트 프로필에서 먼저 확인하세요.</p></article><article class="panel body-copy"><span class="guide-number">04 · iPhone·iPad</span><h2>AnkiWeb으로 연결</h2><p>PC와 AnkiMobile에서 같은 AnkiWeb 계정으로 동기화합니다. 카드와 이미지의 동기화가 모두 끝난 뒤 학습을 시작하세요.</p><p>전체 업로드·다운로드를 선택하는 창이 나오면 어느 기기에 보존할 최신 기록이 있는지 먼저 확인합니다. 서로 다른 변경이 있다면 백업 후 정리하세요.</p><p>대표 카드의 정답 보기·선택지·필기·긴 설명의 스크롤을 기기별로 확인합니다.</p></article></div><section class="section panel body-copy"><h2>공식 안내</h2><p><a href="https://docs.ankiweb.net/importing/packaged-decks.html" target="_blank" rel="noopener noreferrer">Anki 패키지 가져오기·업데이트</a> · <a href="https://docs.ankiweb.net/syncing.html" target="_blank" rel="noopener noreferrer">AnkiWeb 동기화</a></p><p class="scope">공식 문서 확인일: 2026.10.02. 제품별 안내와 검증 범위는 각 덱 상세에서 확인할 수 있습니다.</p></section>`;
  }
  function qa() {
    const current = data.decks.filter(d=>d.current);
    main.innerHTML = `${title('QUALITY & COMPATIBILITY', '검증·호환성', '파일 검사·가져오기·업데이트·기기 실행을 나누어 확인 범위를 표시합니다.')}<div class="panel body-copy"><p><strong>PASS</strong>는 해당 범위의 통과, <strong>PARTIAL</strong>은 일부 범위 확인, <strong>NOT_TESTED</strong>는 미실행, <strong>FAIL</strong>은 실패 기록을 뜻합니다. 배포 후보는 사용자 승인과 필요한 검증을 마친 최종 기준본(GM)과 구분됩니다.</p></div><section class="section"><div class="table-wrap"><table><thead><tr><th>현재 덱</th>${Object.entries(qaLabels).map(([key,label])=>`<th>${esc(label)}<div class="file-name">${key}</div></th>`).join('')}</tr></thead><tbody>${current.map(d=>`<tr><td><a class="text-link" href="${detailUrl(d)}">${esc(d.title)}</a><div class="file-name">${esc(d.version)}</div></td>${['STATIC','IMPORT','UPDATE','DEVICE'].map(k=>`<td class="${statusClass(d.qa[k])}">${esc(d.qa[k] || 'NOT_TESTED')}<div class="file-name">${esc(statusLabels[d.qa[k]] || '아직 검사 안 함')}</div>${k==='DEVICE' ? `<div class="scope">${Object.entries(d.runtime_devices || {}).filter(([,v])=>v==='PASS').map(([device])=>esc(device)).join(' · ')} 기본 실행 확인</div>` : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><section class="section guide-grid"><article class="panel body-copy"><h2>검사 범위</h2><p><strong>파일·카드 구성 검사 (STATIC)</strong>: 파일이 정상적으로 열리는지, 카드 틀이 사용하는 필드·이미지가 제대로 연결되어 있는지 확인합니다.<br><strong>새 프로필 가져오기 (IMPORT)</strong>: 덱이 없는 새 Anki 프로필에 처음 넣는 검사입니다.<br><strong>기존 덱 업데이트 (UPDATE)</strong>: 이전판에 새 버전을 적용했을 때 학습 기록이 유지되는지 확인합니다.<br><strong>기기별 실행·동작 (DEVICE)</strong>: 실제 앱의 표시·버튼·터치·미디어와 필요한 동기화를 확인합니다.</p></article><article class="panel body-copy"><h2>확인 범위와 미리보기</h2><p>미리보기는 카드의 모양과 사용 흐름을 확인하는 표본입니다. 전체 콘텐츠 감수나 Anki에서의 학습·동기화 검증을 대신하지 않습니다.</p><p>기기별 기본 실행 PASS는 사용자가 실행을 확인한 범위입니다. 세부 기능·미디어·왕복 동기화가 남으면 전체 DEVICE는 PARTIAL로 표시합니다. 확인 기기는 상세 페이지에 표시합니다.</p></article></section><section class="section panel body-copy"><h2>정보 기준</h2><p>GitHub 등록 릴리스 ${data.decks.length}건, 현재 덱 정보와 버전별 실제 캡처 기록을 기준으로 구성했습니다. 이 사이트는 <strong>${esc(data.updated_at)}</strong> 시점의 자료입니다.</p><p class="scope">기준 커밋: ${esc(data.source_commit)}. 새 릴리스는 자료를 갱신한 뒤 반영됩니다.</p></section>`;
  }
  function preview(d) {
    if (!d.preview) { detail(d); return; }
    document.title = `${d.title} 카드 미리보기 · Anki 덱 라이브러리`;
    main.innerHTML = `<a class="back" href="${detailUrl(d)}">덱 상세로 돌아가기</a>${title('CARD PREVIEW', d.title, d.version + ' · 실제 대표 카드의 버튼과 정답 보기를 확인해 보세요.')}<div class="section-heading"><p class="section-note">대표 표본 · 학습 기록은 Anki에 저장되지 않습니다.</p><a class="button" href="${esc(d.preview)}" target="_blank" rel="noopener noreferrer">전체 화면</a></div><iframe class="preview-frame" src="${esc(d.preview)}" title="${esc(d.title + ' 실제 카드 미리보기')}" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe><p class="scope">${esc(d.shot_scope)}</p>`;
  }
  function images() {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<div class="dialog-top"><p id="image-caption"></p><button type="button" class="dialog-close">닫기</button></div><img class="dialog-image" alt="">';
    dialog.setAttribute('aria-labelledby', 'image-caption'); document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    document.querySelectorAll('[data-image]').forEach(b=>b.addEventListener('click',()=>{
      dialog.querySelector('img').src=b.dataset.image; dialog.querySelector('img').alt=b.dataset.caption; dialog.querySelector('p').textContent=b.dataset.caption; dialog.showModal();
    }));
  }
  try {
    if (!data?.decks?.length) throw new Error('덱 정보가 없습니다.');
    const filename = location.pathname.split('/').pop() || 'index.html';
    const route = {'releases.html':'releases','guide.html':'guide','qa.html':'qa','deck.html':'deck','preview.html':'preview'}[filename] || 'catalog';
    const id = new URLSearchParams(location.search).get('id');
    const d = data.decks.find(d=>d.id===id);
    if (route === 'catalog') catalog(); else if (route === 'releases') releases(); else if (route === 'guide') guide(); else if (route === 'qa') qa();
    else if (d) route === 'preview' ? preview(d) : detail(d);
    else main.innerHTML = '<div class="missing"><h1>덱을 찾을 수 없습니다</h1><p>덱 라이브러리에서 다시 선택해 주세요.</p><a class="button primary" href="index.html">덱 라이브러리</a></div>';
    const navRoute = ['deck','preview'].includes(route) ? 'catalog' : route;
    document.querySelector(`[data-nav="${navRoute}"]`)?.classList.add('active');
    document.querySelector(`[data-nav="${navRoute}"]`)?.setAttribute('aria-current','page');
    document.querySelector('#breadcrumb').textContent = ({catalog:'덱 라이브러리',releases:'릴리스 기록',guide:'설치·업데이트',qa:'검증·호환성',deck:'덱 상세',preview:'카드 미리보기'})[route];
    document.querySelector('#snapshot-date').textContent = data.updated_at.replaceAll('-','.');
    images();
  } catch(e) {
    console.error(e); main.innerHTML = '<section class="missing"><h1>덱 정보를 불러오지 못했습니다</h1><p>잠시 후 다시 열어주세요. 배포 파일은 GitHub 릴리스에서 확인할 수 있습니다.</p><a class="button" href="https://github.com/dlquffhqnxj/anki-deck-project/releases">GitHub 릴리스</a></section>';
  }
})();
