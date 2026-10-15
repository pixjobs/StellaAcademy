import type { Question } from '../../../src/lib/quiz/core';
import type { BinaryCheck } from '../../../src/lib/quiz/binary';
import type { Verifier } from './types';

/** Binary: recomputed by repeated halving and by place values, independently of Number.toString(2). */
const toBinary = (n: number) => {
  let s = '';
  for (let x = n; x > 0; x = Math.floor(x / 2)) s = (x % 2) + s;
  return s || '0';
};
const toDenary = (bits: string) => [...bits].reduce((acc, b) => acc * 2 + Number(b), 0);

export const binaryVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<BinaryCheck>).check;
    if (c.kind === 'to-denary') return toDenary(c.bits) === c.answer ? null : `${c.bits} → ${c.answer}`;
    if (c.kind === 'to-binary') return toBinary(c.n) === c.answer ? null : `${c.n} → ${c.answer}`;
    return toBinary(toDenary(c.a) + toDenary(c.b)) === c.answer ? null : `${c.a} + ${c.b} → ${c.answer}`;
  },
  mistakes: (question) => {
    const q = question as Question<BinaryCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'to-denary') return [{ step: last, typed: String([...c.bits].filter((b) => b === '1').length), expect: 'counts the 1s' }];
    if (c.kind === 'to-binary') {
      const rev = [...c.answer].reverse().join('');
      return rev === c.answer ? [] : [{ step: last, typed: rev.replace(/^0+/, ''), expect: 'backwards' }];
    }
    const denary = String(Number(c.a) + Number(c.b));
    return denary === c.answer ? [] : [{ step: last, typed: denary, expect: 'as in denary' }];
  },
};
