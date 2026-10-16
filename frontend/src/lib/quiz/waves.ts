/**
 * Quiz for "Waves: Frequency, Wavelength and Speed" (KAN-95): the wave equation, frequency and period, the same
 * speed at a new frequency, and describing a wave. GCSE; calculator answers to 3 significant figures.
 */
import { D, approx, approxStd, fmt, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'equation' | 'period' | 'compare' | 'describe';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  equation: { label: 'The wave equation', blurb: 'v = fλ, with the frequency in hertz and the wavelength in metres. Give 3 significant figures.' },
  period: { label: 'Frequency and period', blurb: 'Frequency is waves each second. The period is the time for one wave: T = 1 ÷ f.' },
  compare: { label: 'Same speed', blurb: 'When the speed stays the same, a higher frequency means a shorter wavelength.' },
  describe: { label: 'Describing a wave', blurb: 'Wavelength, amplitude, and transverse or longitudinal.' },
};

export type WavesCheck =
  | { kind: 'equation'; find: 'v' | 'f' | 'lambda'; v: number; f: number; lambda: number }
  | { kind: 'period'; waves?: number; seconds?: number; f: number; T: number; perMinute?: number }
  | { kind: 'compare'; v: number; f1: number; f2: number; lambda1: number; lambda2: number }
  | { kind: 'describe'; length: number; count: number; lambda: number; height?: number; amplitude?: number; transverse: boolean };
type Question = Q<WavesCheck>;

const C = 3.0e8;
const SOUND = 343;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
/** A frequency as a pupil would read it: 440 Hz, 1.5 kHz, 97.3 MHz, 2.45 GHz. */
function hz(f: number): { text: string; prefix: '' | 'k' | 'M' | 'G'; value: number } {
  if (f >= 1e9) return { text: `${+(f / 1e9).toPrecision(4)} GHz`, prefix: 'G', value: +(f / 1e9).toPrecision(4) };
  if (f >= 1e6) return { text: `${+(f / 1e6).toPrecision(4)} MHz`, prefix: 'M', value: +(f / 1e6).toPrecision(4) };
  if (f >= 1e4) return { text: `${+(f / 1e3).toPrecision(4)} kHz`, prefix: 'k', value: +(f / 1e3).toPrecision(4) };
  return { text: `${fmt(D(f))} Hz`, prefix: '', value: f };
}
const POWER = { '': 0, k: 3, M: 6, G: 9 } as const;
/** "a 660 Hz note", "an 880 Hz note", "an 88 MHz signal": by how the number is said. */
const an = (text: string) => `${/^(8|11|18)/.test(text) ? 'an' : 'a'} ${text}`;
/** A value in standard form needs brackets after a ÷ sign. */
const bracket = (s: string) => (s.includes('×') ? `(${s})` : s);

// ---------------------------------------------------------------------------------------------
// The wave equation
// ---------------------------------------------------------------------------------------------

/** Waves and realistic values: the speed, and frequencies in Hz to choose from. */
const WAVES: { what: string; v: number; freqs: number[]; findSpeed?: string }[] = [
  { what: 'A sound in air', v: SOUND, freqs: [128, 196, 220, 256, 262, 330, 392, 440, 512, 660, 880, 1000, 2000, 4000, 15000, 18000] },
  { what: 'An FM radio station', v: C, freqs: [88.1e6, 89.7e6, 91.3e6, 93.5e6, 95.8e6, 97.3e6, 98.8e6, 102.2e6, 104.9e6, 107.5e6] },
  { what: 'A mobile phone signal', v: C, freqs: [0.8e9, 0.9e9, 1.8e9, 2.1e9, 2.6e9, 3.5e9] },
  { what: 'A GPS satellite signal', v: C, freqs: [1.575e9, 1.227e9] },
  { what: 'A microwave oven', v: C, freqs: [2.45e9] },
  { what: 'A satellite TV signal', v: C, freqs: [10.7e9, 11.2e9, 11.7e9, 12.1e9] },
];
/** Shown on the page: 343 Hz sound, 100 MHz radio, Wi-Fi at 2.4 and 5 GHz, and 8.4 GHz. */
const SHOWN_F = new Set([343, 100e6, 2.4e9, 5e9, 8.4e9]);
const FORMS = { v: 'v = f × λ', lambda: 'λ = v ÷ f', f: 'f = v ÷ λ' } as const;
const WRONG_FORMS = ['λ = f ÷ v', 'v = f ÷ λ', 'f = v × λ'];

function ripple(r: () => number): { v: number; f: number; lambdaCm: number } {
  for (;;) {
    const f = pick(r, [0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5]);
    const lambdaCm = pick(r, [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80]);
    if (f === 2 && lambdaCm === 150) continue; // the page's ripples
    return { v: (f * lambdaCm) / 100, f, lambdaCm };
  }
}

function equationQuestion(r: () => number): Question {
  for (;;) {
    const ripples = r() < 0.3;
    let v: number, f: number, lambda: number, what: string;
    let lambdaText: string | null = null;
    if (ripples) {
      const w = ripple(r);
      [v, f, lambda, what] = [w.v, w.f, w.lambdaCm / 100, 'Ripples on a pond'];
      lambdaText = `${w.lambdaCm} cm`;
    } else {
      const w = pick(r, WAVES);
      f = pick(r, w.freqs);
      if (SHOWN_F.has(f)) continue;
      [v, lambda, what] = [w.v, w.v / f, w.what];
    }
    const find: 'v' | 'f' | 'lambda' = ripples ? pick(r, ['v', 'f', 'lambda'] as const) : pick(r, ['lambda', 'lambda', 'f'] as const);
    const F = hz(f);
    const right = FORMS[find];
    const options = shuffle(r, [right, ...shuffle(r, WRONG_FORMS).slice(0, 2)]);
    const correct = options.indexOf(right);
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `Which form of the wave equation finds the ${find === 'v' ? 'speed' : find === 'f' ? 'frequency' : 'wavelength'}?`,
        options,
        correct,
        why: whyAll(options, correct, () => 'Start from v = f × λ, and rearrange it so the quantity you want is on its own.'),
      },
    ];
    // A prefix to change first: the frequency in kHz, MHz or GHz, or a wavelength in cm.
    const fGiven = find !== 'f' && F.prefix !== '';
    if (fGiven) steps.push({ type: 'number', prompt: `First, what is ${F.text} in hertz?`, ...approxStd(f), unit: 'Hz', feedback: () => `${{ k: 'Kilo', M: 'Mega', G: 'Giga' }[F.prefix as 'k' | 'M' | 'G']} means ${{ k: '1,000', M: 'a million', G: 'a thousand million' }[F.prefix as 'k' | 'M' | 'G']}.` });
    const lambdaGivenCm = ripples && find !== 'lambda';
    if (lambdaGivenCm) steps.push({ type: 'number', prompt: `First, what is ${lambdaText} in metres?`, answer: D(String(lambda)), unit: 'm', feedback: () => 'There are 100 cm in a metre.' });
    const answer = find === 'v' ? v : find === 'f' ? f : lambda;
    const unit = find === 'v' ? 'm/s' : find === 'f' ? 'Hz' : 'm';
    const inPrefix = fGiven ? f / 10 ** POWER[F.prefix] : f; // the frequency left as 97.3 for 97.3 MHz
    const unconverted = find === 'lambda' && fGiven ? v / inPrefix : find === 'v' && fGiven ? inPrefix * lambda : lambdaGivenCm ? (find === 'v' ? f * lambda * 100 : v / (lambda * 100)) : null;
    const timesSlip = find === 'lambda' ? v * f : find === 'f' ? v * lambda : null;
    const upside = find === 'lambda' ? f / v : find === 'f' ? lambda / v : null;
    // Each slip must give its own number, different from the answer and from each other (a 1 m/s ripple would not).
    const values = [answer, timesSlip, upside, unconverted].filter((x): x is number => x !== null);
    if (values.some((x, i) => values.some((y, j) => j > i && Math.abs(x - y) <= 0.01 * Math.abs(y)))) continue;
    steps.push({
      type: 'number',
      prompt: `So what is the ${find === 'v' ? 'speed' : find === 'f' ? 'frequency' : 'wavelength'}? Give 3 significant figures.`,
      ...(find === 'f' || find === 'lambda' ? approxStd(answer) : approx(answer)),
      unit,
      feedback: (g) =>
        timesSlip !== null && near(g, timesSlip)
          ? 'That multiplies. Divide the speed by the other quantity.'
          : upside !== null && near(g, upside)
            ? 'That divides the wrong way round. The speed goes on top.'
            : unconverted !== null && near(g, unconverted)
              ? `That uses the ${lambdaGivenCm ? 'wavelength in centimetres' : `frequency in ${F.prefix}Hz`}. Change it first.`
              : `Put the values into ${right}, in m/s, Hz and m.`,
    });
    const givenSpeed = find === 'v' ? '' : v === C ? ' Radio waves and light travel at 3.00 × 10^{8} m/s.' : v === SOUND ? ' Sound travels at 343 m/s in air.' : ` They travel at ${v} m/s.`;
    const prompt =
      find === 'v'
        ? `${what} have a frequency of ${F.text} and a wavelength of ${lambdaText}. How fast do they travel?`
        : find === 'lambda'
          ? `${what} ${ripples ? 'have' : 'has'} a frequency of ${F.text}.${givenSpeed} What is the wavelength?`
          : `${what} ${ripples ? 'have' : 'has'} a wavelength of ${lambdaText ?? `${approxStd(lambda).shown} m`}.${givenSpeed} What is the frequency?`;
    return {
      round: 'equation',
      prompt,
      steps,
      workings: [
        `Use ${right}.`,
        `${find === 'v' ? `v = ${fmt(D(f))} × ${lambda}` : find === 'lambda' ? `λ = ${v === C ? '3.00 × 10^{8}' : v} ÷ ${bracket(approxStd(f).shown)}` : `f = ${v === C ? '3.00 × 10^{8}' : v} ÷ ${bracket(approxStd(lambda).shown)}`} = ${(find === 'f' || find === 'lambda' ? approxStd(answer) : approx(answer)).shown} ${unit}.`,
      ],
      check: { kind: 'equation', find, v, f, lambda },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Frequency and period
// ---------------------------------------------------------------------------------------------

const COUNTED = ['waves pass a buoy', 'ripples reach the edge of a pond', 'waves break on a beach', 'swings of a long rope wave pass a marker'];

function periodQuestion(r: () => number): Question {
  for (;;) {
    if (r() < 0.5) {
      const what = pick(r, COUNTED);
      const seconds = pick(r, [10, 12, 15, 20, 30, 40, 60]);
      const waves = int(r, 3, 40);
      const f = waves / seconds;
      const T = seconds / waves;
      if (f === 4 || waves === seconds) continue; // the page's 4 Hz, and f = T = 1, which hides the slip
      return {
        round: 'period',
        prompt: `${waves} ${what} in ${seconds} seconds. Find the frequency and the period.`,
        steps: [
          { type: 'number', prompt: 'What is the frequency, in waves each second? Give 3 significant figures.', ...approx(f), unit: 'Hz', feedback: (g) => (near(g, T) ? 'That is the time for one wave, the period. Frequency is waves ÷ time.' : 'Divide the number of waves by the time in seconds.') },
          { type: 'number', prompt: 'And the period? Give 3 significant figures.', ...approx(T), unit: 's', tolerance: 0.005, feedback: (g) => (near(g, f) ? 'That is the frequency again. The period is T = 1 ÷ f.' : 'T = 1 ÷ f, the time for one wave.') },
        ],
        workings: [`f = ${waves} ÷ ${seconds} = ${approx(f).shown} Hz.`, `T = 1 ÷ f = ${approx(T).shown} s.`],
        check: { kind: 'period', waves, seconds, f, T },
      };
    }
    const T = pick(r, [0.002, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 2, 5]);
    const f = 1 / T;
    if (f === 4) continue;
    const perMinute = f * 60;
    const what = T < 0.1 ? pick(r, ['A tuning fork vibrates', 'A loudspeaker cone vibrates', 'A guitar string vibrates']) : pick(r, ['A wave on a rope has', 'Ripples in a tank have', 'Waves at sea have']);
    const has = what.endsWith('have') || what.endsWith('has');
    return {
      round: 'period',
      prompt: `${what} ${has ? 'a period' : 'with a period'} of ${fmt(D(String(T)))} s. What is the frequency, and how many vibrations happen in one minute?`,
      steps: [
        { type: 'number', prompt: 'What is the frequency?', ...approx(f), unit: 'Hz', feedback: (g) => (near(g, T) ? 'That is the period again. f = 1 ÷ T.' : 'f = 1 ÷ T.') },
        { type: 'number', prompt: 'How many vibrations happen in one minute?', ...approx(perMinute), feedback: (g) => (near(g, f) ? 'That is each second. A minute is 60 seconds.' : 'Multiply the frequency by 60.') },
      ],
      workings: [`f = 1 ÷ ${fmt(D(String(T)))} = ${approx(f).shown} Hz.`, `In a minute: ${approx(f).shown} × 60 = ${approx(perMinute).shown}.`],
      check: { kind: 'period', f, T, perMinute },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Same speed, new frequency
// ---------------------------------------------------------------------------------------------

function compareQuestion(r: () => number): Question {
  for (;;) {
    const sound = r() < 0.6;
    const v = sound ? SOUND : C;
    const f1 = sound ? pick(r, [110, 128, 147, 165, 196, 220, 247, 256, 262, 294, 330, 349, 392, 440, 494, 512, 523, 660, 880]) : pick(r, [88e6, 89e6, 90e6, 91e6, 92e6, 94e6, 96e6, 98e6, 99e6, 101e6, 102e6, 104e6, 105e6, 106e6]);
    const k = pick(r, [2, 3, 4, 0.5, 1.5]);
    const f2 = f1 * k;
    if (SHOWN_F.has(f1) || SHOWN_F.has(f2)) continue;
    const lambda1 = toNumber(approx(v / f1).answer); // the wavelength as the prompt shows it
    const lambda2 = (lambda1 * f1) / f2;
    const speedOptions = shuffle(r, ['It stays the same', 'It gets faster', 'It gets slower']);
    const speedRight = speedOptions.indexOf('It stays the same');
    const sizeOptions = shuffle(r, ['Shorter', 'Longer']);
    const sizeRight = sizeOptions.indexOf(k > 1 ? 'Shorter' : 'Longer');
    const thing = sound ? 'note' : 'radio signal';
    return {
      round: 'compare',
      prompt: `${an(hz(f1).text).replace(/^a/, 'A')} ${thing} has a wavelength of ${approx(v / f1).shown} m in ${sound ? 'air' : 'space'}. What is the wavelength of ${an(hz(f2).text)} ${thing}?`,
      steps: [
        { type: 'choice', prompt: `What happens to the speed of the ${sound ? 'sound' : 'wave'} at the new frequency?`, options: speedOptions, correct: speedRight, why: whyAll(speedOptions, speedRight, () => (sound ? 'Sound of every pitch travels through air at the same speed.' : 'Radio waves of every frequency travel through space at the same speed.')) },
        { type: 'choice', prompt: 'So is the new wavelength longer or shorter?', options: sizeOptions, correct: sizeRight, why: { [1 - sizeRight]: 'At a fixed speed, a higher frequency means a shorter wavelength.' } },
        {
          type: 'number',
          prompt: 'What is the new wavelength? Give 3 significant figures.',
          ...approx(lambda2),
          unit: 'm',
          tolerance: 0.005,
          feedback: (g) => (near(g, lambda1 * k) ? 'That changes the wavelength the same way as the frequency. They change in opposite ways.' : `The frequency is ${k} times as big, so divide the wavelength by ${k}.`),
        },
      ],
      workings: [`The speed stays the same, so the wavelength changes the opposite way to the frequency.`, `The frequency is ${k} times as big, so λ = ${approx(v / f1).shown} ÷ ${k} = ${approx(lambda2).shown} m.`],
      check: { kind: 'compare', v, f1, f2, lambda1, lambda2 },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Describing a wave
// ---------------------------------------------------------------------------------------------

const MEDIUMS: { what: string; along: string; transverse: boolean; unit: 'm' | 'cm'; lengths: number[]; heights?: number[] }[] = [
  { what: 'A rope is shaken from side to side', along: 'along the rope', transverse: true, unit: 'm', lengths: [3, 4, 5, 6, 8, 10, 12], heights: [20, 30, 40, 50, 60] },
  { what: 'Waves move across a ripple tank', along: 'across the tank', transverse: true, unit: 'cm', lengths: [24, 30, 36, 40, 48, 60], heights: [1, 2, 3, 4] },
  { what: 'A slinky spring is pushed and pulled along its length', along: 'along the spring', transverse: false, unit: 'm', lengths: [1.2, 1.5, 1.8, 2, 2.4, 3] },
  { what: 'A loudspeaker sends sound through the air', along: 'in front of it', transverse: false, unit: 'm', lengths: [2, 3, 3.6, 4, 4.5, 6] },
];

function describeQuestion(r: () => number): Question {
  for (;;) {
    const m = pick(r, MEDIUMS);
    const length = pick(r, m.lengths);
    const count = int(r, 2, 8);
    const lambda = length / count;
    if (!Number.isInteger(lambda * 100)) continue;
    const height = m.heights ? pick(r, m.heights) : undefined;
    const steps: Step[] = [
      {
        type: 'number',
        prompt: `What is the wavelength, in ${m.unit}?`,
        answer: D(String(lambda)),
        unit: m.unit,
        feedback: (g) => (near(g, length, 1e-9) ? 'That is the length of all the waves. Divide it by the number of waves.' : near(g, length / (count - 1), 1e-9) && count > 2 ? `There are ${count} whole waves, not ${count - 1}.` : 'Divide the length by the number of whole waves.'),
      },
    ];
    if (height !== undefined)
      steps.push({
        type: 'number',
        prompt: 'What is the amplitude, in cm?',
        answer: D(String(height / 2)),
        unit: 'cm',
        feedback: (g) => (near(g, height, 1e-9) ? 'That is crest to trough. The amplitude is measured from the rest position, which is halfway.' : 'The amplitude is from the rest position to a crest.'),
      });
    const options = shuffle(r, ['Transverse', 'Longitudinal']);
    const correct = options.indexOf(m.transverse ? 'Transverse' : 'Longitudinal');
    steps.push({ type: 'choice', prompt: 'Is this wave transverse or longitudinal?', options, correct, why: { [1 - correct]: 'Compare the direction of the vibrations with the direction the wave travels: across it is transverse, along it is longitudinal.' } });
    return {
      round: 'describe',
      prompt: `${m.what}. ${count} whole waves fit into ${length} ${m.unit} ${m.along}${height !== undefined ? `, and the height from a crest down to a trough is ${height} cm` : ''}. Describe the wave.`,
      steps,
      workings: [
        `Wavelength: ${length} ÷ ${count} = ${lambda} ${m.unit}.`,
        ...(height !== undefined ? [`Amplitude: half of ${height} cm, which is ${height / 2} cm.`] : []),
        `${m.transverse ? 'Transverse' : 'Longitudinal'}: the vibrations are ${m.transverse ? 'at right angles to' : 'along'} the direction the wave travels.`,
      ],
      check: { kind: 'describe', length, count, lambda, ...(height !== undefined ? { height, amplitude: height / 2 } : {}), transverse: m.transverse },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'period') return periodQuestion(r);
  if (round === 'compare') return compareQuestion(r);
  if (round === 'describe') return describeQuestion(r);
  return equationQuestion(r);
}

export const wavesQuiz: LessonQuiz<WavesCheck> = {
  lesson: 'waves',
  storageKey: 'stella-quiz-waves-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

