import React, {useState} from 'react';

interface ComponentPreviewProps {
  children: React.ReactNode;
  code: string;
}

export function ComponentPreview({children, code}: ComponentPreviewProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="component-preview">
      <div className="component-preview__toolbar">
        <button
          className="component-preview__theme-toggle"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          type="button">
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
      <div className="component-preview__demo" data-theme={theme}>
        {children}
      </div>
      <div className="component-preview__code">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            background: 'var(--ifm-color-emphasis-100)',
          }}>
          <button
            onClick={() => setShowCode((s) => !s)}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: 'var(--ifm-color-primary)',
            }}>
            {showCode ? 'Hide code' : 'Show code'}
          </button>
          {showCode && (
            <button
              onClick={handleCopy}
              type="button"
              style={{
                background: 'none',
                border: '1px solid var(--ifm-color-emphasis-300)',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--ifm-font-color-base)',
              }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {showCode && (
          <pre style={{margin: 0, padding: '1rem', overflow: 'auto'}}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
