import { Grade } from '../types';

export interface Subject {
  id: string;
  name: string;
  chapters: string[];
}

export interface CurriculumData {
  grade: Grade;
  subjects: Subject[];
}

export const curriculum: CurriculumData[] = [
  {
    grade: '중1',
    subjects: [
      {
        id: 'middle1-1',
        name: '수와 연산',
        chapters: ['소인수분해', '정수와 유리수', '유리수의 계산'],
      },
      {
        id: 'middle1-2',
        name: '문자와 식',
        chapters: ['문자의 사용과 식의 계산', '일차방정식'],
      },
      {
        id: 'middle1-3',
        name: '좌표평면과 그래프',
        chapters: ['좌표평면', '그래프와 비례 관계'],
      },
      {
        id: 'middle1-4',
        name: '기본 도형',
        chapters: ['기본 도형', '작도와 합동', '평면도형의 성질', '입체도형의 성질'],
      },
      {
        id: 'middle1-5',
        name: '통계',
        chapters: ['자료의 정리와 해석'],
      },
    ],
  },
  {
    grade: '중2',
    subjects: [
      {
        id: 'middle2-1',
        name: '유리수와 순환소수',
        chapters: ['유리수와 순환소수'],
      },
      {
        id: 'middle2-2',
        name: '식의 계산',
        chapters: ['단항식의 계산', '다항식의 계산'],
      },
      {
        id: 'middle2-3',
        name: '부등식과 연립방정식',
        chapters: ['일차부등식', '연립일차방정식'],
      },
      {
        id: 'middle2-4',
        name: '일차함수',
        chapters: ['일차함수와 그래프', '일차함수와 일차방정식의 관계'],
      },
      {
        id: 'middle2-5',
        name: '도형의 성질',
        chapters: ['삼각형의 성질', '사각형의 성질'],
      },
      {
        id: 'middle2-6',
        name: '도형의 닮음과 피타고라스 정리',
        chapters: ['도형의 닮음', '피타고라스 정리'],
      },
      {
        id: 'middle2-7',
        name: '확률',
        chapters: ['경우의 수', '확률'],
      },
    ],
  },
  {
    grade: '중3',
    subjects: [
      {
        id: 'middle3-1',
        name: '제곱근과 실수',
        chapters: ['제곱근과 실수', '근호를 포함한 식의 계산'],
      },
      {
        id: 'middle3-2',
        name: '다항식의 곱셈과 인수분해',
        chapters: ['다항식의 곱셈', '인수분해'],
      },
      {
        id: 'middle3-3',
        name: '이차방정식',
        chapters: ['이차방정식의 풀이', '이차방정식의 활용'],
      },
      {
        id: 'middle3-4',
        name: '이차함수',
        chapters: ['이차함수와 그래프', '이차함수의 활용'],
      },
      {
        id: 'middle3-5',
        name: '통계',
        chapters: ['대푯값과 산포도', '상관관계'],
      },
    ],
  },
  {
    grade: '고1',
    subjects: [
      {
        id: 'high1-1',
        name: '다항식',
        chapters: ['다항식의 연산', '나머지정리', '인수분해'],
      },
      {
        id: 'high1-2',
        name: '방정식과 부등식',
        chapters: ['복소수', '이차방정식', '이차함수와 이차방정식', '여러 가지 방정식', '여러 가지 부등식'],
      },
      {
        id: 'high1-3',
        name: '도형의 방정식',
        chapters: ['평면좌표', '직선의 방정식', '원의 방정식', '도형의 이동'],
      },
      {
        id: 'high1-4',
        name: '집합과 명제',
        chapters: ['집합', '명제'],
      },
      {
        id: 'high1-5',
        name: '함수',
        chapters: ['함수', '유리함수와 무리함수'],
      },
    ],
  },
  {
    grade: '고2',
    subjects: [
      {
        id: 'high2-math1-1',
        name: '수학I - 지수와 로그',
        chapters: ['지수', '로그'],
      },
      {
        id: 'high2-math1-2',
        name: '수학I - 지수함수와 로그함수',
        chapters: ['지수함수', '로그함수'],
      },
      {
        id: 'high2-math1-3',
        name: '수학I - 삼각함수',
        chapters: ['삼각함수', '삼각함수의 그래프', '사인법칙과 코사인법칙'],
      },
      {
        id: 'high2-math1-4',
        name: '수학I - 수열',
        chapters: ['등차수열과 등비수열', '수열의 합', '수학적 귀납법'],
      },
      {
        id: 'high2-math2-1',
        name: '수학II - 함수의 극한과 연속',
        chapters: ['함수의 극한', '함수의 연속'],
      },
      {
        id: 'high2-math2-2',
        name: '수학II - 미분',
        chapters: ['미분계수와 도함수', '도함수의 활용'],
      },
      {
        id: 'high2-math2-3',
        name: '수학II - 적분',
        chapters: ['부정적분', '정적분', '정적분의 활용'],
      },
    ],
  },
  {
    grade: '고3',
    subjects: [
      {
        id: 'high3-prob-1',
        name: '확률과 통계 - 경우의 수',
        chapters: ['순열과 조합', '이항정리'],
      },
      {
        id: 'high3-prob-2',
        name: '확률과 통계 - 확률',
        chapters: ['확률의 뜻과 활용', '조건부확률'],
      },
      {
        id: 'high3-prob-3',
        name: '확률과 통계 - 통계',
        chapters: ['확률분포', '통계적 추정'],
      },
      {
        id: 'high3-calc-1',
        name: '미적분 - 수열의 극한',
        chapters: ['수열의 극한', '급수'],
      },
      {
        id: 'high3-calc-2',
        name: '미적분 - 미분법',
        chapters: ['여러 가지 함수의 미분', '여러 가지 미분법', '도함수의 활용'],
      },
      {
        id: 'high3-calc-3',
        name: '미적분 - 적분법',
        chapters: ['여러 가지 적분법', '정적분의 활용'],
      },
      {
        id: 'high3-geo-1',
        name: '기하 - 이차곡선',
        chapters: ['이차곡선', '이차곡선과 직선'],
      },
      {
        id: 'high3-geo-2',
        name: '기하 - 평면벡터',
        chapters: ['벡터의 연산', '평면벡터의 성분과 내적'],
      },
      {
        id: 'high3-geo-3',
        name: '기하 - 공간도형과 공간좌표',
        chapters: ['공간도형', '공간좌표'],
      },
    ],
  },
];

export const getSubjectsByGrade = (grade: Grade): Subject[] => {
  const gradeData = curriculum.find((c) => c.grade === grade);
  return gradeData?.subjects || [];
};

export const getAllGrades = (): Grade[] => {
  return ['중1', '중2', '중3', '고1', '고2', '고3'];
};
