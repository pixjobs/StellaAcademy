/**
 * Quiz for "Momentum and Collisions" (KAN-96): p = mv with directions, sticking together, bouncing apart, and
 * pushing apart from rest. GCSE to A-level. Speeds are typed as positive numbers and the direction is its own
 * choice. Every collision is one that could happen: kinetic energy never increases, and an object that was hit
 * never ends up behind the one that hit it.
 */
import { D, approx, divide, fmt, multiply, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'momentum' | 'stick' | 'bounce' | 'apart';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  momentum: { label: 'Momentum', blurb: 'p = mv, in kg m/s. Momentum has a direction: opposite ways take away.' },
  stick: { label: 'Sticking together', blurb: 'Total momentum before = total momentum after, with the masses added.' },
  bounce: { label: 'Bouncing apart', blurb: 'The momentum one object loses, the other gains.' },
  apart: { label: 'Pushing apart', blurb: 'From rest the total is zero, so they move off in opposite directions.' },
};

export type MomentumCheck =
  | { kind: 'one'; find: 'p' | 'v' | 'm'; m: string; v: string; p: string }
  | { kind: 'two'; m1: string; v1: string; m2: string; v2: string; total: string; towardsFirst: boolean; towards: boolean }
  | { kind: 'stick'; m1: string; v1: string; m2: string; v2: string; v: string }
  | { kind: 'bounce'; m1: string; v1: string; m2: string; u1: string; v2: string }
  | { kind: 'apart'; mA: string; vA: string; mB: string; vB: number };
type Question = Q<MomentumCheck>;

const near = (g: Digits, x: number, rel = 0.005) => Math.abs(toNumber(g) - x) <= rel * Math.max(Math.abs(x), 1e-9);
const n = (d: Digits) => toNumber(d);
const s = (d: Digits) => fmt(d);
const plain = (d: Digits) => fmt(d).replace(/,/g, '');
const sub = (a: Digits, b: Digits): Digits => D(String(+(n(a) - n(b)).toFixed(9)));
const add = (a: Digits, b: Digits): Digits => D(String(+(n(a) + n(b)).toFixed(9)));

/** Real things, with masses in kg and speeds in m/s. */
const THINGS: { what: string; plural: string; masses: string[]; speeds: string[]; person?: boolean; join: string }[] = [
  { what: 'trolley', plural: 'trolleys', masses: ['0.5', '1', '1.5', '2', '2.5', '3'], speeds: ['0.5', '1', '1.5', '2', '2.5', '3', '4'], join: 'They stick together.' },
  { what: 'car', plural: 'cars', masses: ['800', '900', '1000', '1100', '1300', '1500', '1800', '2000'], speeds: ['5', '10', '15', '20', '25', '30'], join: 'They lock together.' },
  { what: 'railway wagon', plural: 'railway wagons', masses: ['10000', '12000', '15000', '20000', '25000'], speeds: ['0.5', '1', '1.5', '2', '3'], join: 'They couple together.' },
  { what: 'skater', plural: 'skaters', masses: ['40', '45', '50', '55', '60', '65', '70', '75', '80'], speeds: ['2', '3', '4', '5', '6'], person: true, join: 'They hold on to each other.' },
  { what: 'bumper car', plural: 'bumper cars', masses: ['150', '180', '200', '220', '250'], speeds: ['1', '1.5', '2', '2.5', '3'], join: 'They lock together.' },
];
/** Shown on the page (mass, speed, and for collisions the other mass), in either direction. */
const SHOWN = new Set(['one 1200 20', 'stick 3 4 1 0', 'stick 2 3 1 0', 'two 0.5 6 0.5 6', 'bounce 5 10 3 4']);
const an = (w: string) => (/^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`);
const UNIT = 'kg m/s';
/** A correct size typed as a negative (the notes take one direction as negative): say so, before any other feedback. */
const signed = (answer: number, rest: (g: Digits) => string) => (g: Digits) =>
  g.neg && Math.abs(Math.abs(n(g)) - answer) <= 0.005 * Math.max(answer, 1e-9) ? 'Right size. Type it as a positive number: the direction is asked separately.' : rest(g);
/** An exact quotient shown as it is (0.5), or 3 s.f. when it does not end (0.0417). */
function exactOr3(x: number) {
  const clean = parseFloat(x.toPrecision(10));
  const d = D(String(clean));
  return d.digits.length <= 3 && Math.abs(clean - x) < 1e-12 * Math.max(1, x) ? { answer: d, shown: fmt(d) } : approx(x);
}
/** Every exact answer short enough to type without rounding: at most 3 significant figures. */
const short = (...ds: Digits[]) => ds.every((d) => d.digits.length <= 3);

// ---------------------------------------------------------------------------------------------
// Momentum
// ---------------------------------------------------------------------------------------------

function momentumQuestion(r: () => number): Question {
  for (;;) {
    const t = pick(r, THINGS);
    if (r() < 0.5) {
      const m = D(pick(r, t.masses));
      const v = D(pick(r, t.speeds));
      const p = multiply(m, v);
      const find = pick(r, ['p', 'p', 'v', 'm'] as const);
      // With a 1 in the sum, multiplying and dividing give the same number, so the slip could not be named.
      const slip = find === 'p' ? [n(m) / n(v), n(v) / n(m)] : [n(p) * n(find === 'v' ? m : v)];
      const ans0 = find === 'p' ? n(p) : find === 'v' ? n(v) : n(m);
      if (!short(m, v, p) || slip.some((x) => Math.abs(x - ans0) < 1e-9) || SHOWN.has(`one ${plain(m)} ${plain(v)}`)) continue;
      // The equation for what is asked, so the right option is not always the same one.
      const want = { p: 'p = m × v', v: 'v = p ÷ m', m: 'm = p ÷ v' }[find];
      const wrong = { p: ['p = m ÷ v', 'p = v ÷ m'], v: ['v = p × m', 'v = m ÷ p'], m: ['m = p × v', 'm = v ÷ p'] }[find];
      const options = shuffle(r, [want, ...wrong]);
      const correct = options.indexOf(want);
      const steps: Step[] = [{ type: 'choice', prompt: `Which equation gives the ${find === 'p' ? 'momentum' : find === 'v' ? 'speed' : 'mass'}?`, options, correct, why: whyAll(options, correct, () => 'Start from p = m × v: more mass or more speed means more momentum. Rearrange it for what you want.') }];
      if (find === 'p') {
        steps.push({ type: 'number', prompt: 'So what is its momentum?', answer: p, unit: UNIT, feedback: (g) => (near(g, n(m) / n(v)) || near(g, n(v) / n(m)) ? 'That divides. Momentum is mass times velocity.' : 'Multiply the mass in kg by the speed in m/s.') });
        return {
          round: 'momentum',
          prompt: `${cap(an(t.what))} of mass ${s(m)} kg moves at ${s(v)} m/s. What is its momentum?`,
          steps,
          workings: [`p = m × v = ${s(m)} × ${s(v)} = ${s(p)} kg m/s.`],
          check: { kind: 'one', find, m: plain(m), v: plain(v), p: plain(p) },
        };
      }
      const ans = find === 'v' ? v : m;
      steps.push({
        type: 'number',
        prompt: find === 'v' ? `So what is ${t.person ? 'their' : 'its'} speed?` : `So what is ${t.person ? 'their' : 'its'} mass?`,
        answer: ans,
        unit: find === 'v' ? 'm/s' : 'kg',
        feedback: (g) => (near(g, n(p) * n(find === 'v' ? m : v)) ? 'That multiplies. Divide the momentum by the quantity you know.' : `Divide the momentum by the ${find === 'v' ? 'mass' : 'speed'}.`),
      });
      return {
        round: 'momentum',
        prompt: find === 'v' ? `${cap(an(t.what))} of mass ${s(m)} kg has a momentum of ${s(p)} kg m/s. How fast is it moving?` : `${cap(an(t.what))} moving at ${s(v)} m/s has a momentum of ${s(p)} kg m/s. What is its mass?`,
        steps,
        workings: [find === 'v' ? `v = p ÷ m = ${s(p)} ÷ ${s(m)} = ${s(v)} m/s.` : `m = p ÷ v = ${s(p)} ÷ ${s(v)} = ${s(m)} kg.`],
        check: { kind: 'one', find, m: plain(m), v: plain(v), p: plain(p) },
      };
    }
    const [m1, m2] = [D(pick(r, t.masses)), D(pick(r, t.masses))];
    const [v1, v2] = [D(pick(r, t.speeds)), D(pick(r, t.speeds))];
    const p1 = multiply(m1, v1);
    const p2 = multiply(m2, v2);
    // Towards each other (take one from the other), or the same way, one catching up (add them).
    const towards = r() < 0.6;
    const totalN = towards ? Math.abs(n(p1) - n(p2)) : n(p1) + n(p2);
    const total = D(String(totalN));
    if (n(p1) === n(p2) || !short(p1, p2, total) || SHOWN.has(`two ${plain(m1)} ${plain(v1)} ${plain(m2)} ${plain(v2)}`)) continue;
    if (!towards && n(v1) === n(v2)) continue; // one must be catching the other up
    const firstWins = n(p1) > n(p2);
    const combineRight = towards ? 'Take one from the other' : 'Add them';
    const sumOptions = shuffle(r, ['Take one from the other', 'Add them']);
    const sumRight = sumOptions.indexOf(combineRight);
    const dirOptions = shuffle(r, ['In the first one’s direction', 'In the second one’s direction']);
    const dirRight = dirOptions.indexOf(firstWins ? 'In the first one’s direction' : 'In the second one’s direction');
    const steps: Step[] = [
      { type: 'number', prompt: 'What is the momentum of the first?', answer: p1, unit: UNIT, feedback: signed(n(p1), () => 'Mass times speed.') },
      { type: 'number', prompt: 'And of the second?', answer: p2, unit: UNIT, feedback: signed(n(p2), () => 'Mass times speed.') },
      { type: 'choice', prompt: 'How do you combine the two momenta?', options: sumOptions, correct: sumRight, why: whyAll(sumOptions, sumRight, () => 'Momentum has a direction. Moving the same way, the momenta add; moving opposite ways, one counts as negative.') },
      {
        type: 'number',
        prompt: 'So what is the size of the total momentum?',
        answer: total,
        unit: UNIT,
        feedback: signed(totalN, (g) => (towards && near(g, n(p1) + n(p2)) ? 'That adds them. They move opposite ways, so take one from the other.' : !towards && near(g, Math.abs(n(p1) - n(p2))) ? 'That takes one from the other. They move the same way, so add them.' : towards ? 'Take the smaller momentum from the bigger one.' : 'Add the two momenta.')),
      },
    ];
    if (towards) steps.push({ type: 'choice', prompt: 'Which way does the total point?', options: dirOptions, correct: dirRight, why: { [1 - dirRight]: 'The total points the same way as the bigger momentum.' } });
    const [fast, slow] = n(v1) > n(v2) ? ['first', 'second'] : ['second', 'first'];
    return {
      round: 'momentum',
      prompt: towards
        ? `Two ${t.plural} move towards each other. The first has a mass of ${s(m1)} kg and moves at ${s(v1)} m/s; the second has a mass of ${s(m2)} kg and moves at ${s(v2)} m/s. What is their total momentum?`
        : `Two ${t.plural} move the same way along a straight line, the ${fast} catching up with the ${slow}. The first has a mass of ${s(m1)} kg and moves at ${s(v1)} m/s; the second has a mass of ${s(m2)} kg and moves at ${s(v2)} m/s. What is their total momentum?`,
      steps,
      workings: [
        `First: ${s(m1)} × ${s(v1)} = ${s(p1)} kg m/s. Second: ${s(m2)} × ${s(v2)} = ${s(p2)} kg m/s.`,
        towards ? `They move opposite ways, so the total is ${s(firstWins ? p1 : p2)} − ${s(firstWins ? p2 : p1)} = ${s(total)} kg m/s.` : `They move the same way, so the total is ${s(p1)} + ${s(p2)} = ${s(total)} kg m/s.`,
        ...(towards ? [`In the ${firstWins ? 'first' : 'second'} one’s direction, the bigger momentum.`] : []),
      ],
      check: { kind: 'two', m1: plain(m1), v1: plain(v1), m2: plain(m2), v2: plain(v2), total: plain(total), towardsFirst: firstWins, towards },
    };
  }
}
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);

// ---------------------------------------------------------------------------------------------
// Sticking together
// ---------------------------------------------------------------------------------------------

function stickQuestion(r: () => number): Question {
  for (;;) {
    const t = pick(r, THINGS);
    const m1 = D(pick(r, t.masses));
    const m2 = D(pick(r, t.masses));
    const v1 = D(pick(r, t.speeds));
    const slower = t.speeds.filter((x) => Number(x) < n(v1));
    const moving = slower.length > 0 && r() < 0.4; // the second one moving the same way, more slowly
    const v2 = moving ? D(pick(r, slower)) : D(0);
    const p = add(multiply(m1, v1), multiply(m2, v2));
    const M = add(m1, m2);
    const v = divide(p, M);
    if (!v || !short(v, p, M) || SHOWN.has(`stick ${plain(m1)} ${plain(v1)} ${plain(m2)} ${plain(v2)}`)) continue;
    return {
      round: 'stick',
      prompt: `${cap(an(t.what))} of mass ${s(m1)} kg moving at ${s(v1)} m/s runs into ${moving ? `${an(t.what)} of mass ${s(m2)} kg moving the same way at ${s(v2)} m/s` : `${an(t.what)} of mass ${s(m2)} kg standing still`}. ${t.join} How fast do they move afterwards?`,
      steps: [
        { type: 'number', prompt: 'What is the total momentum before the collision?', answer: p, unit: UNIT, feedback: (g) => (moving && near(g, n(m1) * n(v1)) ? 'That leaves out the second one, which is moving too.' : 'Add the momentum of each: mass times speed.') },
        { type: 'number', prompt: 'What is the total mass moving afterwards?', answer: M, unit: 'kg', feedback: (g) => (near(g, n(m1)) ? 'They stick together, so they move as one object: add the masses.' : 'Add the two masses.') },
        { type: 'number', prompt: 'So how fast do they move afterwards?', answer: v, unit: 'm/s', feedback: (g) => g.neg ? signed(n(v), () => '')(g) :  near(g, n(p) / n(m1)) ? 'That divides by one mass. Both move together, so divide by the total mass.' : 'Total momentum ÷ total mass.' },
      ],
      workings: [`Before: ${s(m1)} × ${s(v1)}${moving ? ` + ${s(m2)} × ${s(v2)}` : ' + 0'} = ${s(p)} kg m/s.`, `Afterwards the mass is ${s(m1)} + ${s(m2)} = ${s(M)} kg.`, `v = ${s(p)} ÷ ${s(M)} = ${s(v)} m/s, in the same direction.`],
      check: { kind: 'stick', m1: plain(m1), v1: plain(v1), m2: plain(m2), v2: plain(v2), v: plain(v) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Bouncing apart
// ---------------------------------------------------------------------------------------------

/** Balls and trolleys, with masses in kg and speeds in m/s. */
const BOUNCERS: { what: string; masses: string[]; speeds: string[] }[] = [
  { what: 'trolley', masses: ['0.5', '1', '1.5', '2', '2.5', '3', '4'], speeds: ['1', '2', '3', '4', '5', '6'] },
  { what: 'snooker ball', masses: ['0.17'], speeds: ['1', '1.5', '2', '2.5', '3', '4'] },
  { what: 'bowling ball', masses: ['5', '6', '7'], speeds: ['2', '3', '4', '5', '6'] },
];

function bounceQuestion(r: () => number): Question {
  for (;;) {
    const t = pick(r, BOUNCERS);
    const m1 = D(pick(r, t.masses));
    const m2 = D(pick(r, t.masses));
    const v1 = D(pick(r, t.speeds));
    // A carries on more slowly, or stops; a head-on snooker hit usually stops the white dead.
    const u1 = D(String((t.what === 'snooker ball' && r() < 0.7 ? 0 : pick(r, [0, 0.25, 0.5, 0.75])) * n(v1)));
    const p = multiply(m1, v1);
    const pA = multiply(m1, u1);
    const pB = sub(p, pA);
    const v2 = divide(pB, m2);
    if (!v2 || !short(v2, u1, p, pA, pB)) continue;
    // Physically possible: B ends up at least as fast as A, and no kinetic energy is created.
    const ke = (m: number, v: number) => 0.5 * m * v * v;
    // B strictly faster than A: if they moved off together, that would be sticking, not bouncing.
    if (n(v2) <= n(u1) || ke(n(m1), n(u1)) + ke(n(m2), n(v2)) > ke(n(m1), n(v1)) + 1e-9) continue;
    if (SHOWN.has(`bounce ${plain(m1)} ${plain(v1)} ${plain(m2)} ${plain(u1)}`)) continue;
    const stops = n(u1) === 0;
    return {
      round: 'bounce',
      prompt: `${cap(an(t.what))} of mass ${s(m1)} kg rolls at ${s(v1)} m/s into ${an(t.what)} of mass ${s(m2)} kg at rest. ${stops ? 'The first one stops dead.' : `The first one carries on the same way at ${s(u1)} m/s.`} How fast does the second one move off?`,
      steps: [
        { type: 'number', prompt: 'What is the total momentum before?', answer: p, unit: UNIT, feedback: () => 'Only the first one is moving: mass times speed.' },
        { type: 'number', prompt: 'What is the first one’s momentum afterwards?', answer: pA, unit: UNIT, feedback: () => (stops ? 'It stops, so it has no speed.' : 'Its mass times its new speed.') },
        { type: 'number', prompt: 'So what momentum does the second one have afterwards?', answer: pB, unit: UNIT, feedback: (g) => (!stops && near(g, n(p)) ? 'That is the whole total. The first one still has some of it.' : 'Total momentum before − the first one’s momentum after.') },
        { type: 'number', prompt: 'And how fast does the second one move?', answer: v2, unit: 'm/s', feedback: (g) => g.neg ? signed(n(v2), () => '')(g) :  n(m1) !== n(m2) && near(g, n(pB) / n(m1)) ? 'That divides by the first one’s mass. Use the mass of the second.' : 'Its momentum ÷ its mass.' },
      ],
      workings: [`Before: ${s(m1)} × ${s(v1)} = ${s(p)} kg m/s.`, `After, the first has ${s(m1)} × ${s(u1)} = ${s(pA)} kg m/s, so the second has ${s(p)} − ${s(pA)} = ${s(pB)} kg m/s.`, `Its speed: ${s(pB)} ÷ ${s(m2)} = ${s(v2)} m/s.`],
      check: { kind: 'bounce', m1: plain(m1), v1: plain(v1), m2: plain(m2), u1: plain(u1), v2: plain(v2) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Pushing apart from rest
// ---------------------------------------------------------------------------------------------

const kg = (x: string) => fmt(D(x));
/** "a 4 kg tool", "an 8 kg burst", "an 18 kg burst". */
const aKg = (x: string) => `${/^(8|11(?!\d)|18(?!\d))/.test(x) ? 'an' : 'a'} ${kg(x)} kg`;
const PAIRS: { a: string; b: string; text: (mA: string, vA: string, mB: string) => string; mA: string[]; vA: string[]; mB: string[] }[] = [
  { a: 'the first skater', b: 'the second skater', text: (mA, vA, mB) => `Two skaters stand still on the ice and push each other apart. The first, of mass ${kg(mA)} kg, moves off at ${vA} m/s. The second has a mass of ${kg(mB)} kg.`, mA: ['40', '45', '50', '55', '65', '70', '75'], vA: ['1', '1.5', '2', '2.5', '3'], mB: ['45', '50', '55', '60', '70', '75', '90'] },
  { a: 'the tool', b: 'the astronaut', text: (mA, vA, mB) => `An astronaut of mass ${kg(mB)} kg floats at rest and throws ${aKg(mA)} tool away at ${vA} m/s.`, mA: ['1', '1.5', '3', '4', '5'], vA: ['2', '4', '5', '6', '8'], mB: ['80', '90', '100', '110', '120'] },
  { a: 'the gas', b: 'the probe', text: (mA, vA, mB) => `A space probe is at rest. It fires ${aKg(mA)} burst of gas out of the back at ${vA} m/s, leaving the probe with a mass of ${kg(mB)} kg.`, mA: ['5', '8', '10', '12', '15', '20'], vA: ['200', '250', '300', '400', '500'], mB: ['400', '500', '600', '800', '1000'] },
];

function apartQuestion(r: () => number): Question {
  for (;;) {
    const P = pick(r, PAIRS);
    const mA = pick(r, P.mA);
    const vA = pick(r, P.vA);
    const mB = pick(r, P.mB);
    if (mA === mB || (mA === '60' && mB === '80') || (mB === '70' && mA === '2')) continue;
    const pA = Number(mA) * Number(vA);
    if (!short(D(String(pA)))) continue; // 112.5 kg m/s would need rounding to type
    const vB = pA / Number(mB);
    const a = exactOr3(vB);
    return {
      round: 'apart',
      prompt: `${P.text(mA, vA, mB)} How fast does ${P.b} move?`,
      steps: [
        { type: 'number', prompt: 'What is the total momentum before they push apart?', answer: D(0), unit: UNIT, feedback: () => 'Before they push apart nothing moves, so the total is zero.' },
        { type: 'number', prompt: `What is the momentum of ${P.a} afterwards?`, answer: D(pA), unit: UNIT, feedback: signed(pA, () => 'Mass times speed.') },
        {
          type: 'number',
          prompt: `So how fast does ${P.b} move? Give 3 significant figures if it does not come out exactly.`,
          ...a,
          unit: 'm/s',
          feedback: signed(vB, (g) =>
            near(g, Number(vA)) ? `That is the speed of ${P.a}. ${cap(P.b)} has the same momentum but a different mass.` : near(g, pA / (Number(mA) + Number(mB))) ? 'That divides by both masses. Use only its own mass.' : `Its momentum is the same size as that of ${P.a}: divide it by its own mass.`,
          ),
        },
      ],
      workings: [`Before, the total momentum is 0.`, `Afterwards ${P.a} has ${kg(mA)} × ${vA} = ${fmt(D(pA))} kg m/s, so ${P.b} has ${fmt(D(pA))} kg m/s the other way, keeping the total at zero.`, `Its speed: ${fmt(D(pA))} ÷ ${kg(mB)} = ${a.shown} m/s, the opposite way to ${P.a}.`],
      check: { kind: 'apart', mA, vA, mB, vB },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'stick') return stickQuestion(r);
  if (round === 'bounce') return bounceQuestion(r);
  if (round === 'apart') return apartQuestion(r);
  return momentumQuestion(r);
}

export const momentumQuiz: LessonQuiz<MomentumCheck> = {
  lesson: 'momentum',
  storageKey: 'stella-quiz-momentum-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
