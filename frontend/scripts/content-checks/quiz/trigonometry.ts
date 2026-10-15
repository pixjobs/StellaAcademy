import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { TrigCheck } from '../../../src/lib/quiz/trigonometry';
import type { Verifier } from './types';

const math = create(all);
const near = (x: number, y: number) => Math.abs(x - y) <= Math.abs(y) * 1e-9 + 1e-12;

/**
 * Trigonometry: every answer rebuilt as a triangle with mathjs (angles as degree units) and checked
 * against Pythagoras and the definitions of sin, cos and tan.
 */
export const trigonometryVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<TrigCheck>).check;
    if (c.kind === 'pythagoras') {
      const [a, b, x] = [c.a, c.b, c.answer];
      return c.hypotenuse ? (near(a * a + b * b, x * x) ? null : `hyp ${a},${b}: ${x}`) : near(a * a + x * x, b * b) ? null : `short ${a},${b}: ${x}`;
    }
    if (c.kind === 'angle') {
      const t = math.unit(c.answer, 'deg');
      const fn = c.a === 'opposite' && c.b === 'hypotenuse' ? math.sin(t) : c.a === 'adjacent' ? math.cos(t) : math.tan(t);
      return near(fn as number, c.aLength / c.bLength) ? null : `angle ${c.answer} for ${c.aLength}/${c.bLength}`;
    }
    // A side: build the triangle with hypotenuse 1 at this angle, scale it to the known side, read off the wanted side.
    const t = math.unit(c.angle, 'deg');
    const unit = { hypotenuse: 1, opposite: math.sin(t) as number, adjacent: math.cos(t) as number };
    const scale = c.knownLength / unit[c.known];
    const want = unit[c.want] * scale;
    if (!near(want, c.answer)) return `${c.want} from ${c.known} ${c.knownLength} at ${c.angle}°: ${c.answer} vs ${want}`;
    const tri = { o: unit.opposite * scale, a: unit.adjacent * scale, h: scale };
    return near(tri.o ** 2 + tri.a ** 2, tri.h ** 2) ? null : 'triangle is not right-angled';
  },
  mistakes: (question) => {
    const q = question as Question<TrigCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'side') {
      // × and ÷ swapped.
      const other = (c.knownLength * c.knownLength) / c.answer;
      return Math.abs(other - c.answer) / c.answer > 0.05 ? [{ step: last, typed: String(Number(other.toPrecision(4))), expect: 'of the ratio, so' }] : [];
    }
    if (c.kind === 'pythagoras') {
      const sum = c.hypotenuse ? c.a + c.b : c.b - c.a;
      const out = Math.abs(sum - c.answer) > 0.01 ? [{ step: last, typed: String(sum), expect: 'Square them first' }] : [];
      // Adding the squares when finding a shorter side.
      if (!c.hypotenuse) out.push({ step: 2, typed: 'Add them', expect: 'biggest' });
      return out;
    }
    // Rounded too far: 2 significant figures where it differs from the 3 s.f. answer.
    const two = Number(c.answer.toPrecision(2));
    if (Math.abs(two - c.answer) > Math.max(Math.abs(c.answer) * 0.002, 10 ** (Math.floor(Math.log10(Math.abs(c.answer))) - 2) / 2) * 1.01)
      return [{ step: last, typed: String(two), expect: '3 significant figures' }];
    return [];
  },
};
