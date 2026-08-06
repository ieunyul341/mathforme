const EBSI_MATH_COURSE_URL = "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005";
const EBSI_MATH_BOOK_URL = "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005678";
const EBSI_MATH_SAMPLE_URL = "https://www.youtube.com/watch?v=bLH_Cku2cng";

const MATH_LECTURES = [
  "두 점 사이의 거리",
  "내분점과 중점",
  "삼각형의 무게중심",
  "평면좌표 단원 마무리",
  "직선의 방정식 만드는 방법",
  "두 직선의 평행과 수직",
  "수직이등분선의 방정식",
  "점과 직선 사이의 거리",
  "직선의 방정식 단원 마무리",
  "원의 방정식",
  "원과 직선의 위치 관계",
  "원과 접선의 방정식(1)",
  "원과 접선의 방정식(2)",
  "원의 방정식 단원 마무리",
  "평행이동",
  "대칭이동(1)",
  "대칭이동(2)",
  "도형의 이동 단원 마무리, 수능에 나오는 8가지 대칭",
  "집합의 뜻과 표시법",
  "부분집합의 개수",
  "합집합과 교집합",
  "집합의 연산법칙",
  "원소의 개수",
  "집합 단원 마무리",
  "명제의 뜻과 조건의 뜻",
  "명제 p→q",
  "역과 대우",
  "필요조건과 충분조건",
  "여러 가지 증명법, 절대부등식",
  "산술평균과 기하평균",
  "명제 단원 마무리",
  "함수의 뜻과 그래프",
  "함수의 4가지 종류",
  "함수의 개수, 합성함수의 뜻",
  "합성함수의 성질, 역함수의 뜻",
  "역함수의 성질",
  "역함수의 그래프",
  "함수 단원 마무리(1)",
  "함수 단원 마무리(2)",
  "함수 단원 마무리(3)",
  "유리식, 분수함수의 기본형",
  "분수함수의 그래프",
  "분수함수의 역함수",
  "무리함수의 기본형과 그래프",
  "무리함수의 역함수",
  "유리함수와 무리함수 단원 마무리(1)",
  "유리함수와 무리함수 단원 마무리(2)"
];

const STUDY_PLAN = [
  {
    day: 1, subject: "수학", unit: "도형의 방정식", topic: "평면좌표 기본: 거리·내분점·무게중심",
    lecture: "정승제 01~03강", lectureRange: [1, 3], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, secondaryUrl: EBSI_MATH_SAMPLE_URL,
    difficulty: "쉬움", minutes: 85,
    mission: "01~03강을 듣고 공식마다 예제 2문항을 직접 풀기. 좌표의 순서와 내분비 방향을 소리 내어 확인한다.",
    output: "거리·내분점·무게중심 공식 3개 + 대표 예제 2문항 + 실수 포인트 1개"
  },
  {
    day: 2, subject: "수학", unit: "도형의 방정식", topic: "평면좌표 마무리와 직선의 방정식 시작",
    lecture: "정승제 04~06강", lectureRange: [4, 6], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 90,
    mission: "평면좌표 단원 마무리 문제를 풀고, 한 점·기울기·두 점 조건으로 직선식을 만드는 과정을 비교한다.",
    output: "직선의 방정식 만드는 3가지 순서도 + 평행·수직 조건 비교표"
  },
  {
    day: 3, subject: "수학", unit: "도형의 방정식", topic: "수직이등분선·점과 직선 사이 거리",
    lecture: "정승제 07~09강", lectureRange: [7, 9], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 90,
    mission: "수직이등분선의 두 풀이법을 비교하고 점과 직선 사이 거리 문제 6문항을 푼 뒤 단원 마무리를 확인한다.",
    output: "수직이등분선 풀이 1개 + 거리 공식 적용 예제 2개 + 오답 1개"
  },
  {
    day: 4, subject: "수학", unit: "도형의 방정식", topic: "원의 방정식·원과 직선의 위치 관계",
    lecture: "정승제 10~11강", lectureRange: [10, 11], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 75,
    mission: "원의 표준형과 일반형을 서로 바꾸고, 중심·반지름 찾기와 원-직선의 위치 관계 판단을 연습한다.",
    output: "원 식 변형 예제 2개 + 위치 관계 판단 기준 3가지"
  },
  {
    day: 5, subject: "수학", unit: "도형의 방정식", topic: "원의 접선과 단원 마무리",
    lecture: "정승제 12~14강", lectureRange: [12, 14], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "어려움", minutes: 95,
    mission: "접선 조건을 거리 공식과 판별식으로 각각 표현해 보고, 같은 문제를 두 방법으로 한 번씩 해결한다.",
    output: "접선 문제 두 풀이법 비교 + 틀린 이유와 다음 판단 기준"
  },
  {
    day: 6, subject: "수학", unit: "도형의 방정식", topic: "평행이동·대칭이동",
    lecture: "정승제 15~18강", lectureRange: [15, 18], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 105,
    mission: "점의 이동과 도형의 이동을 구분하고 x축·y축·원점·직선 대칭을 식으로 바꾸는 연습을 한다.",
    output: "이동 규칙표 + 대칭 4종 그림 + 자주 틀리는 부호 1개"
  },
  {
    day: 7, subject: "수학", unit: "집합과 명제", topic: "집합의 뜻·표시·부분집합",
    lecture: "정승제 19~20강", lectureRange: [19, 20], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "쉬움", minutes: 70,
    mission: "원소나열법·조건제시법을 서로 바꾸고, 부분집합의 개수 공식을 실제 집합에 적용한다.",
    output: "집합 기호 정리표 + 표현 변환 예제 3개 + 부분집합 개수 예제"
  },
  {
    day: 8, subject: "수학", unit: "집합과 명제", topic: "집합의 연산·원소의 개수",
    lecture: "정승제 21~24강", lectureRange: [21, 24], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 105,
    mission: "합집합·교집합·여집합을 벤다이어그램으로 그리고, 원소의 개수 문제를 식과 그림 두 방식으로 풀어본다.",
    output: "벤다이어그램 2개 + 집합 연산법칙 5개 + 원소 수 문제 1개"
  },
  {
    day: 9, subject: "수학", unit: "집합과 명제", topic: "명제와 조건·p→q",
    lecture: "정승제 25~26강", lectureRange: [25, 26], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 75,
    mission: "명제와 조건을 구분하고 ‘모든/어떤’ 문장에서 참·거짓을 판단한 뒤 반례를 직접 만든다.",
    output: "명제/조건 비교표 + 참·거짓 예시 2개 + 반례 2개"
  },
  {
    day: 10, subject: "수학", unit: "집합과 명제", topic: "역·대우·필요조건과 충분조건",
    lecture: "정승제 27~28강", lectureRange: [27, 28], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "어려움", minutes: 80,
    mission: "조건 사이의 화살표 방향을 그림으로 표현하고, 원명제·역·대우의 참거짓을 구분한다.",
    output: "원명제/역/대우 표 + 충분·필요조건 화살표 그림 + 헷갈린 문제 1개"
  },
  {
    day: 11, subject: "수학", unit: "집합과 명제", topic: "증명법·절대부등식·산술기하평균",
    lecture: "정승제 29~31강", lectureRange: [29, 31], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "어려움", minutes: 100,
    mission: "증명문을 암기하지 말고 가정→변형→결론의 구조로 요약한다. 산술·기하평균의 등호 조건까지 확인한다.",
    output: "증명 흐름 3단계 + 절대부등식 예제 + 산술기하평균 등호 조건"
  },
  {
    day: 12, subject: "수학", unit: "함수와 그래프", topic: "함수·그래프·함수의 종류·합성함수",
    lecture: "정승제 32~34강", lectureRange: [32, 34], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 95,
    mission: "정의역·공역·치역을 구분하고 함수인 그래프를 판별한다. 합성 순서를 화살표로 표시한다.",
    output: "함수 용어 4개 + 그래프 판별 기준 + 합성함수 순서도"
  },
  {
    day: 13, subject: "수학", unit: "함수와 그래프", topic: "합성함수의 성질·역함수",
    lecture: "정승제 35~37강", lectureRange: [35, 37], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "보통", minutes: 90,
    mission: "역함수 존재 조건과 성질을 정리하고 y=x 대칭으로 원함수와 역함수의 그래프를 함께 그린다.",
    output: "역함수 조건 3개 + y=x 대칭 그래프 + 합성 관계 식 2개"
  },
  {
    day: 14, subject: "수학", unit: "함수와 그래프", topic: "함수 단원 마무리·유리함수 시작",
    lecture: "정승제 38~42강", lectureRange: [38, 42], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, difficulty: "어려움", minutes: 115,
    mission: "함수 단원 마무리 문제 중 틀린 유형만 다시 풀고, 유리함수 기본형·점근선·그래프 이동을 정리한다.",
    output: "함수 오답 BEST 2 + 유리함수 기본형/점근선/이동 그래프"
  },
  {
    day: 15, subject: "수학", unit: "함수와 그래프", topic: "유리함수·무리함수와 수학 총정리",
    lecture: "정승제 43~47강", lectureRange: [43, 47], provider: "EBSi 정승제",
    primaryUrl: EBSI_MATH_COURSE_URL, secondaryUrl: EBSI_MATH_BOOK_URL,
    difficulty: "어려움", minutes: 120,
    mission: "유리함수·무리함수와 역함수의 그래프를 스케치하고 15일 동안의 오답을 도형/집합/함수로 분류한다.",
    output: "유리·무리함수 그래프 2개 + 수학 오답 BEST 3 + 재학습 단원"
  },
  {
    day: 16, subject: "과학", unit: "변화와 다양성", topic: "지질 시대의 환경과 생물 변화",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=5WJYVYQnbms",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+지질+시대+환경+생물+변화",
    difficulty: "쉬움", minutes: 65,
    mission: "지질 시대별 환경·대표 생물·화석을 표로 정리하고 표준화석과 시상화석을 구분한다.",
    output: "지질 시대 3열 비교표 + 표준/시상화석 차이 + 암기 포인트 3개"
  },
  {
    day: 17, subject: "과학", unit: "변화와 다양성", topic: "변이·자연선택·생물의 진화",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=q0q2lRXI4ng",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+변이+자연선택+진화",
    difficulty: "보통", minutes: 65,
    mission: "변이→생존경쟁→자연선택→진화의 흐름을 한 사례와 연결하고 개체 변화와 집단 변화를 구분한다.",
    output: "자연선택 4단계 흐름도 + 사례 1개 + 자주 하는 오해 1개"
  },
  {
    day: 18, subject: "과학", unit: "변화와 다양성", topic: "생물다양성의 의미와 보전",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=LDvlTj4xu_8",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+생물다양성+보전",
    difficulty: "쉬움", minutes: 60,
    mission: "유전적·종·생태계 다양성을 사례로 구분하고 생물다양성 보전의 이유를 생태·경제 관점에서 정리한다.",
    output: "생물다양성 3종 비교표 + 감소 원인 + 보전 사례 1개"
  },
  {
    day: 19, subject: "과학", unit: "변화와 다양성", topic: "산화와 환원: 산소·전자 이동",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=0QzkNuPt_RU",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+산화+환원+전자+이동",
    difficulty: "보통", minutes: 75,
    mission: "산화·환원을 산소 이동과 전자 이동 관점으로 각각 판단하고 두 반응이 동시에 일어남을 확인한다.",
    output: "산화/환원 비교표 + 전자 이동 표시 반응 2개 + 헷갈린 기준"
  },
  {
    day: 20, subject: "과학", unit: "변화와 다양성", topic: "산·염기와 중화 반응",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=o3-iIHiltWk",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+산+염기+중화+반응",
    difficulty: "보통", minutes: 75,
    mission: "산과 염기의 성질·이온·지시약·pH를 한 표로 연결하고 중화반응의 입자 변화를 설명한다.",
    output: "산/염기 성질표 + 중화반응 입자 그림 + 실생활 예시 1개"
  },
  {
    day: 21, subject: "과학", unit: "변화와 다양성", topic: "물질 변화에서 에너지의 출입",
    lecture: "YouTube 주제 검색", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/results?search_query=통합과학2+물질+변화+에너지+출입+발열+흡열",
    difficulty: "보통", minutes: 65,
    mission: "발열·흡열 반응의 에너지 흐름과 반응 전후 에너지 차이를 그래프로 표현하고 생활 사례를 찾는다.",
    output: "에너지 출입 그래프 + 발열/흡열 비교 + 생활 예시 2개"
  },
  {
    day: 22, subject: "과학", unit: "환경과 에너지", topic: "생물과 환경: 생태계 구성요소·상호작용",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=Fov_Ms8SmJI",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+생물과+환경+생태계+구성요소",
    difficulty: "쉬움", minutes: 60,
    mission: "생산자·소비자·분해자와 비생물 환경 요소를 연결하고 개체군·군집·생태계를 구분한다.",
    output: "생태계 구성도 + 생물/비생물 상호작용 예시 3개"
  },
  {
    day: 23, subject: "과학", unit: "환경과 에너지", topic: "생태계 평형과 먹이 관계",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=srvUR6XPyNo",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+생태계+평형+먹이그물",
    difficulty: "보통", minutes: 70,
    mission: "먹이사슬·먹이그물·생태피라미드를 비교하고 한 개체군 변화가 생태계에 미치는 영향을 설명한다.",
    output: "먹이그물 그림 + 생태피라미드 + 평형 변화 시나리오"
  },
  {
    day: 24, subject: "과학", unit: "환경과 에너지", topic: "지구 환경 변화와 인간 생활",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=Wwok1ddrxM4",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+지구환경+변화+복사평형+엘니뇨",
    difficulty: "보통", minutes: 80,
    mission: "복사평형·온실효과·지구온난화·엘니뇨를 원인과 결과로 연결하고 자료 해석 문제를 3개 푼다.",
    output: "원인→과정→결과 흐름표 + 기후 자료 해석 1개"
  },
  {
    day: 25, subject: "과학", unit: "환경과 에너지", topic: "태양 에너지의 생성과 전환",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=nLmp5zeoLrg",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+태양에너지+핵융합+에너지+전환",
    difficulty: "보통", minutes: 70,
    mission: "태양 내부의 핵융합에서 지구의 다양한 에너지로 전환되는 흐름을 화살표로 나타낸다.",
    output: "태양에너지 전환 흐름도 + 핵융합 핵심용어 5개"
  },
  {
    day: 26, subject: "과학", unit: "환경과 에너지", topic: "발전과 에너지원·전기 에너지",
    lecture: "YouTube 주제 검색", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/results?search_query=통합과학2+발전과+에너지원+전기+에너지",
    difficulty: "보통", minutes: 75,
    mission: "화력·수력·원자력·풍력·태양광 발전을 에너지 전환, 장점, 한계 기준으로 비교한다.",
    output: "발전 방식 비교표 + 에너지 전환 화살표 + 선택 기준"
  },
  {
    day: 27, subject: "과학", unit: "환경과 에너지", topic: "에너지 효율과 신재생 에너지",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=A1_6I8p3WXE",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+에너지+효율+신재생+에너지",
    difficulty: "쉬움", minutes: 65,
    mission: "에너지 효율 계산식을 문제에 적용하고 신재생 에너지의 특징을 지역 조건과 연결한다.",
    output: "효율 공식/예제 + 신재생 에너지 4종 비교표"
  },
  {
    day: 28, subject: "과학", unit: "과학과 미래 사회", topic: "과학 기술의 활용: 감염병·AI·로봇",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=X5tyv7H3wzY",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+과학기술의+활용+감염병+AI+로봇",
    difficulty: "쉬움", minutes: 60,
    mission: "과학기술 사례 2개를 문제→원리→해결→한계의 구조로 정리한다.",
    output: "기술 활용 사례 2개 + 과학 원리 + 장점/한계"
  },
  {
    day: 29, subject: "과학", unit: "과학과 미래 사회", topic: "과학 기술의 발전과 쟁점·윤리",
    lecture: "YouTube 개념 영상", provider: "통합과학2",
    primaryUrl: "https://www.youtube.com/watch?v=QOW1YKhiuls",
    searchUrl: "https://www.youtube.com/results?search_query=통합과학2+과학기술+발전+쟁점+윤리",
    difficulty: "보통", minutes: 70,
    mission: "한 가지 과학기술 쟁점을 골라 찬성·반대 근거를 자료와 가치 판단으로 나누어 쓴다.",
    output: "쟁점 찬반표 + 과학적 사실/가치 판단 구분 + 내 의견 3줄"
  },
  {
    day: 30, subject: "통합", unit: "30일 총복습", topic: "공통수학2·통합과학2 오답/개념 포트폴리오",
    lecture: "수학 47강 복습 + 과학 취약 주제 재시청", provider: "최종 점검",
    primaryUrl: EBSI_MATH_COURSE_URL,
    secondaryUrl: "https://www.youtube.com/playlist?list=PLF4fUImrWlQO5snf8PGhVifcxkDGNin4n",
    difficulty: "보통", minutes: 120,
    mission: "30일 결과물을 한 번에 펼쳐 보고 수학 오답 3개, 과학 핵심개념 5개, 다음 7일 재학습 계획을 선정한다.",
    output: "A4 한 장 최종 포트폴리오: 수학 오답 3개 + 과학 개념 5개 + 다음 7일 계획"
  }
];

const RESOURCE_LINKS = [
  {
    type: "공식 강좌",
    title: "EBSi 정승제 | 매쓰 디렉터 공통수학2 (2022 개정)",
    description: "총 47강. 30일 플랜의 수학 Day 1~15는 이 강좌 번호에 맞춰 구성했습니다.",
    url: EBSI_MATH_COURSE_URL
  },
  {
    type: "공식 교재",
    title: "EBS 매쓰 디렉터 공통수학2 교재",
    description: "핵심 개념, 대표유형·유제, 단원 마무리 문제로 강의와 함께 활용할 수 있습니다.",
    url: EBSI_MATH_BOOK_URL
  },
  {
    type: "맛보기 영상",
    title: "정승제 공통수학2 첫 수업 | 두 점 사이의 거리",
    description: "EBSi 공식 YouTube에 공개된 첫 수업 영상입니다.",
    url: EBSI_MATH_SAMPLE_URL
  },
  {
    type: "과학 전체 복습",
    title: "통합과학2 전체 흐름 플레이리스트",
    description: "과학 Day 16~29 학습 후 취약 주제를 다시 찾는 용도로 사용합니다.",
    url: "https://www.youtube.com/playlist?list=PLF4fUImrWlQO5snf8PGhVifcxkDGNin4n"
  }
];
