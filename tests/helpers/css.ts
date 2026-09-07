/**
 * CSS 텍스트에서 특정 셀렉터 블록의 커스텀 프로퍼티를 뽑는다.
 * 렌더링이 아니라 소스 계약을 검증하기 위한 도구다.
 */
export function parseCustomProperties(css: string, selector: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map<string, string>();

  /** 셀렉터는 줄바꿈으로 나뉘어 쓰이므로 공백을 눌러 비교한다. */
  const normalize = (s: string) => s.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
  const target = normalize(selector);

  // 양쪽 그룹에서 중괄호를 배제해 가장 안쪽 블록만 잡는다.
  // 덕분에 @media 로 감싼 블록도 셀렉터로 찾을 수 있다.
  for (const block of stripped.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (normalize(block[1]) !== target) continue;
    for (const line of block[2].split(';')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim();
      if (!name.startsWith('--')) continue;
      out.set(name, line.slice(idx + 1).trim());
    }
  }
  return out;
}
