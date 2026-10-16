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
  | { kind: 'trade'; driver: number; driven: number; speed: number; moment: number; out: number; outMoment: string }
  | { kind: 'train'; teeth: number[]; clockwise: boolean; speed: number; out: number };
type Question = Q<GearsCheck>;

/** Shown on the page: the worked example, the idea's 10 to 40, and the practice questions (driver, driven, speed). */
const SHOWN = new Set(['12 36 90', '12 36', '10 40', '20 40', '20 40 100', '10 50', '30 10 60', '30 10']);
const SHOWN_MOMENTS = new Set(['10 20']); // 10 N at 20 cm

const TEETH = [8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60];
/** The ratio driven ÷ driver as an exact decimal (2.5, 0.4), or null when it does not end within 2 places. */
function ratioOf(driver: number, driven: number): Digits | null {
  const hundredths = (driven * 100) / driver;
  return Number.isInteger(hundredths) ? D(String(hundredths / 100)) : null;
}
/** Ratios a pupil can divide by without a calculator. */
const EASY_RATIOS = new Set([0.2, 0.25, 0.5, 1.5, 2, 2.5, 3, 4, 5]);
/** "a 12-tooth gear", "an 18-tooth gear". */
const aGear = (t: number) => `${/^(8|11|18)/.test(String(t)) ? 'an' : 'a'} ${t}-tooth gear`;
const near = (g: Digits, x: number) => Math.abs(toNumber(g) - x) <= 0.005 * Math.abs(x);
const turns = (n: number) => `${fmt(D(n))} turns a minute`;

/** A driver and driven pair with a ratio that ends neatly, and a driver speed giving a whole-number driven speed. */
function pair(r: () => number, trade = false, top = 300): { driver: number; driven: number; ratio: Digits; speed: number; out: number } {
  for (;;) {
    const driver = pick(r, TEETH);
    const driven = pick(r, TEETH);
    const ratio = ratioOf(driver, driven);
    if (!ratio || !EASY_RATIOS.has(toNumber(ratio))) continue;
    const speed = int(r, 2, top / 10) * 10;
    const out = (speed * driver) / driven;
    if (!Number.isInteger(out) || out > 1500) continue;
    if (SHOWN.has(`${driver} ${driven} ${speed}`) || (!trade && SHOWN.has(`${driver} ${driven}`))) continue;
    return { driver, driven, ratio, speed, out };
  }
}

/** The gear-ratio step, with the upside-down slip named. */
const ratioStep = (driver: number, driven: number, ratio: Digits): Step => ({
  type: 'number',
  prompt: 'What is the gear ratio?',
  answer: ratio,
  feedback: (g) => (near(g, driver / driven) ? 'That is upside down. The gear ratio is the driven gear’s teeth divided by the driver’s.' : 'Divide the teeth on the driven gear by the teeth on the driver.'),
});

/** The driven gear's speed, with "multiplied by the ratio" named. */
const speedStep = (speed: number, ratio: Digits, out: number, gear: string): Step => ({
  type: 'number',
  prompt: `How many turns a minute does the ${gear} make?`,
  answer: D(out),
  unit: 'turns a minute',
  feedback: (g) => (near(g, speed * toNumber(ratio)) && toNumber(ratio) !== 1 ? 'That multiplies by the ratio. A bigger driven gear turns more slowly: divide the speed by the ratio.' : 'Divide the driver’s speed by the gear ratio.'),
});

// ---------------------------------------------------------------------------------------------
// Gear ratio and speed
// ---------------------------------------------------------------------------------------------

function ratioQuestion(r: () => number): Question {
  // What turns the driver, and how fast it can: people pedal at up to about 100 turns a minute.
  const [what, top] = pick(r, [['A motor is fixed to', 300], ['The pedals turn', 100], ['A hand crank turns', 120]] as const);
  const { driver, driven, ratio, speed, out } = pair(r, false, top);
  const options = shuffle(r, [`The ${driven}-tooth gear`, `The ${driver}-tooth gear`]);
  const correct = options.indexOf(`The ${driven}-tooth gear`);
  return {
    round: 'ratio',
    prompt: `${aGear(driver).replace(/^a/, 'A')} and ${aGear(driven)} mesh. ${what} the ${driver}-tooth gear, at ${turns(speed)}. How fast does the other gear turn?`,
    steps: [
      { type: 'choice', prompt: 'Which is the driven gear?', options, correct, why: whyAll(options, correct, () => 'The driver is the gear being turned by the motor, pedals or crank. The driven gear is the one it turns.') },
      ratioStep(driver, driven, ratio),
      speedStep(speed, ratio, out, `${driven}-tooth gear`),
    ],
    workings: [`The driven gear has ${driven} teeth, so the ratio is ${driven} ÷ ${driver} = ${fmt(ratio)}.`, `Its speed is ${speed} ÷ ${fmt(ratio)} = ${fmt(D(out))} turns a minute.`],
    check: { kind: 'ratio', driver, driven, speed, ratio: fmt(ratio), out },
  };
}

// ---------------------------------------------------------------------------------------------
// Moments
// ---------------------------------------------------------------------------------------------

/** Real turning forces: the force range in N and the distance range in cm (multiples of 5). */
const LEVERS: { thing: string; at: string; force: [number, number]; cm: [number, number] }[] = [
  { thing: 'a spanner', at: 'at the end of a spanner', force: [20, 150], cm: [15, 40] },
  { thing: 'a door', at: 'on a door handle', force: [5, 20], cm: [60, 80] },
  { thing: 'a bicycle pedal', at: 'on a bicycle pedal', force: [100, 400], cm: [15, 20] },
  { thing: 'a seesaw', at: 'by a child sitting on a seesaw', force: [200, 400], cm: [100, 200] },
  { thing: 'a tap', at: 'on the edge of a tap handle', force: [5, 30], cm: [5, 5] },
];

function momentQuestion(r: () => number): Question {
  for (;;) {
    const L = pick(r, LEVERS);
    const force = int(r, L.force[0] / 5, L.force[1] / 5) * 5;
    const cm = int(r, L.cm[0] / 5, L.cm[1] / 5) * 5;
    // At 10 cm and at 1 m two slips give the same number (× cm equals ÷ metres), so neither could be named.
    if (cm === 10 || cm === 100 || SHOWN_MOMENTS.has(`${force} ${cm}`)) continue;
    const metres = D(String(cm / 100));
    const moment = D(String((force * cm) / 100));
    const inMetresGiven = cm >= 100 && r() < 0.5;
    const where = inMetresGiven ? `${fmt(metres)} m` : `${cm} cm`;
    const ask: 'moment' | 'force' = r() < 0.7 ? 'moment' : 'force';
    const steps: Step[] = [];
    if (!inMetresGiven) steps.push({ type: 'number', prompt: `The distance must be in metres. What is ${cm} cm in metres?`, answer: metres, unit: 'm', feedback: () => 'There are 100 cm in a metre: divide by 100.' });
    if (ask === 'moment') {
      steps.push({
        type: 'number',
        prompt: 'So what is the moment?',
        answer: moment,
        unit: 'N m',
        feedback: (g) =>
          !inMetresGiven && near(g, force * cm) ? 'That uses the distance in centimetres. Change it to metres first.' : near(g, force / (cm / 100)) ? 'That divides. The moment is the force times the distance.' : 'Multiply the force in newtons by the distance in metres.',
      });
      return {
        round: 'moment',
        prompt: `A force of ${force} N pushes ${L.at}, ${where} from the pivot, at right angles. What is its moment?`,
        steps,
        workings: [`${cm} cm = ${fmt(metres)} m.`, `Moment = ${force} × ${fmt(metres)} = ${fmt(moment)} N m.`],
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
        feedback: (g) => (!inMetresGiven && near(g, toNumber(moment) / cm) ? 'That uses the distance in centimetres. Change it to metres first.' : near(g, toNumber(moment) * (cm / 100)) ? 'That multiplies. Divide the moment by the distance.' : 'Divide the moment by the distance in metres.'),
      },
    );
    return {
      round: 'moment',
      prompt: `Turning ${L.thing} needs a moment of ${fmt(moment)} N m. The force acts ${where} from the pivot, at right angles. What force is needed?`,
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
    const { driver, driven, ratio, speed, out } = pair(r, true);
    const moment = int(r, 2, 20);
    const outMoment = D(String((moment * driven * 100) / driver / 100));
    if (!Number.isInteger((moment * driven * 100) / driver) || SHOWN.has(`${driver} ${driven} ${speed}`)) continue;
    const slower = driven > driver;
    const right = slower ? TRADES[0] : TRADES[3];
    const options = shuffle(r, [...TRADES]);
    const correct = options.indexOf(right);
    return {
      round: 'trade',
      prompt: `A motor turns ${aGear(driver)} at ${turns(speed)} with a moment of ${moment} N m. It drives ${aGear(driven)}. How fast does the driven gear turn, and with what moment?`,
      steps: [
        ratioStep(driver, driven, ratio),
        speedStep(speed, ratio, out, 'driven gear'),
        {
          type: 'number',
          prompt: 'What moment does the driven gear give?',
          answer: outMoment,
          unit: 'N m',
          feedback: (g) => (near(g, moment / toNumber(ratio)) ? 'That divides by the ratio. The moment is multiplied by the gear ratio.' : 'Multiply the motor’s moment by the gear ratio.'),
        },
        { type: 'choice', prompt: 'So, compared with the motor’s gear, the driven gear turns…', options, correct, why: whyAll(options, correct, () => 'Look at your two answers: gears trade speed for moment, so one goes up and the other goes down.') },
      ],
      workings: [`Ratio: ${driven} ÷ ${driver} = ${fmt(ratio)}.`, `Speed: ${speed} ÷ ${fmt(ratio)} = ${fmt(D(out))} turns a minute. Moment: ${moment} × ${fmt(ratio)} = ${fmt(outMoment)} N m.`, `So it turns ${right}.`],
      check: { kind: 'trade', driver, driven, speed, moment, out, outMoment: fmt(outMoment) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Gear trains
// ---------------------------------------------------------------------------------------------

const NAMES = ['A', 'B', 'C', 'D'];

function trainQuestion(r: () => number): Question {
  for (;;) {
    const n = r() < 0.7 ? 3 : 4;
    const teeth = Array.from({ length: n }, () => pick(r, TEETH));
    if (new Set(teeth).size < n || !EASY_RATIOS.has(teeth[n - 1] / teeth[0])) continue;
    const first = teeth[0];
    const last = teeth[n - 1];
    const speed = int(r, 2, 30) * 10;
    const out = (speed * first) / last;
    if (!Number.isInteger(out) || out > 1500) continue;
    const viaNext = (speed * first) / teeth[1]; // the slip: the speed of the gear next to A, not the last one
    const clockwise = r() < 0.5;
    const dir = (k: number) => ((k % 2 === 0) === clockwise ? 'Clockwise' : 'Anticlockwise');
    const steps: Step[] = [];
    for (let k = 1; k < n; k++) {
      const options = ['Clockwise', 'Anticlockwise'];
      const correct = options.indexOf(dir(k));
      steps.push({ type: 'choice', prompt: `Which way does gear ${NAMES[k]} turn?`, options, correct, why: { [1 - correct]: `Meshing gears turn in opposite directions, so ${NAMES[k]} turns the other way to ${NAMES[k - 1]}.` } });
    }
    const lastName = NAMES[n - 1];
    steps.push({
      type: 'number',
      prompt: `How many turns a minute does gear ${lastName} make?`,
      answer: D(out),
      unit: 'turns a minute',
      feedback: (g) =>
        near(g, viaNext) && viaNext !== out
          ? `That is the speed of gear B. Gear ${lastName} is the one asked about.`
          : near(g, (speed * last) / first)
            ? 'That multiplies by the ratio. Divide the speed by it.'
            : `The gears in between do not change the result: use the teeth on A and on ${lastName}.`,
    });
    const list = teeth.map((t, k) => `${NAMES[k]} (${t} teeth)`);
    return {
      round: 'train',
      prompt: `Gears ${list.slice(0, -1).join(', ')} and ${list[n - 1]} mesh in a line. Gear A is the driver and turns ${clockwise ? 'clockwise' : 'anticlockwise'} at ${turns(speed)}.`,
      steps,
      workings: [
        `Each gear turns the opposite way to the one before it, so ${NAMES.slice(1, n).map((x, k) => `${x} turns ${dir(k + 1).toLowerCase()}`).join(', ')}.`,
        `The overall ratio is ${last} ÷ ${first}, because each gear in between passes the same number of teeth a minute along.`,
        `Gear ${lastName}: ${speed} × ${first} ÷ ${last} = ${fmt(D(out))} turns a minute.`,
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

