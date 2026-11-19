(() => {
  'use strict';

  const manual = 'https://docs.ankiweb.net/manual/';
  const help = {
    import: manual + 'importing/packaged-decks',
    backup: manual + 'exporting',
    sync: manual + 'syncing',
  };
  const flows = {
    install: {
      title: '새 덱 설치',
      caption: 'Anki 준비, APKG 받기, 첫 카드 확인',
      steps: [
        ['prepare', 'Anki와 덱 준비'],
        ['download', '덱 파일 받기'],
        ['import', 'Anki에서 가져오기'],
        ['verify', '첫 카드 확인'],
      ],
    },
    update: {
      title: '기존 덱 업데이트',
      caption: '백업부터 학습 기록 확인까지',
      steps: [
        ['backup', '동기화하고 백업'],
        ['download', '받을 버전과 파일 선택'],
        ['import', '같은 프로필에 가져오기'],
        ['verify', '카드와 복습 기록 확인'],
        ['sync', '다른 기기에도 반영'],
      ],
    },
    sync: {
      title: 'iPhone·iPad 동기화',
      caption: 'AnkiWeb으로 다른 기기에 덱 받기',
      steps: [
        ['account', '같은 AnkiWeb 계정 사용'],
        ['latest', '최신 기록이 있는 기기부터'],
        ['other', '다른 기기에서 동기화'],
        ['media', '카드와 미디어 확인'],
      ],
    },
  };

  function render(main, decks, esc) {
    const isApkg = asset => asset.name.toLowerCase().endsWith('.apkg');
    const installFiles = deck => {
      const assets = deck.assets.filter(asset => !asset.blocked);
      const preferred = deck.install?.asset;
      const packages = assets.filter(asset => isApkg(asset) && (!preferred || asset.name === preferred));
      return packages.length ? packages : assets.filter(asset => asset.kind === '배포 ZIP');
    };
    const available = decks.filter(deck => deck.current && !['pilot', 'platform'].includes(deck.classification) &&
      !deck.blocked && installFiles(deck).length);
    const params = new URLSearchParams(location.search);
    const requested = decks.find(deck => deck.id === params.get('id'));
    const startingFlow = params.get('flow') || location.hash.slice(1);
    const initialFlow = Object.hasOwn(flows, startingFlow) ? startingFlow : 'install';
    const activeDeck = available.find(d => d.id === requested?.id || d.product_id === requested?.product_id);
    const requestedVersion = requested && requested.id !== activeDeck?.id ? requested.version.match(/^v\d+\.\d+\.\d+/)?.[0] : '';
    const state = {
      flow: initialFlow,
      deck: activeDeck?.id || '',
      step: params.get('step') || flows[initialFlow].steps[0][0],
      from: params.get('from') || requestedVersion || '',
    };
    const outbound = (url, label, cls = 'guide-button') =>
      `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
    const deckUrl = deck => `deck.html?id=${encodeURIComponent(deck.id)}`;
    const bullets = items => `<ul class="guide-checks">${items.map(text => `<li>${esc(text)}</li>`).join('')}</ul>`;

    function receiveFile(deck, edition) {
      if (!deck) return `<p>위에서 덱을 고르면 받을 버전과 다운로드 버튼이 표시됩니다. 사이트에서 덱의 구성과 대표 카드를 미리 확인할 수 있습니다.</p>
        <a class="guide-button" href="index.html">덱 목록 보기</a>`;
      const packages = installFiles(deck);
      const versionHelp = state.flow === 'update' && edition
        ? `<div class="guide-note"><strong>${esc(edition.label)}</strong><p>${esc(edition.copy)}</p>${edition.scope ? `<p>${esc(edition.scope)}</p>` : ''}</div>`
        : '';
      return `<p><strong>${esc(deck.title)} ${esc(deck.version)}</strong>${deck.prerelease ? ' · 배포 후보' : ''}</p>
        ${versionHelp}
        <div class="guide-file-list">${packages.map(asset => `<div class="guide-file"><div><strong>${esc(asset.name)}</strong><p>${(asset.size / 1048576).toLocaleString('ko-KR', {maximumFractionDigits: 1})} MiB</p></div>
          ${outbound(asset.url, isApkg(asset) ? (deck.install?.asset === asset.name ? '통합 APKG 받기' : 'APKG 받기') : '배포 ZIP 받기', 'guide-button guide-button-primary')}</div>`).join('')}</div>
        ${packages.some(asset => !isApkg(asset)) ? '<p>ZIP을 압축 해제한 뒤 내부 안내에서 가져올 APKG를 확인하세요.</p>' : ''}
        <p class="guide-caption">다운로드할 때는 제작 저장소에 접근할 수 있는 GitHub 계정으로 로그인하세요.</p>
        <a class="guide-text-link" href="${deckUrl(deck)}">덱 상세·미리보기 및 전체 배포 파일 보기</a>`;
    }

    function stepContent(deck, edition) {
      const updating = state.flow === 'update';
      switch (state.step) {
        case 'prepare':
          return `<p>PC에서 작업하려면 먼저 Anki를 설치합니다. 설치할 덱은 위에서 선택하거나 덱 목록에서 화면과 구성을 살펴본 뒤 골라 주세요.</p>
            <div class="guide-inline-actions">${outbound('https://apps.ankiweb.net/', 'PC용 Anki 설치')}<a class="guide-button" href="index.html">덱 목록 보기</a></div>`;
        case 'backup':
          return `<p>최근에 공부한 기기부터 동기화하고, PC Anki에서 학습 기록과 미디어가 들어 있는 컬렉션 백업을 저장합니다.</p>
            <ol class="guide-checks">
              <li>PC Anki에서 <strong>파일 → 내보내기</strong>를 누릅니다.</li>
              <li><strong>Anki 컬렉션 패키지(.colpkg)</strong>를 고르고 미디어를 포함합니다.</li>
              <li>백업 파일의 저장 위치를 확인합니다.</li>
            </ol>
            ${outbound(help.backup, 'Anki 백업 방법 보기')}`;
        case 'download':
          return receiveFile(deck, edition);
        case 'import':
          return `<p>PC Anki에서 ${updating ? '사용 중인 프로필을 열어 ' : ''}<strong>파일 → 가져오기</strong>를 누르고 받은 <strong>.apkg</strong> 파일을 선택합니다.</p>
            ${updating
              ? bullets([
                  '기존 덱을 둔 상태에서 새 APKG를 가져옵니다.',
                  '덱별 업데이트 안내의 노트와 노트 유형 가져오기 옵션을 확인하세요.',
                  '패키지에 들어 있는 학습 일정은 가져오지 않도록 설정하고, 직접 수정한 내용이 있다면 시험 프로필에서 먼저 확인하세요.',
                ])
              : bullets([
                  '배포 ZIP을 받았다면 압축을 풀고 내부 안내에서 가져올 APKG를 확인합니다.',
                  '패키지의 학습 이력까지 옮길 필요가 없다면 가져오기 옵션에서 학습 진행 상황을 선택하지 않습니다.',
                ])}
            ${updating && deck ? `<div class="guide-note"><strong>선택한 덱의 업데이트 방법</strong>
              <p>${esc(edition?.copy || deck.update)}</p>${edition?.scope ? `<p>${esc(edition.scope)}</p>` : ''}</div>` : ''}
            ${deck && updating ? `<p><a class="guide-text-link" href="${deckUrl(deck)}#install">선택한 덱의 설치·업데이트 안내</a></p>` : ''}
            ${outbound(help.import, 'APKG 가져오기 도움말')}`;
        case 'verify':
          return `<p>${updating ? '가져오기가 끝나면 기존 카드부터 열어 확인하세요.' : '덱 목록에 새 덱이 생겼는지 보고 대표 카드 몇 장을 열어보세요.'}</p>
            ${bullets(updating
              ? ['가져오기 결과에서 기존 노트의 업데이트 수와 신규 노트 수를 확인합니다.', '대표 카드의 복습 예정일과 카드 구성이 예상대로인지 확인합니다.', '정답 보기와 이미지가 정상적으로 표시되는지 확인합니다.']
              : ['덱 이름과 하위 덱 구성을 확인합니다.', '대표 카드의 문제와 정답이 열리는지 확인합니다.', '이미지와 선택지 등 카드에서 사용하는 기능을 확인합니다.'])}
            ${deck ? `<a class="guide-button" href="${deckUrl(deck)}">덱 구성 확인</a>` : ''}`;
        case 'sync':
          return '<p>PC에서 카드와 복습 기록을 확인했다면 AnkiWeb에 동기화합니다. 그다음 다른 기기에서 동기화해 새 카드와 업데이트 내용을 받으세요.</p>';
        case 'account':
          return `<p>PC Anki와 iPhone·iPad의 AnkiMobile에서 같은 AnkiWeb 계정을 사용합니다.</p>
            ${outbound(help.sync, 'AnkiWeb 동기화 도움말')}`;
        case 'latest':
          return '<p>최근에 공부한 기기에서 먼저 동기화하세요. 처음 동기화할 때 전체 업로드·다운로드 선택이 나오면 최신 기록을 보관한 쪽을 확인하고 그 방향으로 진행합니다.</p><div class="guide-note"><strong>기기마다 다른 변경 사항이 있을 때</strong><p>최신 내용을 덮어쓰지 않도록 먼저 컬렉션을 백업하고 어느 쪽을 기준으로 할지 확인하세요.</p></div>';
        case 'other':
          return '<p>최신 기록이 AnkiWeb에 올라갔는지 확인한 후, iPhone·iPad에서 AnkiMobile을 열고 동기화를 누릅니다. 카드 이미지까지 받는 데 시간이 걸릴 수 있습니다.</p>';
        case 'media':
          return `<p>다른 기기에서 대표 카드의 뒷면과 이미지를 열어 동기화 결과를 확인합니다.</p>
            ${bullets(['이미지가 있는 카드가 정상적으로 표시되는지 확인합니다.', '선택지, 필기, 긴 해설의 스크롤을 확인합니다.', '기존 사용자는 대표 카드의 복습 예정일도 확인합니다.'])}`;
      }
    }

    function show(focusId) {
      const flow = flows[state.flow];
      let index = flow.steps.findIndex(([key]) => key === state.step);
      if (index < 0) index = 0;
      const [key, title] = flow.steps[index];
      state.step = key;
      const deck = available.find(d => d.id === state.deck);
      const editions = (deck?.install?.paths || []).filter(path => path.id !== 'fresh');
      const edition = editions.find(path => path.id === state.from);
      if (!edition) state.from = '';
      const previous = flow.steps[index - 1];
      const next = flow.steps[index + 1];

      main.innerHTML = `
        <header class="guide-intro" id="${state.flow}">
          <h1>설치·업데이트 안내</h1>
          <p>내 상황에 맞는 방법을 고르고, 단계별로 진행하세요.</p>
        </header>
        <nav class="guide-modes" aria-label="내 상황 선택">
          ${Object.entries(flows).map(([id, value]) => `<button class="guide-mode" type="button" id="guide-mode-${id}" data-guide-flow="${id}" aria-pressed="${state.flow === id}">
            <strong>${value.title}</strong><span>${value.caption}</span>
          </button>`).join('')}
        </nav>
        <div class="guide-layout">
          <nav class="guide-rail" aria-label="진행 순서">
            <div class="guide-rail-heading"><h2>진행 순서</h2><span>${index + 1} / ${flow.steps.length}</span></div>
            <progress value="${index + 1}" max="${flow.steps.length}" aria-label="현재 단계"></progress>
            <ol>${flow.steps.map(([id, label], i) => `<li><button type="button" data-guide-step="${id}" ${key === id ? 'aria-current="step"' : ''}><span>${i + 1}</span>${label}</button></li>`).join('')}</ol>
          </nav>
          <div class="guide-main">
            ${state.flow === 'sync' ? '' : `<div class="guide-context">
              <label for="guide-deck">진행할 덱</label>
              <select id="guide-deck"><option value="">덱을 선택하세요</option>${available.map(d => `<option value="${esc(d.id)}" ${deck?.id === d.id ? 'selected' : ''}>${esc(d.title)} · ${esc(d.version)}</option>`).join('')}</select>
              ${state.flow === 'update' && editions.length ? `<label for="guide-from">현재 쓰는 버전</label><select id="guide-from"><option value="">버전을 선택하세요</option>${editions.map(path => `<option value="${esc(path.id)}" ${edition?.id === path.id ? 'selected' : ''}>${esc(path.label)}</option>`).join('')}</select>` : ''}
            </div>`}
            <section class="guide-step" aria-labelledby="guide-step-title">
              <h2 id="guide-step-title" tabindex="-1">${title}</h2>
              <div class="guide-step-content">${stepContent(deck, edition)}</div>
              <div class="guide-step-buttons">
                ${previous ? `<button class="guide-button" data-guide-step="${previous[0]}" type="button">이전 단계</button>` : ''}
                ${next ? `<button class="guide-button guide-button-primary" data-guide-step="${next[0]}" type="button">다음 · ${next[1]}</button>`
                  : state.flow === 'sync' ? '<a class="guide-button guide-button-primary" href="index.html">덱 목록으로</a>'
                  : '<button class="guide-button guide-button-primary" data-guide-flow="sync" type="button">iPhone·iPad 동기화 안내</button>'}
              </div>
            </section>
            <details class="guide-help">
              <summary>Anki 공식 도움말</summary>
              <div>${outbound(help.import, 'APKG 가져오기', 'guide-text-link')}${outbound(help.backup, '컬렉션 내보내기', 'guide-text-link')}${outbound(help.sync, 'AnkiWeb 동기화', 'guide-text-link')}</div>
            </details>
          </div>
        </div>`;

      const rail = main.querySelector('.guide-rail ol');
      if (rail.scrollWidth > rail.clientWidth) {
        const current = rail.querySelector('[aria-current="step"]');
        rail.scrollLeft = current.getBoundingClientRect().left - rail.getBoundingClientRect().left - 5;
      }
      if (focusId) {
        const focus = main.querySelector('#' + focusId);
        focus?.focus({preventScroll: focusId !== 'guide-step-title'});
      }
    }

    function saveLocation() {
      const url = new URL(location.href);
      url.searchParams.set('flow', state.flow);
      url.searchParams.set('step', state.step);
      for (const [key, value] of [['id', state.deck], ['from', state.from]]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      url.hash = state.flow === 'install' ? '' : state.flow;
      history.replaceState(null, '', url);
    }

    main.addEventListener('click', event => {
      const button = event.target.closest('button[data-guide-flow],button[data-guide-step]');
      if (!button) return;
      const mode = button.dataset.guideFlow;
      if (mode && mode !== state.flow) {
        state.flow = mode;
        state.step = flows[mode].steps[0][0];
      } else if (button.dataset.guideStep) {
        state.step = button.dataset.guideStep;
      } else {
        return;
      }
      show(button.classList.contains('guide-mode') ? 'guide-mode-' + state.flow : 'guide-step-title');
      saveLocation();
    });
    main.addEventListener('change', event => {
      const {id, value} = event.target;
      if (id === 'guide-deck') {
        state.deck = value;
        state.from = '';
      } else if (id === 'guide-from') {
        state.from = value;
      } else {
        return;
      }
      show(id);
      saveLocation();
    });

    show();
  }

  window.LibraryGuide = {render};
})();
