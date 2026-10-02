window.ANKI_LIBRARY = {
  "schema_version": 1,
  "site_version": "1.0.0",
  "updated_at": "2026-10-02",
  "source_repository": "dlquffhqnxj/anki-deck-project",
  "source_commit": "98645cf64f5f526214f6f0278fb356976d03deac",
  "decks": [
    {
      "id": "jlpt-kanji-lab-v1.2.0",
      "product_id": "jlpt-kanji-lab",
      "title": "JLPT Kanji LAB 2136",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.2.0-RC1",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Kanji_2136",
      "published_at": "2026-09-12T04:47:40Z",
      "purpose": "한자의 의미·읽기·쓰기와 대표어를 서로 다른 회상 행동으로 익히고, N4·N3 형식의 실전문제로 적용합니다.",
      "study": "급수 하나에서 한자 인식 카드를 먼저 익힌 뒤 쓰기와 대표어 읽기를 단계적으로 추가합니다. 실전문제는 해당 급수 복습 뒤 풉니다.",
      "update": "v1.1.2 실제 APKG가 없어 업데이트 검증은 아직 미수행입니다. 기존 프로필을 백업하고 테스트 프로필에서 중복과 학습 이력 보존을 먼저 확인합니다.",
      "structure": [
        "한자 읽기 N5~N1",
        "한자 쓰기 N5~N1",
        "단어 읽기 N5~N1",
        "실전문제 N4·N3"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/jlpt-kanji-lab/v1.2.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/jlpt-kanji-lab-v1.2.0-writing.jpg",
          "caption": "한자 필기",
          "sha256": "c270ecf53a82cec8d741a1ffba3c5ff59d046d3a24dd298ae3005eaf91e2adfe"
        },
        {
          "path": "assets/release-screenshots/jlpt-kanji-lab-v1.2.0-writing-back.jpg",
          "caption": "필기·정답 비교",
          "sha256": "9cfd51e916a893444cccc8b7cf19d303e8a0eb55dc1173b747889713e815f47a"
        }
      ],
      "shot_scope": "v1.2.0 실제 템플릿의 필기 화면과 정답 비교 화면입니다.",
      "assets": [
        {
          "name": "JLPT_Kanji_LAB_2136_v1.2.0.apkg",
          "size": 2868487,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_2136/JLPT_Kanji_LAB_2136_v1.2.0.apkg",
          "sha256": "b166ad378ccb79aa33cf7aeb84f499eae9a4539d0dffc7f9b3d6fd87d1a7e936",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "JLPT_Kanji_LAB_2136_v1.2.0_PREVIEW.zip",
          "size": 50379,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_2136/JLPT_Kanji_LAB_2136_v1.2.0_PREVIEW.zip",
          "sha256": "818d5677830922f4e82f263859d55b32e463a8170bbbff4e8ce4483c45212eb3",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 2376,
        "cards": 6648,
        "media": 0,
        "needs_review": 0,
        "excluded": 0
      }
    },
    {
      "id": "jlpt-vocabulary-grammar-v2.0.0-rc2",
      "product_id": "jlpt-vocabulary-grammar-lab",
      "title": "JLPT Vocabulary & Grammar LAB",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v2.0.0-RC2",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Vocabulary_Grammar_V2.0.0_RC2",
      "published_at": "2026-09-21T13:37:36Z",
      "purpose": "어휘와 문법을 읽기·문맥·구별·실전·산출의 서로 다른 회상 행동으로 학습합니다.",
      "study": "처음에는 01과 02를 중심으로 익히고, 03·04는 실제 혼동·검증 항목만 복습합니다. 05 타이핑은 입력 없이도 Anki의 답 보기와 평가 흐름을 계속 사용할 수 있습니다.",
      "update": "RC1 위에 RC2를 가져오기 전 백업합니다. 공식 재가져오기 Gate가 끝날 때까지 운영 프로필과 별도 테스트 프로필을 구분합니다.",
      "structure": [
        "어휘 01 단어→읽기·뜻 / 02 문맥·회상 / 03 혼동어 비교",
        "어휘 04 객관식 실전 / 05 타이핑 / 90 확장 참고",
        "문법 01 표현→이해 / 02 문맥·회상 / 03 유사문법 비교",
        "문법 04 객관식 실전 / 05 타이핑"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "PARTIAL",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/jlpt-vocabulary-grammar-lab/v2.0.0-rc2/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/jlpt-vocabulary-grammar-v2.0.0-rc2-01.png",
          "caption": "단어→읽기·뜻",
          "sha256": "8f7ae29b46fbb2c89825dfec1e9fc88441ccfdd52d3166bce5f1d45700014daa"
        },
        {
          "path": "assets/release-screenshots/jlpt-vocabulary-grammar-v2.0.0-rc2-02.png",
          "caption": "정답 펼침",
          "sha256": "1a618c054d1258be8ebdc1346e829d32038e0e4e5e5d83b3b4604e711c28f708"
        }
      ],
      "shot_scope": "RC2의 `会う` 대표 카드에서 정답을 열기 전·후의 실제 화면입니다.",
      "assets": [
        {
          "name": "JLPT_Vocabulary_Grammar_LAB_v2.0.0-RC2_DELIVERY.zip",
          "size": 5237886,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Vocabulary_Grammar_V2.0.0_RC2/JLPT_Vocabulary_Grammar_LAB_v2.0.0-RC2_DELIVERY.zip",
          "sha256": "25035158feae84bc61b7c9949dc0bb89be17e19a9242bded6d91f92db6664a46",
          "kind": "배포 ZIP",
          "blocked": false
        },
        {
          "name": "JLPT_Vocabulary_Grammar_LAB_v2.0.0_RC2_PREVIEW.zip",
          "size": 9315,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Vocabulary_Grammar_V2.0.0_RC2/JLPT_Vocabulary_Grammar_LAB_v2.0.0_RC2_PREVIEW.zip",
          "sha256": "5abb88c49c8071a14e9b8b8fcb2e949c57e496416119b54d208afb78cb816fbe",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 13138,
        "cards": 16049,
        "media": 0,
        "needs_review": null,
        "excluded": null
      }
    },
    {
      "id": "business-japanese-v1.1.0-rc2",
      "product_id": "business-japanese",
      "title": "Business Japanese LAB",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.1.0-RC2",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/Business_Japanese_LAB_BUNDLE",
      "published_at": "2026-09-21T13:39:21Z",
      "purpose": "업무 표현을 뜻만 외우지 않고 상황별 산출과 비슷한 표현 구별까지 연결합니다.",
      "study": "같은 목표의 CORE를 먼저 익힌 뒤 APPLICATION과 DISCRIMINATION을 순서대로 추가합니다.",
      "update": "RC1 사용자라면 테스트 프로필에서 RC2 재가져오기 후 1,200개 노트의 중복과 일정 보존을 확인합니다.",
      "structure": [
        "01 학습: 문법·표현 / 핵심어휘",
        "02 적용: 교정훈련 / 문맥생성 / 표현구별",
        "03 실무: 메일·회의 / 보고·기술"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/business-japanese/v1.1.0-rc2/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/business-japanese-v1.1.0-rc2-01.png",
          "caption": "업무 표현 회상",
          "sha256": "a2d7074b7e84798c9d09c2bcfd99798aa35ccc38fdb782ee9a580219409ab418"
        },
        {
          "path": "assets/release-screenshots/business-japanese-v1.1.0-rc2-02.png",
          "caption": "핵심 답·업무 예문",
          "sha256": "f709f77906e9653c597e22a371c2054f21fbb8c9aeb26b30af526eba11f61029"
        }
      ],
      "shot_scope": "RC2의 `～向け` 대표 카드 앞면·뒷면입니다.",
      "assets": [
        {
          "name": "Business_Japanese_LAB_BUNDLE_v1.1.0_RC2.zip",
          "size": 1650191,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Business_Japanese_LAB_BUNDLE/Business_Japanese_LAB_BUNDLE_v1.1.0_RC2.zip",
          "sha256": "6fb93b20d81fffc0b21bcd8913a8ed47466c55536a9866565d7ca55826a50431",
          "kind": "배포 ZIP",
          "blocked": false
        },
        {
          "name": "Business_Japanese_LAB_BUNDLE_v1.1.0_RC2_PREVIEW.zip",
          "size": 13421,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Business_Japanese_LAB_BUNDLE/Business_Japanese_LAB_BUNDLE_v1.1.0_RC2_PREVIEW.zip",
          "sha256": "64830f991ccb30e64cc247041cf9a7cd895f638e9ca7d0b11d58138c1042f0e2",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 1200,
        "cards": 1200,
        "media": 0,
        "needs_review": 207,
        "excluded": null
      }
    },
    {
      "id": "jlpt-confusion-context-v1.1.0-rc3",
      "product_id": "jlpt-confusion-context-lab",
      "title": "JLPT Confusion & Context LAB",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.1.0-RC3",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Confusion_Context_LAB",
      "published_at": "2026-09-21T13:38:41Z",
      "purpose": "뜻이 비슷하거나 접속이 혼동되는 표현을 비교 기준과 실제 문맥 선택으로 구별합니다.",
      "study": "비교 카드에서 의미·접속·문맥 기준을 먼저 설명한 뒤 문맥 카드에서 네 선택지를 고릅니다.",
      "update": "RC2 사용자라면 테스트 프로필에서 RC3 재가져오기 후 750개 노트의 중복과 일정 보존을 확인합니다.",
      "structure": [
        "N5~N1 각 01 혼동비교",
        "N5~N1 각 02 문맥적용"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/jlpt-confusion-context-lab/v1.1.0-rc3/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/jlpt-confusion-context-v1.1.0-rc3-01.png",
          "caption": "혼동 표현 회상",
          "sha256": "35e69d0b8b481fce1da4d8b4d2510aaead566eb5f0b05aba4bf8ba3e5bdf3313"
        },
        {
          "path": "assets/release-screenshots/jlpt-confusion-context-v1.1.0-rc3-02.png",
          "caption": "선택 기준·대조 예문",
          "sha256": "47016d635fdeac6ed0f5a24df91e74cf5568fc56e76b07e013ff6a613b14f280"
        }
      ],
      "shot_scope": "RC3의 `～が早いか / ～や否や` 대표 카드 앞면·뒷면입니다.",
      "assets": [
        {
          "name": "JLPT_Confusion_Context_LAB_N1-N5_BUNDLE_v1.1.0_RC3.zip",
          "size": 1276439,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Confusion_Context_LAB/JLPT_Confusion_Context_LAB_N1-N5_BUNDLE_v1.1.0_RC3.zip",
          "sha256": "cdafc74cdc44726d66230ac905b7ba235f8965c7a03b7cde4172813f7ea04d7b",
          "kind": "배포 ZIP",
          "blocked": false
        },
        {
          "name": "JLPT_Confusion_Context_LAB_v1.1.0_RC3_PREVIEW.zip",
          "size": 22298,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Confusion_Context_LAB/JLPT_Confusion_Context_LAB_v1.1.0_RC3_PREVIEW.zip",
          "sha256": "0c43352ea423352516f97f8f4602725ce3e7143213eacf4502c1a793a2ea6213",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 750,
        "cards": 750,
        "media": 0,
        "needs_review": 750,
        "excluded": null
      }
    },
    {
      "id": "kanji-revolution-v1.2.0-rc1",
      "product_id": "kanji-revolution",
      "title": "Kanji Revolution",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.2.0-RC1",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Kanji_Revolution_V1.2.0",
      "published_at": "2026-09-30T10:56:38Z",
      "purpose": "한자 형태를 구성 요소와 이미지에 연결해 장기 기억 단서를 강화합니다.",
      "study": "답을 보기 전에 형태를 말로 분해하고 본인만의 연상을 한 번 만들어 봅니다.",
      "update": "기존 버전 사용자는 백업 후 별도 테스트 프로필에서 v1.2.0-RC1 업데이트를 검증해야 합니다. 이번 사용자 보고에는 Update 결과가 없어 NOT_TESTED입니다.",
      "structure": [
        "한자",
        "생성원리",
        "연상법",
        "원본 확인"
      ],
      "qa": {
        "STATIC": "NOT_TESTED",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "사용자 요청에 따라 STATIC은 NOT_TESTED로 유지합니다. 수정 예정 내용이 있으며 현행 버전으로 학습 중입니다. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/kanji-revolution/v1.2.0-rc1/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.2.0-rc1-01.png",
          "caption": "정답·기억 카드",
          "sha256": "9c21ff1ffb30135fb26c94a1ee6cc3420debddb46e3728ba9d6dcf59e92196d6"
        },
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.2.0-rc1-02.png",
          "caption": "학습 설정",
          "sha256": "27a7831481f0c455d09c61a71a9975e722faa2f8e915c2179c023748f81504c2"
        }
      ],
      "shot_scope": "RC1 첨부 원본이 제공하는 정답 카드와 설정 패널입니다. 앞면·뒷면 한 쌍으로 표기하지 않습니다.",
      "assets": [
        {
          "name": "CONTENT_AUDIT.md",
          "size": 925,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/CONTENT_AUDIT.md",
          "sha256": "4374252d6170463f5ae5c061b36d6d5324891df33708a12a6446fe15f82619bf",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_QUIZ_v1.2.0-RC1.apkg",
          "size": 38681225,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/Kanji_Revolution_QUIZ_v1.2.0-RC1.apkg",
          "sha256": "3bd055ca90b5a9f21d6ab9664a6232b190d5aff72668a5abdbb17418997de068",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_TEXT_COMPLETE_v1.2.0-RC1.apkg",
          "size": 421982606,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/Kanji_Revolution_TEXT_COMPLETE_v1.2.0-RC1.apkg",
          "sha256": "56bb6c67a32d6887aa49e185160e3d6f2b1beebe09fe1321665ce1413a7baf44",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.2.0-RC1_PREVIEW.html",
          "size": 96944,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/Kanji_Revolution_v1.2.0-RC1_PREVIEW.html",
          "sha256": "98a805948b6814c652f41d3cfb058025767ebf79a8c81ad73654487aae7153d7",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.2.0-RC1_PREVIEW.zip",
          "size": 54522,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/Kanji_Revolution_v1.2.0-RC1_PREVIEW.zip",
          "sha256": "e9e14c6f9f36385ca3f790661025c980c6082b4f7a03796e76a591d54c79c493",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "README_IMPORT_TEST.md",
          "size": 1604,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Kanji_Revolution_V1.2.0/README_IMPORT_TEST.md",
          "sha256": "7ff21509c5c607aad082c48a535e38ea9b2c21c4e76588e27d84dc90fc07b1fb",
          "kind": "문서·자료",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "toeic-vocabulary-v1.2.0-rc5",
      "product_id": "toeic-lab",
      "title": "TOEIC LAB",
      "subject": "english",
      "subject_label": "영어·TOEIC",
      "version": "v1.2.0-RC5",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/TOEIC_LAB_v1.2.0-RC5_Vocabulary",
      "published_at": "2026-09-30T09:57:28Z",
      "purpose": "정답뿐 아니라 예문·해석·출제 표현·연상 단서를 함께 회상합니다.",
      "study": "단어 뜻을 맞힌 뒤 예문 속 결합 표현까지 말할 수 있는지 확인합니다.",
      "update": "기존 버전 위 업데이트 PASS 기록을 유지합니다. 사용자도 업데이트한 덱의 학습 기록 보존을 확인했습니다. 새 프로필 가져오기는 사용자 확인 PASS입니다.",
      "structure": [
        "단어",
        "숙어",
        "부사",
        "실전 문제"
      ],
      "qa": {
        "STATIC": "NOT_TESTED",
        "IMPORT": "PASS",
        "UPDATE": "PASS",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "사용자 요청에 따라 STATIC은 NOT_TESTED로 유지합니다. 수정 예정 내용이 있으며 현행 버전으로 학습 중입니다. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 기존에 확인된 업데이트 PASS를 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/toeic-vocabulary/v1.2.0-rc5/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/toeic-vocabulary-v1.2.0-rc5-01.png",
          "caption": "단어 앞면 · 상단",
          "sha256": "3878d6ab1aca2d7d000cb6dfa8bb39cf00dcc2aa993629ee050dfb79affe7451"
        },
        {
          "path": "assets/release-screenshots/toeic-vocabulary-v1.2.0-rc5-02.png",
          "caption": "정답·연상 이미지 · 상단",
          "sha256": "0a287132333a034ec24f9879fa4b2d0eb58cb004526bfe35f020b0f489c7409d"
        }
      ],
      "shot_scope": "RC5 실제 템플릿의 `chill` 카드입니다. 아래로 이어지는 내용은 기존 상세 미리보기에서 확인할 수 있습니다.",
      "assets": [
        {
          "name": "TOEIC_LAB_v1.2.0-RC5_DELIVERY.zip",
          "size": 17176515,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_LAB_v1.2.0-RC5_Vocabulary/TOEIC_LAB_v1.2.0-RC5_DELIVERY.zip",
          "sha256": "c005f87c89cd6c99bfb108ef7f8bdd6480c70a1780dd0d6d3e9e443c03a81508",
          "kind": "배포 ZIP",
          "blocked": false
        },
        {
          "name": "TOEIC_LAB_v1.2.0-RC5_PREVIEW.zip",
          "size": 363455,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_LAB_v1.2.0-RC5_Vocabulary/TOEIC_LAB_v1.2.0-RC5_PREVIEW.zip",
          "sha256": "88bb8bd13c436381d18eff0f700e93ca90d80c2ac816de13e0d06448c8946ea9",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.2.0-RC5.apkg",
          "size": 15475203,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_LAB_v1.2.0-RC5_Vocabulary/TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.2.0-RC5.apkg",
          "sha256": "8f4997df92fb995761cc61b029e1caf061c1178a20d103b68b5eb2551dab9911",
          "kind": "APKG",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "toeic-rc-vol3-ai-interactive-v2.0.0",
      "product_id": "toeic-rc",
      "title": "TOEIC RC Vol.3",
      "subject": "english",
      "subject_label": "영어·TOEIC",
      "version": "v2.0.0",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/TOEIC_RC_Vol3_AI_Interactive",
      "published_at": "2026-09-22T00:41:22Z",
      "purpose": "문제를 풀고 정답·번역·해설을 확인하는 TOEIC 독해 연습입니다.",
      "study": "선택지를 고른 뒤 정답 근거와 오답 해설을 확인합니다.",
      "update": "컬렉션을 백업하고 같은 제품의 업데이트 안내에 따라 적용합니다.",
      "structure": [
        "PART 5 · PART 6 · PART 7"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. 세부 기능·동기화 QA는 별도입니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/toeic-rc/vol3-ai-interactive/v2.0.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/toeic-rc-v2.0.0-selected.jpg",
          "caption": "문제·선택 상태",
          "sha256": "5a661d5f90badac52b01b6273a3e893c1272dcc629962875ce2aff2e6fd186ff"
        },
        {
          "path": "assets/release-screenshots/toeic-rc-v2.0.0-answer.jpg",
          "caption": "정답·해설",
          "sha256": "5c4abfee8cca061b40a5167dedb8c1ad60d7fbef86faff917d589af48d86e8a5"
        }
      ],
      "shot_scope": "v2.0.0 PART 5의 실제 선택·정답 화면입니다.",
      "assets": [
        {
          "name": "TOEIC_RC_Vol3_AI_Interactive_v2.0.0.apkg",
          "size": 1147860,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_RC_Vol3_AI_Interactive/TOEIC_RC_Vol3_AI_Interactive_v2.0.0.apkg",
          "sha256": "b7ca83b51bb077c9e34ddc81d9d044208c96ec993f6ee9cd7e5485b439d61cef",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "TOEIC_RC_Vol3_AI_Interactive_v2.0.0_PREVIEW.zip",
          "size": 11454,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_RC_Vol3_AI_Interactive/TOEIC_RC_Vol3_AI_Interactive_v2.0.0_PREVIEW.zip",
          "sha256": "34f8f7c5ef1ac4bb39f415b4b2cd9cf762a770c202368db725f62a795e9185fe",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "TOEIC_RC_Vol3_AI_Translation_Explanation_Master_v2.0.0.xlsx",
          "size": 1278834,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_RC_Vol3_AI_Interactive/TOEIC_RC_Vol3_AI_Translation_Explanation_Master_v2.0.0.xlsx",
          "sha256": "9b43f1ccc88fdbf4369ac7accedf54a442741ba4a318626ce0af60755f12aad6",
          "kind": "MASTER",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "electrical-engineer-summary-v1.0.0",
      "product_id": "electrical-engineer-summary",
      "title": "전기기사 요점정리 LAB",
      "subject": "electrical-engineer",
      "subject_label": "전기기사",
      "version": "v1.0.0",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/Electrical_Engineer",
      "published_at": "2026-09-12T04:44:24Z",
      "purpose": "공식 암기와 개념 이해를 연결하고 필요할 때 원본 근거를 확인합니다.",
      "study": "공식 카드는 답·단위·성립 조건까지 함께 말하고, 틀리면 핵심 설명과 원본 확인 영역을 봅니다.",
      "update": "현재 배포 가능한 기준은 v1.0.0입니다. 실제 v1.1.0 RC 산출물을 확보하기 전에는 이름만으로 덮어쓰지 않습니다.",
      "structure": [
        "전기자기학",
        "전력공학",
        "전기기기",
        "회로이론",
        "제어공학",
        "전기응용 및 공사재료"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/electrical-engineer-summary/v1.0.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/electrical-summary-v1.0.0-front-pc.jpg",
          "caption": "공식 회상·필기",
          "sha256": "7aa2534dbaef597b7a879ec13c0efa6604795a58773e929490441a328b7fcf97"
        },
        {
          "path": "assets/release-screenshots/electrical-summary-v1.0.0-back-pc.jpg",
          "caption": "정답 공식",
          "sha256": "082c3f81b8d384c309c1480593e5aa61f48afb1933eeab855169e100cfba3d7c"
        }
      ],
      "shot_scope": "v1.0.0 실제 요점정리 템플릿의 쿨롱 법칙 카드입니다.",
      "assets": [
        {
          "name": "Electrical_Engineer_Anki_Deck_Master_Prompt_v1.1.0.md",
          "size": 17121,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Anki_Deck_Master_Prompt_v1.1.0.md",
          "sha256": "11c7990d3b195578b3b727998c9f30c0cc88c231290d2315e2eb2db9eee1f879",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_CHANGELOG_v1.0.0.md",
          "size": 1146,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_CHANGELOG_v1.0.0.md",
          "sha256": "3e8d2874d3c82783884113eaf65fd80fab44fb9ea7a21b87f30df3a42aad3060",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_LAB_v1.0.0.apkg",
          "size": 155590711,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_LAB_v1.0.0.apkg",
          "sha256": "d091d22a596618a9f1abfb91093b14c1131fbf7312e37706e98a33b6d43a343e",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_LAB_v1.0.0_PREVIEW.zip",
          "size": 358716,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_LAB_v1.0.0_PREVIEW.zip",
          "sha256": "aeb5b3125228edd4df6b1a12f090992618056605fcffccab4aaf0a6cdeb0f93b",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_MASTER_v1.0.0.xlsx",
          "size": 422999,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_MASTER_v1.0.0.xlsx",
          "sha256": "9075901c39fd30a3fa4b0f566bdbd2ba07566fcacdf5419b4406029058fcf4d4",
          "kind": "MASTER",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_NOTES_v1.0.0.tsv",
          "size": 1503688,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_NOTES_v1.0.0.tsv",
          "sha256": "0ed26246936bbf4b597742523d09e8717905e38a34471761f6a0754c76dbb5d4",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_Summary_QA_v1.0.0.md",
          "size": 4207,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer/Electrical_Engineer_Summary_QA_v1.0.0.md",
          "sha256": "d3f4e59900f48cc04fc35a0c5fb614a5f4a3c227b205b85cd0a53546edec8b7f",
          "kind": "문서·자료",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 1300,
        "cards": 1300,
        "media": 2671,
        "needs_review": null,
        "excluded": null
      }
    },
    {
      "id": "electrical-engineer-cbt-v1.0.0",
      "product_id": "electrical-engineer-cbt",
      "title": "전기기사 CBT",
      "subject": "electrical-engineer",
      "subject_label": "전기기사",
      "version": "v1.0.0",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/Electrical_Engineer_CBT_FULL_2016-2026",
      "published_at": "2026-09-21T20:13:48Z",
      "purpose": "선택지를 고른 뒤 정답 근거와 오답 포인트를 확인하는 시험형 반복 학습입니다.",
      "study": "정답 번호만 외우지 말고 공식·판단 근거를 말한 뒤 답을 확인합니다.",
      "update": "v0.1.0의 AnkiMobile 오류 이력과 v0.1.1 기록은 보존합니다. v1.0.0은 새 후보로 별도 테스트한 뒤 운영 프로필에 넣습니다.",
      "structure": [
        "2016~2022 LegacyFixedPaper · 개인학습 전용",
        "2023~2026 대비 AIPractice · Original",
        "전기자기학 · 전력공학 · 전기기기",
        "회로이론 및 제어공학 · 전기설비기술기준"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "파일·카드 구조 검사 PASS. 새 프로필 가져오기는 사용자 확인 PASS이며 Desktop·iPhone·iPad 기본 실행도 확인했습니다. DEVICE PARTIAL은 세부 기능·동기화 QA가 남았다는 뜻입니다. 업데이트 대상이 특정되지 않아 기존 UPDATE 판정을 유지합니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "PASS",
        "iPhone": "PASS",
        "iPad": "PASS",
        "Android": "NOT_TESTED"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "",
      "preview": "previews/electrical-engineer-cbt/v1.0.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/electrical-cbt-v1.0.0-question-pc.jpg",
          "caption": "CBT 질문·선택지",
          "sha256": "a1430db59343371126335fe90e36006d316064d6b554f727b642aed67def29b3"
        },
        {
          "path": "assets/release-screenshots/electrical-cbt-v1.0.0-answer-pc.jpg",
          "caption": "정답·풀이",
          "sha256": "69fb59ebc8c10fb1334530e8921b46af176b4399d701aae456cda00d7c6f5e2e"
        }
      ],
      "shot_scope": "v1.0.0 실제 CBT 템플릿의 문제 화면과 풀이 부분입니다.",
      "assets": [
        {
          "name": "Electrical_Engineer_CBT_FULL_2016-2026_v1.0.0.apkg",
          "size": 48148636,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer_CBT_FULL_2016-2026/Electrical_Engineer_CBT_FULL_2016-2026_v1.0.0.apkg",
          "sha256": "a2ba9da9bf052df4d174d0bc3eba3104f18698d5646d37a3f0d3441d0f37884f",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Electrical_Engineer_CBT_v1.0.0_PREVIEW.zip",
          "size": 11431,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/Electrical_Engineer_CBT_FULL_2016-2026/Electrical_Engineer_CBT_v1.0.0_PREVIEW.zip",
          "sha256": "214ad173e69442d607d5b2c908a534db3d0401dbd9d93a738d0924d3e90837d7",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {
        "notes": 2250,
        "cards": 2250,
        "media": 2601,
        "needs_review": null,
        "excluded": null
      }
    },
    {
      "id": "epd-anki-v0.9.0",
      "product_id": "epd-auditor",
      "title": "EPD Auditor Anki",
      "subject": "certifications",
      "subject_label": "환경성적표지",
      "version": "v0.9.0",
      "current": true,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/EPD_Anki_MASTER_PACKAGE",
      "published_at": "2026-09-30T09:58:37Z",
      "purpose": "환경성적표지 인증심사 절차·용어·판정 근거를 반복 회상하고 실무 확인 순서를 정리합니다.",
      "study": "정의와 절차를 먼저 익힌 뒤 실제 심사 상황에서 필요한 근거와 판단 순서를 회상합니다.",
      "update": "기존 버전 위 Update 결과는 보고되지 않아 NOT_TESTED입니다. 백업 후 별도 테스트 프로필에서 확인해야 합니다.",
      "structure": [
        "핵심 용어",
        "심사 절차",
        "판정 근거",
        "주의·혼동 항목"
      ],
      "qa": {
        "STATIC": "PARTIAL",
        "IMPORT": "PASS",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "단독 APKG가 Release에 등록됐으며 크기·SHA-256이 기존 CRC·SQLite 검증본과 일치합니다. STATIC은 구조 확인 범위의 PARTIAL이며 미디어·필드 참조 전수 검사는 남아 있습니다. 새 프로필 가져오기와 Android 기본 실행은 사용자 확인 PASS입니다.",
      "device_note": "2026-10-02 사용자 보고 · 기기별 기본 실행 확인. 실제 시험일·앱/OS 버전·세부 기능·왕복 동기화 증거는 별도입니다.",
      "runtime_devices": {
        "Desktop": "NOT_TESTED",
        "iPhone": "NOT_TESTED",
        "iPad": "NOT_TESTED",
        "Android": "PASS"
      },
      "runtime_scope": "기본 실행 확인; 세부 기능·동기화 QA 미완료",
      "download_note": "설치에는 EPD_Anki_MASTER_v0.9.0.apkg를 사용하세요. 예전 MASTER PACKAGE ZIP은 손상 기록으로 다운로드가 차단되어 있습니다.",
      "preview": "previews/epd-auditor/v0.9.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/epd-anki-v0.9.0-01.png",
          "caption": "학습형 질문",
          "sha256": "2e8890d0d074538fe3f49ee246723e9c93dce9a049a39c7d7b9e85fbcc35c1af"
        },
        {
          "path": "assets/release-screenshots/epd-anki-v0.9.0-02.png",
          "caption": "설명·근거",
          "sha256": "adf335f71c1df169f134d03bd6691b22265bec75f3960870196ad3907916b253"
        }
      ],
      "shot_scope": "v0.9.0 APKG의 실제 학습형 템플릿입니다. 설치에는 별도로 등록된 APKG를 사용하며 예전 손상 ZIP은 차단합니다.",
      "assets": [
        {
          "name": "EPD_Anki_.EC.B2.98.EC.9D.8C.EC.82.AC.EC.9A.A9.EC.9E.90.EA.B0.80.EC.9D.B4.EB.93.9C_v0.9.0.html",
          "size": 16354,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/EPD_Anki_MASTER_PACKAGE/EPD_Anki_.EC.B2.98.EC.9D.8C.EC.82.AC.EC.9A.A9.EC.9E.90.EA.B0.80.EC.9D.B4.EB.93.9C_v0.9.0.html",
          "sha256": "c55c5220a8c567ac267b04f4cb024389521e49ea0a0267dfbcf2139b90e6390e",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "EPD_Anki_MASTER_PACKAGE_v0.9.0.zip",
          "size": 53695936,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/EPD_Anki_MASTER_PACKAGE/EPD_Anki_MASTER_PACKAGE_v0.9.0.zip",
          "sha256": "15550f494106a1c6af1b79cbb651775bf3aa818d8afdbacf943b8e62252b8f62",
          "kind": "배포 ZIP",
          "blocked": true
        },
        {
          "name": "EPD_Anki_MASTER_v0.9.0.apkg",
          "size": 42874199,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/EPD_Anki_MASTER_PACKAGE/EPD_Anki_MASTER_v0.9.0.apkg",
          "sha256": "5cf0ffc707a7cf471f17c6d1da685afbb7df29284dee3a5cc67d26c539b45ad7",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "EPD_Auditor_Anki_v0.9.0_PREVIEW.zip",
          "size": 24122,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/EPD_Anki_MASTER_PACKAGE/EPD_Auditor_Anki_v0.9.0_PREVIEW.zip",
          "sha256": "f788b2051c6c3172b09859736ed4406716fcb3c9931233a39ec1e67f12f50b47",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "kanji-revolution-v1.0.4",
      "product_id": "kanji-revolution",
      "title": "Kanji Revolution",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.0.4",
      "current": false,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Anki",
      "published_at": "2026-09-12T04:46:11Z",
      "purpose": "한자 형태를 구성 요소와 이미지에 연결해 장기 기억 단서를 강화합니다.",
      "study": "답을 보기 전에 형태를 말로 분해하고 본인만의 연상을 한 번 만들어 봅니다.",
      "update": "기존 버전 사용자는 백업 후 별도 테스트 프로필에서 v1.2.0-RC1 업데이트를 검증해야 합니다. 이번 사용자 보고에는 Update 결과가 없어 NOT_TESTED입니다.",
      "structure": [
        "한자",
        "생성원리",
        "연상법",
        "원본 확인"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "NOT_TESTED",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "NOT_TESTED"
      },
      "qa_note": "해당 버전의 Release 기록을 기준으로 표시합니다. 현재판 검증을 이전판으로 승계하지 않습니다.",
      "device_note": "",
      "runtime_devices": {},
      "runtime_scope": "",
      "download_note": "",
      "preview": "previews/kanji-revolution/v1.0.4/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.0.4-reading-front.png",
          "caption": "한자 읽기 앞면",
          "sha256": "ea318e47e61fb8330dc94c18a689bac70911cf40d552062f3ae7456cfa66d591"
        },
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.0.4-reading-answer.png",
          "caption": "정답·기억 그림",
          "sha256": "7069d8fc9b8365d7a250ce421d7309101854981610460fb3c663294e6b330169"
        }
      ],
      "shot_scope": "v1.0.4 실제 템플릿 미리보기의 읽기 앞면·정답 화면입니다.",
      "assets": [
        {
          "name": "complete_v104.zip",
          "size": 426723448,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki/complete_v104.zip",
          "sha256": "d4813fb72d7bc77ce413c19c8a4e9fdd3ba80d43134a6196c0c686962f3cb4d9",
          "kind": "배포 ZIP",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_TEXT_COMPLETE_v1.0.4_PREVIEW_BUNDLE.zip",
          "size": 961898,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki/Kanji_Revolution_TEXT_COMPLETE_v1.0.4_PREVIEW_BUNDLE.zip",
          "sha256": "e7c6c5db68fe46bdce0ef9b6db5ff82875b24c7cbdecffc9175939a46de3f0fd",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "toeic-vocabulary-v1.1.0",
      "product_id": "toeic-lab",
      "title": "TOEIC LAB",
      "subject": "english",
      "subject_label": "영어·TOEIC",
      "version": "v1.1.0",
      "current": false,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/TOEIC_Vocabulary",
      "published_at": "2026-09-22T00:40:25Z",
      "purpose": "정답뿐 아니라 예문·해석·출제 표현·연상 단서를 함께 회상합니다.",
      "study": "단어 뜻을 맞힌 뒤 예문 속 결합 표현까지 말할 수 있는지 확인합니다.",
      "update": "기존 버전 위 업데이트 PASS 기록을 유지합니다. 사용자도 업데이트한 덱의 학습 기록 보존을 확인했습니다. 새 프로필 가져오기는 사용자 확인 PASS입니다.",
      "structure": [
        "단어",
        "숙어",
        "부사",
        "실전 문제"
      ],
      "qa": {
        "STATIC": "PASS",
        "IMPORT": "NOT_TESTED",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "NOT_TESTED"
      },
      "qa_note": "해당 버전의 Release 기록을 기준으로 표시합니다. 현재판 검증을 이전판으로 승계하지 않습니다.",
      "device_note": "",
      "runtime_devices": {},
      "runtime_scope": "",
      "download_note": "",
      "preview": "previews/toeic-vocabulary/v1.1.0/index.html",
      "shots": [
        {
          "path": "assets/release-screenshots/toeic-vocabulary-v1.1.0-front.jpg",
          "caption": "단어 앞면",
          "sha256": "b58d185cbb75e15a9f8c5bdefd2e1b9072371797f924e92fde69dc9f25330ef8"
        },
        {
          "path": "assets/release-screenshots/toeic-vocabulary-v1.1.0-back.jpg",
          "caption": "정답·연상",
          "sha256": "7ddf82164500e62e39f029e5a5882173d136b79a407676078ff5facbfa5fbebe"
        }
      ],
      "shot_scope": "v1.1.0 실제 템플릿 미리보기의 기존 앞면·정답 캡처입니다.",
      "assets": [
        {
          "name": "TOEIC_Vocabulary_Idiom_Adverb_LAB_Master_v1.1.0.xlsx",
          "size": 1327910,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_Vocabulary/TOEIC_Vocabulary_Idiom_Adverb_LAB_Master_v1.1.0.xlsx",
          "sha256": "8ac45474e1cd79c7655e7d3b90b100aff4f602e9d3f2c2f6f4cb2463e6800642",
          "kind": "MASTER",
          "blocked": false
        },
        {
          "name": "TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.1.0.apkg",
          "size": 1635650,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_Vocabulary/TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.1.0.apkg",
          "sha256": "8c6c65d30ef3f331484ef488d00e4dbe5861fd6b9fd862f0f72aaeddeb22fb88",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.1.0_PREVIEW.zip",
          "size": 9804,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/TOEIC_Vocabulary/TOEIC_Vocabulary_Idiom_Adverb_LAB_v1.1.0_PREVIEW.zip",
          "sha256": "22919f5318aa6292dfd7146d6e897ff885a950cf9ab2fb8ed49032f1edb070fb",
          "kind": "미리보기",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    },
    {
      "id": "kanji-revolution-v1.1.0",
      "product_id": "kanji-revolution",
      "title": "Kanji Revolution",
      "subject": "japanese",
      "subject_label": "일본어",
      "version": "v1.1.0",
      "current": false,
      "prerelease": true,
      "release_url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/tag/JLPT_Anki_KANJI_REVOLUTION",
      "published_at": "2026-09-30T10:05:40Z",
      "purpose": "한자 형태를 구성 요소와 이미지에 연결해 장기 기억 단서를 강화합니다.",
      "study": "답을 보기 전에 형태를 말로 분해하고 본인만의 연상을 한 번 만들어 봅니다.",
      "update": "기존 버전 사용자는 백업 후 별도 테스트 프로필에서 v1.2.0-RC1 업데이트를 검증해야 합니다. 이번 사용자 보고에는 Update 결과가 없어 NOT_TESTED입니다.",
      "structure": [
        "한자",
        "생성원리",
        "연상법",
        "원본 확인"
      ],
      "qa": {
        "STATIC": "NOT_TESTED",
        "IMPORT": "NOT_TESTED",
        "UPDATE": "NOT_TESTED",
        "DEVICE": "PARTIAL"
      },
      "qa_note": "해당 버전의 Release 기록을 기준으로 표시합니다. 현재판 검증을 이전판으로 승계하지 않습니다.",
      "device_note": "사용자 실행 보고(2026.09.30): Desktop·iPhone PASS, Anki 25.09. iPad·Android는 NOT_TESTED로 기록되어 있습니다.",
      "runtime_devices": {},
      "runtime_scope": "",
      "download_note": "",
      "preview": null,
      "shots": [
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.1.0-01.png",
          "caption": "QUIZ 질문·선택지",
          "sha256": "0bb366e8e125341e870afad5e410bff96327352e857ce710c3572237f8c06694"
        },
        {
          "path": "assets/release-screenshots/kanji-revolution-v1.1.0-02.png",
          "caption": "QUIZ 정답·해설",
          "sha256": "63c7899adfa71c34dd4711b9b97570e39e14ceb27eb4c01b93f37a5a957f5d2f"
        }
      ],
      "shot_scope": "v1.1.0 QUIZ APKG의 실제 HTML·CSS·대표 노트와 미디어를 읽기 전용으로 추출했습니다. 디자인 승인용 HTML은 이 캡처에 사용하지 않았습니다.",
      "assets": [
        {
          "name": "Kanji_Revolution_Accuracy_UI_PREVIEW_v1.1.0-RC2.html",
          "size": 1221489,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_Accuracy_UI_PREVIEW_v1.1.0-RC2.html",
          "sha256": "c2786676e36ca9cd50b65a17d18d686aeca146fc6986297617da2b921e26e22c",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_MASTER_v1.1.0.xlsx",
          "size": 5598255,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_MASTER_v1.1.0.xlsx",
          "sha256": "c958ae2797f8c494a6bf60e4b511fe6dd5721a8e701a150715b815fbaedaaee1",
          "kind": "MASTER",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_QUIZ_v1.1.0.apkg",
          "size": 42501934,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_QUIZ_v1.1.0.apkg",
          "sha256": "b1d8debbfc21852bc4e4730cab5a3b9a70d06d48db1908a7ec229f60363afbec",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_TEXT_COMPLETE_v1.1.0.apkg",
          "size": 446801404,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_TEXT_COMPLETE_v1.1.0.apkg",
          "sha256": "6279353feeaa0c8d8f0da8f24ed923595f5345489df14167c2c1aab2f663a1fa",
          "kind": "APKG",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_UI_PREVIEW_v1.1.0.html",
          "size": 1221489,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_UI_PREVIEW_v1.1.0.html",
          "sha256": "c2786676e36ca9cd50b65a17d18d686aeca146fc6986297617da2b921e26e22c",
          "kind": "미리보기",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.1.0_CHANGELOG.md",
          "size": 1928,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_v1.1.0_CHANGELOG.md",
          "sha256": "32f9b9f1c08d3d2d5fbed3e3543987b42391df2f56e194ba8d668ece223eb353",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.1.0_IMPORT_GUIDE.md",
          "size": 2005,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_v1.1.0_IMPORT_GUIDE.md",
          "sha256": "0cfd6498c113c344f0085d3f17c0418df12df6055755829ba761d276929aaf6d",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.1.0_MANIFEST.json",
          "size": 2245,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_v1.1.0_MANIFEST.json",
          "sha256": "c3533e068dc93f8e7b52cb3c3bcbe53403d3ae58cfe738d5880e3a38a8803a0f",
          "kind": "문서·자료",
          "blocked": false
        },
        {
          "name": "Kanji_Revolution_v1.1.0_QA.md",
          "size": 3320,
          "url": "https://github.com/dlquffhqnxj/anki-deck-project/releases/download/JLPT_Anki_KANJI_REVOLUTION/Kanji_Revolution_v1.1.0_QA.md",
          "sha256": "f892984836d58b7b23c11c40c40272b9d8a708573790af111c8bd33f089d598c",
          "kind": "문서·자료",
          "blocked": false
        }
      ],
      "blocked": false,
      "counts": {}
    }
  ]
};
