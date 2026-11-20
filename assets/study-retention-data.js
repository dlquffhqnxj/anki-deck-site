/* Original seven-day variants and optional reasoning checks for the web practice. */
(() => {
  'use strict';

  const retests = {
    japanese: [
      {
        id: 'retest-jp-location-action', concept: 'location', type: '문맥 선택',
        prompt: '아이들이 운동장에서 논다는 뜻을 완성하세요.',
        sentence: '子どもたちは校庭（　）遊びます。',
        reading: 'こどもたちはこうていであそびます。',
        translation: '아이들은 운동장에서 놉니다.', answer: 'c',
        options: [
          ['a', 'に', '이동 목적지나 존재 장소 등에 쓰입니다.'],
          ['b', 'へ', '이동 방향을 나타내는 조사입니다.'],
          ['c', 'で', '遊びます가 일어나는 장소에 で를 붙입니다.'],
          ['d', 'が', '校庭은 이 문장에서 행동하는 주체가 아닙니다.'],
        ],
      },
      {
        id: 'retest-jp-location-destination', concept: 'location', type: '문맥 선택',
        prompt: '내일 은행에 간다는 뜻을 완성하세요.',
        sentence: '明日、銀行（　）行きます。',
        reading: 'あした、ぎんこうにいきます。',
        translation: '내일 은행에 갑니다.', answer: 'b',
        options: [
          ['a', 'で', '행동 장소나 이동 수단 등에 씁니다.'],
          ['b', 'に', '銀行은 行きます의 목적지입니다.'],
          ['c', 'が', '銀行은 이동의 주체가 아닙니다.'],
          ['d', 'を', '이동 경로 등은 표시할 수 있지만 여기서는 목적지를 표시합니다.'],
        ],
      },
      {
        id: 'retest-jp-agency-action', concept: 'agency', type: '문맥 선택',
        prompt: '짐을 떨어뜨렸다는 뜻을 완성하세요.',
        sentence: '荷物を（　）。',
        reading: 'にもつをおとしました。',
        translation: '짐을 떨어뜨렸습니다.', answer: 'd',
        options: [
          ['a', '落ちました', '자동사 落ちる는 짐이 떨어지는 변화를 나타냅니다.'],
          ['b', '上がりました', '자동사 上がる는 올라간다는 뜻입니다.'],
          ['c', '転びました', '넘어졌다는 뜻입니다.'],
          ['d', '落としました', '타동사 落とす가 荷物を를 목적어로 받아 떨어뜨리는 행동을 나타냅니다.'],
        ],
      },
      {
        id: 'retest-jp-agency-change', concept: 'agency', type: '문맥 선택',
        prompt: '물이 끓었다는 뜻을 완성하세요.',
        sentence: 'お湯が（　）。',
        reading: 'おゆがわきました。',
        translation: '물이 끓었습니다.', answer: 'a',
        options: [
          ['a', '沸きました', '자동사 沸く가 물이 끓는 변화를 나타냅니다.'],
          ['b', '沸かしました', '타동사 沸かす는 물을 끓이는 행동입니다.'],
          ['c', '注ぎました', '타동사 注ぐ는 물을 붓는 행동입니다.'],
          ['d', '飲みました', '타동사 飲む는 물을 마시는 행동입니다.'],
        ],
      },
      {
        id: 'retest-jp-existence-animal', concept: 'existence', type: '문맥 선택',
        prompt: '공원에 개가 있다는 뜻을 완성하세요.',
        sentence: '公園に犬が（　）。',
        reading: 'こうえんにいぬがいます。',
        translation: '공원에 개가 있습니다.', answer: 'c',
        options: [
          ['a', 'あります', '사물의 위치를 말할 때 쓸 수 있습니다.'],
          ['b', 'します', '어떤 행동을 한다는 뜻입니다.'],
          ['c', 'います', '개는 동물이므로 いる의 정중형 います를 씁니다.'],
          ['d', 'なります', '어떤 상태가 된다는 뜻입니다.'],
        ],
      },
      {
        id: 'retest-jp-existence-thing', concept: 'existence', type: '문맥 선택',
        prompt: '냉장고에 우유가 있다는 뜻을 완성하세요.',
        sentence: '冷蔵庫に牛乳が（　）。',
        reading: 'れいぞうこにぎゅうにゅうがあります。',
        translation: '냉장고에 우유가 있습니다.', answer: 'b',
        options: [
          ['a', 'います', '사람이나 동물이 있는 곳을 말할 때 씁니다.'],
          ['b', 'あります', '우유는 사물이므로 ある의 정중형 あります를 씁니다.'],
          ['c', 'なります', '어떤 상태로 바뀐다는 뜻입니다.'],
          ['d', 'します', '어떤 행동을 한다는 뜻입니다.'],
        ],
      },
    ],
    toeic: [
      {
        id: 'retest-toeic-word-form-state', concept: 'word-form', type: '품사 빈칸',
        prompt: '빈칸에 들어갈 단어를 고르세요.',
        sentence: 'The replacement cable appears _____.',
        translation: '교체용 케이블이 튼튼해 보입니다.', answer: 'a',
        options: [
          ['a', 'durable', '연결동사 appears 뒤에서 케이블의 성격을 설명하는 형용사입니다.'],
          ['b', 'durably', '부사입니다. 여기서는 케이블의 상태를 설명합니다.'],
          ['c', 'durability', '‘내구성’을 뜻하는 명사입니다.'],
          ['d', 'duration', '‘지속 시간’을 뜻하는 명사입니다.'],
        ],
      },
      {
        id: 'retest-toeic-word-form-action', concept: 'word-form', type: '품사 빈칸',
        prompt: '빈칸에 들어갈 단어를 고르세요.',
        sentence: 'Please pack the samples _____ to avoid damage.',
        translation: '손상을 방지할 수 있도록 샘플을 단단히 포장해 주세요.', answer: 'd',
        options: [
          ['a', 'secure', '형용사나 동사로 쓰입니다. 포장하는 방식에는 부사가 필요합니다.'],
          ['b', 'security', '‘보안’이나 ‘안전’을 뜻하는 명사입니다.'],
          ['c', 'secures', '동사의 3인칭 단수 현재형입니다.'],
          ['d', 'securely', '부사 securely가 포장하는 방식인 ‘단단히’를 나타냅니다.'],
        ],
      },
      {
        id: 'retest-toeic-connector-phrase', concept: 'connector', type: '문장 연결',
        prompt: '배송 경로가 변경된 이유에 맞는 표현을 고르세요.',
        sentence: 'The shipment was rerouted _____ a bridge inspection.',
        translation: '교량 점검 때문에 배송 경로가 변경되었습니다.', answer: 'c',
        options: [
          ['a', 'although', '뒤에 절이 오며 양보를 나타냅니다.'],
          ['b', 'because', '이유를 나타내며 뒤에 주어와 동사가 있는 절이 옵니다.'],
          ['c', 'because of', '명사구 a bridge inspection을 이어 이유를 나타냅니다.'],
          ['d', 'unless', '뒤에 절이 오며 예외 조건을 나타냅니다.'],
        ],
      },
      {
        id: 'retest-toeic-connector-clause', concept: 'connector', type: '문장 연결',
        prompt: '두 일이 모두 일어났습니다. 문맥에 맞는 표현을 고르세요.',
        sentence: '_____ the inspection took longer than expected, the service team finished the repairs on time.',
        translation: '점검이 예상보다 오래 걸렸지만 서비스팀은 수리를 제시간에 마쳤습니다.', answer: 'b',
        options: [
          ['a', 'Despite', '양보를 나타내는 전치사이므로 뒤에 명사구가 옵니다.'],
          ['b', 'Although', '점검이 오래 걸렸다는 절을 이어 뒤 문장과의 대비를 나타냅니다.'],
          ['c', 'During', '시간이나 기간을 나타내는 명사구와 함께 씁니다.'],
          ['d', 'Because of', '명사구 앞에 쓰이며 이유를 나타냅니다.'],
        ],
      },
      {
        id: 'retest-toeic-collocation-agreement', concept: 'collocation', type: '어휘 결합',
        prompt: '양측이 합의에 이른다는 뜻을 완성하세요.',
        sentence: 'Both sides hope to _____ an agreement on the delivery date.',
        translation: '양측은 납품일에 합의하기를 바랍니다.', answer: 'd',
        options: [
          ['a', 'carry', '물건을 옮긴다는 뜻으로 쓰입니다.'],
          ['b', 'perform', '작업이나 임무 등을 수행할 때 씁니다.'],
          ['c', 'keep', '약속을 지킨다는 뜻에 쓸 수 있지만 여기서는 합의에 이르는 행동을 묻습니다.'],
          ['d', 'reach', 'reach an agreement는 합의에 이르다는 뜻입니다.'],
        ],
      },
      {
        id: 'retest-toeic-collocation-application', concept: 'collocation', type: '어휘 결합',
        prompt: '신청서를 제출한다는 뜻에 맞는 동사를 고르세요.',
        sentence: 'Please _____ your application through the online portal by Friday.',
        translation: '금요일까지 온라인 포털에서 신청서를 제출해 주세요.', answer: 'a',
        options: [
          ['a', 'submit', 'submit an application은 신청서를 제출하다는 뜻입니다.'],
          ['b', 'withdraw', '신청을 철회한다는 뜻입니다.'],
          ['c', 'review', '신청서를 검토한다는 뜻입니다.'],
          ['d', 'approve', '신청을 승인한다는 뜻입니다.'],
        ],
      },
    ],
    electrical: [
      {
        id: 'retest-elec-unit-current', concept: 'unit-conversion', type: '전류 단위 환산',
        prompt: '전류를 A 단위로 바꾸세요.',
        sentence: '420 mA = ? A',
        solution: '1 A = 1,000 mA이므로 420을 1,000으로 나누면 0.42 A입니다.', answer: 'b',
        options: [
          ['a', '4.2 A', '수치를 100으로 나눴습니다.'],
          ['b', '0.42 A', '420 ÷ 1,000 = 0.42입니다.'],
          ['c', '420 A', '단위만 바꾸면 실제 전류 크기가 달라집니다.'],
          ['d', '0.042 A', '수치를 10,000으로 나눴습니다.'],
        ],
      },
      {
        id: 'retest-elec-unit-resistance', concept: 'unit-conversion', type: '저항 단위 환산',
        prompt: '저항을 kΩ 단위로 바꾸세요.',
        sentence: '6,800 Ω = ? kΩ',
        solution: '1 kΩ = 1,000 Ω이므로 6,800 ÷ 1,000 = 6.8 kΩ입니다.', answer: 'c',
        options: [
          ['a', '68 kΩ', '수치를 100으로 나눴습니다.'],
          ['b', '0.68 kΩ', '수치를 10,000으로 나눴습니다.'],
          ['c', '6.8 kΩ', 'Ω에서 kΩ로 바꾸려면 수치를 1,000으로 나눕니다.'],
          ['d', '6,800 kΩ', '단위만 바꾸면 실제 저항 크기가 달라집니다.'],
        ],
      },
      {
        id: 'retest-elec-ohm-current', concept: 'ohm-law', type: '전류 계산',
        prompt: '직류 회로의 저항에 흐르는 전류를 구하세요.',
        sentence: '저항 양단의 전압 20 V · 저항 8 Ω',
        solution: 'I = V / R = 20 V / 8 Ω = 2.5 A입니다.', answer: 'd',
        options: [
          ['a', '0.4 A', '저항을 전압으로 나눴습니다. 나누는 순서를 확인하세요.'],
          ['b', '12 A', '20에서 8을 뺀 수치입니다.'],
          ['c', '160 A', '두 수치를 곱했습니다.'],
          ['d', '2.5 A', '전압을 저항으로 나누면 2.5 A입니다.'],
        ],
      },
      {
        id: 'retest-elec-ohm-resistance', concept: 'ohm-law', type: '저항 계산',
        prompt: '직류 회로의 저항값을 구하세요.',
        sentence: '저항 양단의 전압 6 V · 전류 240 mA',
        solution: '240 mA = 0.240 A입니다. R = 6 V / 0.240 A = 25 Ω입니다.', answer: 'a',
        options: [
          ['a', '25 Ω', '전류를 A로 환산한 뒤 전압을 나눠 구합니다.'],
          ['b', '0.025 Ω', 'mA 수치를 A로 맞추기 전에 나눈 값입니다.'],
          ['c', '2.5 Ω', '전류를 2.4 A로 바꾼 경우의 값입니다.'],
          ['d', '1.44 Ω', '전압과 전류를 곱한 1.44의 단위는 W입니다.'],
        ],
      },
      {
        id: 'retest-elec-power-current', concept: 'dc-power', type: '전력 계산',
        prompt: '직류 부하가 소비하는 전력을 구하세요.',
        sentence: '부하 양단의 전압 15 V · 전류 0.40 A',
        solution: 'P = VI = 15 V × 0.40 A = 6 W입니다.', answer: 'b',
        options: [
          ['a', '37.5 W', '전압을 전류로 나눴습니다. V / I의 단위는 Ω입니다.'],
          ['b', '6 W', '전압과 전류를 곱하면 6 W입니다.'],
          ['c', '0.6 W', '전류를 0.04 A로 읽었을 때의 값입니다.'],
          ['d', '60 W', '전류를 4 A로 읽었을 때의 값입니다.'],
        ],
      },
      {
        id: 'retest-elec-power-voltage', concept: 'dc-power', type: '저항 부하의 전력',
        prompt: '다음 직류 저항 부하가 소비하는 전력을 구하세요.',
        sentence: '저항 양단의 전압 5 V · 저항 10 Ω',
        solution: 'P = VI에 I = V / R을 대입하면 P = V² / R = (5 V)² / 10 Ω = 2.5 W입니다.', answer: 'c',
        options: [
          ['a', '0.5 W', '5 V / 10 Ω으로 구한 0.5의 단위는 A입니다.'],
          ['b', '5 W', '전압 수치를 그대로 옮겼습니다.'],
          ['c', '2.5 W', '전압을 제곱해 저항으로 나누면 2.5 W입니다.'],
          ['d', '250 W', '전압을 제곱한 뒤 저항을 곱했습니다.'],
        ],
      },
    ],
  };

  const reasoning = {
    location: {prompt: '장소 표현은 문장에서 어떤 역할을 하나요?', options: [
      ['activity', '행동이 일어나는 장소'], ['destination', '이동의 목적지'], ['existence', '사물이나 사람이 있는 장소'],
    ]},
    agency: {prompt: '이 문장은 무엇에 초점을 두고 있나요?', options: [
      ['change', '대상 자체의 상태 변화'], ['action', '누군가 대상을 바꾸는 행동'],
    ]},
    existence: {prompt: '문장에서 존재하는 대상은 무엇인가요?', options: [
      ['living', '사람이나 동물'], ['thing', '물건과 같은 사물'],
    ]},
    'word-form': {prompt: '빈칸의 말은 무엇을 설명하나요?', options: [
      ['state', '주어의 상태나 성격'], ['manner', '어떤 방식으로 동작했는지'], ['quantity', '대상의 수량'],
    ]},
    connector: {prompt: '빈칸 바로 뒤는 어떤 구조인가요?', options: [
      ['clause', '주어와 동사가 있는 절'], ['phrase', '명사나 명사구'],
    ]},
    'unit-conversion': {prompt: '단위를 바꿀 때 원래 수치를 어떻게 계산하나요?', options: [
      ['multiply', '1,000을 곱함'], ['divide', '1,000으로 나눔'], ['same', '수치를 그대로 둠'],
    ]},
    'ohm-law': {prompt: '구하려는 값을 왼쪽에 두면 식이 어떻게 되나요?', options: [
      ['current', 'I = V / R'], ['resistance', 'R = V / I'], ['voltage', 'V = IR'],
    ]},
    'dc-power': {prompt: '주어진 값을 바로 넣을 수 있는 전력식은 무엇인가요?', options: [
      ['both', 'P = VI'], ['current', 'P = I²R'], ['voltage', 'P = V² / R'],
    ]},
  };

  const keys = {
    'demo-jp-01': 'activity', 'demo-jp-02': 'change', 'demo-jp-03': 'thing',
    'demo-jp-04': 'destination', 'demo-jp-05': 'action', 'demo-jp-06': 'living',
    'review-jp-location-action': 'activity', 'review-jp-location-goal': 'destination',
    'review-jp-agency-transitive': 'action', 'review-jp-agency-intransitive': 'change',
    'review-jp-existence-person': 'living', 'review-jp-existence-object': 'thing',
    'retest-jp-location-action': 'activity', 'retest-jp-location-destination': 'destination',
    'retest-jp-agency-action': 'action', 'retest-jp-agency-change': 'change',
    'retest-jp-existence-animal': 'living', 'retest-jp-existence-thing': 'thing',
    'demo-toeic-01': 'state', 'demo-toeic-02': 'manner', 'demo-toeic-03': 'clause', 'demo-toeic-04': 'phrase',
    'review-toeic-word-form': 'manner', 'review-toeic-word-form-state': 'state',
    'review-toeic-connector': 'phrase', 'review-toeic-connector-clause': 'clause',
    'retest-toeic-word-form-state': 'state', 'retest-toeic-word-form-action': 'manner',
    'retest-toeic-connector-phrase': 'phrase', 'retest-toeic-connector-clause': 'clause',
    'demo-elec-01': 'multiply', 'demo-elec-02': 'multiply', 'demo-elec-03': 'current',
    'demo-elec-04': 'resistance', 'demo-elec-05': 'both', 'demo-elec-06': 'current',
    'review-elec-unit': 'multiply', 'review-elec-unit-resistance': 'multiply',
    'review-elec-ohm': 'current', 'review-elec-ohm-resistance': 'resistance',
    'review-elec-power': 'both', 'review-elec-power-resistance': 'current',
    'retest-elec-unit-current': 'divide', 'retest-elec-unit-resistance': 'divide',
    'retest-elec-ohm-current': 'current', 'retest-elec-ohm-resistance': 'resistance',
    'retest-elec-power-current': 'both', 'retest-elec-power-voltage': 'voltage',
  };

  const collocation = {
    'demo-toeic-05': ['b', 'the technician', 'an appointment', 'the service center'],
    'demo-toeic-06': ['a', 'effect', 'the new filing procedure', 'on Monday'],
    'review-toeic-collocation': ['c', 'the new parking signs', 'please', 'attention'],
    'review-toeic-collocation-deadline': ['a', 'the deadline', 'the final check', 'today'],
    'retest-toeic-collocation-agreement': ['b', 'both sides', 'an agreement', 'the delivery date'],
    'retest-toeic-collocation-application': ['c', 'the online portal', 'Friday', 'your application'],
  };

  const focus = {
    japanese: {
      meaning: {action: '핵심 동사의 뜻을 먼저 떠올린 뒤 앞의 조사와 연결해 문장을 해석하세요.'},
      rule: {action: '조사 앞의 말과 뒤의 동사를 찾아서 어떤 관계인지 확인하세요.'},
      reading: {action: '누가, 어디서, 무엇을 했는지 나눠 읽어 보세요.'},
      slip: {action: '고른 표현을 빈칸에 넣고, 문장 전체의 뜻을 확인한 뒤 제출하세요.'},
    },
    toeic: {
      meaning: {action: '보기의 뜻을 떠올리고, 완성한 문장이 업무 상황에 맞는지 확인하세요.'},
      rule: {action: '빈칸 앞뒤에서 수식 대상과 문장 성분을 먼저 찾으세요.'},
      reading: {action: '주어와 동사에 표시하고, 빈칸 전후를 나눠 읽으세요.'},
      collocation: {concept: 'collocation', action: '빈칸과 바로 묶이는 명사를 찾고, 그 명사에 붙는 동사를 떠올려 보세요.'},
      slip: {action: '제출하기 전에 고른 보기를 빈칸에 넣고 문장을 한 번 더 읽으세요.'},
    },
    electrical: {
      unit: {concept: 'unit-conversion', action: '식에 넣기 전에 시작 단위와 목표 단위를 적고, 1,000을 곱할지 나눌지 확인하세요.'},
      formula: {action: '수치를 넣기 전에 구하는 값을 왼쪽에 둔 식부터 써 보세요.'},
      condition: {action: '계산 전에 무엇이 주어졌고 어떤 조건에서 식이 성립하는지 확인하세요.'},
      calculation: {action: '식 정리와 수치 계산을 한 줄씩 써 보세요.'},
      slip: {action: '계산한 값과 선택지의 단위·소수점 위치를 대조하고 제출하세요.'},
    },
  };

  for (const bank of window.STUDY_COURSES) {
    bank.retests = retests[bank.id] || [];
    bank.reasonFocus = focus[bank.id] || {};
    for (const question of [...bank.questions, ...(bank.followups || []), ...bank.retests]) {
      if (collocation[question.id]) {
        const [answer, ...words] = collocation[question.id];
        question.evidence = {
          prompt: '빈칸의 동사와 함께 쓰이는 목적어를 고르세요.',
          options: words.map((word, index) => [['a', 'b', 'c'][index], word]),
          answer,
        };
      } else if (keys[question.id]) {
        question.evidence = {...reasoning[question.concept], answer: keys[question.id]};
      }
    }
  }
})();
