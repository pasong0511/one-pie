import { ChangeEvent, useMemo } from 'react';
import { formatAmountInput, parseAmountInput } from '../utils/format';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  value: number;
  onChange: (next: number) => void;
  // 음수 허용 여부 (기본 true). 예산 배정 등 음수가 말이 안 되는 필드에서 false.
  allowNegative?: boolean;
};

// 금액 입력 전용 컴포넌트.
// - 현재 로케일 기준 세자리 구분자 자동 삽입
// - 저장은 순수 number, 표시는 포맷된 문자열
// - 외국 로케일 확장은 utils/format.ts의 setCurrencyLocale로 일괄 전환
export default function NumericInput({
  value,
  onChange,
  allowNegative = true,
  placeholder,
  ...rest
}: Props) {
  const display = useMemo(
    () => (value === 0 ? '' : formatAmountInput(value)),
    [value],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') {
      onChange(0);
      return;
    }
    const parsed = parseAmountInput(raw);
    onChange(allowNegative ? parsed : Math.max(0, parsed));
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode={allowNegative ? 'decimal' : 'numeric'}
      value={display}
      onChange={handleChange}
      placeholder={placeholder ?? '0'}
    />
  );
}
