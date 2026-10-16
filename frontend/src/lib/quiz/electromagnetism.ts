/**
 * Quiz for "Electromagnetic Induction and Faraday's Law" (KAN-99): when an emf is induced, magnetic flux and
 * flux linkage, Faraday's law, and Lenz's law. GCSE to A-level. Numbers are chosen so every answer is exact,
 * worked with exact decimal arithmetic so no float noise reaches a pupil.
 */
import { D, divide, fmt, multiply, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'induced' | 'flux' | 'faraday' | 'lenz';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  induced: { label: 'When is an emf induced?', blurb: 'Only a change in the flux through the coil induces an emf.' },
  flux: { label: 'Magnetic flux', blurb: 'Φ = BA in webers, with B in teslas and A in m². Flux linkage is NΦ.' },
  faraday: { label: 'Faraday’s law', blurb: 'The size of the emf is N × ΔΦ ÷ Δt, with the time in seconds.' },
  lenz: { label: 'Lenz’s law', blurb: 'The induced current opposes the change that causes it.' },
};

export type EmCheck =
  | { kind: 'induced'; changing: boolean; effect: string; direction?: string }
  | { kind: 'flux'; B: string; A: string; N: number; phi: string; linkage: string }
  | { kind: 'faraday'; N: number; phi1: string; phi2: string; seconds: string; emf: string }
  | { kind: 'lenz'; pole: 'north' | 'south'; inwards: boolean; linkage: string; seconds: string; emf: string };
type Question = Q<EmCheck>;

const near = (g: Digits, x: number, rel = 0.005) => Math.abs(toNumber(g) - x) <= rel * Math.max(Math.abs(x), 1e-12);
const sub = (a: Digits, b: Digits): Digits => D(String(parseFloat((toNumber(a) - toNumber(b)).toPrecision(10))));
const s = (d: Digits) => fmt(d);
const plain = (d: Digits) => fmt(d).replace(/,/g, '');
/** At most 3 significant figures, so every exact answer can be typed without rounding. */
const short = (...ds: (Digits | null)[]) => ds.every((d) => d !== null && d.digits.length <= 3);

// ---------------------------------------------------------------------------------------------
// When is an emf induced?
// ---------------------------------------------------------------------------------------------

const EFFECTS = ['Bigger, but not zero', 'Smaller, but not zero', 'The same, and not zero', 'Zero: no emf'];
type Effect = 'bigger' | 'smaller' | 'same size' | 'zero';
const compare = (a: number, b: number): Effect => (b > a ? 'bigger' : b < a ? 'smaller' : 'same size');
const amps = (n: number) => `${n} ampere${n === 1 ? '' : 's'}`;

/**
 * A situation, then a change to it, with numbers so the size of the effect has to be worked out. About half
 * start with nothing changing (a coil at rest, a steady current), so "is the flux changing?" is not a giveaway.
 * The page's practice questions (a magnet at rest; doubling the turns) are left out.
 */
function situation(r: () => number): { text: string; change: string; changing: boolean; effect: Effect; direction?: 'same' | 'opposite' } {
  const kind = pick(r, ['magnet', 'magnet', 'generator', 'electromagnet', 'restingCoil', 'steadyCurrent', 'steadyCurrent'] as const);
  if (kind === 'magnet') {
    const N = pick(r, [100, 200, 300, 400, 500]);
    const v1 = pick(r, [0.2, 0.3, 0.4, 0.5, 0.6]);
    const text = `A bar magnet is pushed steadily at ${v1} m/s into a ${N}-turn coil connected to a meter.`;
    const c = pick(r, ['speed', 'out', 'turns', 'stop'] as const);
    if (c === 'speed') {
      const v2 = pick(r, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8].filter((x) => x !== v1));
      return { text, change: `It is now pushed in at ${v2} m/s.`, changing: true, effect: compare(v1, v2), direction: 'same' };
    }
    if (c === 'out') {
      const v2 = pick(r, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]);
      return { text, change: `It is now pulled out at ${v2} m/s.`, changing: true, effect: compare(v1, v2), direction: 'opposite' };
    }
    if (c === 'turns') {
      const N2 = pick(r, [50, 100, 150, 250, 300, 400, 500, 800].filter((x) => x !== N && x !== 2 * N));
      return { text, change: `The coil is swapped for one with ${N2} turns, and the magnet is pushed in at the same speed.`, changing: true, effect: compare(N, N2), direction: 'same' };
    }
    return { text, change: 'The magnet is then stopped inside the coil.', changing: true, effect: 'zero' };
  }
  if (kind === 'generator') {
    const f1 = pick(r, [5, 10, 20, 25, 50]);
    const text = `A coil is turned steadily ${f1} times a second between the poles of a magnet, as in a generator.`;
    const c = pick(r, ['rate', 'magnet', 'stop'] as const);
    if (c === 'rate') {
      const f2 = pick(r, [5, 10, 20, 25, 50, 60].filter((x) => x !== f1));
      return { text, change: `It is now turned ${f2} times a second.`, changing: true, effect: compare(f1, f2) };
    }
    if (c === 'magnet') return { text, change: `A stronger magnet is used, and the coil still turns ${f1} times a second.`, changing: true, effect: 'bigger' };
    return { text, change: 'It stops turning.', changing: true, effect: 'zero' };
  }
  if (kind === 'electromagnet') {
    const a = pick(r, [1, 2, 3, 4, 5]);
    const text = `The current in an electromagnet next to a coil is switched on and rises by ${amps(a)} each second.`;
    const c = pick(r, ['faster', 'steady', 'off'] as const);
    if (c === 'faster') {
      const b = pick(r, [1, 2, 3, 4, 5, 8].filter((x) => x !== a));
      return { text, change: `The current is then made to rise by ${amps(b)} each second.`, changing: true, effect: compare(a, b), direction: 'same' };
    }
    if (c === 'steady') return { text, change: 'Later the current stays steady.', changing: true, effect: 'zero' };
    const b = pick(r, [1, 2, 3, 4, 5, 8]);
    return { text, change: `Then it is switched off, and its current falls by ${amps(b)} each second.`, changing: true, effect: compare(a, b), direction: 'opposite' };
  }
  if (kind === 'restingCoil') {
    const f = pick(r, [5, 10, 20, 25, 50]);
    return { text: 'A coil rests, not turning, between the poles of a magnet.', change: `It is then turned steadily ${f} times a second.`, changing: false, effect: 'bigger' };
  }
  const a = pick(r, [1, 2, 3, 4, 5]);
  const text = `A steady current of ${amps(a)} flows in an electromagnet next to a coil.`;
  return pick(r, [
    { text, change: `It is then switched off, and the current falls to zero in half a second.`, changing: false, effect: 'bigger' as Effect },
    { text, change: `The current is then made to rise steadily, by ${amps(pick(r, [1, 2, 4]))} each second.`, changing: false, effect: 'bigger' as Effect },
    { text, change: 'The coil is then moved a little closer, and left still once it is there.', changing: false, effect: 'zero' as Effect },
  ]);
}

function inducedQuestion(r: () => number): Question {
  const sit = situation(r);
  const ch = { text: sit.change, effect: sit.effect, direction: sit.direction };
  const flowOptions = shuffle(r, ['Yes, it is changing', 'No, it is not changing']);
  const flowRight = flowOptions.indexOf(sit.changing ? 'Yes, it is changing' : 'No, it is not changing');
  const effectText = { bigger: 'Bigger, but not zero', smaller: 'Smaller, but not zero', 'same size': 'The same, and not zero', zero: 'Zero: no emf' }[ch.effect];
  const effectOptions = shuffle(r, [...EFFECTS]);
  const effectRight = effectOptions.indexOf(effectText);
  const steps: Step[] = [
    { type: 'choice', prompt: 'At first, is the magnetic flux through the coil changing?', options: flowOptions, correct: flowRight, why: { [1 - flowRight]: sit.changing ? 'Something is moving or a current is changing, so the field through the coil changes.' : 'Nothing moves and no current changes, so the flux stays the same.' } },
    {
      type: 'choice',
      prompt: `After the change, compared with ${sit.changing ? 'before' : 'the start'}, the induced emf is…`,
      options: effectOptions,
      correct: effectRight,
      why: whyAll(effectOptions, effectRight, (o) =>
        o === 'Zero: no emf' ? 'Something is still changing the flux, so there is an emf.' : ch.effect === 'zero' ? 'Is anything still changing the flux through the coil?' : 'A faster change, more turns or a stronger field gives a bigger emf; a slower change gives a smaller one.',
      ),
    },
  ];
  // A direction only makes sense when there was an emf before and there still is one.
  if (ch.direction && sit.changing && ch.effect !== 'zero') {
    const dirOptions = shuffle(r, ['The same direction', 'The opposite direction']);
    const dirRight = dirOptions.indexOf(ch.direction === 'same' ? 'The same direction' : 'The opposite direction');
    steps.push({ type: 'choice', prompt: 'Does the emf act in the same direction as before, or the opposite?', options: dirOptions, correct: dirRight, why: { [1 - dirRight]: 'The emf reverses when the change reverses: flux rising, then flux falling.' } });
  }
  return {
    round: 'induced',
    prompt: `${sit.text} ${ch.text}`.replace(`${ch.text} ${ch.text}`, ch.text),
    steps,
    workings: [
      sit.changing ? 'At first the flux through the coil is changing, so an emf is induced.' : 'At first nothing changes, so no emf is induced.',
      `${effectText}: ${ch.effect === 'zero' ? 'with nothing changing, no emf is induced.' : ch.effect === 'same size' ? 'the flux changes just as fast as before.' : !sit.changing ? 'the flux now changes, where before it did not.' : ch.effect === 'bigger' ? 'the flux linkage changes faster.' : 'the flux linkage changes more slowly.'}`,
      ...(ch.direction && sit.changing && ch.effect !== 'zero' ? [`${ch.direction === 'same' ? 'The same direction' : 'The opposite direction'}: the flux is ${ch.direction === 'same' ? 'still rising' : 'now falling instead of rising'}.`] : []),
    ],
    check: { kind: 'induced', changing: sit.changing, effect: ch.effect, ...(ch.direction && sit.changing && ch.effect !== 'zero' ? { direction: ch.direction } : {}) },
  };
}

// ---------------------------------------------------------------------------------------------
// Magnetic flux and flux linkage
// ---------------------------------------------------------------------------------------------

function fluxQuestion(r: () => number): Question {
  for (;;) {
    const mT = r() < 0.5;
    const Bt = D(pick(r, ['0.02', '0.04', '0.05', '0.08', '0.1', '0.15', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6']));
    const cm2 = r() < 0.5;
    const Am2 = D(pick(r, ['0.001', '0.002', '0.004', '0.005', '0.01', '0.02', '0.04', '0.05', '0.1']));
    const N = pick(r, [20, 50, 100, 150, 200, 250, 400, 500]);
    if (plain(Bt) === '0.2' && plain(Am2) === '0.05') continue; // the page's practice question
    const phi = multiply(Bt, Am2);
    const linkage = multiply(phi, D(N));
    if (!short(phi, linkage)) continue;
    const Bgiven = mT ? `${s(multiply(Bt, D(1000)))} mT` : `${s(Bt)} T`;
    const Agiven = cm2 ? `${s(multiply(Am2, D(10000)))} cm²` : `${s(Am2)} m²`;
    const steps: Step[] = [];
    if (mT) steps.push({ type: 'number', prompt: `What is ${Bgiven} in teslas?`, answer: Bt, unit: 'T', feedback: (g) => (near(g, toNumber(Bt) * 1000) ? 'That is still in millitesla. Divide by 1,000.' : 'A millitesla is a thousandth of a tesla.') });
    if (cm2) steps.push({ type: 'number', prompt: `What is ${Agiven} in m²?`, answer: Am2, unit: 'm²', feedback: (g) => (near(g, toNumber(Am2) * 100) ? 'That divides by 100. For an area, 1 m² is 100 × 100 = 10,000 cm².' : 'Divide by 10,000: 1 m² is 10,000 cm².') });
    steps.push(
      {
        type: 'number',
        prompt: 'What is the flux through the coil, Φ = BA?',
        answer: phi,
        unit: 'Wb',
        feedback: (g) => (cm2 && near(g, toNumber(phi) * 10000) ? 'That uses the area in cm². Change it to m² first.' : mT && near(g, toNumber(phi) * 1000) ? 'That uses the field in mT. Change it to teslas first.' : 'Multiply B in teslas by A in m².'),
      },
      { type: 'number', prompt: `And the flux linkage of the ${N}-turn coil?`, answer: linkage, unit: 'Wb', feedback: (g) => (near(g, toNumber(phi)) ? 'That is the flux through one turn. Flux linkage is NΦ.' : 'Multiply the flux by the number of turns.') },
    );
    return {
      round: 'flux',
      prompt: `A magnetic field of ${Bgiven} passes straight through a coil of ${N} turns, each of area ${Agiven}. What is the flux linkage?`,
      steps,
      workings: [...(mT ? [`${Bgiven} = ${s(Bt)} T.`] : []), ...(cm2 ? [`${Agiven} = ${s(Am2)} m².`] : []), `Φ = BA = ${s(Bt)} × ${s(Am2)} = ${s(phi)} Wb.`, `NΦ = ${N} × ${s(phi)} = ${s(linkage)} Wb.`],
      check: { kind: 'flux', B: plain(Bt), A: plain(Am2), N, phi: plain(phi), linkage: plain(linkage) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Faraday's law
// ---------------------------------------------------------------------------------------------

const SHOWN_FARADAY = new Set(['50 0.02 0.1 0.4', '200 0.5 0.1 0.2']);

function faradayQuestion(r: () => number): Question {
  for (;;) {
    const N = pick(r, [20, 50, 100, 150, 200, 250, 300, 400, 500]);
    const [a, b] = shuffle(r, ['0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.08', '0.1', '0.12', '0.15', '0.2', '0.25', '0.3', '0.4', '0.5']).slice(0, 2).map(D);
    const ms = r() < 0.4;
    const t = D(ms ? pick(r, ['0.02', '0.04', '0.05', '0.08', '0.1', '0.2', '0.25']) : pick(r, ['0.05', '0.1', '0.2', '0.25', '0.4', '0.5', '0.8', '1', '2']));
    if (SHOWN_FARADAY.has(`${N} ${plain(a)} ${plain(b)} ${plain(t)}`)) continue;
    const dPhi = D(String(Math.abs(toNumber(sub(b, a)))));
    // The final flux must differ from the change (0.06 down to 0.03 would make the slip look right).
    if (toNumber(dPhi) === toNumber(b) || toNumber(dPhi) === toNumber(a)) continue;
    const rate = divide(dPhi, t);
    const emf = rate && multiply(rate, D(N));
    if (!rate || !emf || !short(dPhi, rate, emf) || toNumber(emf) > 100) continue; // a realistic coil
    const rises = toNumber(b) > toNumber(a);
    const tGiven = ms ? `${s(multiply(t, D(1000)))} ms` : `${s(t)} s`;
    const finalOnly = (N * toNumber(b)) / toNumber(t);
    const steps: Step[] = [
      { type: 'number', prompt: 'By how much does the flux change?', answer: dPhi, unit: 'Wb', feedback: (g) => (near(g, toNumber(b)) ? 'That is the final flux. Take one value from the other.' : 'Take the smaller flux from the bigger one.') },
    ];
    if (ms) steps.push({ type: 'number', prompt: `What is ${tGiven} in seconds?`, answer: t, unit: 's', feedback: () => 'There are 1,000 milliseconds in a second.' });
    steps.push(
      { type: 'number', prompt: 'What is the rate of change of flux, ΔΦ ÷ Δt?', answer: rate, unit: 'Wb/s', feedback: (g) => (ms && near(g, toNumber(rate) / 1000) ? 'That uses the time in milliseconds. Change it to seconds first.' : 'Divide the change in flux by the time in seconds.') },
      {
        type: 'number',
        prompt: 'So what is the size of the induced emf?',
        answer: emf,
        unit: 'V',
        feedback: (g) => (near(g, toNumber(rate)) ? 'That leaves out the turns. The emf is N times the rate of change of flux.' : Math.abs(finalOnly - toNumber(emf)) > 0.01 * toNumber(emf) && near(g, finalOnly) ? 'That uses the final flux, not the change in flux.' : 'Multiply the rate of change of flux by the number of turns.'),
      },
    );
    return {
      round: 'faraday',
      prompt: `The flux through a ${N}-turn coil ${rises ? 'rises' : 'falls'} from ${s(a)} Wb to ${s(b)} Wb in ${tGiven}. What is the size of the induced emf?`,
      steps,
      workings: [`ΔΦ = ${s(rises ? b : a)} − ${s(rises ? a : b)} = ${s(dPhi)} Wb${ms ? `, and ${tGiven} = ${s(t)} s` : ''}.`, `ΔΦ ÷ Δt = ${s(dPhi)} ÷ ${s(t)} = ${s(rate)} Wb/s.`, `emf = N × ΔΦ ÷ Δt = ${N} × ${s(rate)} = ${s(emf)} V.`],
      check: { kind: 'faraday', N, phi1: plain(a), phi2: plain(b), seconds: plain(t), emf: plain(emf) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Lenz's law
// ---------------------------------------------------------------------------------------------

function lenzQuestion(r: () => number): Question {
  for (;;) {
    // North pushed in is the page's practice question. Weighting the other three cases 1 : 2 : 2 balances
    // attract against repel, and north against south, at 60 : 40.
    const [pole, inwards] = pick(r, [['north', false], ['south', true], ['south', true], ['south', false], ['south', false]] as const);
    // A hand-held magnet and a classroom coil: a few hundredths of a weber, millivolts to about a volt.
    const linkage = D(pick(r, ['0.002', '0.004', '0.005', '0.006', '0.008', '0.01', '0.012', '0.015', '0.02', '0.025', '0.03', '0.04', '0.05']));
    const t = D(pick(r, ['0.1', '0.2', '0.25', '0.4', '0.5']));
    const emf = divide(linkage, t);
    if (!emf || !short(emf)) continue;
    const forceOptions = shuffle(r, ['It repels the magnet', 'It attracts the magnet']);
    const forceRight = forceOptions.indexOf(inwards ? 'It repels the magnet' : 'It attracts the magnet');
    const facing = inwards ? pole : pole === 'north' ? 'south' : 'north';
    const poleOptions = shuffle(r, ['A north pole', 'A south pole']);
    const poleRight = poleOptions.indexOf(facing === 'north' ? 'A north pole' : 'A south pole');
    return {
      round: 'lenz',
      prompt: `The ${pole} pole of a magnet is ${inwards ? 'pushed into' : 'pulled out of'} a coil in a complete circuit. The flux linkage changes by ${s(linkage)} Wb in ${s(t)} s.`,
      steps: [
        { type: 'choice', prompt: 'Which way does the induced current push on the magnet?', options: forceOptions, correct: forceRight, why: { [1 - forceRight]: 'The induced current opposes the change that causes it, so it works against the motion.' } },
        { type: 'choice', prompt: 'So which pole forms at the end of the coil facing the magnet?', options: poleOptions, correct: poleRight, why: { [1 - poleRight]: 'Like poles repel and unlike poles attract. Which does the coil need, to oppose the motion?' } },
        { type: 'number', prompt: 'What is the size of the induced emf?', answer: emf, unit: 'V', feedback: (g) => (near(g, toNumber(linkage) * toNumber(t)) ? 'That multiplies. Divide the change in flux linkage by the time.' : 'Divide the change in flux linkage by the time.') },
      ],
      workings: [
        `${inwards ? 'It repels the magnet' : 'It attracts the magnet'}: the coil opposes the magnet ${inwards ? 'coming in' : 'leaving'}.`,
        `So ${facing === 'north' ? 'a north pole' : 'a south pole'} forms facing the magnet, ${inwards ? 'like poles repelling' : 'unlike poles attracting'}.`,
        `emf = ${s(linkage)} ÷ ${s(t)} = ${s(emf)} V.`,
      ],
      check: { kind: 'lenz', pole, inwards, linkage: plain(linkage), seconds: plain(t), emf: plain(emf) },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'flux') return fluxQuestion(r);
  if (round === 'faraday') return faradayQuestion(r);
  if (round === 'lenz') return lenzQuestion(r);
  return inducedQuestion(r);
}

export const electromagnetismQuiz: LessonQuiz<EmCheck> = {
  lesson: 'electromagnetism',
  storageKey: 'stella-quiz-electromagnetism-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
