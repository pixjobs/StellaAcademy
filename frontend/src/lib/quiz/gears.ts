/**
 * Quiz for "Gears and Gear Ratios" (KAN-92): gear ratio and speed, moments, the trade between speed and moment,
 * and gear trains. The lesson spans Year 5 to GCSE, so every number is whole or a simple decimal, worked
 * without a calculator.
 */
import { D, fmt, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'ratio' | 'moment' | 'trade' | 'train';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  ratio: { label: 'Gear ratio and speed', blurb: 'Gear ratio = driven teeth ÷ driver teeth. The driven gear’s speed is the driver’s speed ÷ the ratio.' },
  moment: { label: 'Moments', blurb: 'Moment = force × distance, with the distance in metres.' },
  trade: { label: 'Speed and moment', blurb: 'Slower but stronger, or faster but weaker: never both.' },
  train: { label: 'Gear trains', blurb: 'Meshing gears turn opposite ways. The last gear’s speed depends on the first and last gears only.' },
};

export type GearsCheck =
  | { kind: 'ratio'; driver: number; driven: number; speed: number; ratio: string; out: number }
  | { kind: 'moment'; force: string; cm: number; moment: string; ask: 'moment' | 'force' }
  | { kind: 'trade'; driver: number; driven: number; speed: number; moment: number; ratio: string; out: number; outMoment: string }
  | { kind: 'train'; teeth: number[]; clockwise: boolean; speed: number; out: number };
type Question = Q<GearsCheck>;

/** Shown on the page: the worked example, the idea's 10 to 40, and the practice questions. */
const SHOWN_PAIRS = new Set(['12 36', '10 40', '20 40', '10 50', '30 10']);
/** In the speed and moment round, the page's motor examples: driver, driven, moment. */
const SHOWN_TRADES = new Set(['12 36 5', '10 50 3']);
const SHOWN_MOMENTS = new Set(['10 20']); // 10 N at 20 cm

const TEETH = [8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60];
/** Ratios a pupil can divide by without a calculator. */
const EASY_RATIOS = new Set([0.2, 0.25, 0.5, 1.5, 2, 2.5, 3, 4, 5]);
/** "a 12-tooth gear", "an 18-tooth gear". */
const aGear = (t: number) => `${/^(8|11|18)/.test(String(t)) ? 'an' : 'a'} ${t}-tooth gear`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const near = (g: Digits, x: number) => Math.abs(toNumber(g) - x) <= 0.005 * Math.abs(x);
const turns = (n: number) => `${fmt(D(n))} turns a minute`;

/** The ratio driven ÷ driver as an exact decimal (2.5, 0.4), or null when it does not end within 2 places. */
function ratioOf(driver: number, driven: number): Digits | null {
  const hundredths = (driven * 100) / driver;
  return Number.isInteger(hundredths) ? D(String(hundredths / 100)) : null;
}

/** A driver and driven pair with an easy ratio, and a driver speed giving a whole-number driven speed. */
function pair(r: () => number, lo: number, hi: number): { driver: number; driven: number; ratio: Digits; speed: number; out: number } {
  for (;;) {
    const driver = pick(r, TEETH);
    const driven = pick(r, TEETH);
    const ratio = ratioOf(driver, driven);
    if (!ratio || !EASY_RATIOS.has(toNumber(ratio)) || SHOWN_PAIRS.has(`${driver} ${driven}`)) continue;
    const speed = int(r, lo / 10, hi / 10) * 10;
    const out = (speed * driver) / driven;
    if (!Number.isInteger(out) || out > 1500) continue;
    return { driver, driven, ratio, speed, out };
  }
}

/** The gear-ratio step. "1:2" or a rounded 0.33 for the upside-down ratio still gets the named feedback. */
const ratioStep = (driver: number, driven: number, ratio: Digits): Step => ({
  type: 'number',
  prompt: 'What is the gear ratio? (Type it as one number, such as 2 for 2 : 1.)',
  answer: ratio,
  ratio: true,
  feedback: (g) => (Math.abs(toNumber(g) - driver / driven) < 0.006 ? 'That is upside down. The gear ratio is the driven gear’s teeth divided by the driver’s.' : 'Divide the teeth on the driven gear by the teeth on the driver.'),
});

/** The driven gear's speed, with "multiplied by the ratio" named. */
const speedStep = (speed: number, ratio: Digits, out: number): Step => ({
  type: 'number',
  prompt: 'How many turns a minute does the driven gear make?',
  answer: D(out),
  unit: 'turns a minute',
  feedback: (g) => (near(g, speed * toNumber(ratio)) ? 'That multiplies by the ratio. Divide the driver’s speed by the ratio.' : 'Divide the driver’s speed by the gear ratio.'),
});

// ---------------------------------------------------------------------------------------------
// Gear ratio and speed
// ---------------------------------------------------------------------------------------------

/** What turns the driver, and a realistic speed range: people pedal at about 40 to 100 turns a minute. */
const DRIVERS: [string, number, number][] = [
  ['A motor is fixed to', 60, 300],
  ['The pedals turn', 40, 100],
  ['A hand crank turns', 30, 120],
];

function ratioQuestion(r: () => number): Question {
  const [what, lo, hi] = pick(r, DRIVERS);
  const { driver, driven, ratio, speed, out } = pair(r, lo, hi);
  const options = shuffle(r, [`The ${driven}-tooth gear`, `The ${driver}-tooth gear`]);
  const correct = options.indexOf(`The ${driven}-tooth gear`);
  // The two gears in either order, so the first one named is not always the driver.
  const named = shuffle(r, [driver, driven]);
  return {
    round: 'ratio',
    prompt: `${cap(aGear(named[0]))} and ${aGear(named[1])} mesh. ${what} the ${driver}-tooth gear, at ${turns(speed)}. How fast does the driven gear turn?`,
    steps: [
      { type: 'choice', prompt: 'Which is the driven gear?', options, correct, why: whyAll(options, correct, () => 'The driver is the gear being turned by the motor, pedals or crank. The driven gear is the one it turns.') },
      ratioStep(driver, driven, ratio),
      speedStep(speed, ratio, out),
    ],
    workings: [`The driven gear has ${driven} teeth, so the ratio is ${driven} ÷ ${driver} = ${fmt(ratio)}.`, `Its speed is ${speed} ÷ ${fmt(ratio)} = ${turns(out)}.`],
    check: { kind: 'ratio', driver, driven, speed, ratio: fmt(ratio), out },
  };
}

// ---------------------------------------------------------------------------------------------
// Moments
// ---------------------------------------------------------------------------------------------

/** Real turning forces, with friendly forces (N) and distances (cm). A seesaw's distance is given in metres. */
const LEVERS: { push: (f: number, d: string) => string; need: (d: string) => string; forces: number[]; cm: number[]; metres?: boolean }[] = [
  { push: (f, d) => `A force of ${f} N pushes at the end of a spanner, ${d} from the nut, at right angles.`, need: (d) => `The force acts at the end of a spanner, ${d} from the nut, at right angles.`, forces: [20, 30, 40, 50, 60, 80, 100, 120, 150], cm: [15, 20, 25, 30, 40] },
  { push: (f, d) => `A force of ${f} N pushes on a door handle, ${d} from the hinges, at right angles.`, need: (d) => `The force acts on the door handle, ${d} from the hinges, at right angles.`, forces: [5, 10, 15, 20], cm: [50, 60, 70, 80] },
  { push: (f, d) => `A cyclist pushes down with ${f} N on a pedal, ${d} from the centre of the crank, at right angles.`, need: (d) => `The pedal is ${d} from the centre of the crank, and the push is at right angles.`, forces: [100, 150, 200, 250, 300, 400], cm: [15, 20] },
  { push: (f, d) => `A child sitting on a seesaw pushes down with ${f} N, ${d} from the pivot.`, need: () => '', forces: [200, 250, 300, 350, 400], cm: [150, 200, 250], metres: true },
];

function momentQuestion(r: () => number): Question {
  for (;;) {
    const L = pick(r, LEVERS);
    const force = pick(r, L.forces);
    const cm = pick(r, L.cm);
    if (SHOWN_MOMENTS.has(`${force} ${cm}`)) continue;
    const metres = D(String(cm / 100));
    const moment = D(String((force * cm) / 100));
    const where = L.metres ? `${fmt(metres)} m` : `${cm} cm`;
    // A seesaw is only ever asked for its moment: "the force needed to turn a seesaw" is not a real question.
    const ask: 'moment' | 'force' = L.metres || r() < 0.7 ? 'moment' : 'force';
    const steps: Step[] = [];
    if (!L.metres) steps.push({ type: 'number', prompt: `The distance must be in metres. What is ${cm} cm in metres?`, answer: metres, unit: 'm', feedback: () => 'There are 100 cm in a metre: divide by 100.' });
    if (ask === 'moment') {
      if (L.metres) {
        const options = shuffle(r, ['Multiply the force by the distance', 'Divide the force by the distance']);
        const correct = options.indexOf('Multiply the force by the distance');
        steps.push({ type: 'choice', prompt: 'How do you find the moment?', options, correct, why: whyAll(options, correct, () => 'The moment is the force times its distance from the pivot.') });
      }
      steps.push({
        type: 'number',
        prompt: L.metres ? 'What is the moment?' : 'So what is the moment?',
        answer: moment,
        unit: 'N m',
        feedback: (g) =>
          !L.metres && near(g, force * cm) ? 'That uses the distance in centimetres. Change it to metres first.' : near(g, force / (cm / 100)) ? 'That divides. The moment is the force times the distance.' : 'Multiply the force in newtons by the distance in metres.',
      });
      return {
        round: 'moment',
        prompt: `${L.push(force, where)} What is its moment?`,
        steps,
        workings: [...(L.metres ? [] : [`${cm} cm = ${fmt(metres)} m.`]), `Moment = ${force} × ${fmt(metres)} = ${fmt(moment)} N m.`],
        check: { kind: 'moment', force: String(force), cm, moment: fmt(moment).replace(/,/g, ''), ask },
      };
    }
    const options = shuffle(r, ['Force = moment ÷ distance', 'Force = moment × distance']);
    const correct = options.indexOf('Force = moment ÷ distance');
    steps.push(
      { type: 'choice', prompt: 'Moment = force × distance. How do you find the force?', options, correct, why: whyAll(options, correct, () => 'Undo the multiplying: divide the moment by the distance.') },
      {
        type: 'number',
        prompt: 'So what force is needed?',
        answer: D(force),
        unit: 'N',
        feedback: (g) => (near(g, toNumber(moment) / cm) ? 'That uses the distance in centimetres. Change it to metres first.' : near(g, toNumber(moment) * (cm / 100)) ? 'That multiplies. Divide the moment by the distance.' : 'Divide the moment by the distance in metres.'),
      },
    );
    return {
      round: 'moment',
      prompt: `A turning effect of ${fmt(moment)} N m is needed. ${L.need(where)} What force is needed?`,
      steps,
      workings: [`${cm} cm = ${fmt(metres)} m.`, `Force = ${fmt(moment)} ÷ ${fmt(metres)} = ${force} N.`],
      check: { kind: 'moment', force: String(force), cm, moment: fmt(moment).replace(/,/g, ''), ask },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Speed and moment together
// ---------------------------------------------------------------------------------------------

const TRADES = ['more slowly, with a bigger moment', 'more slowly, with a smaller moment', 'faster, with a bigger moment', 'faster, with a smaller moment'];

function tradeQuestion(r: () => number): Question {
  for (;;) {
    const { driver, driven, ratio, speed, out } = pair(r, 60, 300);
    const moment = int(r, 2, 20);
    const outMomentHundredths = (moment * driven * 100) / driver;
    if (!Number.isInteger(outMomentHundredths) || SHOWN_TRADES.has(`${driver} ${driven} ${moment}`)) continue;
    const outMoment = D(String(outMomentHundredths / 100));
    const right = driven > driver ? TRADES[0] : TRADES[3];
    const options = shuffle(r, [...TRADES]);
    const correct = options.indexOf(right);
    return {
      round: 'trade',
      prompt: `A motor turns ${aGear(driver)} at ${turns(speed)} with a moment of ${moment} N m. It drives ${aGear(driven)}. How fast does the driven gear turn, and with what moment?`,
      steps: [
        ratioStep(driver, driven, ratio),
        speedStep(speed, ratio, out),
        {
          type: 'number',
          prompt: 'What moment does the driven gear give?',
          answer: outMoment,
          unit: 'N m',
          feedback: (g) => (near(g, moment / toNumber(ratio)) ? 'That divides by the ratio. The moment is multiplied by the gear ratio.' : 'Multiply the motor’s moment by the gear ratio.'),
        },
        { type: 'choice', prompt: 'So, compared with the motor’s gear, the driven gear turns…', options, correct, why: whyAll(options, correct, () => 'Look at your two answers: gears trade speed for moment, so one goes up and the other goes down.') },
      ],
      workings: [`Ratio: ${driven} ÷ ${driver} = ${fmt(ratio)}.`, `Speed: ${speed} ÷ ${fmt(ratio)} = ${turns(out)}. Moment: ${moment} × ${fmt(ratio)} = ${fmt(outMoment)} N m.`, `So it turns ${right}.`],
      check: { kind: 'trade', driver, driven, speed, moment, ratio: fmt(ratio), out, outMoment: fmt(outMoment) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Gear trains: three gears in a line
// ---------------------------------------------------------------------------------------------

function trainQuestion(r: () => number): Question {
  for (;;) {
    const teeth = [pick(r, TEETH), pick(r, TEETH), pick(r, TEETH)];
    const [a, b, c] = teeth;
    if (new Set(teeth).size < 3 || !EASY_RATIOS.has(c / a)) continue;
    const speed = int(r, 6, 30) * 10;
    const out = (speed * a) / c;
    const viaB = (speed * a) / b; // the slip: gear B's speed, not C's
    // Each slip must give its own number, so its feedback can be named.
    if (!Number.isInteger(out) || out > 1500 || viaB === out || viaB === (speed * c) / a) continue;
    const clockwise = r() < 0.5;
    const dirOf = (k: number) => ((k % 2 === 0) === clockwise ? 'Clockwise' : 'Anticlockwise');
    const steps: Step[] = ['B', 'C'].map((name, i) => {
      const options = shuffle(r, ['Clockwise', 'Anticlockwise']);
      const correct = options.indexOf(dirOf(i + 1));
      return { type: 'choice' as const, prompt: `Which way does gear ${name} turn?`, options, correct, why: { [1 - correct]: `Meshing gears turn in opposite directions, so ${name} turns the other way to ${i === 0 ? 'A' : 'B'}.` } };
    });
    steps.push({
      type: 'number',
      prompt: 'How many turns a minute does gear C make?',
      answer: D(out),
      unit: 'turns a minute',
      feedback: (g) =>
        near(g, viaB) ? 'That is the speed of gear B. Gear C is the one asked about.' : near(g, (speed * c) / a) ? 'That is upside down: multiply A’s speed by A’s teeth, then divide by C’s teeth.' : 'Work out how many of A’s teeth pass each minute, then divide by the teeth on C.',
    });
    return {
      round: 'train',
      prompt: `Gears A (${a} teeth), B (${b} teeth) and C (${c} teeth) mesh in a line. Gear A is the driver and turns ${clockwise ? 'clockwise' : 'anticlockwise'} at ${turns(speed)}.`,
      steps,
      workings: [
        `Each gear turns the opposite way to the one before it, so B turns ${dirOf(1).toLowerCase()} and C turns ${dirOf(2).toLowerCase()}.`,
        `Each minute ${speed} × ${a} = ${fmt(D(speed * a))} teeth of A pass, and the same number pass on B and on C, so B does not change C’s speed.`,
        `Gear C: ${fmt(D(speed * a))} ÷ ${c} = ${turns(out)}.`,
      ],
      check: { kind: 'train', teeth, clockwise, speed, out },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'moment') return momentQuestion(r);
  if (round === 'trade') return tradeQuestion(r);
  if (round === 'train') return trainQuestion(r);
  return ratioQuestion(r);
}

export const gearsQuiz: LessonQuiz<GearsCheck> = {
  lesson: 'gears',
  storageKey: 'stella-quiz-gears-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
