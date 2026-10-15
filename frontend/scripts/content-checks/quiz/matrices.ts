import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { MatricesCheck } from '../../../src/lib/quiz/matrices';
import type { Verifier } from './types';

const math = create(all);
type M = [number, number, number, number];
const grid = (m: M) => math.matrix([[m[0], m[1]], [m[2], m[3]]]);
const flat = (x: unknown) => (math.flatten(x as never) as unknown as { toArray: () => number[] }).toArray();
const eq = (x: number[], y: number[]) => x.length === y.length && x.every((v, i) => v === y[i]);

/** Matrices: recomputed with mathjs matrix arithmetic; named transformations checked by where they send test points. */
export const matricesVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<MatricesCheck>).check;
    if (c.kind === 'add') return eq(flat(math.add(grid(c.a), grid(c.b!))), c.answer) ? null : 'add';
    if (c.kind === 'sub') return eq(flat(math.subtract(grid(c.a), grid(c.b!))), c.answer) ? null : 'sub';
    if (c.kind === 'scale') return eq(flat(math.multiply(c.k, grid(c.a))), c.answer) ? null : 'scale';
    if (c.kind === 'mul') return eq(flat(math.multiply(grid(c.a), grid(c.b))), c.answer) ? null : 'mul';
    if (c.kind === 'apply') return eq(flat(math.multiply(grid(c.m), math.matrix([[c.p[0]], [c.p[1]]]))), c.answer) ? null : 'apply';
    if (c.kind !== 'name') return `unknown kind`;
    // Name: check by where (2, 1) goes, worked out from the description independently.
    const [x, y] = [2, 1];
    const where: Record<string, [number, number]> = {
      'Rotation 90° anticlockwise about the origin': [-y, x],
      'Rotation 90° clockwise about the origin': [y, -x],
      'Rotation 180° about the origin': [-x, -y],
      'Reflection in the x-axis': [x, -y],
      'Reflection in the y-axis': [-x, y],
      'Reflection in the line y = x': [y, x],
      'Enlargement, scale factor 2, centre the origin': [2 * x, 2 * y],
      'Enlargement, scale factor 3, centre the origin': [3 * x, 3 * y],
    };
    const got = flat(math.multiply(grid(c.m), math.matrix([[x], [y]])));
    return where[c.answer] && eq(got, where[c.answer]) ? null : `name: ${c.answer}`;
  },
  mistakes: (question) => {
    const q = question as Question<MatricesCheck>;
    const c = q.check;
    if (c.kind !== 'mul') return [];
    // Matching positions multiplied: name it where it differs from the right entry.
    return [0, 1, 2, 3].filter((i) => c.a[i] * c.b[i] !== c.answer[i]).slice(0, 1).map((i) => ({ step: i + 1, typed: String(c.a[i] * c.b[i]), expect: 'matching positions' }));
  },
};
