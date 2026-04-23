import { useEffect, useState } from 'react';

type Op = '+' | '-' | '×' | '÷';

const compute = (a: number, b: number, op: Op): number => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
  }
};

const formatDisplay = (s: string) => {
  if (s === '' || s === '-') return s || '0';
  const [intPart, decPart] = s.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = sign ? intPart.slice(1) : intPart;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + withCommas + (decPart !== undefined ? '.' + decPart : '');
};

export default function CalculatorModal({
  initialValue,
  onApply,
  onClose,
}: {
  initialValue: number;
  onApply: (value: number) => void;
  onClose: () => void;
}) {
  const [display, setDisplay] = useState<string>(
    initialValue && Number.isFinite(initialValue) ? String(Math.trunc(initialValue)) : '0',
  );
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [replaceOnNext, setReplaceOnNext] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) pressDigit(k);
      else if (k === '.') pressDot();
      else if (k === '+' || k === '-') pressOp(k);
      else if (k === '*') pressOp('×');
      else if (k === '/') { e.preventDefault(); pressOp('÷'); }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); pressEquals(); }
      else if (k === 'Backspace') pressBackspace();
      else if (k === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, prev, op, replaceOnNext]);

  const pressDigit = (d: string) => {
    if (replaceOnNext || display === '0') {
      setDisplay(d);
      setReplaceOnNext(false);
    } else {
      if (display.replace(/[-.]/g, '').length >= 12) return;
      setDisplay(display + d);
    }
  };

  const pressDot = () => {
    if (replaceOnNext) {
      setDisplay('0.');
      setReplaceOnNext(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const pressOp = (next: Op) => {
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) return;
    if (prev !== null && op && !replaceOnNext) {
      const result = compute(prev, cur, op);
      if (!Number.isFinite(result)) {
        setDisplay('Error');
        setPrev(null);
        setOp(null);
        setReplaceOnNext(true);
        return;
      }
      setDisplay(trimResult(result));
      setPrev(result);
    } else {
      setPrev(cur);
    }
    setOp(next);
    setReplaceOnNext(true);
  };

  const pressEquals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) return;
    const result = compute(prev, cur, op);
    if (!Number.isFinite(result)) {
      setDisplay('Error');
    } else {
      setDisplay(trimResult(result));
    }
    setPrev(null);
    setOp(null);
    setReplaceOnNext(true);
  };

  const pressClear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setReplaceOnNext(true);
  };

  const pressBackspace = () => {
    if (replaceOnNext) return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
      setReplaceOnNext(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const pressToggleSign = () => {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  };

  const handleApply = () => {
    let value: number;
    if (prev !== null && op) {
      const cur = parseFloat(display);
      const result = compute(prev, cur, op);
      if (!Number.isFinite(result)) return;
      value = result;
    } else {
      value = parseFloat(display);
    }
    if (!Number.isFinite(value)) return;
    onApply(Math.round(Math.abs(value)));
    onClose();
  };

  const expression =
    prev !== null && op
      ? `${formatDisplay(trimResult(prev))} ${op} ${replaceOnNext ? '' : formatDisplay(display)}`
      : '';

  const Btn = ({
    label,
    onClick,
    variant,
    wide,
  }: {
    label: string;
    onClick: () => void;
    variant?: 'op' | 'accent' | 'ghost';
    wide?: boolean;
  }) => (
    <button
      type="button"
      className={`calc-btn${variant ? ' ' + variant : ''}${wide ? ' wide' : ''}${
        variant === 'op' && op === label ? ' active' : ''
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="modal-backdrop nested" onClick={onClose}>
      <div className="modal calc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🧮 계산기</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="calc-display">
            <div className="calc-expr">{expression || '\u00A0'}</div>
            <div className="calc-value">{formatDisplay(display)}</div>
          </div>
          <div className="calc-grid">
            <Btn label="AC" variant="ghost" onClick={pressClear} />
            <Btn label="±" variant="ghost" onClick={pressToggleSign} />
            <Btn label="⌫" variant="ghost" onClick={pressBackspace} />
            <Btn label="÷" variant="op" onClick={() => pressOp('÷')} />

            <Btn label="7" onClick={() => pressDigit('7')} />
            <Btn label="8" onClick={() => pressDigit('8')} />
            <Btn label="9" onClick={() => pressDigit('9')} />
            <Btn label="×" variant="op" onClick={() => pressOp('×')} />

            <Btn label="4" onClick={() => pressDigit('4')} />
            <Btn label="5" onClick={() => pressDigit('5')} />
            <Btn label="6" onClick={() => pressDigit('6')} />
            <Btn label="-" variant="op" onClick={() => pressOp('-')} />

            <Btn label="1" onClick={() => pressDigit('1')} />
            <Btn label="2" onClick={() => pressDigit('2')} />
            <Btn label="3" onClick={() => pressDigit('3')} />
            <Btn label="+" variant="op" onClick={() => pressOp('+')} />

            <Btn label="0" wide onClick={() => pressDigit('0')} />
            <Btn label="." onClick={pressDot} />
            <Btn label="=" variant="accent" onClick={pressEquals} />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={handleApply} disabled={display === 'Error'}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

const trimResult = (n: number): string => {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = Math.round(n * 1e8) / 1e8;
  return String(rounded);
};
