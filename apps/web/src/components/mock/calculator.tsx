'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type ButtonType = { label: string; action: () => void; style: 'op' | 'clear' | 'func' | 'num' };

export function MockCalculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');

  const inputDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setExpression(p => p + digit);
        setWaitingForOperand(false);
        return digit;
      }
      const newDisplay = prev === '0' ? digit : prev + digit;
      setExpression(p => p + digit);
      return newDisplay;
    });
  }, [waitingForOperand]);

  const inputDot = useCallback(() => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setExpression(p => p + '0.');
        setWaitingForOperand(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      const newDisplay = prev + '.';
      setExpression(p => p + '.');
      return newDisplay;
    });
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay('0');
    setMemory(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
  }, []);

  const backspace = useCallback(() => {
    setDisplay(prev => {
      if (prev.length > 1) {
        const newDisplay = prev.slice(0, -1);
        setExpression(p => p.slice(0, -1));
        return newDisplay;
      }
      setExpression(p => p.slice(0, -1));
      return '0';
    });
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay(prev => String(-parseFloat(prev)));
  }, []);

  const percentage = useCallback(() => {
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
    setExpression(String(value));
  }, [display]);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const performOperation = useCallback((op: string) => {
    const inputValue = parseFloat(display);
    if (op === '√') {
      const result = Math.sqrt(inputValue);
      setDisplay(String(result));
      setExpression(`√(${inputValue}) = ${result}`);
      return;
    }
    if (op === 'x²') {
      const result = inputValue * inputValue;
      setDisplay(String(result));
      setExpression(`${inputValue}² = ${result}`);
      return;
    }
    if (op === '1/x') {
      const result = 1 / inputValue;
      setDisplay(String(result));
      setExpression(`1/${inputValue} = ${result}`);
      return;
    }

    if (operator && memory !== null && !waitingForOperand) {
      const result = calculate(memory, inputValue, operator);
      setMemory(result);
      setDisplay(String(result));
      setExpression(`${memory} ${operator} ${inputValue} = ${result}`);
      setOperator(op);
      setWaitingForOperand(true);
    } else {
      setMemory(inputValue);
      setOperator(op);
      setExpression(`${inputValue} ${op}`);
      setWaitingForOperand(true);
    }
  }, [display, memory, operator, waitingForOperand]);

  const equals = useCallback(() => {
    if (operator === null || memory === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(memory, inputValue, operator);
    setDisplay(String(result));
    setExpression(`${memory} ${operator} ${inputValue} = ${result}`);
    setMemory(result);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, memory, operator]);

  if (!isOpen) return null;

  const buttons: ButtonType[] = [
    { label: 'C', action: clear, style: 'clear' },
    { label: '⌫', action: backspace, style: 'func' },
    { label: '±', action: toggleSign, style: 'func' },
    { label: '%', action: percentage, style: 'func' },
    { label: '7', action: () => inputDigit('7'), style: 'num' },
    { label: '8', action: () => inputDigit('8'), style: 'num' },
    { label: '9', action: () => inputDigit('9'), style: 'num' },
    { label: '÷', action: () => performOperation('÷'), style: 'op' },
    { label: '4', action: () => inputDigit('4'), style: 'num' },
    { label: '5', action: () => inputDigit('5'), style: 'num' },
    { label: '6', action: () => inputDigit('6'), style: 'num' },
    { label: '×', action: () => performOperation('×'), style: 'op' },
    { label: '1', action: () => inputDigit('1'), style: 'num' },
    { label: '2', action: () => inputDigit('2'), style: 'num' },
    { label: '3', action: () => inputDigit('3'), style: 'num' },
    { label: '-', action: () => performOperation('-'), style: 'op' },
    { label: '0', action: () => inputDigit('0'), style: 'num' },
    { label: '.', action: inputDot, style: 'num' },
    { label: '=', action: equals, style: 'op' },
    { label: '+', action: () => performOperation('+'), style: 'op' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <span className="text-sm font-medium text-muted-foreground">Calculator</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 bg-muted/30">
          <div className="text-xs text-muted-foreground h-4 mb-1 overflow-hidden text-right truncate">{expression.slice(-30)}</div>
          <div className="text-3xl font-bold text-right font-mono truncate">{display}</div>
        </div>

        <div className="grid grid-cols-5 gap-1 p-3 bg-muted/20">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className={cn(
                'h-10 rounded-lg text-sm font-medium transition-all active:scale-95',
                btn.style === 'op'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : btn.style === 'clear'
                  ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                  : btn.style === 'func'
                  ? 'bg-muted hover:bg-muted/80'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}