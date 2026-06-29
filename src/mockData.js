export const MOCK_USERS = [
  {
    id: 'super',
    password: 'password',
    name: '시스템',
    role: '최고관리자',
    roleCode: 'SUPER_ADMIN',
    department: '플랫폼운영팀',
    companyId: 'SYSTEM',
    baseSalary: 0,
  },
  {
    id: 'admin',
    password: 'password',
    name: '박임원',
    role: '인사담당 임원',
    roleCode: 'COMPANY_ADMIN',
    department: 'HKHQ 경영지원',
    companyId: 'company_a',
    baseSalary: 6000000,
  },
  {
    id: 'user1',
    password: 'password',
    name: '김정욱',
    role: '사원',
    roleCode: 'EMPLOYEE',
    department: '개발팀',
    companyId: 'company_a',
    baseSalary: 3500000,
  },
  {
    id: 'user2',
    password: 'password',
    name: '최준호',
    role: '대리',
    roleCode: 'EMPLOYEE',
    department: '개발팀',
    companyId: 'company_a',
    baseSalary: 4200000,
  },
  {
    id: 'user3',
    password: 'password',
    name: '이수진',
    role: '과장',
    roleCode: 'EMPLOYEE',
    department: '디자인팀',
    companyId: 'company_a',
    baseSalary: 4800000,
  },
  {
    id: 'user4',
    password: 'password',
    name: '강민수',
    role: '사원',
    roleCode: 'EMPLOYEE',
    department: '영업팀',
    companyId: 'company_a',
    baseSalary: 3200000,
  },
  // B회사 (타 회사) 테스트 데이터 추가
  {
    id: 'admin_b',
    password: 'password',
    name: '이임원',
    role: '대표',
    roleCode: 'COMPANY_ADMIN',
    department: '타회사 임원진',
    companyId: 'company_b',
    baseSalary: 7000000,
  },
  {
    id: 'user_b',
    password: 'password',
    name: '타직원',
    role: '사원',
    roleCode: 'EMPLOYEE',
    department: '타회사 영업팀',
    companyId: 'company_b',
    baseSalary: 3100000,
  }
];

// 이번 달(현재 날짜 기준) 샘플 데이터 생성을 위한 날짜 계산 유틸
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;
const yesterdayStr = `${yyyy}-${mm}-${String(today.getDate() - 1).padStart(2, '0')}`;

export const MOCK_LEAVES = [
  { id: 1, userId: 'user2', type: '연차', startDate: `${yyyy}-${mm}-15`, endDate: `${yyyy}-${mm}-15`, days: 1, reason: '개인 사정', status: '대기' },
  { id: 2, userId: 'user1', type: '반차(오후)', startDate: `${yyyy}-${mm}-20`, endDate: `${yyyy}-${mm}-20`, days: 0.5, reason: '병원 진료', status: '승인' },
  { id: 3, userId: 'user2', type: '연차', startDate: `${yyyy}-${mm}-25`, endDate: `${yyyy}-${mm}-26`, days: 2, reason: '가족 여행', status: '대기' },
  { id: 4, userId: 'user_b', type: '연차', startDate: `${yyyy}-${mm}-10`, endDate: `${yyyy}-${mm}-10`, days: 1, reason: '타회사 직원 연차', status: '대기' },
];

export const MOCK_OVERTIMES = [
  { id: 1, userId: 'user1', date: todayStr, startTime: '18:00', endTime: '21:00', hours: 3, reason: '긴급 서버 패치', status: '대기' },
  { id: 2, userId: 'user1', date: yesterdayStr, startTime: '18:30', endTime: '20:30', hours: 2, reason: '프로젝트 마감', status: '승인' },
  { id: 3, userId: 'user3', date: todayStr, startTime: '19:00', endTime: '22:00', hours: 3, reason: '디자인 시안 수정', status: '대기' },
  { id: 4, userId: 'user_b', date: todayStr, startTime: '18:00', endTime: '20:00', hours: 2, reason: '타회사 야근', status: '대기' },
];

export const MOCK_NOTICES = [
  { id: 1, title: '공지사항 테스트', content: '확인 해주세요', author: '김정욱 부장', date: todayStr, views: 2, attachment: '김정욱_서명.png', companyId: 'SYSTEM' }
];

export const MOCK_MESSAGES = [
  { id: 1, senderId: 'admin', recipientId: 'user1', senderName: '관리자', title: '근무 규정 안내', content: '이번 달 변경된 근무 규정을 확인 바랍니다.', date: todayStr + ' 18:45', isRead: false },
  { id: 2, senderId: 'user2', recipientId: 'user1', senderName: '최준호', title: '이번주 회의 자료', content: '회의 자료 첨부해드립니다.', date: yesterdayStr + ' 10:30', isRead: true },
  { id: 3, senderId: 'user1', recipientId: 'admin', senderName: '홍길동(본인)', title: '휴가 관련 문의', content: '다음달 휴가 신청에 관해 문의드립니다.', date: yesterdayStr + ' 15:20', isRead: true }
];

export const MOCK_EDUCATIONS = [
  { 
    id: 1, 
    title: '직장 내 괴롭힘(직장갑질) 예방교육', 
    startDate: '2025-01-01', 
    endDate: '2025-12-31', 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    quiz: {
      question: '다음 중 직장 내 괴롭힘에 해당하지 않는 것은?',
      options: ['정당한 이유 없이 업무 능력 성과를 인정하지 않는 행위', '개인사에 대한 지나친 간섭', '업무상 적정 범위를 넘지 않는 정당한 업무 지시', '회식 참여 강요'],
      answer: 2 // 0-indexed: '업무상 적정 범위를 넘지 않는 정당한 업무 지시'
    }
  },
  { 
    id: 2, 
    title: '퇴직연금 교육', 
    startDate: '2025-01-01', 
    endDate: '2025-12-31', 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    quiz: {
      question: '퇴직연금제도의 종류가 아닌 것은?',
      options: ['확정급여형(DB)', '확정기여형(DC)', '개인형퇴직연금(IRP)', '국민연금'],
      answer: 3
    }
  }
];

export const MOCK_USER_EDUCATIONS = [];

export const MOCK_ATTENDANCES = [
  { id: 1, userId: 'user1', date: todayStr, clockIn: '08:50', clockOut: null, status: '근무중' },
  { id: 2, userId: 'user1', date: yesterdayStr, clockIn: '08:55', clockOut: '18:05', status: '정상퇴근' },
  { id: 3, userId: 'user1', date: `${yyyy}-${mm}-10`, clockIn: '09:10', clockOut: '18:30', status: '지각' },
  { id: 4, userId: 'user1', date: `${yyyy}-${mm}-11`, clockIn: '08:45', clockOut: '18:00', status: '정상퇴근' },
  
  // 다른 직원들의 더미 데이터 추가
  { id: 5, userId: 'user2', date: todayStr, clockIn: '09:05', clockOut: null, status: '지각' },
  { id: 6, userId: 'user2', date: yesterdayStr, clockIn: '08:58', clockOut: '18:10', status: '정상퇴근' },
  
  { id: 7, userId: 'user3', date: todayStr, clockIn: '08:40', clockOut: '14:00', status: '조퇴' },
  { id: 8, userId: 'user3', date: yesterdayStr, clockIn: null, clockOut: null, status: '연차휴가' },
  
  { id: 9, userId: 'user4', date: todayStr, clockIn: '09:00', clockOut: null, status: '외근' },
  { id: 10, userId: 'user4', date: yesterdayStr, clockIn: '08:55', clockOut: '19:30', status: '연장근무' },
];

export const MOCK_PAYROLLS = [
  // { month: '2025-07', companyId: 'company_a', status: '확정' }
];

export const MOCK_CONTRACTS = [
  {
    id: 1,
    userId: 'user1',
    companyId: 'company_a',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: '서명대기',
    signatureDataUrl: null, // 직원이 서명하면 캔버스 이미지가 여기에 들어감
    issuedAt: '2025-08-27'
  },
  {
    id: 2,
    userId: 'user2',
    companyId: 'company_a',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    status: '서명완료',
    signatureDataUrl: 'mock_signature_image',
    issuedAt: '2024-03-01'
  }
];

export const MOCK_SAFETY_CHECKLIST = [
  {
    id: 1,
    title: '물기 확인',
    description: '바닥에 물기가 방치되지 않고 건조한 상태를 유지하고 있는가?',
    options: ['양호', '미흡', '불량']
  },
  {
    id: 2,
    title: '기름기/오염',
    description: '바닥에 미끄러움, 기름기나 음식물 찌꺼기가 없는가?',
    options: ['양호', '미흡', '불량']
  },
  {
    id: 3,
    title: '이물질 제거',
    description: '환자나 보호자의 발에 걸릴만한 작은 이물질이 즉시 제거되었는가?',
    options: ['양호', '미흡', '불량']
  },
  {
    id: 4,
    title: '청소 표지판',
    description: "물청소 중이거나 바닥이 젖었을 때 '미끄럼 주의' 표지판을 설치하였는가?",
    options: ['양호', '미흡', '불량']
  }
];

export const MOCK_SAFETY_RESULTS = [
  {
    id: 1,
    userId: 'user1',
    date: yesterdayStr,
    isPerfect: true,
    items: [
      { questionId: 1, status: '양호', note: '' },
      { questionId: 2, status: '양호', note: '' },
      { questionId: 3, status: '양호', note: '' },
      { questionId: 4, status: '양호', note: '' }
    ]
  },
  {
    id: 2,
    userId: 'user2',
    date: yesterdayStr,
    isPerfect: false,
    items: [
      { questionId: 1, status: '양호', note: '' },
      { questionId: 2, status: '미흡', note: '식당 바닥 약간 미끄러움' },
      { questionId: 3, status: '양호', note: '' },
      { questionId: 4, status: '양호', note: '' }
    ]
  }
];

export const MOCK_COMPANIES = [
  { id: 'company_a', name: 'A회사', representative: '박임원', contact: '010-1111-2222', joinedAt: '2024-01-15', status: '활성', managerName: '김영수', managerPhone: '010-1234-5678', address: '서울시 강남구 테헤란로 123', businessRegImage: null, latitude: 37.4979, longitude: 127.0276, useSafetyFeature: true },
  { id: 'company_b', name: 'B회사', representative: '이임원', contact: '010-3333-4444', joinedAt: '2024-05-20', status: '활성', managerName: '이철민', managerPhone: '010-9876-5432', address: '서울시 서초구 서초대로 45', businessRegImage: null, latitude: 37.4923, longitude: 127.0142, useSafetyFeature: true },
  { id: 'company_c', name: 'C상사', representative: '김대표', contact: '010-5555-6666', joinedAt: '2025-02-10', status: '활성', managerName: '박과장', managerPhone: '010-2222-3333', address: '경기도 성남시 분당구 판교역로 10', businessRegImage: null, latitude: 37.3947, longitude: 127.1111, useSafetyFeature: false }
];

export const MOCK_SUBSCRIPTIONS = [
  { id: 1, companyId: 'company_a', plan: 'Enterprise', amount: 500000, nextBillingDate: '2025-09-15', status: '결제완료' },
  { id: 2, companyId: 'company_b', plan: 'Pro', amount: 150000, nextBillingDate: '2025-09-20', status: '결제완료' },
  { id: 3, companyId: 'company_c', plan: 'Basic', amount: 50000, nextBillingDate: '2026-08-10', status: '결제완료' }
];

export const MOCK_PAYMENT_HISTORY = [
  { id: 1, companyId: 'company_a', date: '2025-08-15', amount: 500000, method: '신용카드', status: '결제완료' },
  { id: 2, companyId: 'company_a', date: '2025-07-15', amount: 500000, method: '신용카드', status: '결제완료' },
  { id: 3, companyId: 'company_b', date: '2025-08-20', amount: 150000, method: '계좌이체', status: '결제완료' },
  { id: 4, companyId: 'company_c', date: '2025-07-10', amount: 50000, method: '신용카드', status: '결제완료' },
];

export const MOCK_TBM_SUBMISSIONS = [
  {
    id: 1,
    userId: 'user1',
    userName: '김정욱',
    companyId: 'company_a',
    date: yesterdayStr,
    type: 'checklist',
    title: 'TBM 실행 체크리스트',
    data: {
      prepQuestions: [
        { id: 1, text: '해당 작업의 위험성평가를 실시하였다. (해당 작업의 위험성평가 결과가 있다.)', status: 'YES', note: '' },
        { id: 2, text: '해당 작업에서 발생한 사고보고서(아차사고 포함)의 내용을 확인하였다.', status: 'YES', note: '' },
        { id: 3, text: '작업 물량과 범위, 작업내용과 필요한 보호구를 잘 알고 있다.', status: 'YES', note: '' },
        { id: 4, text: '위험성평가 결과, 사고보고서, 안전작업지침의 내용을 여러 번 읽어 숙지하였다.', status: 'YES', note: '' }
      ],
      execQuestions: [
        { id: 1, text: '작업자가 음주, 발열, 약물 복용 등으로 작업에 적합한지 여부를 확인하였다.', status: 'YES', note: '' },
        { id: 2, text: '작업내용 / 위험요인 / 안전 작업절차 / 대책에 대해 긍정적인 분위기로 대화하였다.', status: 'YES', note: '' },
        { id: 3, text: '작업자와 중점 위험요인과 대책을 도출하고 이를 숙지하도록 하였다.', status: 'YES', note: '' },
        { id: 4, text: '위험요인, 불안전한 상태 발견시 멈추고, 확인하고, 생각한 후 작업하도록 하였다.', status: 'YES', note: '' },
        { id: 5, text: '작업 후 정리 정돈을 상태를 확인하였다.', status: 'NO', note: '청소 도구함 미정리' }
      ],
      postQuestions: [
        { id: 1, text: '작업자가 제기한 불만사항, 질문, 제안사항을 검토하였다.', status: 'YES', note: '' },
        { id: 2, text: 'TBM 결과를 충실하게 기록하고 보관한다.', status: 'YES', note: '' },
        { id: 3, text: '관련 조치결과는 작업자에게 피드백 한다.', status: 'YES', note: '' }
      ],
      leaderName: '김정욱',
      leaderSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  },
  {
    id: 2,
    userId: 'user2',
    userName: '최준호',
    companyId: 'company_a',
    date: todayStr,
    type: 'minutes',
    title: 'Tool Box Meeting 회의록',
    data: {
      tbmDate: todayStr,
      tbmTimeStart: '08:00',
      tbmTimeEnd: '08:30',
      isTimeSameAsDate: '예',
      taskName: '2층 외벽 보수 및 페인트 작업',
      taskContent: '외벽 균열 보수 후 외부 방수 페인팅 실시',
      location: 'HK빌딩 2층 외부 북측면',
      riskAssessmentDone: '예',
      hazards: [
        { id: 1, hazard: '고소 작업 중 발판 미끄러짐 및 추락 위험', countermeasure: '안전대 체결 및 고정 상태 더블 체크' },
        { id: 2, hazard: '페인트 도료 비산 및 흡입', countermeasure: '보호안경, 방독 마스크 착용' },
        { id: 3, hazard: '낙하물에 의한 지상 보행자 충돌', countermeasure: '지상 통제선 설치 및 감시원 배치' }
      ],
      focusHazard: {
        selection: '고소 작업대에서 보수 작업 중 추락 위험',
        countermeasure: '안전벨트 생명선 연결선 필히 체결 후 작업 진행'
      },
      leaderDept: 'HKHQ 안전팀',
      leaderPosition: '팀장',
      leaderName: '박안전',
      leaderSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      preWorkSafetyChecks: [
        { id: 1, hazard: '고소 작업대 지지대 설치 상태', status: 'YES', note: '' },
        { id: 2, hazard: '개인 보호구(안전모, 안전대) 착용 상태', status: 'YES', note: '' },
        { id: 3, hazard: '주변 경고 표지 및 통제선 설치', status: 'NO', note: '통제선 테이프 추가 고정 필요' }
      ],
      dailyCheckResult: '고소 작업 발판 고정 상태 양호함. 통제 표지판 확인 완료.',
      postMeetingResult: '안전하게 작업 종료되었으며, 잔여 자재 정리 완료 확인.',
      participants: [
        { name: '최준호', signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
        { name: '이순신', signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
      ]
    }
  }
];

export const MOCK_SAFETY_SUGGESTIONS = [
  {
    id: 1,
    userId: 'user1',
    userName: '김정욱',
    companyId: 'company_a',
    title: '지하주차장 누수 위험',
    content: '비가 올 때 지하 2층 주차장 기둥(B구역) 부근에 물이 새고 있어서 바닥이 미끄럽습니다.',
    location: '지하 2층 주차장 B구역',
    isAnonymous: false,
    status: '접수대기',
    feedback: '',
    createdAt: `${yyyy}-${mm}-10 09:30:00`
  },
  {
    id: 2,
    userId: 'user2',
    userName: '최준호',
    companyId: 'company_a',
    title: '휴게실 환풍구 고장',
    content: '직원 휴게실 환풍구에서 지속적으로 이상한 소음이 발생하며, 환기가 제대로 되지 않습니다.',
    location: '3층 휴게실',
    isAnonymous: true,
    status: '처리중',
    feedback: '담당 부서에서 방문하여 상태 확인 완료. 내일 부품 교체 예정입니다.',
    createdAt: yesterdayStr + ' 14:20:00'
  },
  {
    id: 3,
    userId: 'user3',
    userName: '이수진',
    companyId: 'company_a',
    title: '비상구 앞 적치물 치워주세요',
    content: '물류팀 작업 후 발생한 박스들이 비상구(동측) 앞을 가로막고 있어 화재 시 위험합니다.',
    location: '1층 동측 비상구',
    isAnonymous: false,
    status: '조치완료',
    feedback: '물류팀에 전달하여 박스 수거 및 비상구 앞 확보 완료했습니다.',
    createdAt: todayStr + ' 08:15:00'
  }
];

export const MOCK_NEAR_MISSES = [
  {
    id: 1,
    userId: 'user1',
    userName: '김정욱',
    companyId: 'company_a',
    title: '지게차와 작업자 충돌 뻔함',
    content: '물류창고 A구역 사거리에서 지게차가 경적을 울리지 않고 회전하다가 지나가던 작업자와 부딪힐 뻔 했습니다.',
    location: '물류창고 A구역 사거리',
    isAnonymous: false,
    status: '조치완료',
    feedback: '지게차 운전자 대상 안전교육 실시 및 해당 교차로 반사경 설치 완료했습니다.',
    createdAt: `${yyyy}-${mm}-12 10:30:00`
  },
  {
    id: 2,
    userId: 'user2',
    userName: '최준호',
    companyId: 'company_a',
    title: '천장 조명 덮개 추락 위험',
    content: '사무실 2층 회의실 천장 조명 덮개가 반쯤 열려있어 떨어질 위험이 컸습니다.',
    location: '2층 대회의실',
    isAnonymous: true,
    status: '접수대기',
    feedback: '',
    createdAt: yesterdayStr + ' 16:45:00'
  }
];
