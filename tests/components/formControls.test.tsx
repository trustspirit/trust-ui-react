// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Checkbox } from '../../src/components/Checkbox';
import { Radio, RadioGroup } from '../../src/components/Radio';
import { Switch } from '../../src/components/Switch';
import { Slider } from '../../src/components/Slider';
import { Progress } from '../../src/components/Progress';
import { Avatar } from '../../src/components/Avatar';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Chip } from '../../src/components/Chip';
import { FileUpload } from '../../src/components/FileUpload';

afterEach(cleanup);

describe('Checkbox', () => {
  it('required 를 실제 input 에 전달한다', () => {
    render(<Checkbox label="약관 동의" required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('오류 메시지를 체크박스 설명으로 연결한다', () => {
    render(<Checkbox label="약관 동의" errorMessage="동의가 필요합니다" />);
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('동의가 필요합니다');
  });
});

describe('RadioGroup', () => {
  const Group = (props: Partial<React.ComponentProps<typeof RadioGroup>>) => (
    <RadioGroup name="plan" label="요금제" {...props}>
      <Radio value="basic" label="기본" />
      <Radio value="pro" label="프로" />
    </RadioGroup>
  );

  it('값 없이 시작해도 제어 컴포넌트 경고 없이 선택된다', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Group />);

    await userEvent.click(screen.getByRole('radio', { name: '프로' }));

    expect(screen.getByRole('radio', { name: '프로' })).toBeChecked();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('Radio 에 onChange 를 달아도 그룹의 선택이 바뀐다', async () => {
    const onRadioChange = vi.fn();
    const onGroupChange = vi.fn();
    render(
      <RadioGroup name="plan" label="요금제" onChange={onGroupChange}>
        <Radio value="basic" label="기본" onChange={onRadioChange} />
      </RadioGroup>,
    );

    await userEvent.click(screen.getByRole('radio', { name: '기본' }));

    expect(onGroupChange).toHaveBeenCalledWith('basic');
    expect(onRadioChange).toHaveBeenCalledTimes(1);
  });

  it('오류 메시지를 그룹 설명으로 연결한다', () => {
    render(<Group errorMessage="요금제를 고르세요" />);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('요금제를 고르세요');
  });

  it('Radio 의 required 를 실제 input 에 전달한다', () => {
    render(<Radio value="a" label="가" required />);
    expect(screen.getByRole('radio')).toBeRequired();
  });
});

describe('Switch', () => {
  it('보이는 label 없이도 aria-label 로 이름을 붙일 수 있다', () => {
    render(<Switch aria-label="알림 받기" />);
    expect(screen.getByRole('switch', { name: '알림 받기' })).toBeInTheDocument();
  });

  it('오류 메시지를 스위치 설명으로 연결한다', () => {
    render(<Switch label="알림" errorMessage="저장하지 못했습니다" />);
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('저장하지 못했습니다');
  });
});

describe('Slider / Progress', () => {
  it('Slider 에 이름과 name 을 줄 수 있다', () => {
    render(<Slider aria-label="음량" name="volume" />);
    const slider = screen.getByRole('slider', { name: '음량' });
    expect(slider).toHaveAttribute('name', 'volume');
  });

  it('Progress 에 이름을 줄 수 있다', () => {
    render(<Progress aria-label="업로드 진행률" value={40} />);
    expect(screen.getByRole('progressbar', { name: '업로드 진행률' })).toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('이미지 로드에 실패했더라도 src 가 바뀌면 다시 시도한다', () => {
    const { container, rerender } = render(<Avatar src="/broken.png" name="김 하늘" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar src="/ok.png" name="김 하늘" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/ok.png');
  });

  it('상태를 접근 가능한 이름에 포함한다', () => {
    render(<Avatar name="김 하늘" status="online" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/김 하늘.*online/);
  });
});

describe('SegmentedControl', () => {
  function Sample() {
    const [value, setValue] = useState('day');
    return (
      <SegmentedControl
        aria-label="기간"
        value={value}
        onChange={setValue}
        options={[
          { value: 'day', label: '일' },
          { value: 'week', label: '주' },
          { value: 'month', label: '월', disabled: true },
          { value: 'year', label: '년' },
        ]}
      />
    );
  }

  it('라디오 그룹으로 노출된다 — 탭 패널이 없는 선택 컨트롤이다', () => {
    render(<Sample />);
    expect(screen.getByRole('radiogroup', { name: '기간' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '일' })).toBeChecked();
  });

  it('Tab 으로는 선택된 세그먼트에만 닿고, 화살표로 옮기며 비활성은 건너뛴다', async () => {
    const user = userEvent.setup();
    render(<Sample />);

    await user.tab();
    expect(screen.getByRole('radio', { name: '일' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '주' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '주' })).toHaveFocus();

    await user.keyboard('{ArrowRight}'); // '월' 은 비활성
    expect(screen.getByRole('radio', { name: '년' })).toBeChecked();

    await user.keyboard('{ArrowRight}'); // 끝에서 처음으로
    expect(screen.getByRole('radio', { name: '일' })).toBeChecked();
  });
});

describe('Chip', () => {
  it('삭제 버튼에서 Enter 를 누르면 칩의 onClick 이 아니라 onDelete 가 실행된다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<Chip onClick={onClick} onDelete={onDelete}>서울</Chip>);

    screen.getByRole('button', { name: 'Remove' }).focus();
    await user.keyboard('{Enter}');

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('FileUpload', () => {
  it('multiple 이 false 면 여러 개를 드롭해도 하나만 받는다', () => {
    const onFilesChange = vi.fn();
    const { container } = render(<FileUpload multiple={false} onFilesChange={onFilesChange} />);
    const files = ['a.txt', 'b.txt', 'c.txt'].map((n) => new File(['x'], n, { type: 'text/plain' }));
    const dropzone = container.querySelector('[class*="dropzone"]')!;

    fireEvent.drop(dropzone, { dataTransfer: { files } });

    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(onFilesChange.mock.calls[0][0]).toHaveLength(1);
  });
});
