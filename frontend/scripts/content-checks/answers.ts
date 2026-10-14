/**
 * Content check: answers (Mission 2, "Get to orbit").
 *
 * Recomputes every numeric answer in the six Mission 2 lessons from first principles and compares it with
 * what the lesson states. Nothing is parsed out of the physics prose: every checkable item is an explicit
 * entry in the TABLE below, with
 *   - a verbatim fragment of the question (or notes) it belongs to, so the entry fails loudly when the
 *     lesson is rewritten and the entry needs re-verifying;
 *   - a compute() written from the inputs, and the value worked out by hand (`expected`) as a self-check
 *     on the table;
 *   - a tolerance that matches the precision the lesson states.
 *
 * Run: cd frontend && npx tsx scripts/content-checks/answers.ts [lessonId ...]
 * Exit code 1 if any entry fails.
 */

import { studyModules, type StudyModule } from '../../src/lib/study-modules';
import { MISSIONS } from '../../src/lib/missions';
import { ENTRIES as TOOLKIT } from './answers/toolkit';
import { ENTRIES as NAVIGATE } from './answers/navigate';
import { ENTRIES as SIGNAL } from './answers/signal';
import { ENTRIES as STARLIGHT } from './answers/starlight';

export type Finding = {
  check: string;
  lesson: string;
  where: string;
  excerpt: string;
  message: string;
  level: 'fail' | 'warn' | 'info';
};

// ---------------------------------------------------------------------------------------------------------
// Constants, declared once. "Lesson" values are the ones the lesson itself gives; questions that give a value
// are always computed with that value.
// ---------------------------------------------------------------------------------------------------------

const C = {
  // Gravitation
  G_SOLVED_GRAVITY: 6.674e-11, // gravity solvedExample states G ≈ 6.674e-11
  G_NOTES_GRAVITY: 6.67e-11, // gravity notes state G = 6.67e-11 (different from the solvedExample; see consistency)
  M_EARTH: 5.97e24, // kg, as the gravity lesson gives it
  R_EARTH_NOTES: 6.37e6, // m, gravity notes
  R_ISS_NOTES: 6.77e6, // m, gravity notes
  GM_GRAVITY_LESSON: 3.98e14, // m^3 s^-2, gravity practice and notes
  GM_TRAJ_KM: 3.986e5, // km^3 s^-2, trajectory notes and practice (3.986e14 m^3 s^-2)
  R_EARTH_MEAN_KM: 6371, // km, IUGG mean radius (trajectory "300 km above the ground")
  SIDEREAL_DAY_S: 86164.1, // s, period of a geostationary orbit
  // Gases
  R_SOLVED_THERMO: 8.314, // J mol^-1 K^-1, thermodynamics solvedExample
  R_NOTES_THERMO: 8.31, // J mol^-1 K^-1, thermodynamics notes and practice
  K_BOLTZMANN_LESSON: 1.38e-23, // J K^-1, thermodynamics notes
  N_AVOGADRO: 6.02214076e23, // mol^-1
  ATM_PA: 101325, // Pa
  KELVIN_OFFSET_LESSON: 273, // the lesson adds 273 (not 273.15)
  // Units
  PREFIX: { T: 1e12, G: 1e9, M: 1e6, k: 1e3, c: 1e-2, m: 1e-3, u: 1e-6, n: 1e-9 },
  M_PER_KM: 1000,
  S_PER_H: 3600,
  CM_PER_M: 100,
} as const;

const hohmann = (() => {
  // Transfer from 300 km above the ground to geostationary orbit, with the lesson's GM, in km and s.
  const GM = C.GM_TRAJ_KM;
  const r1 = C.R_EARTH_MEAN_KM + 300;
  const r2 = Math.cbrt((GM * C.SIDEREAL_DAY_S ** 2) / (4 * Math.PI ** 2)); // ≈ 42,164 km
  const a = (r1 + r2) / 2;
  const vCirc1 = Math.sqrt(GM / r1);
  const vCirc2 = Math.sqrt(GM / r2);
  const vPeri = Math.sqrt(GM * (2 / r1 - 1 / a));
  const vApo = Math.sqrt(GM * (2 / r2 - 1 / a));
  const tCoast = Math.PI * Math.sqrt(a ** 3 / GM);
  return { r1, r2, a, vCirc1, vCirc2, burn1: vPeri - vCirc1, burn2: vCirc2 - vApo, tCoastMin: tCoast / 60 };
})();

// ---------------------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------------------

type Base = {
  lesson: string;
  /** practiceProblems[i] | solvedExample.resultFormula | solvedExample.steps[i] | conceptSteps[i] | textbookContent: <label>. Anything after a space is a label. */
  where: string;
  /** Verbatim fragment of the question / problem / concept step. Required unless the item is in the notes. */
  expectQuestionIncludes?: string;
  /** Verbatim fragment of the notes, for textbookContent items. */
  expectNotesIncludes?: string;
  note?: string;
};

export type NumericEntry = Base & {
  kind?: 'numeric';
  compute: () => number;
  /** Hand-worked value, a self-check on compute(). */
  expected: number;
  /** Absolute tolerance, in `unit`. */
  tolerance?: number;
  /** Relative tolerance, for very large or small values. */
  relTolerance?: number;
  unit: string;
  /** Verbatim fragment of the stated answer that holds the number. Defaults to the whole answer text. */
  stated?: string;
  /** Where the stated number is: the answer (default) or the question. */
  statedIn?: 'answer' | 'question';
  /** Index (or indices) of the number(s) within the stated text to compare. Default 0. */
  pick?: number | number[];
  /** Combine the extracted numbers into one value (e.g. hours and minutes). Overrides pick. */
  combine?: (nums: number[]) => number;
};

export type QualitativeEntry = Base & {
  kind: 'qualitative';
  expectAnswerIncludes: string;
  /** Optional: a computation that confirms the qualitative answer. */
  verify?: () => { holds: boolean; detail: string };
};

export type ClaimEntry = Base & {
  kind: 'claim';
  /** Verbatim fragment of the claim. While it is present, the claim is checked. */
  claimIncludes: string;
  verify: () => { holds: boolean; detail: string };
};

export type Entry = NumericEntry | QualitativeEntry | ClaimEntry;

const MISSION_2_TABLE: Entry[] = [
  // ======================================================================================== units
  {
    lesson: 'units', where: 'conceptSteps[1]', expectQuestionIncludes: '20\\text{ mA} = 20 \\times 10^{-3}',
    stated: '= 0.02\\text{ A}', compute: () => 20 * C.PREFIX.m, expected: 0.02, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'units', where: 'conceptSteps[2] (72 km in m)', expectQuestionIncludes: 'For $72\\text{ km/h}$',
    stated: '$72\\text{ km} = 72\\,000\\text{ m}$', pick: 1, compute: () => 72 * C.M_PER_KM, expected: 72000, tolerance: 0, unit: 'm',
  },
  {
    lesson: 'units', where: 'conceptSteps[2] (speed)', expectQuestionIncludes: 'For $72\\text{ km/h}$',
    stated: '$72\\,000 \\div 3600 = 20\\text{ m/s}$', pick: 2, compute: () => (72 * C.M_PER_KM) / C.S_PER_H, expected: 20, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'units', where: 'conceptSteps[2] (3.6 shortcut)', expectQuestionIncludes: 'divide by 3.6',
    stated: 'divide by 3.6', compute: () => C.S_PER_H / C.M_PER_KM, expected: 3.6, tolerance: 1e-9, unit: '(km/h per m/s)',
  },
  {
    lesson: 'units', where: 'conceptSteps[3] (area)', expectQuestionIncludes: 'a square metre is',
    stated: '$100 \\times 100 = 10\\,000\\text{ cm}^2$', pick: 2, compute: () => C.CM_PER_M ** 2, expected: 10000, tolerance: 0, unit: 'cm²',
  },
  {
    lesson: 'units', where: 'conceptSteps[3] (volume)', expectQuestionIncludes: 'a cubic metre is',
    stated: '$100 \\times 100 \\times 100 = 1\\,000\\,000\\text{ cm}^3$', pick: 3, compute: () => C.CM_PER_M ** 3, expected: 1e6, tolerance: 0, unit: 'cm³',
  },
  {
    lesson: 'units', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'broadcasts at $97.5$ MHz',
    stated: '$97.5\\text{ MHz} = 97.5 \\times 10^6\\text{ Hz}$', pick: 1, compute: () => 97.5 * C.PREFIX.M, expected: 9.75e7, relTolerance: 1e-9, unit: 'Hz',
  },
  {
    lesson: 'units', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'broadcasts at $97.5$ MHz',
    stated: 'Write $97.5$ as $9.75 \\times 10^1$', pick: 1, compute: () => 97.5, expected: 97.5, relTolerance: 1e-9, unit: '',
  },
  {
    lesson: 'units', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'broadcasts at $97.5$ MHz',
    stated: '= 9.75 \\times 10^7', compute: () => 97.5 * C.PREFIX.M, expected: 9.75e7, relTolerance: 1e-9, unit: 'Hz',
  },
  {
    lesson: 'units', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'broadcasts at $97.5$ MHz',
    stated: '9.75 \\times 10^{7}', compute: () => 97.5 * C.PREFIX.M, expected: 9.75e7, relTolerance: 1e-9, unit: 'Hz',
  },
  {
    lesson: 'units', where: 'practiceProblems[0]', expectQuestionIncludes: 'Convert 450 mA to amperes',
    compute: () => 450 * C.PREFIX.m, expected: 0.45, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'units', where: 'practiceProblems[1]', expectQuestionIncludes: 'Convert 3.2 km to metres',
    compute: () => 3.2 * C.PREFIX.k, expected: 3200, tolerance: 1e-9, unit: 'm',
  },
  {
    lesson: 'units', where: 'practiceProblems[2]', expectQuestionIncludes: 'travels at 90 km/h',
    compute: () => (90 * C.M_PER_KM) / C.S_PER_H, expected: 25, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'units', where: 'practiceProblems[3]', expectQuestionIncludes: 'travels at 15 m/s',
    compute: () => (15 / C.M_PER_KM) * C.S_PER_H, expected: 54, tolerance: 1e-9, unit: 'km/h',
  },
  {
    lesson: 'units', where: 'practiceProblems[4]', expectQuestionIncludes: 'area of 2 m²',
    compute: () => 2 * C.CM_PER_M ** 2, expected: 20000, tolerance: 0, unit: 'cm²',
  },
  {
    lesson: 'units', where: 'practiceProblems[5]', expectQuestionIncludes: 'wavelength of 650 nm',
    compute: () => 650 * C.PREFIX.n, expected: 6.5e-7, relTolerance: 1e-9, unit: 'm',
  },
  ...(
    [
      ['tera', 'T', '| $10^{12}$ | 1 TW = 1 000 000 000 000 W |', 1e12],
      ['giga', 'G', '| $10^{9}$ | 1 GW = 1 000 000 000 W |', 1e9],
      ['mega', 'M', '| $10^{6}$ | 1 MHz = 1 000 000 Hz |', 1e6],
      ['kilo', 'k', '| $10^{3}$ | 1 km = 1000 m |', 1e3],
      ['centi', 'c', '| $10^{-2}$ | 1 cm = 0.01 m |', 1e-2],
      ['milli', 'm', '| $10^{-3}$ | 1 mA = 0.001 A |', 1e-3],
      ['micro', 'u', '| $10^{-6}$ | 1 μm = 0.000 001 m |', 1e-6],
      ['nano', 'n', '| $10^{-9}$ | 1 nm = 0.000 000 001 m |', 1e-9],
    ] as const
  ).map(([name, key, row, hand]): NumericEntry => ({
    lesson: 'units',
    where: `textbookContent: prefix table, ${name}`,
    expectNotesIncludes: `| ${name} |`,
    // Numbers in the row: [factor, 1, example value]; both factor and example must equal the prefix.
    stated: row,
    pick: [0, 2],
    compute: () => C.PREFIX[key],
    expected: hand,
    relTolerance: 1e-9,
    unit: '× base unit',
  })),
  {
    lesson: 'units', where: 'textbookContent: 250 mA', expectNotesIncludes: '$250 \\text{ mA} = 250 \\times 10^{-3}',
    stated: '= 0.25 \\text{ A}', compute: () => 250 * C.PREFIX.m, expected: 0.25, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'units', where: 'textbookContent: 36 km in m', expectNotesIncludes: 'For 36 km/h:',
    stated: '$36 \\text{ km} = 36\\,000 \\text{ m}$', pick: 1, compute: () => 36 * C.M_PER_KM, expected: 36000, tolerance: 0, unit: 'm',
  },
  {
    lesson: 'units', where: 'textbookContent: 36 km/h in m/s', expectNotesIncludes: 'For 36 km/h:',
    stated: '$36\\,000 \\div 3600 = 10$ m/s', pick: 2, compute: () => (36 * C.M_PER_KM) / C.S_PER_H, expected: 10, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'units', where: 'textbookContent: 1 m² in cm²', expectNotesIncludes: 'Because $1 \\text{ m} = 100 \\text{ cm}$',
    stated: '$1 \\text{ m}^2 = 100 \\times 100 = 10\\,000 \\text{ cm}^2$', pick: 3, compute: () => C.CM_PER_M ** 2, expected: 10000, tolerance: 0, unit: 'cm²',
  },
  {
    lesson: 'units', where: 'textbookContent: 1 m³ in cm³', expectNotesIncludes: 'Because $1 \\text{ m} = 100 \\text{ cm}$',
    stated: '$1 \\text{ m}^3 = 100 \\times 100 \\times 100 = 1\\,000\\,000 \\text{ cm}^3$', pick: 4, compute: () => C.CM_PER_M ** 3, expected: 1e6, tolerance: 0, unit: 'cm³',
  },
  {
    lesson: 'units', where: 'textbookContent: litres in 1 m³', expectNotesIncludes: '$1 \\text{ litre} = 1000 \\text{ cm}^3$',
    stated: '$1 \\text{ m}^3 = 1000$ litres', pick: 1, compute: () => C.CM_PER_M ** 3 / 1000, expected: 1000, tolerance: 0, unit: 'litres',
  },
  {
    lesson: 'units', where: 'textbookContent: Moon distance', expectNotesIncludes: 'about 384 000 km from Earth',
    stated: '= 3.84 \\times 10^8 \\text{ m}', compute: () => 384000 * C.M_PER_KM, expected: 3.84e8, relTolerance: 1e-9, unit: 'm',
  },

  // ======================================================================================== gears
  {
    lesson: 'gears', where: 'practiceProblems[0]', expectQuestionIncludes: 'driver gear has 20 teeth and the gear it drives has 40 teeth',
    compute: () => 40 / 20, expected: 2, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'gears', where: 'practiceProblems[1]', expectQuestionIncludes: 'driver gear turns 100 times a minute',
    compute: () => 100 / (40 / 20), expected: 50, tolerance: 1e-9, unit: 'turns/min',
  },
  {
    lesson: 'gears', where: 'practiceProblems[2]', expectQuestionIncludes: 'A force of 10 N acts 0.2 m from a pivot',
    compute: () => 10 * 0.2, expected: 2, tolerance: 1e-9, unit: 'N m',
  },
  {
    lesson: 'gears', where: 'practiceProblems[3] (moment)', expectQuestionIncludes: 'moment of 3 N m to a 10-tooth gear, which drives a 50-tooth gear',
    compute: () => 3 * (50 / 10), expected: 15, tolerance: 1e-9, unit: 'N m',
  },
  {
    lesson: 'gears', where: 'practiceProblems[3] (ratio)', expectQuestionIncludes: 'moment of 3 N m to a 10-tooth gear, which drives a 50-tooth gear',
    stated: 'the gear ratio is 5', compute: () => 50 / 10, expected: 5, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'gears', where: 'practiceProblems[4] (speed)', expectQuestionIncludes: 'A 30-tooth gear turning 60 times a minute drives a 10-tooth gear',
    stated: '180 turns per minute', compute: () => 60 / (10 / 30), expected: 180, tolerance: 1e-9, unit: 'turns/min',
  },
  {
    lesson: 'gears', where: 'practiceProblems[4] (moment)', expectQuestionIncludes: 'A 30-tooth gear turning 60 times a minute drives a 10-tooth gear',
    stated: 'one third', compute: () => 10 / 30, expected: 1 / 3, tolerance: 1e-9, unit: '× input moment',
  },
  {
    lesson: 'gears', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'The driver turns clockwise',
    expectAnswerIncludes: 'Anticlockwise',
  },
  {
    lesson: 'gears', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'A motor turns a 12-tooth gear 90 times a minute with a moment of 5 N m. It drives a 36-tooth gear.',
    stated: 'Gear ratio: $\\dfrac{36}{12} = 3$', pick: 2, compute: () => 36 / 12, expected: 3, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'gears', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'A motor turns a 12-tooth gear 90 times a minute with a moment of 5 N m. It drives a 36-tooth gear.',
    stated: '$90 \\div 3 = 30$ turns per minute', pick: 2, compute: () => 90 / (36 / 12), expected: 30, tolerance: 1e-9, unit: 'turns/min',
  },
  {
    lesson: 'gears', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'A motor turns a 12-tooth gear 90 times a minute with a moment of 5 N m. It drives a 36-tooth gear.',
    stated: '$5 \\times 3 = 15$ N m', pick: 2, compute: () => 5 * (36 / 12), expected: 15, tolerance: 1e-9, unit: 'N m',
  },

  // ======================================================================================== momentum
  {
    lesson: 'momentum', where: 'conceptSteps[0]', kind: 'claim', expectQuestionIncludes: 'Momentum, $p = mv$',
    claimIncludes: 'bullet can have similar momenta',
    note: 'Removed in the KAN-68 rewrite; kept so the claim cannot come back.',
    verify: () => {
      const truck = 10000 * 1; // 10 t truck at walking pace, 1 m/s
      const bullet = 0.01 * 1000; // 10 g bullet at 1000 m/s
      const ratio = truck / bullet;
      return {
        holds: ratio < 3,
        detail: `a slow truck and a fast bullet do not have similar momenta: 10,000 kg × 1 m/s = ${fmt(truck)} kg m/s, ` +
          `0.01 kg × 1000 m/s = ${fmt(bullet)} kg m/s, a factor of ${fmt(ratio)}`,
      };
    },
  },
  {
    lesson: 'momentum', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'A $5$ kg ball moving at $10$ m/s collides with a stationary $3$ kg ball',
    stated: '= 50$ kg', compute: () => 5 * 10 + 3 * 0, expected: 50, tolerance: 1e-9, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'the 5 kg ball carries on in the same direction at $4$ m/s',
    stated: '= 20 + 3v_2', compute: () => 5 * 4, expected: 20, tolerance: 1e-9, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'the 5 kg ball carries on in the same direction at $4$ m/s',
    stated: '$3v_2 = 30$', pick: 1, compute: () => 5 * 10 - 5 * 4, expected: 30, tolerance: 1e-9, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'the 5 kg ball carries on in the same direction at $4$ m/s',
    compute: () => (5 * 10 - 5 * 4) / 3, expected: 10, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[0]', expectQuestionIncludes: 'A 1,200 kg car travels at 20 m/s',
    compute: () => 1200 * 20, expected: 24000, tolerance: 0, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[1]', expectQuestionIncludes: '3 kg trolley moving at 4 m/s',
    compute: () => (3 * 4) / (3 + 1), expected: 3, tolerance: 0.01, unit: 'm/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[2]', expectQuestionIncludes: 'Two 0.5 kg balls roll towards each other, each at 6 m/s',
    compute: () => 0.5 * 6 + 0.5 * -6, expected: 0, tolerance: 1e-9, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[3]', expectQuestionIncludes: 'Two ice skaters, 60 kg and 80 kg',
    compute: () => (60 * 4) / 80, expected: 3, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[4]', expectQuestionIncludes: 'A 70 kg astronaut floating at rest throws a 2 kg tool away at 10 m/s',
    note: '"About 0.29": 2 s.f., so ±0.005.',
    compute: () => (2 * 10) / 70, expected: 0.2857, tolerance: 0.005, unit: 'm/s',
  },
  {
    lesson: 'momentum', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'A rocket in space has nothing to push against',
    expectAnswerIncludes: 'throws exhaust gas out backwards',
  },
  {
    lesson: 'momentum', where: 'textbookContent: collision, momentum before', expectNotesIncludes: 'a 2 kg trolley moving at 3 m/s hits a stationary 1 kg trolley',
    stated: '$(2 \\times 3) + (1 \\times 0) = 6$ kg m/s', pick: 4, compute: () => 2 * 3 + 1 * 0, expected: 6, tolerance: 1e-9, unit: 'kg m/s',
  },
  {
    lesson: 'momentum', where: 'textbookContent: collision, speed after', expectNotesIncludes: 'a 2 kg trolley moving at 3 m/s hits a stationary 1 kg trolley',
    stated: '$3v = 6$, so $v = 2$ m/s', pick: 2, compute: () => (2 * 3) / (2 + 1), expected: 2, tolerance: 1e-9, unit: 'm/s',
  },

  // ======================================================================================== thermodynamics
  {
    lesson: 'thermodynamics', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'A sealed tank holds 2 mol of gas at 300 K in a volume of 0.05 m³',
    stated: '= 4986$', compute: () => 2 * C.R_NOTES_THERMO * 300, expected: 4986, tolerance: 0.05, unit: '',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[0]', expectQuestionIncludes: 'Convert 27 °C to kelvin',
    compute: () => 27 + C.KELVIN_OFFSET_LESSON, expected: 300, tolerance: 1e-9, unit: 'K',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[1]', expectQuestionIncludes: 'sealed, rigid container doubles (in kelvin)',
    compute: () => { const p = (T: number) => (1 * C.R_NOTES_THERMO * T) / 1; return p(2 * 300) / p(300); },
    expected: 2, tolerance: 1e-9, unit: '× pressure',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[2]', expectQuestionIncludes: 'volume of 4 litres at a pressure of 200 kPa',
    compute: () => (200 * 4) / 100, expected: 8, tolerance: 1e-9, unit: 'litres',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[3] (Pa)', expectQuestionIncludes: '1 mol of an ideal gas at 300 K in a volume of 0.025 m³. ($R = 8.31$',
    note: '"About 99,700": 3 s.f., so ±50.',
    compute: () => (1 * C.R_NOTES_THERMO * 300) / 0.025, expected: 99720, tolerance: 50, unit: 'Pa',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[3] (kPa)', expectQuestionIncludes: '1 mol of an ideal gas at 300 K in a volume of 0.025 m³. ($R = 8.31$',
    stated: '99.7 kPa', compute: () => (1 * C.R_NOTES_THERMO * 300) / 0.025 / 1000, expected: 99.72, tolerance: 0.05, unit: 'kPa',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[4]', expectQuestionIncludes: 'heated from 300 K to 600 K',
    compute: () => (1.5 * C.K_BOLTZMANN_LESSON * 600) / (1.5 * C.K_BOLTZMANN_LESSON * 300), expected: 2, tolerance: 1e-9, unit: '× average KE',
  },
  {
    lesson: 'thermodynamics', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'Why must the temperature be in kelvin',
    expectAnswerIncludes: 'arbitrary zero',
  },
  {
    lesson: 'thermodynamics', where: 'textbookContent: Boltzmann constant k = R / N_A', expectNotesIncludes: 'The two forms agree because $Nk = nR$',
    stated: '$k = 1.38 \\times 10^{-23}$', note: 'Nk = nR means k = R / N_A; 3 s.f., so ±0.4%.',
    compute: () => C.R_NOTES_THERMO / C.N_AVOGADRO, expected: 1.3799e-23, relTolerance: 0.004, unit: 'J/K',
  },
  {
    lesson: 'thermodynamics', where: 'textbookContent: average KE at 300 K', expectNotesIncludes: 'at 300 K the average is',
    stated: '= 6.21 \\times 10^{-21}$ J', compute: () => 1.5 * C.K_BOLTZMANN_LESSON * 300, expected: 6.21e-21, relTolerance: 0.001, unit: 'J',
  },
  {
    lesson: 'thermodynamics', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'A sealed tank holds 2 mol of gas at 300 K in a volume of 0.05 m³',
    stated: '= 99\\,720$ Pa',
    compute: () => (2 * C.R_NOTES_THERMO * 300) / 0.05, expected: 99720, tolerance: 0.5, unit: 'Pa',
  },
  {
    lesson: 'thermodynamics', where: 'solvedExample.resultFormula (kPa)', expectQuestionIncludes: 'A sealed tank holds 2 mol of gas at 300 K in a volume of 0.05 m³',
    stated: 'about } 99.7', compute: () => (2 * C.R_NOTES_THERMO * 300) / 0.05 / 1000, expected: 99.72, tolerance: 0.05, unit: 'kPa',
  },

  // ======================================================================================== gravity
  {
    lesson: 'gravity', where: 'conceptSteps[1]', expectQuestionIncludes: 'Move twice as far from the centre of a planet',
    stated: 'its pull falls to a quarter', compute: () => 1 / 2 ** 2, expected: 0.25, tolerance: 1e-9, unit: '× force',
  },
  {
    lesson: 'gravity', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'Earth ($M = 5.97 \\times 10^{24}$ kg) and a $1000$ kg satellite in a low orbit',
    note: 'G = 6.67e-11, as in the notes. "≈ 8870": 3 s.f., so ±5 N.',
    compute: () => (C.G_NOTES_GRAVITY * C.M_EARTH * 1000) / (6.7e6) ** 2, expected: 8870.5, tolerance: 5, unit: 'N',
  },
  {
    lesson: 'gravity', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'Earth ($M = 5.97 \\times 10^{24}$ kg) and a $1000$ kg satellite in a low orbit',
    stated: '{3.98 \\times 10^{17}}', compute: () => C.G_NOTES_GRAVITY * C.M_EARTH * 1000, expected: 3.982e17, relTolerance: 0.002, unit: 'N m²',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[0]', expectQuestionIncludes: 'The distance between two masses is tripled',
    compute: () => 1 / 3 ** 2, expected: 1 / 9, tolerance: 1e-9, unit: '× force',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[1]', expectQuestionIncludes: 'The mass of a satellite is doubled',
    compute: () => 2, expected: 2, tolerance: 1e-9, unit: '× force',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[2] (value)', expectQuestionIncludes: 'at a height of one Earth radius above the surface',
    note: '"About 2.45": ±0.005.',
    compute: () => 9.81 / 2 ** 2, expected: 2.4525, tolerance: 0.005, unit: 'N/kg',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[2] (fraction)', expectQuestionIncludes: 'at a height of one Earth radius above the surface',
    stated: 'a quarter', compute: () => 1 / 2 ** 2, expected: 0.25, tolerance: 1e-9, unit: '× surface g',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[3]', expectQuestionIncludes: 'about 8.7 N/kg. What is the weight of an 80 kg astronaut',
    note: '"About 700 N": rounded to the nearest 10 N or so; ±10.',
    compute: () => 80 * 8.7, expected: 696, tolerance: 10, unit: 'N',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[4] (m/s)', expectQuestionIncludes: 'circular orbit of radius $7.0 \\times 10^6$ m. Take $GM = 3.98 \\times 10^{14}$',
    note: '"About 7,500": 2 s.f., so ±50.',
    compute: () => Math.sqrt(C.GM_GRAVITY_LESSON / 7.0e6), expected: 7540.4, tolerance: 50, unit: 'm/s',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[4] (km/s)', expectQuestionIncludes: 'circular orbit of radius $7.0 \\times 10^6$ m. Take $GM = 3.98 \\times 10^{14}$',
    stated: '7.5 km/s', compute: () => Math.sqrt(C.GM_GRAVITY_LESSON / 7.0e6) / 1000, expected: 7.540, tolerance: 0.05, unit: 'km/s',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[5] (90% in question)', expectQuestionIncludes: 'Gravity on the International Space Station is almost 90% as strong',
    statedIn: 'question', stated: 'almost 90%', note: 'ISS 8.7 N/kg against 9.81 N/kg at the surface; "almost 90%": 85 to 90.',
    compute: () => (8.7 / 9.81) * 100, expected: 88.69, tolerance: 3.5, unit: '%',
  },
  {
    lesson: 'gravity', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'Why do the astronauts float?',
    expectAnswerIncludes: 'falling freely together',
  },
  {
    lesson: 'gravity', where: 'textbookContent: g at surface (stated)', expectNotesIncludes: "At Earth's surface $g$ is 9.81 N/kg",
    stated: '$g$ is 9.81 N/kg', note: 'Computed from the notes\' own G, M and r.',
    compute: () => (C.G_NOTES_GRAVITY * C.M_EARTH) / C.R_EARTH_NOTES ** 2, expected: 9.8134, tolerance: 0.005, unit: 'N/kg',
  },
  {
    lesson: 'gravity', where: 'textbookContent: inverse square, double', expectNotesIncludes: 'inverse square law',
    stated: 'double the distance and the force falls to a quarter', pick: 1, compute: () => 1 / 2 ** 2, expected: 0.25, tolerance: 1e-9, unit: '× force',
  },
  {
    lesson: 'gravity', where: 'textbookContent: inverse square, triple', expectNotesIncludes: 'inverse square law',
    stated: 'triple it and the force falls to a ninth', pick: 1, compute: () => 1 / 3 ** 2, expected: 1 / 9, tolerance: 1e-9, unit: '× force',
  },
  {
    lesson: 'gravity', where: 'textbookContent: g at surface (worked)', expectNotesIncludes: '$M = 5.97 \\times 10^{24}$ kg and $r = 6.37 \\times 10^6$ m',
    stated: '= 9.81 \\text{ N/kg}', compute: () => (C.G_NOTES_GRAVITY * C.M_EARTH) / C.R_EARTH_NOTES ** 2, expected: 9.8134, tolerance: 0.005, unit: 'N/kg',
  },
  {
    lesson: 'gravity', where: 'textbookContent: ISS radius', expectNotesIncludes: 'International Space Station, about 400 km up',
    stated: '$r = 6.77 \\times 10^6$ m', compute: () => C.R_EARTH_NOTES + 400e3, expected: 6.77e6, relTolerance: 0.001, unit: 'm',
  },
  {
    lesson: 'gravity', where: 'textbookContent: g at ISS', expectNotesIncludes: 'International Space Station, about 400 km up',
    stated: '$g$ is still 8.7 N/kg', note: '2 s.f., so ±0.05.',
    compute: () => (C.G_NOTES_GRAVITY * C.M_EARTH) / C.R_ISS_NOTES ** 2, expected: 8.688, tolerance: 0.05, unit: 'N/kg',
  },
  {
    lesson: 'gravity', where: 'textbookContent: ISS orbital speed', expectNotesIncludes: '*Example:* at $r = 6.77 \\times 10^6$ m the speed is',
    stated: '= 7{,}670$ m/s', note: '3 s.f., so ±5.',
    compute: () => Math.sqrt(C.GM_GRAVITY_LESSON / C.R_ISS_NOTES), expected: 7667.4, tolerance: 5, unit: 'm/s',
  },
  {
    lesson: 'gravity', where: 'textbookContent: ISS period', expectNotesIncludes: '*Example:* at $r = 6.77 \\times 10^6$ m the speed is',
    stated: 'One lap takes about 92 minutes', note: 'T = 2πr / v; "about 92": ±1 min.',
    compute: () => (2 * Math.PI * C.R_ISS_NOTES) / Math.sqrt(C.GM_GRAVITY_LESSON / C.R_ISS_NOTES) / 60,
    expected: 92.47, tolerance: 1, unit: 'min',
  },

  // ======================================================================================== trajectory
  {
    lesson: 'trajectory', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'circular orbit of radius 7,000 km, or one of radius 42,000 km',
    expectAnswerIncludes: 'The one at 7,000 km',
    verify: () => {
      const v1 = Math.sqrt(C.GM_TRAJ_KM / 7000);
      const v2 = Math.sqrt(C.GM_TRAJ_KM / 42000);
      return { holds: v1 > v2, detail: `${fmt(v1)} km/s at 7,000 km against ${fmt(v2)} km/s at 42,000 km` };
    },
  },
  {
    lesson: 'trajectory', where: 'practiceProblems[1]', expectQuestionIncludes: 'circular orbits of radius 10,000 km and 20,000 km',
    compute: () => (10000 + 20000) / 2, expected: 15000, tolerance: 0, unit: 'km',
  },
  {
    lesson: 'trajectory', where: 'practiceProblems[2]', kind: 'qualitative', expectQuestionIncludes: 'How many engine burns does a Hohmann transfer need',
    expectAnswerIncludes: 'Two: one at the lowest point of the ellipse and one at the highest',
  },
  {
    lesson: 'trajectory', where: 'practiceProblems[3]', expectQuestionIncludes: 'circular orbit of radius 10,000 km. Take $GM = 3.986 \\times 10^5$',
    note: '"About 6.3": 2 s.f., so ±0.05.',
    compute: () => Math.sqrt(C.GM_TRAJ_KM / 10000), expected: 6.313, tolerance: 0.05, unit: 'km/s',
  },
  {
    lesson: 'trajectory', where: 'practiceProblems[4]', expectQuestionIncludes: 'from a circular orbit of radius 7,000 km to one of radius 13,000 km',
    compute: () => (7000 + 13000) / 2, expected: 10000, tolerance: 0, unit: 'km',
  },
  {
    lesson: 'trajectory', where: 'practiceProblems[5]', expectQuestionIncludes: 'The radius of a circular orbit is made 4 times larger',
    compute: () => 4 ** 1.5, expected: 8, tolerance: 1e-9, unit: '× period',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: GM in km³ s⁻²', expectNotesIncludes: 'For Earth, $GM = 3.986 \\times 10^{14}$',
    stated: '$GM = 3.986 \\times 10^{14}$ m³ s⁻², or $3.986 \\times 10^5$ km³ s⁻²', pick: 1,
    compute: () => 3.986e14 / 1000 ** 3, expected: 3.986e5, relTolerance: 1e-9, unit: 'km³ s⁻²',
  },
  {
    lesson: 'trajectory', where: 'solvedExample.steps[0] (GEO radius)', expectQuestionIncludes: 'to geostationary orbit, of radius 42,000 km',
    stated: '+ 42{,}000 =',  note: 'True GEO radius from one sidereal day is 42,164 km; 42,000 is fine to 2 s.f. (±500).',
    compute: () => hohmann.r2, expected: 42164, tolerance: 500, unit: 'km',
  },
  {
    lesson: 'trajectory', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'from a low orbit of radius 6,700 km to geostationary orbit',
    stated: '$6{,}700 + 42{,}000 = 48{,}700$ km', pick: 2, compute: () => 6700 + 42000, expected: 48700, tolerance: 0, unit: 'km',
  },
  {
    lesson: 'trajectory', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'from a low orbit of radius 6,700 km to geostationary orbit',
    compute: () => (6700 + 42000) / 2, expected: 24350, tolerance: 0, unit: 'km',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: burn 1', expectNotesIncludes: 'For a transfer from 300 km above the ground to geostationary orbit',
    stated: 'burn 1 adds about 2.4 km/s', pick: 1, note: 'r1 = 6371 + 300 km, r2 = 42,164 km, vis-viva at perigee minus circular speed. ±0.05.',
    compute: () => hohmann.burn1, expected: 2.428, tolerance: 0.05, unit: 'km/s',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: burn 2', expectNotesIncludes: 'For a transfer from 300 km above the ground to geostationary orbit',
    stated: 'burn 2 adds about 1.5 km/s', pick: 1, note: 'Circular speed at GEO minus vis-viva at apogee. ±0.05.',
    compute: () => hohmann.burn2, expected: 1.468, tolerance: 0.05, unit: 'km/s',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: coast time', expectNotesIncludes: 'For a transfer from 300 km above the ground to geostationary orbit',
    stated: 'about 5 hours 15 minutes', combine: (n) => n[0] * 60 + n[1], note: 't = π√(a³/GM). "About 5 h 15 min": ±5 min.',
    compute: () => hohmann.tCoastMin, expected: 316.4, tolerance: 5, unit: 'min',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: GEO speed', expectNotesIncludes: 'Faster twice, yet slower',
    stated: 'about 3.1 km/s in geostationary orbit', compute: () => hohmann.vCirc2, expected: 3.075, tolerance: 0.05, unit: 'km/s',
  },
  {
    lesson: 'trajectory', where: 'textbookContent: low orbit speed', expectNotesIncludes: 'Faster twice, yet slower',
    stated: 'against 7.7 km/s in the low one', note: 'The low orbit of the "going further" example (300 km up). ±0.05.',
    compute: () => hohmann.vCirc1, expected: 7.730, tolerance: 0.05, unit: 'km/s',
  },
];

// ---------------------------------------------------------------------------------------------------------
// Consistency: the same quantity written with different values within one lesson.
// ---------------------------------------------------------------------------------------------------------

type Consistency = {
  lesson: string;
  quantity: string;
  variants: Array<{ label: string; re: RegExp }>;
  /** What the difference does to a result, for the message. */
  effect?: string;
};

const CONSISTENCY: Consistency[] = [
  {
    lesson: 'thermodynamics',
    quantity: 'molar gas constant R',
    variants: [
      { label: 'R = 8.314', re: /8\.314/ },
      { label: 'R = 8.31', re: /8\.31(?!\d)/ },
    ],
    effect: `the same problem (2 mol, 300 K, 0.05 m³) gives ${fmt((2 * 8.314 * 300) / 0.05)} Pa with 8.314 and ${fmt((2 * 8.31 * 300) / 0.05)} Pa with 8.31`,
  },
  {
    lesson: 'thermodynamics',
    quantity: 'kelvin offset',
    variants: [
      { label: '273.15', re: /273\.15/ },
      { label: '273', re: /273(?![.\d])/ },
    ],
  },
  {
    lesson: 'gravity',
    quantity: 'gravitational constant G',
    variants: [
      { label: 'G = 6.674e-11', re: /6\.674/ },
      { label: 'G = 6.67e-11', re: /6\.67(?!\d)/ },
    ],
    effect: `the solvedExample force is ${fmt((6.674e-11 * 5.97e24 * 1000) / 6.7e6 ** 2)} N with 6.674 and ${fmt((6.67e-11 * 5.97e24 * 1000) / 6.7e6 ** 2)} N with 6.67`,
  },
  {
    lesson: 'gravity',
    quantity: "Earth's GM",
    variants: [
      { label: 'GM = 3.98e14', re: /3\.98(?!\d)/ },
      { label: 'GM = 3.986e14', re: /3\.986/ },
    ],
  },
  {
    lesson: 'trajectory',
    quantity: "Earth's GM",
    variants: [
      { label: 'GM = 3.98e14', re: /3\.98(?!\d)/ },
      { label: 'GM = 3.986e14', re: /3\.986/ },
    ],
  },
  {
    lesson: 'trajectory',
    quantity: 'geostationary radius',
    variants: [
      { label: '42,000 km', re: /42(?:,|\{,\}|\\,| )?000/ },
      { label: '42,164 km', re: /42(?:,|\{,\}|\\,| )?16\d/ },
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------
// Number extraction
// ---------------------------------------------------------------------------------------------------------

function normalise(s: string): string {
  return s
    .replace(/\{,\}/g, ',')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[   ]/g, ' ')
    .replace(/\\(?:d|t)?frac\{([^}]*)\}\{([^}]*)\}/g, ' $1 / $2 ')
    .replace(/\\text\{([^}]*)\}/g, ' $1 ')
    .replace(/\$/g, ' ')
    .replace(/−/g, '-');
}

const ORDINALS: Record<string, number> = {
  half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6,
  seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10,
};
const CARDINALS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
const MULTIPLIERS: Record<string, number> = {
  zero: 0, double: 2, doubles: 2, doubled: 2, twice: 2, triple: 3, triples: 3, tripled: 3, halves: 0.5, halved: 0.5,
};

/** Every number in a piece of lesson text, in reading order. */
export function extractNumbers(raw: string): number[] {
  let s = normalise(raw);
  const found: Array<{ i: number; v: number }> = [];
  const blank = (m: RegExpExecArray) => {
    s = s.slice(0, m.index) + ' '.repeat(m[0].length) + s.slice(m.index + m[0].length);
  };
  const scan = (re: RegExp, value: (m: RegExpExecArray) => number) => {
    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) matches.push(m);
    for (const mm of matches) {
      found.push({ i: mm.index, v: value(mm) });
      blank(mm);
    }
  };
  const num = (t: string) => Number(t.replace(/[, ]/g, ''));
  // Standard form: 6.5 \times 10^{-7}, 9.75 × 10^1
  scan(/(\d+(?:\.\d+)?)\s*(?:\\times|×|\\cdot)\s*10\^\{?\s*(-?\d+)\s*\}?/g, (m) => Number(m[1]) * 10 ** Number(m[2]));
  // A bare power of ten: 10^{12}
  scan(/(?<![\d.])10\^\{?\s*(-?\d+)\s*\}?/g, (m) => 10 ** Number(m[1]));
  // Grouped or plain numbers: 24,000 | 20 000 | 0.000 001 | 3.2. Not digits attached to a letter (v_2, m^2, 12-tooth is fine).
  scan(
    /(?<![A-Za-z_\d.^])(?:\d{1,3}(?:(?:,\d{3})+|(?: \d{3})+)(?!\d)|\d+)(?:\.\d+(?: \d{3}(?!\d))*)?/g,
    (m) => num(m[0]),
  );
  // Fractions in words: one ninth, a quarter, two thirds
  scan(
    new RegExp(`\\b(${Object.keys(CARDINALS).join('|')})\\s+(${Object.keys(ORDINALS).join('|')})\\b`, 'gi'),
    (m) => CARDINALS[m[1].toLowerCase()] / ORDINALS[m[2].toLowerCase()],
  );
  // Multipliers in words: doubles, zero
  scan(new RegExp(`\\b(${Object.keys(MULTIPLIERS).join('|')})\\b`, 'gi'), (m) => MULTIPLIERS[m[1].toLowerCase()]);
  return found.sort((a, b) => a.i - b.i).map((f) => f.v);
}

// ---------------------------------------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------------------------------------

function fmt(x: number): string {
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e6 || ax < 1e-3) return x.toExponential(4).replace(/\.?0+e/, 'e');
  return Number(x.toPrecision(6)).toLocaleString('en-GB', { maximumFractionDigits: 6 });
}

const short = (s: string, n = 110) => {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n - 1)}…` : one;
};

type Located = { question: string; answer: string; label: string };

function locate(mod: StudyModule, where: string): Located | null {
  let m: RegExpMatchArray | null;
  if ((m = where.match(/^practiceProblems\[(\d+)\]/))) {
    const p = mod.practiceProblems[Number(m[1])];
    return p ? { question: p.question, answer: p.answer, label: 'question' } : null;
  }
  if (where.startsWith('solvedExample.resultFormula')) {
    return { question: mod.solvedExample.problem, answer: mod.solvedExample.resultFormula, label: 'problem' };
  }
  if ((m = where.match(/^solvedExample\.steps\[(\d+)\]/))) {
    const st = mod.solvedExample.steps[Number(m[1])];
    return st !== undefined ? { question: mod.solvedExample.problem, answer: st, label: 'problem' } : null;
  }
  if ((m = where.match(/^conceptSteps\[(\d+)\]/))) {
    const c = mod.conceptSteps[Number(m[1])];
    if (!c) return null;
    const text = `${c.content}\n${c.keyInsight}`;
    return { question: text, answer: text, label: 'concept step' };
  }
  if (where.startsWith('textbookContent')) {
    const t = mod.textbookContent ?? '';
    return { question: t, answer: t, label: 'notes' };
  }
  return null;
}

function within(stated: number, computed: number, e: NumericEntry): boolean {
  if (e.relTolerance !== undefined) {
    if (computed === 0) return Math.abs(stated) <= e.relTolerance;
    return Math.abs(stated - computed) / Math.abs(computed) <= e.relTolerance;
  }
  return Math.abs(stated - computed) <= (e.tolerance ?? 0) + 1e-12 * Math.max(1, Math.abs(computed));
}

const tolText = (e: NumericEntry) =>
  e.relTolerance !== undefined ? `±${+(e.relTolerance * 100).toPrecision(3)}%` : `±${fmt(e.tolerance ?? 0)}`;

function checkEntry(e: Entry, mod: StudyModule): Finding[] {
  const base = { check: 'answers', lesson: e.lesson, where: e.where };
  const fail = (excerpt: string, message: string): Finding => ({ ...base, excerpt: short(excerpt), message, level: 'fail' });
  const pass = (excerpt: string, message: string): Finding => ({ ...base, excerpt: short(excerpt), message, level: 'info' });

  const loc = locate(mod, e.where);
  if (!loc) return [fail('', `no such item in the lesson (${e.where}); re-verify this entry`)];

  const fragment = e.where.startsWith('textbookContent') ? e.expectNotesIncludes : e.expectQuestionIncludes;
  if (!fragment) return [fail('', 'table error: entry has no question/notes fragment')];
  if (!loc.question.includes(fragment)) {
    return [fail(fragment, `${loc.label} text changed, re-verify this entry (fragment not found: "${short(fragment, 70)}")`)];
  }

  if (e.kind === 'qualitative') {
    if (!loc.answer.includes(e.expectAnswerIncludes)) {
      return [fail(loc.answer, `answer text changed, re-verify this entry (expected to include "${e.expectAnswerIncludes}")`)];
    }
    if (e.verify) {
      const r = e.verify();
      if (!r.holds) return [fail(loc.answer, `qualitative answer contradicted: ${r.detail}`)];
      return [pass(e.expectAnswerIncludes, `PASS qualitative "${e.expectAnswerIncludes}" (${r.detail})`)];
    }
    return [pass(e.expectAnswerIncludes, `PASS qualitative "${e.expectAnswerIncludes}" (tracked, not computed)`)];
  }

  if (e.kind === 'claim') {
    if (!loc.answer.includes(e.claimIncludes)) {
      return [pass(e.claimIncludes, `INFO claim "${e.claimIncludes}" no longer present; this entry can be removed`)];
    }
    const r = e.verify();
    if (!r.holds) return [fail(e.claimIncludes, `false claim "${e.claimIncludes}": ${r.detail}${e.note ? `. ${e.note}` : ''}`)];
    return [pass(e.claimIncludes, `PASS claim holds: ${r.detail}`)];
  }

  // Numeric
  const computed = e.compute();
  if (!Number.isFinite(computed)) return [fail('', 'table error: compute() is not a finite number')];
  const selfTol = e.relTolerance !== undefined ? e.relTolerance * Math.abs(computed) : e.tolerance ?? 0;
  if (Math.abs(computed - e.expected) > Math.max(selfTol, 1e-9 * Math.abs(computed), 1e-15)) {
    return [fail('', `table error: compute() gives ${fmt(computed)} but the hand-worked value is ${fmt(e.expected)}`)];
  }

  const source = e.statedIn === 'question' ? loc.question : loc.answer;
  const statedText = e.stated ?? source;
  if (e.stated && !source.includes(e.stated)) {
    return [fail(source, `stated answer changed, re-verify this entry (fragment not found: "${short(e.stated, 70)}")`)];
  }
  const nums = extractNumbers(statedText);
  let stated: number[];
  if (e.combine) {
    stated = [e.combine(nums)];
  } else {
    const picks = e.pick === undefined ? [0] : Array.isArray(e.pick) ? e.pick : [e.pick];
    if (picks.some((p) => p >= nums.length)) {
      return [fail(statedText, `could not read the stated number (found [${nums.map(fmt).join(', ')}])`)];
    }
    stated = picks.map((p) => nums[p]);
  }
  if (stated.some((v) => !Number.isFinite(v))) {
    return [fail(statedText, `could not read the stated number (found [${nums.map(fmt).join(', ')}])`)];
  }
  const unit = e.unit ? ` ${e.unit}` : '';
  const statedStr = stated.map(fmt).join(', ');
  const bad = stated.filter((v) => !within(v, computed, e));
  if (bad.length) {
    return [fail(statedText, `stated ${statedStr}${unit}, computed ${fmt(computed)}${unit} (${tolText(e)})${e.note ? `. ${e.note}` : ''}`)];
  }
  return [pass(statedText, `PASS stated ${statedStr}${unit}, computed ${fmt(computed)}${unit} (${tolText(e)})`)];
}

function lessonTexts(mod: StudyModule): Array<{ where: string; text: string }> {
  const out: Array<{ where: string; text: string }> = [];
  mod.conceptSteps.forEach((c, i) => out.push({ where: `conceptSteps[${i}]`, text: `${c.content}\n${c.keyInsight}` }));
  out.push({ where: 'solvedExample.problem', text: mod.solvedExample.problem });
  mod.solvedExample.steps.forEach((s, i) => out.push({ where: `solvedExample.steps[${i}]`, text: s }));
  out.push({ where: 'solvedExample.resultFormula', text: mod.solvedExample.resultFormula });
  mod.practiceProblems.forEach((p, i) =>
    out.push({ where: `practiceProblems[${i}]`, text: `${p.question}\n${p.hint}\n${p.answer}` }),
  );
  out.push({ where: 'realWorldConnection', text: mod.realWorldConnection });
  if (mod.textbookContent) out.push({ where: 'textbookContent', text: mod.textbookContent });
  return out;
}

function checkConsistency(c: Consistency, mod: StudyModule): Finding[] {
  const texts = lessonTexts(mod);
  const seen = c.variants
    .map((v) => ({ v, places: texts.filter((t) => v.re.test(t.text)).map((t) => t.where) }))
    .filter((x) => x.places.length > 0);
  if (seen.length < 2) return [];
  const where = seen.map((x) => `${x.v.label} in ${x.places.join(', ')}`).join('; ');
  return [
    {
      check: 'answers',
      lesson: c.lesson,
      where: `consistency: ${c.quantity}`,
      excerpt: short(where),
      message: `${c.quantity} has different values in one lesson: ${where}${c.effect ? `. Effect: ${c.effect}` : ''}`,
      level: 'warn',
    },
  ];
}

/** Every mission's entries. Missions other than 2 keep theirs in ./answers/<mission>.ts. */
const TABLE: Entry[] = [...MISSION_2_TABLE, ...TOOLKIT, ...NAVIGATE, ...SIGNAL, ...STARLIGHT];

export const MISSION_2_LESSONS: string[] = MISSIONS.find((m) => m.id === 'orbit')?.lessons.slice() ?? [];

/** Run the answer checks. Passing entries come back as level 'info' with a message starting "PASS". */
export function runAnswerChecks(lessonIds?: string[]): Finding[] {
  const ids = lessonIds && lessonIds.length ? lessonIds : MISSION_2_LESSONS;
  const findings: Finding[] = [];
  for (const id of ids) {
    const mod = studyModules.find((m) => m.id === id);
    if (!mod) {
      findings.push({ check: 'answers', lesson: id, where: '-', excerpt: '', message: `no lesson with id "${id}"`, level: 'fail' });
      continue;
    }
    const entries = TABLE.filter((e) => e.lesson === id);
    if (!entries.length) {
      findings.push({ check: 'answers', lesson: id, where: '-', excerpt: '', message: 'no answer entries for this lesson', level: 'warn' });
    }
    for (const e of entries) findings.push(...checkEntry(e, mod));
    for (const c of CONSISTENCY.filter((x) => x.lesson === id)) findings.push(...checkConsistency(c, mod));
  }
  return findings;
}

/** Number of table entries for the given lessons. */
export function countAnswerEntries(lessonIds?: string[]): number {
  const ids = lessonIds && lessonIds.length ? lessonIds : MISSION_2_LESSONS;
  return TABLE.filter((e) => ids.includes(e.lesson)).length;
}

function main(): void {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const ids = args.length ? args : MISSION_2_LESSONS;
  const findings = runAnswerChecks(ids);
  for (const id of ids) {
    const fs = findings.filter((f) => f.lesson === id);
    const n = TABLE.filter((e) => e.lesson === id).length;
    console.log(`\n${id} (${n} entries)`);
    for (const f of fs) {
      const tag = f.level === 'fail' ? 'FAIL' : f.level === 'warn' ? 'WARN' : f.message.startsWith('INFO') ? 'INFO' : 'PASS';
      const msg = f.message.replace(/^(PASS|INFO) /, '');
      console.log(`  ${tag}  ${f.where}: ${msg}`);
      if (f.level !== 'info' && f.excerpt) console.log(`        > ${f.excerpt}`);
    }
  }
  const failures = findings.filter((f) => f.level === 'fail').length;
  const warnings = findings.filter((f) => f.level === 'warn').length;
  console.log(`\nanswers: ${countAnswerEntries(ids)} checked, ${failures} failures, ${warnings} warnings`);
  process.exitCode = failures ? 1 : 0;
}

// Run the CLI only when this file is executed directly, not when it is imported by another check runner.
const runDirectly = /content-checks[\\/]answers\.ts$/.test(process.argv[1] ?? '');
if (runDirectly) main();
