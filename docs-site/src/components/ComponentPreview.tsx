import React, {useEffect, useState} from 'react';
import CodeBlock from '@theme/CodeBlock';

type Theme = 'light' | 'dark';

/**
 * 사이트의 명암 모드. Docusaurus 는 <html data-theme> 에 적어 둔다.
 * @docusaurus/theme-common 의 useColorMode 를 쓰면 직접 의존성을 하나 더 들여야 하므로
 * 속성을 직접 지켜본다. 서버 렌더와 첫 클라이언트 렌더는 'light' 로 일치시킨다.
 */
function useSiteTheme(): Theme {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);
  return theme;
}

interface ComponentPreviewProps {
  children: React.ReactNode;
  code: string;
}

export function ComponentPreview({children, code}: ComponentPreviewProps) {
  // 사이트의 명암 모드를 따른다. 사용자가 이 프리뷰에서 직접 바꾼 뒤에는 그 선택을 유지한다.
  const siteTheme = useSiteTheme();
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? siteTheme;
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="component-preview">
      <div className="component-preview__toolbar">
        <button
          className="component-preview__button"
          onClick={() => setOverride(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Preview in ${theme === 'light' ? 'dark' : 'light'} theme`}
          type="button">
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
      <div className="component-preview__demo" data-theme={theme}>
        {children}
      </div>
      <div className="component-preview__code">
        <div className="component-preview__code-bar">
          <button
            className="component-preview__button component-preview__button--plain"
            onClick={() => setShowCode((s) => !s)}
            aria-expanded={showCode}
            type="button">
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        {/* CodeBlock 이 구문 강조와 복사 버튼을 함께 제공한다. */}
        {showCode && <CodeBlock language="tsx">{code}</CodeBlock>}
      </div>
    </div>
  );
}
