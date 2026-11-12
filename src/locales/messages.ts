/**
 * 컴포넌트가 스스로 내놓는 문자열(보조 기술용 이름, 빈 상태 문구, 버튼 라벨).
 * 호출자가 prop 으로 넘기는 문자열은 여기에 없다.
 */
export interface Messages {
  dialog: { close: string };
  toast: { close: string };
  chip: { remove: string };
  textField: { showPassword: string };
  select: {
    search: string;
    searchPlaceholder: string;
    noOptions: string;
    remove: (label: string) => string;
  };
  menu: { cancel: string };
  pagination: {
    label: string;
    previous: string;
    next: string;
    previousPage: string;
    nextPage: string;
    morePages: string;
    page: (page: number) => string;
  };
  datePicker: {
    label: string;
    calendar: string;
    selectDate: string;
    previous: string;
    next: string;
  };
  dateRangePicker: {
    label: string;
    previousMonth: string;
    nextMonth: string;
    startDate: string;
    endDate: string;
    selectStartDate: string;
    selectEndDate: string;
  };
  fileUpload: {
    label: string;
    remove: (fileName: string) => string;
    uploading: (fileName: string, percent: number) => string;
    typeNotAccepted: (type: string) => string;
    tooLarge: (fileName: string, maxSize: string) => string;
    tooMany: (maxFiles: number) => string;
  };
  table: {
    sort: string;
    sortBy: string;
    notSorted: string;
    ascending: string;
    descending: string;
    clearSort: string;
    close: string;
  };
}

/** 한 로케일의 일부만 덮어쓸 때 쓰는 형태. */
export type MessagesOverride = { [K in keyof Messages]?: Partial<Messages[K]> };

export const en: Messages = {
  dialog: { close: 'Close dialog' },
  toast: { close: 'Close notification' },
  chip: { remove: 'Remove' },
  textField: { showPassword: 'Show password' },
  select: {
    search: 'Search options',
    searchPlaceholder: 'Search...',
    noOptions: 'No options found',
    remove: (label) => `Remove ${label}`,
  },
  menu: { cancel: 'Cancel' },
  pagination: {
    label: 'pagination',
    previous: 'Previous',
    next: 'Next',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    morePages: 'more pages',
    page: (page) => `Page ${page}`,
  },
  datePicker: {
    label: 'Date picker',
    calendar: 'Calendar',
    selectDate: 'Select date',
    previous: 'Previous',
    next: 'Next',
  },
  dateRangePicker: {
    label: 'Date range picker',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    startDate: 'Start date',
    endDate: 'End date',
    selectStartDate: 'Select start date',
    selectEndDate: 'Select end date',
  },
  fileUpload: {
    label: 'Upload files',
    remove: (fileName) => `Remove ${fileName}`,
    uploading: (fileName, percent) => `Uploading ${fileName}: ${percent}%`,
    typeNotAccepted: (type) => `File type "${type}" is not accepted`,
    tooLarge: (fileName, maxSize) => `File "${fileName}" exceeds the maximum size of ${maxSize}`,
    tooMany: (maxFiles) => `Maximum of ${maxFiles} files allowed`,
  },
  table: {
    sort: 'Sort',
    sortBy: 'Sort by',
    notSorted: 'Not sorted',
    ascending: 'Ascending',
    descending: 'Descending',
    clearSort: 'Clear sort',
    close: 'Close',
  },
};

export const ko: Messages = {
  dialog: { close: '닫기' },
  toast: { close: '알림 닫기' },
  chip: { remove: '삭제' },
  textField: { showPassword: '비밀번호 표시' },
  select: {
    search: '옵션 검색',
    searchPlaceholder: '검색',
    noOptions: '결과가 없습니다',
    remove: (label) => `${label} 삭제`,
  },
  menu: { cancel: '취소' },
  pagination: {
    label: '페이지 이동',
    previous: '이전',
    next: '다음',
    previousPage: '이전 페이지',
    nextPage: '다음 페이지',
    morePages: '페이지 더 있음',
    page: (page) => `${page}페이지`,
  },
  datePicker: {
    label: '날짜 선택',
    calendar: '달력',
    selectDate: '날짜 선택',
    previous: '이전',
    next: '다음',
  },
  dateRangePicker: {
    label: '기간 선택',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    startDate: '시작일',
    endDate: '종료일',
    selectStartDate: '시작일을 선택하세요',
    selectEndDate: '종료일을 선택하세요',
  },
  fileUpload: {
    label: '파일 올리기',
    remove: (fileName) => `${fileName} 삭제`,
    uploading: (fileName, percent) => `${fileName} 올리는 중: ${percent}%`,
    typeNotAccepted: (type) => `"${type}" 형식의 파일은 올릴 수 없습니다`,
    tooLarge: (fileName, maxSize) => `"${fileName}" 파일이 최대 크기 ${maxSize}를 넘습니다`,
    tooMany: (maxFiles) => `파일은 최대 ${maxFiles}개까지 올릴 수 있습니다`,
  },
  table: {
    sort: '정렬',
    sortBy: '정렬 기준',
    notSorted: '정렬 안 함',
    ascending: '오름차순',
    descending: '내림차순',
    clearSort: '정렬 해제',
    close: '닫기',
  },
};

/**
 * LocaleProvider 없이 쓸 때의 문자열. 2.0 까지의 동작을 그대로 지킨다:
 * 대부분 영어지만 Table 의 모바일 정렬 UI 만 한국어였다. 로케일을 정하면
 * (`<LocaleProvider locale="ko">` 또는 "en") 전체가 한 언어로 맞춰진다.
 */
export const legacyDefault: Messages = { ...en, table: ko.table };

export const catalogs = { en, ko } as const;
export type Locale = keyof typeof catalogs;
