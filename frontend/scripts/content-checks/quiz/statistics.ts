import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { StatisticsCheck } from '../../../src/lib/quiz/statistics';
import type { Verifier } from './types';

const math = create(all);
const near = (x: number, y: number) => Math.abs(x - y) <= Math.abs(y) * 1e-9 + 1e-9;

/** Statistics: every answer recomputed with mathjs (mean, median, std with the population normalisation). */
export const statisticsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<StatisticsCheck>).check;
    switch (c.kind) {
      case 'mean':
        return near(math.mean(c.data) as number, c.answer) ? null : `mean ${c.data}: ${c.answer}`;
      case 'median':
        return near(math.median(c.data) as number, c.answer) ? null : `median ${c.data}: ${c.answer}`;
      case 'range':
        return c.answer === Math.max(...c.data) - Math.min(...c.data) ? null : `range ${c.data}: ${c.answer}`;
      case 'missing':
        return near(math.mean([...c.known, c.answer]) as number, c.mean) ? null : `missing: ${c.answer}`;
      case 'sd':
        return near(math.std(c.data, 'uncorrected') as number, c.answer) ? null : `sd ${c.data}: ${c.answer}`;
      case 'summary': {
        const variance = c.sxx / c.n - (c.sx / c.n) ** 2;
        return near(Math.sqrt(variance), c.answer) && variance > 0 ? null : `summary: ${c.answer}`;
      }
    }
  },
  mistakes: (question) => {
    const q = question as Question<StatisticsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'median') {
      const n = c.data.length;
      const asWritten = n % 2 ? c.data[(n - 1) / 2] : (c.data[n / 2 - 1] + c.data[n / 2]) / 2;
      return asWritten === c.answer ? [] : [{ step: last, typed: String(asWritten), expect: 'in order' }];
    }
    if (c.kind === 'sd') {
      const variance = c.answer ** 2;
      const n = c.data.length;
      const sample = (variance * n) / (n - 1);
      const out = [{ step: 2, typed: String(Number(sample.toPrecision(4))), expect: `divides by ${n - 1}` }];
      if (Math.abs(variance - c.answer) / c.answer > 0.01) out.push({ step: last, typed: String(Number(variance.toPrecision(4))), expect: 'That is the variance' });
      return out;
    }
    if (c.kind === 'summary') {
      const notSquared = c.sxx / c.n - c.sx / c.n;
      return notSquared === c.answer ** 2 ? [] : [{ step: 2, typed: String(notSquared), expect: 'Square the mean' }];
    }
    return [];
  },
};
