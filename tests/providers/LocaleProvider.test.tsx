// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider } from '../../src/providers/LocaleProvider';
import { Dialog } from '../../src/components/Dialog';
import { Select } from '../../src/components/Select';
import { Pagination } from '../../src/components/Pagination';
import { Chip } from '../../src/components/Chip';
import { TextField } from '../../src/components/TextField';
import { Toast } from '../../src/components/Toast/Toast';
import { DatePicker } from '../../src/components/DatePicker';
import { installDialogPolyfill } from '../helpers/dialog';

beforeAll(installDialogPolyfill);
afterEach(cleanup);

const dialog = (
  <Dialog open onClose={() => {}}>
    <Dialog.Title>제목</Dialog.Title>
  </Dialog>
);

describe('LocaleProvider', () => {
  it('프로바이더가 없으면 2.0 의 문자열을 그대로 쓴다', () => {
    render(dialog);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('locale="ko" 면 컴포넌트가 내놓는 문자열이 한국어가 된다', async () => {
    render(
      <LocaleProvider locale="ko">
        {dialog}
        <Select aria-label="은행" options={[]} />
        <Pagination totalPages={5} currentPage={2} onChange={() => {}} />
        <Chip onDelete={() => {}}>서울</Chip>
        <TextField label="비밀번호" type="password" />
        <Toast id="t" variant="info" message="저장됨" duration={0} />
        <DatePicker label="날짜" locale="ko-KR" defaultOpen />
      </LocaleProvider>,
    );

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '페이지 이동' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3페이지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 표시' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '알림 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '날짜 선택' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: '달력' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: '은행' }));
    expect(screen.getByText('결과가 없습니다')).toBeInTheDocument();
  });

  it('messages 로 일부만 덮어쓰면 나머지는 유지된다', () => {
    render(
      <LocaleProvider locale="en" messages={{ pagination: { nextPage: 'Forward' } }}>
        <Pagination totalPages={5} currentPage={2} onChange={() => {}} />
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
  });

  it('안쪽 프로바이더가 locale 을 생략하면 바깥의 문자열을 이어받는다', () => {
    render(
      <LocaleProvider locale="ko">
        <LocaleProvider messages={{ dialog: { close: '창 닫기' } }}>
          {dialog}
          <Chip onDelete={() => {}}>서울</Chip>
        </LocaleProvider>
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: '창 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
