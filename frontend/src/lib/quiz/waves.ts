/**
 * Quiz for "Waves: Frequency, Wavelength and Speed" (KAN-95): the wave equation, frequency and period, the same
 * speed at a new frequency, and describing a wave. GCSE; calculator answers to 3 significant figures.
 * Every answer is worked from the values the pupil can see, and unit conversions are exact.
 */
import { D, approx, approxStd, divide, fmt, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'equation' | 'period' | 'compare' | 'describe';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  equation: { label: 'The wave equation', blurb: 'v = fλ, with the frequency in hertz and the wavelength in metres. Give 3 significant figures.' },
  period: { label: 'Frequency and period', blurb: 'Frequency is waves each second. The period is the time for one wave: T = 1 ÷ f.' },
  compare: { label: 'Same speed', blurb: 'When the speed stays the same, frequency and wavelength change in opposite ways.' },
  describe: { label: 'Describing a wave', blurb: 'Wavelength, amplitude, and transverse or longitudinal.' },
};

export type WavesCheck =
  | { kind: 'equation'; find: 'v' | 'f' | 'lambda'; v: number; f: number; lambda: number }
  | { kind: 'period'; waves: number; seconds: number; f: number; T: number }
  | { kind: 'compare'; v: number; f1: number; f2: number; lambda1: number; lambda2: number }
  | { kind: 'describe'; length: string; count: number; lambda: string; height?: number; amplitude?: number; transverse: boolean };
type Question = Q<WavesCheck>;

const C = 3.0e8;
const SOUND = 343;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
const tenTo = (n: number) => `10^{${n < 0 ? `−${-n}` : n}}`;
/** An exact value in standard form with all its figures: 1.575 × 10^{9}, never rounded. */
function exactStd(x: number): { answer: Digits; shown: string } {
  const e = Math.floor(Math.log10(x));
  const mant = String(parseFloat((x / 10 ** e).toPrecision(12)));
  return { answer: D(String(x)), shown: x >= 1e5 ? `${mant} × ${tenTo(e)}` : fmt(D(String(x))) };
}
/** A frequency as a pupil would read it: 440 Hz, 97.3 MHz, 2.6 GHz. */
function hz(f: number): { text: string; prefix: '' | 'M' | 'G'; inPrefix: number } {
  if (f >= 1e9) return { text: `${parseFloat((f / 1e9).toPrecision(6))} GHz`, prefix: 'G', inPrefix: f / 1e9 };
  if (f >= 1e6) return { text: `${parseFloat((f / 1e6).toPrecision(6))} MHz`, prefix: 'M', inPrefix: f / 1e6 };
  return { text: `${fmt(D(f))} Hz`, prefix: '', inPrefix: f };
}
/** "a 660 Hz note", "an 880 Hz note", "an 18 MHz signal", but "a 110 Hz note": by how the number is said. */
const an = (text: string) => `${/^(8|11(?![\d])|11[.,]|18(?![\d])|18[.,])/.test(text) ? 'an' : 'a'} ${text}`;
const bracket = (s: string) => (s.includes('×') ? `(${s})` : s);

// ---------------------------------------------------------------------------------------------
// The wave equation
// ---------------------------------------------------------------------------------------------

const WAVES: { what: string; v: number; freqs: number[] }[] = [
  { what: 'A sound in air', v: SOUND, freqs: [128, 196, 220, 256, 262, 330, 392, 440, 512, 660, 880, 1000, 2000, 4000, 15000, 18000] },
  { what: 'An FM radio station', v: C, freqs: [88.1e6, 89.7e6, 91.3e6, 93.5e6, 95.8e6, 97.3e6, 98.8e6, 102.2e6, 104.9e6, 107.5e6] },
  { what: 'A mobile phone signal', v: C, freqs: [0.8e9, 0.9e9, 1.8e9, 2.1e9, 2.6e9, 3.5e9] },
  { what: 'A GPS satellite signal', v: C, freqs: [1.575e9, 1.227e9] },
  { what: 'A satellite TV signal', v: C, freqs: [10.7e9, 11.2e9, 11.7e9, 12.1e9] },
];
/** Shown on the page: 343 Hz sound, 100 MHz radio, Wi-Fi at 2.4 and 5 GHz, and 8.4 GHz. */
const SHOWN_F = new Set([343, 100e6, 2.4e9, 5e9, 8.4e9]);
const FORMS = { v: 'v = f × λ', lambda: 'λ = v ÷ f', f: 'f = v ÷ λ' } as const;
/** For each form, the upside-down one with the same letter on the left, so that letter alone never gives it away. */
const SAME_SUBJECT = { v: 'v = f ÷ λ', lambda: 'λ = f ÷ v', f: 'f = λ ÷ v' } as const;
const OTHER_WRONG = ['λ = f × v', 'v = λ ÷ f', 'f = v × λ'];

/** Ripples on a pond: realistic pairs, with speeds of about 0.2 to 0.5 m/s. */
function ripple(r: () => number): { f: number; lambdaCm: number } {
  for (;;) {
    const f = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5]);
    const lambdaCm = pick(r, [5, 6, 8, 10, 12, 15, 20, 25]);
    const v = (f * lambdaCm) / 100;
    if (v < 0.2 || v > 0.5 || (f === 2 && lambdaCm === 150)) continue;
    return { f, lambdaCm };
  }
}

function equationQuestion(r: () => number): Question {
  for (;;) {
    const ripples = r() < 0.3;
    let f: number, v: number, lambda: number, what: string;
    let lambdaText: string;
    let find: 'v' | 'f' | 'lambda';
    if (ripples) {
      const w = ripple(r);
      f = w.f;
      lambda = w.lambdaCm / 100;
      v = (w.f * w.lambdaCm) / 100;
      what = 'Ripples on a pond';
      lambdaText = `${w.lambdaCm} cm`;
      find = pick(r, ['v', 'f', 'lambda'] as const);
    } else {
      const w = pick(r, WAVES);
      const f0 = pick(r, w.freqs);
      if (SHOWN_F.has(f0)) continue;
      what = w.what;
      v = w.v;
      find = pick(r, ['lambda', 'lambda', 'f'] as const);
      if (find === 'lambda') {
        f = f0;
        lambda = v / f;
        lambdaText = '';
      } else {
        // The wavelength is shown to 3 s.f., and the frequency is worked from that shown value.
        const shownLambda = approxStd(v / f0);
        lambda = toNumber(shownLambda.answer);
        lambdaText = `${shownLambda.shown} m`;
        f = v / lambda;
      }
    }
    const F = hz(f);
    const right = FORMS[find];
    const options = shuffle(r, [right, SAME_SUBJECT[find], pick(r, OTHER_WRONG)]);
    const correct = options.indexOf(right);
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `Which form of the wave equation finds the ${find === 'v' ? 'speed' : find === 'f' ? 'frequency' : 'wavelength'}?`,
        options,
        correct,
        why: whyAll(options, correct, (o) => (o === SAME_SUBJECT[find] ? 'That is upside down. Start from v = f × λ and rearrange it.' : 'Start from v = f × λ, and rearrange it so the quantity you want is on its own.')),
      },
    ];
    const fConvert = find === 'lambda' && F.prefix !== '';
    if (fConvert) steps.push({ type: 'number', prompt: `First, what is ${F.text} in hertz?`, ...exactStd(f), unit: 'Hz', feedback: () => (F.prefix === 'M' ? 'Mega means a million.' : 'Giga means a thousand million.') });
    const cmConvert = ripples && find !== 'lambda';
    if (cmConvert) steps.push({ type: 'number', prompt: `First, what is ${lambdaText} in metres?`, answer: D(String(lambda)), unit: 'm', feedback: () => 'There are 100 cm in a metre.' });
    const answer = find === 'v' ? v : find === 'f' ? f : lambda;
    const unit = find === 'v' ? 'm/s' : find === 'f' ? 'Hz' : 'm';
    const unconverted = fConvert ? v / F.inPrefix : cmConvert ? (find === 'v' ? f * lambda * 100 : v / (lambda * 100)) : null;
    const timesSlip = find === 'lambda' ? v * f : find === 'f' ? v * lambda : null;
    const upside = find === 'lambda' ? f / v : find === 'f' ? lambda / v : null;
    // Each slip must give its own number, different from the answer and from each other.
    const values = [answer, timesSlip, upside, unconverted].filter((x): x is number => x !== null);
    if (values.some((x, i) => values.some((y, j) => j > i && Math.abs(x - y) <= 0.01 * Math.abs(y)))) continue;
    const shownAnswer = find === 'v' ? approx(answer) : approxStd(answer);
    steps.push({
      type: 'number',
      prompt: `So what is the ${find === 'v' ? 'speed' : find === 'f' ? 'frequency, in hertz' : 'wavelength, in metres'}? Give 3 significant figures.`,
      ...shownAnswer,
      unit,
      feedback: (g) =>
        timesSlip !== null && near(g, timesSlip)
          ? 'That multiplies. Divide the speed by the other quantity.'
          : upside !== null && near(g, upside)
            ? 'That divides the wrong way round. The speed goes on top.'
            : unconverted !== null && near(g, unconverted)
              ? `That uses the ${cmConvert ? 'wavelength in centimetres' : `frequency in ${F.prefix}Hz`}. Change it first.`
              : `Put the values into ${right}, in m/s, Hz and m.`,
    });
    const speedText = v === C ? '3.00 × 10^{8}' : String(v);
    const givenSpeed = find === 'v' ? '' : v === C ? ' Radio waves travel at 3.00 × 10^{8} m/s.' : v === SOUND ? ' Sound travels at 343 m/s in air.' : ` They travel at ${v} m/s.`;
    const verb = ripples ? 'have' : 'has';
    const prompt =
      find === 'v'
        ? `${what} have a frequency of ${F.text} and a wavelength of ${lambdaText}. How fast do they travel?`
        : find === 'lambda'
          ? `${what} ${verb} a frequency of ${F.text}.${givenSpeed} What is the wavelength?`
          : `${what} ${verb} a wavelength of ${lambdaText}.${givenSpeed} What is the frequency?`;
    const sum =
      find === 'v'
        ? `v = ${F.text.replace(' Hz', '')} × ${lambda}`
        : find === 'lambda'
          ? `λ = ${speedText} ÷ ${bracket(fConvert ? exactStd(f).shown : String(f))}`
          : `f = ${speedText} ÷ ${cmConvert ? lambda : bracket(lambdaText.replace(' m', ''))}`;
    return {
      round: 'equation',
      prompt,
      steps,
      workings: [`Use ${right}.`, `${sum} = ${shownAnswer.shown} ${unit}.`],
      check: { kind: 'equation', find, v, f, lambda },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Frequency and period
// ---------------------------------------------------------------------------------------------

/** Things counted, with realistic counts and times: sea waves every few seconds, ripples faster. */
const COUNTED: { what: string; waves: [number, number]; seconds: number[] }[] = [
  { what: 'waves pass a buoy at sea', waves: [3, 12], seconds: [30, 40, 60] },
  { what: 'waves break on a beach', waves: [3, 10], seconds: [30, 40, 60] },
  { what: 'ripples reach the edge of a pond', waves: [10, 40], seconds: [10, 12, 15, 20] },
  { what: 'waves on a long rope pass a marker', waves: [5, 30], seconds: [10, 12, 15, 20] },
];

function periodQuestion(r: () => number): Question {
  for (;;) {
    const k = pick(r, COUNTED);
    const seconds = pick(r, k.seconds);
    const waves = int(r, k.waves[0], k.waves[1]);
    const f = waves / seconds;
    const T = seconds / waves;
    if (f === 4 || waves === seconds) continue; // the page's 4 Hz, and f = T = 1, which hides the slip
    return {
      round: 'period',
      prompt: `${waves} ${k.what} in ${seconds} seconds. Find the frequency and the period.`,
      steps: [
        { type: 'number', prompt: 'What is the frequency, in hertz? Give 3 significant figures.', ...approx(f), unit: 'Hz', feedback: (g) => (near(g, T) ? 'That is the time for one wave, the period. Frequency is waves ÷ time.' : 'Divide the number of waves by the time in seconds.') },
        { type: 'number', prompt: 'And the period, in seconds? Give 3 significant figures.', ...approx(T), unit: 's', tolerance: 0.005, feedback: (g) => (near(g, f) ? 'That is the frequency again. The period is T = 1 ÷ f.' : 'T = 1 ÷ f, the time for one wave.') },
      ],
      workings: [`f = ${waves} ÷ ${seconds} = ${approx(f).shown} Hz.`, `T = 1 ÷ f = ${approx(T).shown} s.`],
      check: { kind: 'period', waves, seconds, f, T },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Same speed, new frequency
// ---------------------------------------------------------------------------------------------

const TIMES: Record<number, string> = { 2: 'twice', 3: 'three times', 4: 'four times', 0.5: 'half', 1.5: 'one and a half times' };

function compareQuestion(r: () => number): Question {
  for (;;) {
    const sound = r() < 0.6;
    const v = sound ? SOUND : C;
    const f1 = sound ? pick(r, [110, 128, 147, 165, 196, 220, 247, 256, 262, 294, 330, 349, 392, 440, 494, 512, 523, 660, 880]) : pick(r, [88e6, 89e6, 90e6, 91e6, 92e6, 94e6, 96e6, 98e6, 99e6, 101e6, 102e6, 104e6, 105e6, 106e6]);
    const k = pick(r, [2, 3, 4, 0.5, 1.5]);
    const f2 = f1 * k;
    if (SHOWN_F.has(f1) || SHOWN_F.has(f2) || !Number.isInteger(f2)) continue;
    const shown1 = approx(v / f1);
    const lambda1 = toNumber(shown1.answer); // the wavelength as the prompt shows it
    const lambda2 = lambda1 / k;
    const sizeOptions = shuffle(r, ['Shorter', 'Longer']);
    const sizeRight = sizeOptions.indexOf(k > 1 ? 'Shorter' : 'Longer');
    const thing = sound ? 'note' : 'radio signal';
    return {
      round: 'compare',
      prompt: `${an(hz(f1).text).replace(/^a/, 'A')} ${thing} has a wavelength of ${shown1.shown} m in ${sound ? 'air' : 'space'}. What is the wavelength of ${an(hz(f2).text)} ${thing}?`,
      steps: [
        { type: 'number', prompt: 'How many times bigger is the new frequency? (Type 0.5 if it is half.)', answer: D(String(k)), feedback: () => 'Divide the new frequency by the old one.' },
        { type: 'choice', prompt: `${sound ? 'Sound travels' : 'Radio waves travel'} at the same speed at any frequency. So is the new wavelength longer or shorter?`, options: sizeOptions, correct: sizeRight, why: { [1 - sizeRight]: 'At a fixed speed, frequency and wavelength change in opposite ways.' } },
        {
          type: 'number',
          prompt: 'What is the new wavelength? Give 3 significant figures.',
          ...approx(lambda2),
          unit: 'm',
          feedback: (g) => (near(g, lambda1 * k) ? 'That changes the wavelength the same way as the frequency. They change in opposite ways.' : 'Divide the old wavelength by how many times bigger the frequency is.'),
        },
      ],
      workings: [`The new frequency is ${TIMES[k]} as big, and the speed stays the same.`, `So λ = ${shown1.shown} ÷ ${k} = ${approx(lambda2).shown} m.`],
      check: { kind: 'compare', v, f1, f2, lambda1, lambda2 },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Describing a wave
// ---------------------------------------------------------------------------------------------

/** Some transverse waves come with an amplitude to find, and some do not, so the step itself gives nothing away. */
const MEDIUMS: { what: string; along: string; transverse: boolean; unit: 'm' | 'cm'; lengths: string[]; heights?: number[] }[] = [
  { what: 'A rope is shaken from side to side', along: 'along the rope', transverse: true, unit: 'm', lengths: ['3', '4', '5', '6', '8', '10', '12'], heights: [20, 30, 40, 50, 60] },
  { what: 'Waves move across a ripple tank', along: 'across the tank', transverse: true, unit: 'cm', lengths: ['24', '30', '36', '40', '48', '60'], heights: [1, 2, 3, 4] },
  { what: 'A long spring is shaken from side to side', along: 'along the spring', transverse: true, unit: 'm', lengths: ['1.2', '1.5', '1.8', '2', '2.4', '3'] },
  { what: 'A slinky spring is pushed and pulled along its length', along: 'along the spring', transverse: false, unit: 'm', lengths: ['1.2', '1.5', '1.8', '2', '2.4', '3'] },
  { what: 'A loudspeaker sends sound through the air', along: 'in front of it', transverse: false, unit: 'm', lengths: ['2', '3', '3.6', '4', '4.5', '6'] },
];

function describeQuestion(r: () => number): Question {
  for (;;) {
    const m = pick(r, MEDIUMS);
    const length = pick(r, m.lengths);
    const count = int(r, 2, 8);
    const lambda = divide(D(length), D(count)); // exact: 1.2 ÷ 3 is 0.4
    if (!lambda) continue;
    const height = m.heights && r() < 0.7 ? pick(r, m.heights) : undefined;
    const L = Number(length);
    const steps: Step[] = [
      {
        type: 'number',
        prompt: `What is the wavelength, in ${m.unit}?`,
        answer: lambda,
        unit: m.unit,
        feedback: (g) => (near(g, L, 1e-9) ? 'That is the length of all the waves. Divide it by the number of waves.' : count > 2 && near(g, L / (count - 1), 1e-9) ? `There are ${count} whole waves, not ${count - 1}.` : 'Divide the length by the number of whole waves.'),
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
        `Wavelength: ${length} ÷ ${count} = ${fmt(lambda)} ${m.unit}.`,
        ...(height !== undefined ? [`Amplitude: half of ${height} cm, which is ${height / 2} cm.`] : []),
        `${m.transverse ? 'Transverse' : 'Longitudinal'}: the vibrations are ${m.transverse ? 'at right angles to' : 'along'} the direction the wave travels.`,
      ],
      check: { kind: 'describe', length, count, lambda: fmt(lambda), ...(height !== undefined ? { height, amplitude: height / 2 } : {}), transverse: m.transverse },
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
