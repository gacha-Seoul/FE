export type Lang = 'ko' | 'en'

// 랜딩 문구 (한/영). 퀘스트 이름은 API 명세의 전통시장 Q01~Q04 기준
export const COPY = {
  ko: {
    nav: { how: '플레이 방법', regions: '지역', quest: '퀘스트', start: '시작하기' },
    hero: {
      eyebrow: 'SEOUL GACHA · K-CULTURE QUEST',
      title: ['서울에서 만나는 K-문화,', '가챠로 시작하세요'],
      body: '랜덤으로 뽑힌 서울의 동네에서 시장 상인, 카페 사장님과 한국어로 대화하며 퀘스트를 완료해 보세요.',
      cta: '가챠 뽑으러 가기',
      coin: '처음 오면 1냥을 드려요',
    },
    how: {
      title: '이렇게 놀아요',
      steps: [
        { title: '가챠 뽑기', body: '엽전 1냥으로 서울의 구 하나를 뽑아요. 어떤 동네가 나올지는 기계만 알아요.' },
        { title: '지역 퀘스트', body: '뽑힌 동네의 전통시장, 대학가, 카페를 순서대로 탐험해요.' },
        { title: 'NPC와 대화', body: '상인과 한국어로 대화하면 표현 교정과 문화 팁을 받아요. 완료하면 냥이 쌓여요.' },
      ],
    },
    regions: {
      title: '지금 열 수 있는 동네',
      body: '구마다 분야가 달라요. 문화, 생활자원, 예술, 관광, 역사 중 무엇이 나올까요?',
    },
    quest: {
      title: '첫 퀘스트는 영천시장',
      body: '서대문구 전통시장에서 네 가지 미션을 이어서 해결해요. 완료할 때마다 냥을 받아요.',
      steps: ['전집 찾기', '시식하기', '흥정하기', '순대 포장하기'],
      npc: '전집 상인',
      chat: {
        npc: '어서 와요! 뭐 찾으러 왔어요?',
        me: '이거 얼마',
        better: '이거 얼마예요?',
        tip: '시장에서는 "조금 깎아 주세요"로 흥정을 시작해 보세요.',
      },
    },
    final: { title: '도깨비불이 서울 길을 안내해 줄게요', cta: '지금 뽑기' },
    footer: '© 2026 gacha-Seoul · 해커톤 프로젝트',
  },
  en: {
    nav: { how: 'How to play', regions: 'Regions', quest: 'Quests', start: 'Start' },
    hero: {
      eyebrow: 'SEOUL GACHA · K-CULTURE QUEST',
      title: ['Meet K-culture in Seoul,', 'one gacha at a time'],
      body: 'Draw a random Seoul neighborhood, then chat in Korean with market vendors and café owners to clear quests.',
      cta: 'Pull the gacha',
      coin: 'Get 1 nyang on your first visit',
    },
    how: {
      title: 'How it works',
      steps: [
        {
          title: 'Pull the gacha',
          body: 'Spend one coin to unlock a Seoul district. Only the machine knows which one.',
        },
        { title: 'Explore quests', body: 'Visit the market, campus street and cafés of your district in order.' },
        {
          title: 'Talk to NPCs',
          body: 'Speak Korean with vendors and get corrections and culture tips. Earn coins as you go.',
        },
      ],
    },
    regions: {
      title: 'Districts you can unlock',
      body: 'Each district has a theme: culture, living, art, tourism or history.',
    },
    quest: {
      title: 'Your first quest: Yeongcheon Market',
      body: 'Clear four missions at a traditional market in Seodaemun-gu and earn coins for each one.',
      steps: ['Find the jeon shop', 'Taste samples', 'Haggle', 'Order sundae to go'],
      npc: 'Jeon vendor',
      chat: {
        npc: '어서 와요! 뭐 찾으러 왔어요?',
        me: '이거 얼마',
        better: '이거 얼마예요?',
        tip: 'At the market, start haggling with "조금 깎아 주세요" (a little discount, please).',
      },
    },
    final: { title: 'A friendly dokkaebi flame will guide you through Seoul', cta: 'Pull now' },
    footer: '© 2026 gacha-Seoul · Hackathon project',
  },
} as const
