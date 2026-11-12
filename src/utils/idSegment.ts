/**
 * 사용자가 준 value 를 DOM id 의 한 조각으로 쓸 수 있게 바꾼다.
 * id 에 공백이 있으면 aria-labelledby / aria-controls 가 여러 개의 id 로 쪼개 읽는다.
 * 서로 다른 value 가 같은 결과로 합쳐지지 않도록 문자 코드를 그대로 적는다.
 */
export function idSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, (ch) => `_${ch.codePointAt(0)!.toString(16)}`);
}
