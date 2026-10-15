import type { Question } from '../../../src/lib/quiz/core';
import type { GeometryCheck } from '../../../src/lib/quiz/basic-geometry';
import type { Verifier } from './types';

/** Area and perimeter: recomputed by counting unit squares and walking the edge of each shape. */
export const basicGeometryVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<GeometryCheck>).check;
    // A grid of unit squares: area by counting, perimeter by counting edges next to the outside.
    const measure = (cells: (x: number, y: number) => boolean, X: number, Y: number) => {
      let area = 0;
      let perim = 0;
      for (let x = 0; x < X; x++)
        for (let y = 0; y < Y; y++)
          if (cells(x, y)) {
            area++;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= X || ny >= Y || !cells(nx, ny)) perim++;
            }
          }
      return { area, perim };
    };
    switch (c.kind) {
      case 'rect': {
        const m = measure(() => true, c.l, c.w);
        return m.area === c.area && m.perim === c.perimeter ? null : `rect ${c.l}×${c.w}: ${c.area}/${c.perimeter} vs ${m.area}/${m.perim}`;
      }
      case 'compare': {
        const pa = measure(() => true, ...c.a).perim;
        const pb = measure(() => true, ...c.b).perim;
        if (c.a[0] * c.a[1] !== c.b[0] * c.b[1]) return 'areas differ';
        return (pa > pb) === c.longer.startsWith(`${c.a[0]} `) ? null : `compare: ${pa} vs ${pb}, said ${c.longer}`;
      }
      case 'width-from-p':
        return 2 * c.l + 2 * c.w === c.p ? null : `width ${c.w} from p ${c.p}`;
      case 'width-from-a':
        return c.l * c.w === c.a ? null : `width ${c.w} from a ${c.a}`;
      case 'notch': {
        const start = Math.floor((c.L - c.nw) / 2);
        const m = measure((x, y) => !(x >= start && x < start + c.nw && y >= c.W - c.nd), c.L, c.W);
        return m.area === c.area && m.perim === c.perimeter ? null : `notch: ${c.area}/${c.perimeter} vs ${m.area}/${m.perim}`;
      }
      case 'L': {
        const m = measure((x, y) => !(x >= c.L - c.cl && y >= c.W - c.cw), c.L, c.W);
        return m.area === c.area && m.perim === c.perimeter ? null : `L: ${c.area}/${c.perimeter} vs ${m.area}/${m.perim}`;
      }
    }
  },
  mistakes: (question) => {
    const q = question as Question<GeometryCheck>;
    const c = q.check;
    if (c.kind === 'rect')
      return [
        { step: 1, typed: String(c.perimeter), expect: 'That is the perimeter' },
        { step: 3, typed: String(c.l + c.w), expect: 'only two sides' },
        { step: 3, typed: String(c.area), expect: 'That is the area' },
      ].filter((m) => Number(m.typed) !== (m.step === 1 ? c.area : c.perimeter));
    if (c.kind === 'notch') return [{ step: 4, typed: String(2 * c.L + 2 * c.W), expect: 'two sides of the notch' }];
    if (c.kind === 'width-from-p' && c.p - c.l !== 2 * c.w) return [{ step: 1, typed: String(c.p - c.l), expect: 'two lengths' }];
    if (c.kind === 'compare') return [];
    if (c.kind === 'L') {
      const shorter = c.perimeter - (2 * c.cl + 2 * c.cw);
      return [
        ...(shorter > 0 ? [{ step: 4, typed: String(shorter), expect: 'does not shorten' }] : []),
        { step: 4, typed: String(c.perimeter - c.cl - c.cw), expect: 'does not shorten' },
      ];
    }
    return [];
  },
};
