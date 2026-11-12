// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Field } from '../../src/components/Field';

afterEach(cleanup);

describe('Field — 이름', () => {
  it('label 이 htmlFor 로 컨트롤의 이름이 된다', () => {
    render(<Field label="Bank">{(control) => <input {...control} />}</Field>);
    const input = screen.getByLabelText('Bank');
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByRole('textbox', { name: 'Bank' })).toBe(input);
  });

  it('id 를 넘기면 그 값을 컨트롤 id 로 쓴다', () => {
    render(
      <Field label="Bank" id="bank">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByLabelText('Bank')).toHaveAttribute('id', 'bank');
  });

  it('hideLabel 이어도 접근 가능한 이름은 남는다', () => {
    render(
      <Field label="Search" hideLabel>
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('required 표시(*)는 이름에 섞이지 않고 상태로 전달된다', () => {
    render(
      <Field label="Bank" required>
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Bank' });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('group 모드는 label 을 span 으로 그리고 aria-labelledby 로 잇는다', () => {
    render(
      <Field label="Plan" group required>
        {({ required: _native, disabled: _disabled, ...control }) => (
          <div role="radiogroup" {...control}>
            <input type="radio" name="plan" aria-label="Basic" />
          </div>
        )}
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const labelId = group.getAttribute('aria-labelledby')!;
    const label = document.getElementById(labelId)!;
    expect(label.tagName).toBe('SPAN');
    expect(document.querySelector('label')).toBeNull();
    expect(group).toHaveAttribute('aria-required', 'true');
  });
});

describe('Field — 설명과 오류', () => {
  it('도움말을 설명으로 잇는다', () => {
    render(
      <Field label="Bank" helperText="Where the money goes">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAccessibleDescription('Where the money goes');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('오류가 생기면 설명이 오류 메시지로 바뀌고 도움말은 사라진다', () => {
    const view = (errorMessage?: string) => (
      <Field label="Bank" helperText="Where the money goes" errorMessage={errorMessage}>
        {(control) => <input {...control} />}
      </Field>
    );
    const { rerender } = render(view());
    const input = screen.getByRole('textbox');

    rerender(view('Pick a bank'));
    expect(input).toHaveAccessibleDescription('Pick a bank');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Where the money goes')).toBeNull();

    rerender(view());
    expect(input).toHaveAccessibleDescription('Where the money goes');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('오류 영역은 처음부터 있는 polite 라이브 영역이다 — 나중에 뜬 메시지가 읽힌다', () => {
    const { rerender, container } = render(
      <Field label="Bank">{(control) => <input {...control} />}</Field>,
    );
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live).toBeEmptyDOMElement();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');

    rerender(
      <Field label="Bank" errorMessage="Pick a bank">
        {(control) => <input {...control} />}
      </Field>,
    );
    // 같은 요소에 내용이 채워져야 한다(새 요소로 바뀌면 읽히지 않는다).
    expect(container.querySelector('[aria-live="polite"]')).toBe(live);
    expect(live).toHaveTextContent('Pick a bank');
  });

  it('error 만 주면 메시지 없이 invalid 로 표시한다', () => {
    render(
      <Field label="Bank" error>
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disabled 를 컨트롤에 전달한다', () => {
    render(
      <Field label="Bank" disabled>
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
