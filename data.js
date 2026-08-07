const APP_VERSION = 8;

const DEFAULT_START_DATE = "2026-08-07";

const DEFAULT_SCHOOL_START_DATE = "2026-08-12";

const DEFAULT_REVIEW_INTERVALS = [1, 3, 7, 14, 30];

const MATH_COURSE_URL = "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005";

const SCIENCE_COURSE_URL = "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701";

const MATH_BOOK_URL = "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005678";

const SCIENCE_BOOK_URL = "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005883";

const LANGUAGE_TASKS = [
  {
    "key": "englishPassage",
    "subject": "영어",
    "title": "영어 독해 지문 1개",
    "shortTitle": "영어 1지문",
    "role": "독해·어휘 감각 유지",
    "minutesKey": "englishReading",
    "defaultMinutes": 25,
    "detail": "지문 1개 풀기 → 근거 문장 표시 → 모르는 단어 5개 → 해석이 막힌 문장 1개 다시 해석",
    "logPlaceholder": "지문 번호·틀린 문제·막힌 문장"
  },
  {
    "key": "mae3biPassage",
    "subject": "국어",
    "title": "매3비 비문학 지문 1개",
    "shortTitle": "매3비 1지문",
    "role": "비문학 독해 루틴",
    "minutesKey": "koreanReading",
    "defaultMinutes": 25,
    "detail": "지문 1개 풀기 → 문단별 핵심어 표시 → 선지 근거 줄긋기 → 헷갈린 선지 한 줄 정리",
    "logPlaceholder": "지문 번호·틀린 선지·근거 문장"
  }
];

const MOCK_EXAMS = [
  {
    "date": "2026-09-02",
    "title": "9월 모의고사",
    "weekday": "수요일",
    "description": "전날은 새 진도보다 오답·어휘·비문학 감각 점검 위주로 가볍게 마무리합니다."
  }
];


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

const SCIENCE_LECTURES = [
  "지질시대(1)",
  "지질시대(2)",
  "변이와 자연선택(1)",
  "변이와 자연선택(2)",
  "생물다양성(1)",
  "생물다양성(2)",
  "산소의 이동과 산화 환원 반응(1)",
  "산소의 이동과 산화 환원 반응(2)",
  "전자의 이동과 산화 환원 반응(1)",
  "전자의 이동과 산화 환원 반응(2)",
  "산과 염기(1)",
  "산과 염기(2)",
  "중화 반응(1)",
  "중화 반응(2)",
  "중화 반응(3)",
  "물질 변화에서 에너지 출입(1)",
  "물질 변화에서 에너지 출입(2)",
  "Ⅰ. 변화와 다양성 스피드 개념 정리",
  "Ⅰ. 변화와 다양성 다지선다",
  "생물과 환경(1)",
  "생물과 환경(2)",
  "생태계 평형(1)",
  "생태계 평형(2)",
  "지구 온난화와 사막화(1)",
  "지구 온난화와 사막화(2)",
  "엘니뇨(1)",
  "엘니뇨(2)",
  "엘니뇨(3)",
  "태양 에너지의 생산과 전환(1)",
  "태양 에너지의 생산과 전환(2)",
  "전기 에너지의 생산(1)",
  "전기 에너지의 생산(2)",
  "에너지 효율과 신재생 에너지(1)",
  "에너지 효율과 신재생 에너지(2)",
  "Ⅱ. 환경과 에너지 스피드 개념 정리",
  "Ⅱ. 환경과 에너지 다지선다",
  "과학 기술의 활용",
  "과학 기술의 발전과 쟁점",
  "Ⅲ. 과학과 미래 사회 스피드 개념 정리, 다지선다",
  "2028학년도 수능 예시문항"
];

const STUDY_PLAN = [
  {
    "day": 1,
    "designPhase": "방학 집중",
    "math": {
      "unit": "Ⅰ 도형의 방정식",
      "focus": "평면좌표 완성·직선의 방정식 시작",
      "lectureRange": [
        1,
        5
      ],
      "lectureTitles": [
        "두 점 사이의 거리",
        "내분점과 중점",
        "삼각형의 무게중심",
        "평면좌표 단원 마무리",
        "직선의 방정식 만드는 방법"
      ],
      "lectureMinutes": 250,
      "conceptTask": "Ⅰ-1 평면좌표 전 범위 + Ⅰ-2 직선의 방정식 도입: 개념·필수예제·확인문제",
      "conceptMinutes": 45,
      "practiceTask": "평면좌표 기본 유형 20문항 + 직선의 방정식 입문 5문항",
      "practiceMinutes": 50,
      "reviewMinutes": 15,
      "totalMinutes": 360,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "지질시대·변이와 자연선택 도입",
      "lectureRange": [
        1,
        3
      ],
      "lectureTitles": [
        "지질시대(1)",
        "지질시대(2)",
        "변이와 자연선택(1)"
      ],
      "lectureMinutes": 135,
      "o2Task": "Ⅰ-1 지구 환경 변화·진화와 생물다양성: 개념·탐구 자료 + 기본 12문항",
      "o2Minutes": 45,
      "wanjaTask": "지질시대·변이 기출픽 10문항",
      "wanjaMinutes": 45,
      "reviewMinutes": 15,
      "totalMinutes": 240,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘평면좌표 완성·직선의 방정식 시작’ 핵심 판단 2개 + 과학 ‘지질시대·변이와 자연선택 도입’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 2,
    "designPhase": "방학 집중",
    "math": {
      "unit": "Ⅰ 도형의 방정식",
      "focus": "직선의 방정식 완성·원의 방정식 시작",
      "lectureRange": [
        6,
        10
      ],
      "lectureTitles": [
        "두 직선의 평행과 수직",
        "수직이등분선의 방정식",
        "점과 직선 사이의 거리",
        "직선의 방정식 단원 마무리",
        "원의 방정식"
      ],
      "lectureMinutes": 250,
      "conceptTask": "Ⅰ-2 직선의 방정식 전 범위 + Ⅰ-3 원의 방정식 도입: 개념·필수예제",
      "conceptMinutes": 45,
      "practiceTask": "직선의 방정식 기본·중간 유형 25문항 + 원 기본 5문항",
      "practiceMinutes": 50,
      "reviewMinutes": 15,
      "totalMinutes": 360,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "자연선택·생물다양성",
      "lectureRange": [
        4,
        6
      ],
      "lectureTitles": [
        "변이와 자연선택(2)",
        "생물다양성(1)",
        "생물다양성(2)"
      ],
      "lectureMinutes": 135,
      "o2Task": "Ⅰ-1 자연선택·생물다양성: 개념·탐구 자료 + 기본 12문항",
      "o2Minutes": 45,
      "wanjaTask": "자연선택·생물다양성 기출픽 10문항",
      "wanjaMinutes": 45,
      "reviewMinutes": 15,
      "totalMinutes": 240,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘직선의 방정식 완성·원의 방정식 시작’ 핵심 판단 2개 + 과학 ‘자연선택·생물다양성’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 3,
    "designPhase": "방학 집중",
    "math": {
      "unit": "Ⅰ 도형의 방정식",
      "focus": "원과 직선·접선·평행이동",
      "lectureRange": [
        11,
        15
      ],
      "lectureTitles": [
        "원과 직선의 위치 관계",
        "원과 접선의 방정식(1)",
        "원과 접선의 방정식(2)",
        "원의 방정식 단원 마무리",
        "평행이동"
      ],
      "lectureMinutes": 250,
      "conceptTask": "Ⅰ-3 원의 방정식 전 범위 + Ⅰ-4 평행이동: 개념·필수예제·단원 확인",
      "conceptMinutes": 45,
      "practiceTask": "원의 방정식·접선 유형 25문항 + 평행이동 5문항",
      "practiceMinutes": 50,
      "reviewMinutes": 15,
      "totalMinutes": 360,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "산소·전자 이동으로 보는 산화환원",
      "lectureRange": [
        7,
        9
      ],
      "lectureTitles": [
        "산소의 이동과 산화 환원 반응(1)",
        "산소의 이동과 산화 환원 반응(2)",
        "전자의 이동과 산화 환원 반응(1)"
      ],
      "lectureMinutes": 135,
      "o2Task": "Ⅰ-2 산화와 환원: 산소 이동·전자 이동 개념 + 기본 12문항",
      "o2Minutes": 45,
      "wanjaTask": "산화·환원 기출픽 10문항",
      "wanjaMinutes": 45,
      "reviewMinutes": 15,
      "totalMinutes": 240,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘원과 직선·접선·평행이동’ 핵심 판단 2개 + 과학 ‘산소·전자 이동으로 보는 산화환원’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 4,
    "designPhase": "방학 집중",
    "math": {
      "unit": "Ⅰ 도형의 방정식 · Ⅱ 집합과 명제",
      "focus": "대칭이동·도형의 이동·집합 시작",
      "lectureRange": [
        16,
        20
      ],
      "lectureTitles": [
        "대칭이동(1)",
        "대칭이동(2)",
        "도형의 이동 단원 마무리, 수능에 나오는 8가지 대칭",
        "집합의 뜻과 표시법",
        "부분집합의 개수"
      ],
      "lectureMinutes": 250,
      "conceptTask": "Ⅰ-4 도형의 이동 전 범위 + Ⅱ-1 집합의 뜻과 포함 관계: 개념·필수예제",
      "conceptMinutes": 45,
      "practiceTask": "도형의 이동 15문항 + 집합의 뜻·부분집합 15문항",
      "practiceMinutes": 50,
      "reviewMinutes": 15,
      "totalMinutes": 360,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "전자 이동·산과 염기",
      "lectureRange": [
        10,
        12
      ],
      "lectureTitles": [
        "전자의 이동과 산화 환원 반응(2)",
        "산과 염기(1)",
        "산과 염기(2)"
      ],
      "lectureMinutes": 135,
      "o2Task": "Ⅰ-2 산화와 환원·산과 염기: 개념·탐구 자료 + 기본 12문항",
      "o2Minutes": 45,
      "wanjaTask": "전자 이동·산과 염기 기출픽 10문항",
      "wanjaMinutes": 45,
      "reviewMinutes": 15,
      "totalMinutes": 240,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘대칭이동·도형의 이동·집합 시작’ 핵심 판단 2개 + 과학 ‘전자 이동·산과 염기’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 5,
    "designPhase": "방학 집중",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "집합의 연산·원소 수·명제 시작",
      "lectureRange": [
        21,
        25
      ],
      "lectureTitles": [
        "합집합과 교집합",
        "집합의 연산법칙",
        "원소의 개수",
        "집합 단원 마무리",
        "명제의 뜻과 조건의 뜻"
      ],
      "lectureMinutes": 250,
      "conceptTask": "Ⅱ-2 집합의 연산 전 범위 + Ⅱ-3 명제 도입: 개념·필수예제",
      "conceptMinutes": 45,
      "practiceTask": "집합 연산·원소 수 20문항 + 명제 기초 10문항",
      "practiceMinutes": 50,
      "reviewMinutes": 15,
      "totalMinutes": 360,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "중화 반응 집중",
      "lectureRange": [
        13,
        15
      ],
      "lectureTitles": [
        "중화 반응(1)",
        "중화 반응(2)",
        "중화 반응(3)"
      ],
      "lectureMinutes": 135,
      "o2Task": "Ⅰ-2 산·염기와 중화 반응: 입자 그림·그래프 + 기본 15문항",
      "o2Minutes": 45,
      "wanjaTask": "중화 반응 기출픽 12문항",
      "wanjaMinutes": 45,
      "reviewMinutes": 15,
      "totalMinutes": 240,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘집합의 연산·원소 수·명제 시작’ 핵심 판단 2개 + 과학 ‘중화 반응 집중’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 6,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "명제 p→q의 뜻과 참·거짓",
      "lectureRange": [
        26,
        26
      ],
      "lectureTitles": [
        "명제 p→q"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ-3 명제: 명제와 조건, p→q의 참·거짓 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "명제 p→q 기본 유형 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "물질 변화와 에너지 출입 1",
      "lectureRange": [
        16,
        16
      ],
      "lectureTitles": [
        "물질 변화에서 에너지 출입(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅰ-2 물질 변화에서 에너지 출입: 개념 확인 4문항",
      "o2Minutes": 7,
      "wanjaTask": "에너지 출입 대표 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘명제 p→q의 뜻과 참·거짓’ 핵심 판단 2개 + 과학 ‘물질 변화와 에너지 출입 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 7,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "역과 대우",
      "lectureRange": [
        27,
        27
      ],
      "lectureTitles": [
        "역과 대우"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ-3 명제: 역·이·대우 개념과 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "역·대우 유형 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "물질 변화와 에너지 출입 2",
      "lectureRange": [
        17,
        17
      ],
      "lectureTitles": [
        "물질 변화에서 에너지 출입(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅰ-2 에너지 출입 그래프·생활 사례: 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "에너지 출입 그래프 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘역과 대우’ 핵심 판단 2개 + 과학 ‘물질 변화와 에너지 출입 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 8,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "필요조건과 충분조건",
      "lectureRange": [
        28,
        28
      ],
      "lectureTitles": [
        "필요조건과 충분조건"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ-3 명제: 필요조건·충분조건·필요충분조건 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "필요·충분조건 유형 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "변화와 다양성 핵심 정리",
      "lectureRange": [
        18,
        18
      ],
      "lectureTitles": [
        "Ⅰ. 변화와 다양성 스피드 개념 정리"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅰ 변화와 다양성 핵심 정리표 완성 + 단원 확인 5문항",
      "o2Minutes": 7,
      "wanjaTask": "변화와 다양성 취약 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘필요조건과 충분조건’ 핵심 판단 2개 + 과학 ‘변화와 다양성 핵심 정리’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 9,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "증명법과 절대부등식",
      "lectureRange": [
        29,
        29
      ],
      "lectureTitles": [
        "여러 가지 증명법, 절대부등식"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ-3 명제: 귀류법·대우를 이용한 증명·절대부등식 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "증명법·절대부등식 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅰ 변화와 다양성",
      "focus": "변화와 다양성 선택지 훈련",
      "lectureRange": [
        19,
        19
      ],
      "lectureTitles": [
        "Ⅰ. 변화와 다양성 다지선다"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅰ 변화와 다양성 단원평가 5문항",
      "o2Minutes": 7,
      "wanjaTask": "변화와 다양성 최고수준 5문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘증명법과 절대부등식’ 핵심 판단 2개 + 과학 ‘변화와 다양성 선택지 훈련’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 10,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "산술평균과 기하평균",
      "lectureRange": [
        30,
        30
      ],
      "lectureTitles": [
        "산술평균과 기하평균"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ-3 명제: 산술평균·기하평균과 등호 성립 조건 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "산술·기하평균 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "생물과 환경 1",
      "lectureRange": [
        20,
        20
      ],
      "lectureTitles": [
        "생물과 환경(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 생물과 환경: 생태계 구성 요소 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "생물과 환경 대표 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘산술평균과 기하평균’ 핵심 판단 2개 + 과학 ‘생물과 환경 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 11,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅱ 집합과 명제",
      "focus": "명제 단원 마무리",
      "lectureRange": [
        31,
        31
      ],
      "lectureTitles": [
        "명제 단원 마무리"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅱ 집합과 명제 대단원 마무리 중 틀린 유형 재풀이",
      "conceptMinutes": 35,
      "practiceTask": "집합과 명제 종합 15문항 + 오답 3문항 재풀이",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "생물과 환경 2",
      "lectureRange": [
        21,
        21
      ],
      "lectureTitles": [
        "생물과 환경(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 생물과 환경: 상호작용·개체군·군집 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "생물·환경 상호작용 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘명제 단원 마무리’ 핵심 판단 2개 + 과학 ‘생물과 환경 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 12,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수의 뜻과 그래프",
      "lectureRange": [
        32,
        32
      ],
      "lectureTitles": [
        "함수의 뜻과 그래프"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 정의역·공역·치역·그래프 개념과 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "함수의 뜻·그래프 기본 유형 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "생태계 평형 1",
      "lectureRange": [
        22,
        22
      ],
      "lectureTitles": [
        "생태계 평형(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 생태계 평형: 먹이 관계 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "생태계 평형 대표 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수의 뜻과 그래프’ 핵심 판단 2개 + 과학 ‘생태계 평형 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 13,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수의 네 가지 종류",
      "lectureRange": [
        33,
        33
      ],
      "lectureTitles": [
        "함수의 4가지 종류"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 일대일함수·일대일대응·항등함수·상수함수",
      "conceptMinutes": 35,
      "practiceTask": "함수의 종류 유형 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "생태계 평형 2",
      "lectureRange": [
        23,
        23
      ],
      "lectureTitles": [
        "생태계 평형(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 생태계 평형: 개체군 변화 자료 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "생태계 자료 해석 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수의 네 가지 종류’ 핵심 판단 2개 + 과학 ‘생태계 평형 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 14,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수의 개수·합성함수",
      "lectureRange": [
        34,
        34
      ],
      "lectureTitles": [
        "함수의 개수, 합성함수의 뜻"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 함수의 개수와 합성함수 도입 필수예제",
      "conceptMinutes": 35,
      "practiceTask": "함수의 개수·합성함수 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "지구 온난화와 사막화 1",
      "lectureRange": [
        24,
        24
      ],
      "lectureTitles": [
        "지구 온난화와 사막화(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 지구 환경 변화: 온난화·사막화 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "온난화·사막화 대표 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수의 개수·합성함수’ 핵심 판단 2개 + 과학 ‘지구 온난화와 사막화 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 15,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "합성함수의 성질·역함수의 뜻",
      "lectureRange": [
        35,
        35
      ],
      "lectureTitles": [
        "합성함수의 성질, 역함수의 뜻"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 합성함수의 성질과 역함수의 뜻",
      "conceptMinutes": 35,
      "practiceTask": "합성함수·역함수 도입 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "지구 온난화와 사막화 2",
      "lectureRange": [
        25,
        25
      ],
      "lectureTitles": [
        "지구 온난화와 사막화(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 온실효과·사막화 자료 해석 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "지구 환경 자료 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘합성함수의 성질·역함수의 뜻’ 핵심 판단 2개 + 과학 ‘지구 온난화와 사막화 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 16,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "역함수의 성질",
      "lectureRange": [
        36,
        36
      ],
      "lectureTitles": [
        "역함수의 성질"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 역함수의 존재 조건과 성질",
      "conceptMinutes": 35,
      "practiceTask": "역함수 성질 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "엘니뇨 1",
      "lectureRange": [
        26,
        26
      ],
      "lectureTitles": [
        "엘니뇨(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 엘니뇨: 발생 과정 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "엘니뇨 기본 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘역함수의 성질’ 핵심 판단 2개 + 과학 ‘엘니뇨 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 17,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "역함수의 그래프",
      "lectureRange": [
        37,
        37
      ],
      "lectureTitles": [
        "역함수의 그래프"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수: 역함수 그래프와 y=x 대칭",
      "conceptMinutes": 35,
      "practiceTask": "역함수 그래프 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "엘니뇨 2",
      "lectureRange": [
        27,
        27
      ],
      "lectureTitles": [
        "엘니뇨(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 엘니뇨: 해수면 온도·기압 자료 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "엘니뇨 자료 해석 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘역함수의 그래프’ 핵심 판단 2개 + 과학 ‘엘니뇨 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 18,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수 단원 마무리 1",
      "lectureRange": [
        38,
        38
      ],
      "lectureTitles": [
        "함수 단원 마무리(1)"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수 단원 마무리 1: 개념원리 핵심 예제 재풀이",
      "conceptMinutes": 35,
      "practiceTask": "함수 단원 종합 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "엘니뇨 3",
      "lectureRange": [
        28,
        28
      ],
      "lectureTitles": [
        "엘니뇨(3)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-1 엘니뇨: 종합 자료 해석 4문항",
      "o2Minutes": 7,
      "wanjaTask": "엘니뇨 고난도 자료 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수 단원 마무리 1’ 핵심 판단 2개 + 과학 ‘엘니뇨 3’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 19,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수 단원 마무리 2",
      "lectureRange": [
        39,
        39
      ],
      "lectureTitles": [
        "함수 단원 마무리(2)"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수 단원 마무리 2: 취약 유형 표시·재풀이",
      "conceptMinutes": 35,
      "practiceTask": "함수 단원 종합 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "태양 에너지의 생산과 전환 1",
      "lectureRange": [
        29,
        29
      ],
      "lectureTitles": [
        "태양 에너지의 생산과 전환(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 태양 에너지: 핵융합·에너지 전환 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "태양 에너지 대표 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수 단원 마무리 2’ 핵심 판단 2개 + 과학 ‘태양 에너지의 생산과 전환 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 20,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "함수 단원 마무리 3",
      "lectureRange": [
        40,
        40
      ],
      "lectureTitles": [
        "함수 단원 마무리(3)"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-1 함수 단원 마무리 3: 서술형 풀이 과정 점검",
      "conceptMinutes": 35,
      "practiceTask": "함수 서술형·고난도 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "태양 에너지의 생산과 전환 2",
      "lectureRange": [
        30,
        30
      ],
      "lectureTitles": [
        "태양 에너지의 생산과 전환(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 태양 에너지 전환 흐름 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "에너지 전환 자료 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수 단원 마무리 3’ 핵심 판단 2개 + 과학 ‘태양 에너지의 생산과 전환 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 21,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "유리식·분수함수 기본형",
      "lectureRange": [
        41,
        41
      ],
      "lectureTitles": [
        "유리식, 분수함수의 기본형"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-2 유리함수: 유리식·분수함수 기본형과 점근선",
      "conceptMinutes": 35,
      "practiceTask": "유리식·분수함수 기본 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "전기 에너지의 생산 1",
      "lectureRange": [
        31,
        31
      ],
      "lectureTitles": [
        "전기 에너지의 생산(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 전기 에너지 생산: 발전 원리 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "전기 에너지 생산 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘유리식·분수함수 기본형’ 핵심 판단 2개 + 과학 ‘전기 에너지의 생산 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 22,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "분수함수의 그래프",
      "lectureRange": [
        42,
        42
      ],
      "lectureTitles": [
        "분수함수의 그래프"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-2 유리함수: 그래프 평행이동과 위치 관계",
      "conceptMinutes": 35,
      "practiceTask": "분수함수 그래프 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "전기 에너지의 생산 2",
      "lectureRange": [
        32,
        32
      ],
      "lectureTitles": [
        "전기 에너지의 생산(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 발전 방식·에너지 전환 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "발전 방식 비교 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘분수함수의 그래프’ 핵심 판단 2개 + 과학 ‘전기 에너지의 생산 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 23,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "분수함수의 역함수",
      "lectureRange": [
        43,
        43
      ],
      "lectureTitles": [
        "분수함수의 역함수"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-2 유리함수: 역함수와 그래프 관계",
      "conceptMinutes": 35,
      "practiceTask": "분수함수 역함수 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "에너지 효율·신재생 에너지 1",
      "lectureRange": [
        33,
        33
      ],
      "lectureTitles": [
        "에너지 효율과 신재생 에너지(1)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 에너지 효율·신재생 에너지 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "에너지 효율 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘분수함수의 역함수’ 핵심 판단 2개 + 과학 ‘에너지 효율·신재생 에너지 1’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 24,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "무리함수 기본형과 그래프",
      "lectureRange": [
        44,
        44
      ],
      "lectureTitles": [
        "무리함수의 기본형과 그래프"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-3 무리함수: 기본형·정의역·치역·그래프",
      "conceptMinutes": 35,
      "practiceTask": "무리함수 기본·그래프 12문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "에너지 효율·신재생 에너지 2",
      "lectureRange": [
        34,
        34
      ],
      "lectureTitles": [
        "에너지 효율과 신재생 에너지(2)"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ-2 효율 계산·신재생 비교 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "신재생 에너지 자료 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘무리함수 기본형과 그래프’ 핵심 판단 2개 + 과학 ‘에너지 효율·신재생 에너지 2’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 25,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "무리함수의 역함수",
      "lectureRange": [
        45,
        45
      ],
      "lectureTitles": [
        "무리함수의 역함수"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ-3 무리함수: 역함수와 그래프 관계",
      "conceptMinutes": 35,
      "practiceTask": "무리함수 역함수 10문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "환경과 에너지 핵심 정리",
      "lectureRange": [
        35,
        35
      ],
      "lectureTitles": [
        "Ⅱ. 환경과 에너지 스피드 개념 정리"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ 환경과 에너지 핵심 정리표 + 단원 확인 5문항",
      "o2Minutes": 7,
      "wanjaTask": "환경과 에너지 취약 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘무리함수의 역함수’ 핵심 판단 2개 + 과학 ‘환경과 에너지 핵심 정리’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 26,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "유리·무리함수 마무리 1",
      "lectureRange": [
        46,
        46
      ],
      "lectureTitles": [
        "유리함수와 무리함수 단원 마무리(1)"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ 함수 대단원 마무리: 유리·무리함수 취약 예제",
      "conceptMinutes": 35,
      "practiceTask": "유리·무리함수 종합 15문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅱ 환경과 에너지",
      "focus": "환경과 에너지 선택지 훈련",
      "lectureRange": [
        36,
        36
      ],
      "lectureTitles": [
        "Ⅱ. 환경과 에너지 다지선다"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅱ 환경과 에너지 단원평가 5문항",
      "o2Minutes": 7,
      "wanjaTask": "환경과 에너지 최고수준 5문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘유리·무리함수 마무리 1’ 핵심 판단 2개 + 과학 ‘환경과 에너지 선택지 훈련’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 27,
    "designPhase": "개학 후 루틴",
    "math": {
      "unit": "Ⅲ 함수",
      "focus": "유리·무리함수 마무리 2",
      "lectureRange": [
        47,
        47
      ],
      "lectureTitles": [
        "유리함수와 무리함수 단원 마무리(2)"
      ],
      "lectureMinutes": 50,
      "conceptTask": "Ⅲ 함수 대단원 마무리: 종합·서술형 문제 재풀이",
      "conceptMinutes": 35,
      "practiceTask": "유리·무리함수 서술형·고난도 15문항",
      "practiceMinutes": 65,
      "reviewMinutes": 30,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅲ 과학과 미래 사회",
      "focus": "과학 기술의 활용",
      "lectureRange": [
        37,
        37
      ],
      "lectureTitles": [
        "과학 기술의 활용"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅲ-1 과학 기술의 활용: 사례·원리 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "과학 기술 활용 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘유리·무리함수 마무리 2’ 핵심 판단 2개 + 과학 ‘과학 기술의 활용’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 28,
    "designPhase": "최종 실전",
    "math": {
      "unit": "누적 실전",
      "focus": "도형의 방정식 누적 실전",
      "lectureRange": [],
      "lectureTitles": [],
      "lectureMinutes": 0,
      "conceptTask": "Ⅰ 도형의 방정식 대단원 마무리 전 범위 1회",
      "conceptMinutes": 45,
      "practiceTask": "도형의 방정식 실전 20문항 + 오답 5문항",
      "practiceMinutes": 95,
      "reviewMinutes": 40,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅲ 과학과 미래 사회",
      "focus": "과학 기술의 발전과 쟁점",
      "lectureRange": [
        38,
        38
      ],
      "lectureTitles": [
        "과학 기술의 발전과 쟁점"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅲ-1 과학 기술 발전과 쟁점: 자료·찬반 근거 기본 4문항",
      "o2Minutes": 7,
      "wanjaTask": "과학 기술 쟁점 기출 3문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘도형의 방정식 누적 실전’ 핵심 판단 2개 + 과학 ‘과학 기술의 발전과 쟁점’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 29,
    "designPhase": "최종 실전",
    "math": {
      "unit": "누적 실전",
      "focus": "집합과 명제 누적 실전",
      "lectureRange": [],
      "lectureTitles": [],
      "lectureMinutes": 0,
      "conceptTask": "Ⅱ 집합과 명제 대단원 마무리 전 범위 1회",
      "conceptMinutes": 45,
      "practiceTask": "집합과 명제 실전 20문항 + 오답 5문항",
      "practiceMinutes": 95,
      "reviewMinutes": 40,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅲ 과학과 미래 사회",
      "focus": "과학과 미래 사회 핵심 정리",
      "lectureRange": [
        39,
        39
      ],
      "lectureTitles": [
        "Ⅲ. 과학과 미래 사회 스피드 개념 정리, 다지선다"
      ],
      "lectureMinutes": 35,
      "o2Task": "Ⅲ 과학과 미래 사회 핵심 정리 + 단원 확인 5문항",
      "o2Minutes": 7,
      "wanjaTask": "과학과 미래 사회 종합 4문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘집합과 명제 누적 실전’ 핵심 판단 2개 + 과학 ‘과학과 미래 사회 핵심 정리’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  },
  {
    "day": 30,
    "designPhase": "최종 실전",
    "math": {
      "unit": "누적 실전",
      "focus": "함수·공통수학2 최종 실전",
      "lectureRange": [],
      "lectureTitles": [],
      "lectureMinutes": 0,
      "conceptTask": "Ⅲ 함수 대단원 마무리 + 공통수학2 전체 핵심 공식 점검",
      "conceptMinutes": 45,
      "practiceTask": "함수 실전 25문항 + 공통수학2 최종 오답 5문항",
      "practiceMinutes": 95,
      "reviewMinutes": 40,
      "totalMinutes": 180,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
    },
    "science": {
      "unit": "Ⅲ 과학과 미래 사회",
      "focus": "2028학년도 수능 예시문항",
      "lectureRange": [
        40,
        40
      ],
      "lectureTitles": [
        "2028학년도 수능 예시문항"
      ],
      "lectureMinutes": 35,
      "o2Task": "통합과학2 전 범위 실전 5문항",
      "o2Minutes": 7,
      "wanjaTask": "2028 예시문항 재풀이 + 유사 기출 4문항",
      "wanjaMinutes": 6,
      "reviewMinutes": 12,
      "totalMinutes": 60,
      "courseUrl": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
    },
    "outputPrompt": "수학 ‘함수·공통수학2 최종 실전’ 핵심 판단 2개 + 과학 ‘2028학년도 수능 예시문항’ 흐름 1개 + 오늘 오답 2개 + 다음 복습 질문 1개"
  }
];

const RESOURCE_LINKS = [
  {
    "type": "EBSi 공식 강좌",
    "title": "정승제 | 매쓰 디렉터 공통수학2 (2022 개정)",
    "description": "총 47강. Day 1~27에 전 강의를 배치하고 Day 28~30은 누적 실전으로 구성했습니다.",
    "url": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20240001005"
  },
  {
    "type": "EBSi 공식 강좌",
    "title": "김청해 | 2028 수능개념 시그널 통합과학2",
    "description": "OT를 제외한 01~40강을 30일 안에 배치했습니다.",
    "url": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtDtl.ebs?courseId=S20250000701"
  },
  {
    "type": "EBS 공식 교재",
    "title": "매쓰 디렉터 공통수학2 교재",
    "description": "정승제 강좌의 공식 교재 정보와 정오표를 확인할 수 있습니다.",
    "url": "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005678"
  },
  {
    "type": "EBS 공식 교재",
    "title": "2028 수능개념 시그널 통합과학2",
    "description": "김청해 강좌의 공식 강의노트 교재 정보입니다.",
    "url": "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005883"
  }
];

const TEXTBOOK_INFO = [
  {
    "key": "conceptMath",
    "subject": "수학",
    "title": "개념원리 공통수학2",
    "role": "개념·필수예제",
    "note": "강의 직후 해당 중단원의 개념과 필수예제를 풀고 실제 페이지를 기록하세요."
  },
  {
    "key": "maplMath",
    "subject": "수학",
    "title": "마플 시너지 공통수학2",
    "role": "유형·내신 문제",
    "note": "권장 문항 수를 기준으로 풀되, 오답은 복습 관리에 바로 등록하세요."
  },
  {
    "key": "o2Science",
    "subject": "과학",
    "title": "오투 통합과학2",
    "role": "개념·탐구·기본",
    "note": "강의와 같은 주제의 개념·탐구 자료를 확인하고 최소 기본 문제를 풉니다."
  },
  {
    "key": "wanjaScience",
    "subject": "과학",
    "title": "완자 기출픽 통합과학2",
    "role": "기출·자료 해석",
    "note": "대표 기출을 소량씩 풀고 선지 판단 근거를 백지로 설명합니다."
  },
  {
    "key": "englishPassage",
    "subject": "영어",
    "title": "영어 지문 매일 1개",
    "role": "독해·어휘 감각 유지",
    "note": "매일 한 지문씩 풀고 해석이 막힌 문장과 모르는 단어를 Day 상세에 기록합니다."
  },
  {
    "key": "mae3biPassage",
    "subject": "국어",
    "title": "매3비 비문학",
    "role": "비문학 지문 1개 루틴",
    "note": "문단별 핵심어와 선지 근거를 표시하고 틀린 선지는 오답 복습에 등록합니다."
  }
];
