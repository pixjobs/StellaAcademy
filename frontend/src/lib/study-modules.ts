import { type FormulaElement } from '@/components/study/VariableHighlighter';

export type ConceptId = 'gravity' | 'prism' | 'gears' | 'trajectory' | 'circuit' | 'waves' | 'fractions' | 'trigonometry' | 'calculus' | 'vectors' | 'matrices' | 'probability' | 'diffeq' | 'arithmetic' | 'basic-geometry' | 'proportions' | 'decimals-percentages' | 'angles' | 'binary' | 'multiplication' | 'fraction-ops' | 'negative-numbers' | 'exponents-roots' | 'thermodynamics' | 'momentum' | 'statistics' | 'electromagnetism' | 'quantum' | 'units';
export type CategoryId = 'physics' | 'mechanics' | 'electronics' | 'mathematics' | 'elementary-math';

export interface StudyModule {
  id: ConceptId;
  category: CategoryId;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: 'indigo' | 'amber' | 'emerald' | 'violet' | 'rose' | 'cyan';
  difficulty: number;
  estimatedMinutes: number;
  formula: string;
  formulaLayout: FormulaElement[];
  variables: Array<{
    symbol: string;
    name: string;
    unit: string;
    description: string;
    color: string;
    range?: { min: number; max: number; default: number };
  }>;
  conceptSteps: Array<{
    stepNumber: number;
    title: string;
    content: string;
    keyInsight: string;
    relatedVariables: string[];
  }>;
  solvedExample: {
    problem: string;
    steps: string[];
    resultFormula: string;
  };
  practiceProblems: Array<{
    question: string;
    hint: string;
    answer: string;
  }>;
  realWorldConnection: string;
  textbookContent?: string;
}

export const studyModules: StudyModule[] = [
  {
    id: 'gravity',
    category: 'physics',
    title: "Gravity and Newton's Law of Gravitation",
    subtitle: "How the pull between two masses depends on their size and the distance between them.",
    icon: 'Sparkles',
    accentColor: 'indigo',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: 'F_g = G \\frac{M \\cdot m}{r^2}',
    formulaLayout: [
      { type: 'variable', symbol: 'F_g' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'G' },
      { type: 'operator', content: '·' },
      {
        type: 'fraction',
        numerator: [
          { type: 'variable', symbol: 'M' },
          { type: 'operator', content: '·' },
          { type: 'variable', symbol: 'm' }
        ],
        denominator: [
          { type: 'variable', symbol: 'r' },
          { type: 'static', latex: '^2' }
        ]
      }
    ],
    variables: [
      {
        symbol: 'F_g',
        name: 'Gravitational Force',
        unit: 'Newtons (N)',
        description: 'The attractive force between two masses. Gravity is always attractive, pulling masses together across space.',
        color: 'text-indigo-400'
      },
      {
        symbol: 'G',
        name: 'Gravitational Constant',
        unit: 'N⋅m²/kg²',
        description: 'A fundamental constant of the universe that determines the baseline strength of gravity.',
        color: 'text-violet-400'
      },
      {
        symbol: 'M',
        name: 'Mass 1 (Attractor)',
        unit: 'Kilograms (kg)',
        description: 'The mass of the larger object, typically a planet or star in orbital mechanics.',
        color: 'text-cyan-400',
        range: { min: 1, max: 10, default: 1 }
      },
      {
        symbol: 'm',
        name: 'Mass 2 (Satellite)',
        unit: 'Kilograms (kg)',
        description: 'The mass of the smaller object, such as a satellite or spacecraft.',
        color: 'text-sky-400'
      },
      {
        symbol: 'r',
        name: 'Distance',
        unit: 'Metres (m)',
        description: 'The distance between the centres of mass of the two objects. Because it is squared in the denominator, gravity weakens quickly as distance increases.',
        color: 'text-rose-400',
        range: { min: 1, max: 10, default: 2 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Universal Attraction',
        content: 'Every particle attracts every other particle in the universe with a force proportional to the product of their masses.',
        keyInsight: 'More massive objects create a stronger gravitational pull.',
        relatedVariables: ['M', 'm']
      },
      {
        stepNumber: 2,
        title: 'The Inverse-Square Law',
        content: 'The gravitational force is inversely proportional to the square of the distance between the centres of the masses. If you double the distance, the force becomes a quarter as strong.',
        keyInsight: 'Gravity weakens very quickly as you move away from a planet.',
        relatedVariables: ['r', 'F_g']
      },
      {
        stepNumber: 3,
        title: 'Orbital Mechanics',
        content: 'In orbit, a satellite moves sideways so fast that as it falls towards the planet, the surface curves away beneath it. It is constantly in free-fall.',
        keyInsight: 'Orbits are just falling while moving sideways fast enough to miss the ground.',
        relatedVariables: ['F_g']
      }
    ],
    solvedExample: {
      problem: 'Calculate the gravitational force between Earth ($M = 5.97 \\times 10^{24}$ kg) and a $1000$ kg satellite in Low Earth Orbit ($r = 6.7 \\times 10^6$ m).',
      steps: [
        'Identify given values and the gravitational constant $G \\approx 6.674 \\times 10^{-11}$.',
        'Plug values into the formula: $F_g = G \\frac{M \\cdot m}{r^2}$.',
        'Substitute the numbers: $F_g = (6.674 \\times 10^{-11}) \\frac{5.97 \\times 10^{24} \\cdot 1000}{(6.7 \\times 10^6)^2}$.',
        'Calculate the result.'
      ],
      resultFormula: 'F_g \\approx 8880 \\text{ N}'
    },
    practiceProblems: [
      {
        question: "The distance between two masses is tripled. How does the gravitational force between them change?",
        hint: "The force depends on 1 ÷ r².",
        answer: "It falls to one ninth."
      },
      {
        question: "The mass of a satellite is doubled, and it stays in the same orbit. What happens to the gravitational force on it?",
        hint: "The force is proportional to each mass.",
        answer: "It doubles."
      },
      {
        question: "The gravitational field strength at Earth's surface is 9.81 N/kg. What is it at a height of one Earth radius above the surface?",
        hint: "That point is twice as far from Earth's centre as the surface is.",
        answer: "About 2.45 N/kg, a quarter of the surface value"
      },
      {
        question: "On the International Space Station the field strength is about 8.7 N/kg. What is the weight of an 80 kg astronaut there?",
        hint: "Weight = mass × gravitational field strength.",
        answer: "About 700 N"
      },
      {
        question: "Find the speed of a satellite in a circular orbit of radius $7.0 \\times 10^6$ m. Take $GM = 3.98 \\times 10^{14}$ m³ s⁻².",
        hint: "Use $v = \\sqrt{GM \\div r}$.",
        answer: "About 7,500 m/s, or 7.5 km/s"
      },
      {
        question: "Gravity on the International Space Station is almost 90% as strong as on the ground. Why do the astronauts float?",
        hint: "Think about what the station and the astronauts are both doing.",
        answer: "The station and everyone in it are falling freely together around Earth. Nothing presses on them, so they feel weightless even though gravity still acts."
      },
    ],
    realWorldConnection: 'Engineers use this exact law to calculate the precise trajectories of spacecraft, ensuring they can slingshot around planets or establish stable orbits without burning excess fuel.',
    textbookContent: `
## Gravitational fields

### What a field is

A gravitational field is a region where a mass feels a force. The **gravitational field strength**, $g$, is the force on each kilogram:

$$g = \\frac{F}{m}$$

It is measured in newtons per kilogram (N/kg). At Earth's surface $g$ is 9.81 N/kg, so a mass $m$ has weight $W = mg$.

### Newton's law of gravitation

Every mass attracts every other mass. For two point masses, or two spheres, the force is:

$$F = \\frac{GMm}{r^2}$$

*   $M$ and $m$ are the two masses, in kilograms.
*   $r$ is the distance between their **centres**, in metres.
*   $G = 6.67 \\times 10^{-11}$ N m² kg⁻² is the gravitational constant.

The force is always attractive. It follows an **inverse square law**: double the distance and the force falls to a quarter; triple it and the force falls to a ninth.

### Field strength around a planet

Dividing the force by $m$ gives the field strength at a distance $r$ from the centre of a mass $M$:

$$g = \\frac{GM}{r^2}$$

*Example:* at Earth's surface, with $M = 5.97 \\times 10^{24}$ kg and $r = 6.37 \\times 10^6$ m:

$$g = \\frac{6.67 \\times 10^{-11} \\times 5.97 \\times 10^{24}}{(6.37 \\times 10^6)^2} = 9.81 \\text{ N/kg}$$

At the height of the International Space Station, about 400 km up, $r = 6.77 \\times 10^6$ m and $g$ is still 8.7 N/kg. Gravity has hardly weakened. Astronauts float because they and the station are falling together, not because gravity has gone.

### Why a satellite stays up

A satellite in a circular orbit is always falling towards Earth, but it is moving sideways fast enough that the ground curves away beneath it. Gravity supplies exactly the force needed for circular motion:

$$\\frac{GMm}{r^2} = \\frac{mv^2}{r} \\qquad \\text{so} \\qquad v = \\sqrt{\\frac{GM}{r}}$$

The satellite's own mass cancels, so every satellite at the same height moves at the same speed. A higher orbit means a slower satellite.

*Example:* at $r = 6.77 \\times 10^6$ m the speed is $\\sqrt{\\dfrac{3.98 \\times 10^{14}}{6.77 \\times 10^6}} = 7{,}670$ m/s. One lap takes about 92 minutes.

### Gravitational potential

The **gravitational potential** at a point is the potential energy of each kilogram placed there:

$$V = -\\frac{GM}{r}$$

It is negative because work has to be done to pull a mass away from the planet, and it is taken to be zero infinitely far away. Moving a mass $m$ through a potential difference $\\Delta V$ changes its potential energy by $m\\,\\Delta V$.

### Comparing gravity with electric fields

Both follow an inverse square law for point sources, and both have a field strength and a potential. The difference is that gravity only ever attracts, while electric forces can attract or repel.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
*   [National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study) (Department for Education)
`
  },
  {
    id: 'prism',
    category: 'physics',
    title: "Refraction and Snell's Law",
    subtitle: "Why light bends when it enters glass or water, and how a prism splits it into colours.",
    icon: 'Sparkles',
    accentColor: 'indigo',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: 'n_1 \\sin(\\theta_i) = n_2 \\sin(\\theta_r)',
    formulaLayout: [
      { type: 'variable', symbol: 'n_1' },
      { type: 'static', latex: '\\sin(' },
      { type: 'variable', symbol: '\\theta_i' },
      { type: 'static', latex: ')' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'n_2' },
      { type: 'static', latex: '\\sin(' },
      { type: 'variable', symbol: '\\theta_r' },
      { type: 'static', latex: ')' }
    ],
    variables: [
      {
        symbol: 'n_1',
        name: 'Initial Refractive Index',
        unit: 'Unitless',
        description: 'A measure of how much light slows down in the first medium (e.g., air).',
        color: 'text-indigo-400'
      },
      {
        symbol: '\\theta_i',
        name: 'Angle of Incidence',
        unit: 'Degrees or Radians',
        description: 'The angle at which the incoming light ray strikes the boundary, measured from the normal (perpendicular) line.',
        color: 'text-sky-400'
      },
      {
        symbol: 'n_2',
        name: 'Final Refractive Index',
        unit: 'Unitless',
        description: 'A measure of how much light slows down in the second medium (e.g., glass or water).',
        color: 'text-cyan-400',
        range: { min: 1, max: 2.5, default: 1.5 }
      },
      {
        symbol: '\\theta_r',
        name: 'Angle of Refraction',
        unit: 'Degrees or Radians',
        description: 'The angle at which the light ray travels through the second medium, measured from the normal line.',
        color: 'text-rose-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Speed of Light in a Medium',
        content: 'Light travels slower in materials like glass or water than it does in a vacuum. The refractive index (n) is the ratio of the speed of light in a vacuum to its speed in the medium.',
        keyInsight: 'A higher refractive index means light travels slower in that material.',
        relatedVariables: ['n_1', 'n_2']
      },
      {
        stepNumber: 2,
        title: 'Bending of Light',
        content: 'When light enters a new medium at an angle, the change in speed causes the ray to bend. This is called refraction.',
        keyInsight: 'Light bends towards the normal when slowing down, and away when speeding up.',
        relatedVariables: ['\\theta_i', '\\theta_r']
      },
      {
        stepNumber: 3,
        title: 'Dispersion',
        content: 'Different colours of light have slightly different refractive indices in materials like glass. This causes white light to split into a rainbow spectrum when passing through a prism.',
        keyInsight: 'Blue light bends more than red light because it has a shorter wavelength.',
        relatedVariables: ['n_2', '\\theta_r']
      }
    ],
    solvedExample: {
      problem: 'Find the angle of refraction ($\\theta_r$) from air ($n_1 = 1.0$) to glass ($n_2 = 1.5$) at $\\theta_i = 30^\\circ$.',
      steps: [
        'Apply Snell\'s Law: $1.0 \\cdot \\sin(30^\\circ) = 1.5 \\cdot \\sin(\\theta_r)$.',
        '$\\sin(30^\\circ)$ is exactly $0.5$.',
        'Substitute the value: $0.5 = 1.5 \\cdot \\sin(\\theta_r)$.',
        'Solve for the sine of the angle: $\\sin(\\theta_r) = \\frac{0.5}{1.5} = 0.333$.',
        'Calculate the inverse sine: $\\theta_r = \\arcsin(0.333)$.'
      ],
      resultFormula: '\\theta_r \\approx 19.47^\\circ'
    },
    practiceProblems: [
      {
        question: 'If light enters water (n = 1.33) from air (n = 1.0) at an angle of 45°, what is the angle of refraction?',
        hint: 'Use Snell\'s law and solve for $\\theta_r$.',
        answer: '$\\theta_r \\approx 32.1^\\circ$'
      },
      {
        question: 'Does light bend towards or away from the normal when moving from glass to air?',
        hint: 'Consider the change in refractive index (high to low).',
        answer: 'Away from the normal.'
      }
    ],
    realWorldConnection: 'Spectrometers use prisms or diffraction gratings to analyse the light from distant stars, revealing their chemical composition.',
    textbookContent: `
## Snell's Law and Refraction

Refraction is the change in direction of a wave passing from one medium to another or from a gradual change in the medium. Snell's Law (also known as the Snell-Descartes law) describes the relationship between the angles of incidence and refraction for light or other waves passing through a boundary between two different isotropic media.

Mathematically, Snell's Law is stated as:
$n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)$

### Core Principles

*   **$n_1, n_2$ (Index of Refraction):** The refractive index is a dimensionless number that describes how fast light travels through the material. It is defined as $c/v$, where $c$ is the speed of light in a vacuum and $v$ is the phase velocity of light in the medium.
*   **$\\theta_1$ (Angle of Incidence):** The angle between the incident ray and the normal (perpendicular line) to the surface interface.
*   **$\\theta_2$ (Angle of Refraction):** The angle between the refracted ray and the normal to the surface interface.

### Fermat's Principle of Least Time

Snell's Law can be derived from Fermat's Principle, which states that the path taken by a ray between two given points is the path that can be traversed in the least time. When light enters a denser medium (higher index of refraction), its phase velocity decreases. To minimise the overall travel time, the light ray bends *towards* the normal to shorten its path length within the slower medium.

*Reference: Hecht, E. (2016). Optics (5th ed.). Pearson.*
    

### References

*   [Optics (5th Edition)](https://www.pearson.com/en-us/subject-catalog/p/optics/P200000003284) (Eugene Hecht)
*   [Principles of Optics](https://en.wikipedia.org/wiki/Principles_of_Optics) (Max Born & Emil Wolf)
*   [Fermat's Principle of Least Time - Feynman Lectures](https://www.feynmanlectures.caltech.edu/I_26.html)
`
  },
  {
    id: 'gears',
    category: 'mechanics',
    title: "Gears and Gear Ratios",
    subtitle: "How gears trade speed for turning force, and how to work out a gear ratio.",
    icon: 'Activity',
    accentColor: 'amber',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: '\\text{Ratio} = \\frac{N_{\\text{driven}}}{N_{\\text{driver}}} = \\frac{\\omega_{\\text{driver}}}{\\omega_{\\text{driven}}}',
    formulaLayout: [
      { type: 'variable', symbol: '\\text{Ratio}' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'N_{\\text{driven}}' }],
        denominator: [{ type: 'variable', symbol: 'N_{\\text{driver}}' }]
      },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: '\\omega_{\\text{driver}}' }],
        denominator: [{ type: 'variable', symbol: '\\omega_{\\text{driven}}' }]
      }
    ],
    variables: [
      {
        symbol: '\\text{Ratio}',
        name: 'Gear Ratio',
        unit: 'Unitless',
        description: 'The ratio of the number of teeth on the driven gear to the number of teeth on the driving gear.',
        color: 'text-amber-400',
        range: { min: 1, max: 5, default: 2 }
      },
      {
        symbol: 'N_{\\text{driven}}',
        name: 'Driven Gear Teeth',
        unit: 'Count',
        description: 'The number of teeth on the gear that is receiving power.',
        color: 'text-orange-400'
      },
      {
        symbol: 'N_{\\text{driver}}',
        name: 'Driver Gear Teeth',
        unit: 'Count',
        description: 'The number of teeth on the gear that is attached to the motor or power source.',
        color: 'text-yellow-400'
      },
      {
        symbol: '\\omega_{\\text{driver}}',
        name: 'Driver Speed',
        unit: 'RPM or rad/s',
        description: 'The rotational speed of the driving gear.',
        color: 'text-rose-400'
      },
      {
        symbol: '\\omega_{\\text{driven}}',
        name: 'Driven Speed',
        unit: 'RPM or rad/s',
        description: 'The rotational speed of the driven gear.',
        color: 'text-red-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Transmitting Motion',
        content: 'Gears are used to transmit rotational motion and torque between shafts. When two gears mesh, they rotate in opposite directions.',
        keyInsight: 'Gears allow us to trade speed for torque, or torque for speed.',
        relatedVariables: ['\\text{Ratio}']
      },
      {
        stepNumber: 2,
        title: 'Calculating the Ratio',
        content: 'The gear ratio is found by dividing the number of teeth on the driven gear by the number of teeth on the driver gear.',
        keyInsight: 'A ratio > 1 means the output is slower but has more torque.',
        relatedVariables: ['N_{\\text{driven}}', 'N_{\\text{driver}}']
      },
      {
        stepNumber: 3,
        title: 'Speed vs. Torque',
        content: 'If a small gear drives a large gear, the large gear turns slower but can provide a much stronger twisting force (torque).',
        keyInsight: 'Speed and torque are inversely related in a gear train.',
        relatedVariables: ['\\omega_{\\text{driver}}', '\\omega_{\\text{driven}}']
      }
    ],
    solvedExample: {
      problem: 'Find the output torque ($\\tau_{\\text{out}}$) if a motor drives a 12-tooth gear at $5$ Nm, meshed with a 36-tooth gear.',
      steps: [
        'Find the gear ratio: $\\text{Ratio} = \\frac{36}{12} = 3.0$.',
        'Remember that torque multiplies by the gear ratio.',
        'Calculate output torque: $\\tau_{\\text{out}} = \\tau_{\\text{in}} \\cdot \\text{Ratio} = 5 \\cdot 3.0$.'
      ],
      resultFormula: '\\tau_{\\text{out}} = 15 \\text{ Nm}'
    },
    practiceProblems: [
      {
        question: "A driver gear has 20 teeth and the gear it drives has 40 teeth. What is the gear ratio?",
        hint: "Divide the teeth on the driven gear by the teeth on the driver.",
        answer: "2 (often written 2 : 1)"
      },
      {
        question: "In question 1 the driver gear turns 100 times a minute. How fast does the driven gear turn?",
        hint: "Divide the driver's speed by the gear ratio.",
        answer: "50 turns per minute"
      },
      {
        question: "A force of 10 N acts 0.2 m from a pivot, at right angles to the line from the pivot. What is its moment?",
        hint: "Moment = force × distance.",
        answer: "2 N m"
      },
      {
        question: "A motor gives a moment of 3 N m to a 10-tooth gear, which drives a 50-tooth gear. What moment does the larger gear deliver?",
        hint: "Find the gear ratio, then multiply the moment by it.",
        answer: "15 N m (the gear ratio is 5)"
      },
      {
        question: "A 30-tooth gear turning 60 times a minute drives a 10-tooth gear. How fast does the small gear turn, and what happens to the moment?",
        hint: "The ratio is 10 ÷ 30, which is less than 1.",
        answer: "180 turns per minute. The moment falls to one third."
      },
      {
        question: "Two gears mesh. The driver turns clockwise. Which way does the driven gear turn?",
        hint: "Picture the teeth pushing against each other where the gears touch.",
        answer: "Anticlockwise. Meshing gears always turn in opposite directions."
      },
    ],
    realWorldConnection: 'Rovers on Mars use highly geared motors to drive slowly over rocks while producing enormous amounts of torque to avoid getting stuck.',
    textbookContent: `
## Gears and turning forces

### The moment of a force

A force can make something turn. Its turning effect is called its **moment**:

$$\\text{moment} = \\text{force} \\times \\text{distance}$$

The distance is measured from the pivot to the line of the force, at right angles to the force. Force is in newtons (N), distance in metres (m), and the moment in newton metres (N m). Engineers often call the moment of a motor its torque.

The same force has a bigger turning effect when it acts further from the pivot. That is why a long spanner undoes a tight nut more easily than a short one.

### How gears pass a turning effect on

Gears are wheels with teeth that fit together, or **mesh**. When one gear turns, its teeth push on the teeth of the next.

*   Where the teeth touch, each gear pushes on the other with the same size of force.
*   On a larger gear that force acts further from the centre, so its moment is larger.
*   Teeth pass the meeting point one at a time on both gears, so the gear with more teeth takes longer to go round once.
*   Two meshing gears always turn in opposite directions.

### Gear ratio

$$\\text{gear ratio} = \\frac{\\text{teeth on the driven gear}}{\\text{teeth on the driver gear}}$$

The **driver** is the gear being turned by the motor or the pedals. The **driven** gear is the one it turns.

If there is no friction:

*   speed of the driven gear = speed of the driver ÷ gear ratio
*   moment on the driven gear = moment on the driver × gear ratio

### You cannot get something for nothing

A gear ratio bigger than 1 gives a larger moment but a slower turn. A ratio smaller than 1 gives a faster turn but a smaller moment. Gears never give more of both. A simple machine can make a force bigger only by making the movement smaller.

### Worked example

A motor turns a 12-tooth gear 90 times a minute with a moment of 5 N m. It drives a 36-tooth gear.

1.  Gear ratio: $\\dfrac{36}{12} = 3$.
2.  Speed of the driven gear: $90 \\div 3 = 30$ turns per minute.
3.  Moment on the driven gear: $5 \\times 3 = 15$ N m.

### Where gears matter

A bicycle's low gear lets you climb a hill with less push on the pedals, in exchange for more turns of them. A rover on Mars does the same thing with its wheels: small electric motors that spin fast drive the wheels through gears, so the wheels turn slowly but with enough moment to climb over rocks.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
*   [National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study) (Department for Education)
`
  },
  {
    id: 'trajectory',
    category: 'mechanics',
    title: "Orbits and Hohmann Transfers",
    subtitle: "How a spacecraft moves from one orbit to a higher one.",
    icon: 'Activity',
    accentColor: 'amber',
    difficulty: 3,
    estimatedMinutes: 20,
    formula: 'a = \\frac{r_1 + r_2}{2}',
    formulaLayout: [
      { type: 'variable', symbol: 'a' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [
          { type: 'variable', symbol: 'r_1' },
          { type: 'operator', content: '+' },
          { type: 'variable', symbol: 'r_2' }
        ],
        denominator: [
          { type: 'static', latex: '2' }
        ]
      }
    ],
    variables: [
      {
        symbol: 'a',
        name: 'Semi-major Axis',
        unit: 'Metres or Kilometres',
        description: 'Half of the longest diameter of the elliptical transfer orbit. It defines the size and energy of the orbit.',
        color: 'text-amber-400'
      },
      {
        symbol: 'r_1',
        name: 'Initial Orbit Radius',
        unit: 'Metres or Kilometres',
        description: 'The radius of the circular orbit the spacecraft starts in.',
        color: 'text-orange-400'
      },
      {
        symbol: 'r_2',
        name: 'Target Orbit Radius',
        unit: 'Metres or Kilometres',
        description: 'The radius of the destination circular orbit.',
        color: 'text-yellow-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Orbital Transfers',
        content: 'To move from one orbit to another, a spacecraft must change its velocity (ΔV). A Hohmann transfer is the most fuel-efficient way to transfer between two circular, coplanar orbits.',
        keyInsight: 'A Hohmann transfer needs exactly two engine burns.',
        relatedVariables: []
      },
      {
        stepNumber: 2,
        title: 'The Transfer Ellipse',
        content: 'The first burn puts the spacecraft into an elliptical transfer orbit. The lowest point (periapsis) is at the original orbit, and the highest point (apoapsis) touches the target orbit.',
        keyInsight: 'The semi-major axis (a) of this ellipse is the average of the two orbital radii.',
        relatedVariables: ['a', 'r_1', 'r_2']
      },
      {
        stepNumber: 3,
        title: 'Circularising',
        content: 'When the spacecraft reaches the target altitude, it is moving too slowly to stay there. A second burn is required to circularise the orbit at the new altitude.',
        keyInsight: 'Without the second burn, the spacecraft stays on the transfer ellipse and swings back down to its original altitude.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Calculate the semi-major axis ($a$) of a Hohmann transfer from LEO ($r_1 = 6700$ km) to GEO ($r_2 = 42000$ km).',
      steps: [
        'Sum the radii: $r_1 + r_2 = 6700 + 42000 = 48700$ km.',
        'Divide by 2 to find the average: $a = \\frac{48700}{2}$.'
      ],
      resultFormula: 'a = 24,350 \\text{ km}'
    },
    practiceProblems: [
      {
        question: "Which moves faster: a satellite in a circular orbit of radius 7,000 km, or one of radius 42,000 km?",
        hint: "Look at $v = \\sqrt{GM \\div r}$.",
        answer: "The one at 7,000 km. The lower the orbit, the faster the satellite."
      },
      {
        question: "What is the semi-major axis of a transfer ellipse between circular orbits of radius 10,000 km and 20,000 km?",
        hint: "It is the average of the two radii.",
        answer: "15,000 km"
      },
      {
        question: "How many engine burns does a Hohmann transfer need, and where?",
        hint: "One to join the transfer ellipse and one to leave it.",
        answer: "Two: one at the lowest point of the ellipse and one at the highest."
      },
      {
        question: "Find the speed of a satellite in a circular orbit of radius 10,000 km. Take $GM = 3.986 \\times 10^5$ km³ s⁻².",
        hint: "Use $v = \\sqrt{GM \\div r}$ with r in kilometres.",
        answer: "About 6.3 km/s"
      },
      {
        question: "A spacecraft is to move from a circular orbit of radius 7,000 km to one of radius 13,000 km. What is the semi-major axis of the transfer ellipse?",
        hint: "Add the radii and halve the total.",
        answer: "10,000 km"
      },
      {
        question: "The radius of a circular orbit is made 4 times larger. How does the time for one orbit change?",
        hint: "The period is proportional to r to the power 1.5.",
        answer: "It becomes 8 times longer."
      },
    ],
    realWorldConnection: 'This trajectory is used by satellites moving from Low Earth Orbit to Geostationary Orbit, as well as missions sending probes to Mars.',
    textbookContent: `
## Changing orbit

### Speed in a circular orbit

For a satellite in a circular orbit, gravity supplies the force for circular motion (see [Gravity and Newton's Law of Gravitation](/study/gravity)):

$$\\frac{GMm}{r^2} = \\frac{mv^2}{r} \\qquad \\text{so} \\qquad v = \\sqrt{\\frac{GM}{r}}$$

The higher the orbit, the slower the satellite. For Earth, $GM = 3.986 \\times 10^{14}$ m³ s⁻², or $3.986 \\times 10^5$ km³ s⁻² if you work in kilometres.

The time for one orbit is the distance round divided by the speed:

$$T = \\frac{2\\pi r}{v} = 2\\pi\\sqrt{\\frac{r^3}{GM}}$$

### The problem

A spacecraft in a low orbit cannot simply point at a higher orbit and fire its engine. Whatever it does, it keeps orbiting. The most economical way to climb between two circular orbits is the **Hohmann transfer**, which uses two short engine burns.

1.  **Burn 1.** The spacecraft speeds up. It is now moving too fast for its circular orbit, so it climbs away along an ellipse.
2.  **Coast.** It travels half way round that ellipse, slowing down as it climbs, until it reaches the height of the target orbit.
3.  **Burn 2.** At the top it is moving too slowly to stay there, so it speeds up again to match the circular speed of the new orbit.

### The transfer ellipse

The ellipse just touches the inner orbit at its lowest point and the outer orbit at its highest. If the two orbits have radii $r_1$ and $r_2$, the ellipse is $r_1 + r_2$ long from end to end. Half of that is its **semi-major axis**:

$$a = \\frac{r_1 + r_2}{2}$$

### Worked example

A spacecraft is to move from a low orbit of radius 6,700 km to geostationary orbit, of radius 42,000 km.

1.  Add the radii: $6{,}700 + 42{,}000 = 48{,}700$ km.
2.  Halve the total: $a = 24{,}350$ km.

### Going further: speeds and timing

These results are not in the required A-level content. They follow from the conservation of energy.

The speed at a distance $r$ from Earth's centre, on an ellipse of semi-major axis $a$, is given by:

$$v^2 = GM\\left(\\frac{2}{r} - \\frac{1}{a}\\right)$$

The transfer takes half the period of the ellipse:

$$t = \\pi\\sqrt{\\frac{a^3}{GM}}$$

For a transfer from 300 km above the ground to geostationary orbit, burn 1 adds about 2.4 km/s, burn 2 adds about 1.5 km/s, and the coast takes about 5 hours 15 minutes.

### Faster twice, yet slower

The spacecraft speeds up at both burns, but ends up moving more slowly than when it started: about 3.1 km/s in geostationary orbit against 7.7 km/s in the low one. The energy from the engine has gone into raising the spacecraft against gravity, not into keeping it fast.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
`
  },
  {
    id: 'circuit',
    category: 'electronics',
    title: "Ohm's Law: Voltage, Current and Resistance",
    subtitle: "How voltage, current and resistance are linked in a circuit.",
    icon: 'Cpu',
    accentColor: 'emerald',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: 'I = \\frac{V}{R}',
    formulaLayout: [
      { type: 'variable', symbol: 'I' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'V' }],
        denominator: [{ type: 'variable', symbol: 'R' }]
      }
    ],
    variables: [
      {
        symbol: 'I',
        name: 'Current',
        unit: 'Amperes (A)',
        description: 'The rate of flow of electrical charge. Think of it as the amount of water flowing through a pipe.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'V',
        name: 'Voltage',
        unit: 'Volts (V)',
        description: 'The electrical potential difference that pushes electrons through a circuit. Think of it as water pressure.',
        color: 'text-teal-400'
      },
      {
        symbol: 'R',
        name: 'Resistance',
        unit: 'Ohms (Ω)',
        description: 'A material\'s opposition to the flow of electric current. Think of it as the narrowness of the pipe.',
        color: 'text-lime-400',
        range: { min: 10, max: 1000, default: 100 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'The Driving Force',
        content: 'Voltage is the push that causes electrons to move. A battery provides this potential difference across a closed circuit.',
        keyInsight: 'Without voltage, there is no current.',
        relatedVariables: ['V']
      },
      {
        stepNumber: 2,
        title: 'Resistance Limits Flow',
        content: 'Every component and wire has some resistance. Resistors are used specifically to limit current to safe levels for sensitive components like LEDs.',
        keyInsight: 'Higher resistance means less current flows for a given voltage.',
        relatedVariables: ['R', 'I']
      },
      {
        stepNumber: 3,
        title: 'Ohm\'s Law',
        content: 'Current is directly proportional to voltage and inversely proportional to resistance. This fundamental relationship governs all basic electrical circuits.',
        keyInsight: 'I = V / R',
        relatedVariables: ['I', 'V', 'R']
      }
    ],
    solvedExample: {
      problem: 'Determine current ($I$) in a $12$V loop with a $150 \\Omega$ resistor.',
      steps: [
        'Apply Ohm\'s Law: $I = \\frac{V}{R}$.',
        'Substitute values: $I = \\frac{12}{150}$.',
        'Calculate the result in Amperes.'
      ],
      resultFormula: 'I = 0.08 \\text{ A (80 mA)}'
    },
    practiceProblems: [
      {
        question: "The potential difference across a resistor is 5 V and its resistance is 100 Ω. What is the current?",
        hint: "Current = potential difference ÷ resistance.",
        answer: "0.05 A (50 mA)"
      },
      {
        question: "You want a current of 20 mA (0.02 A) from a 10 V supply. What resistance do you need?",
        hint: "Work in amperes, not milliamperes (see [Converting Units](/study/units)), then use R = V ÷ I.",
        answer: "500 Ω"
      },
      {
        question: "A current of 2 A flows for 30 seconds. How much charge has passed?",
        hint: "Charge flow = current × time.",
        answer: "60 coulombs"
      },
      {
        question: "A 4 Ω resistor and an 8 Ω resistor are connected in series to a 12 V battery. What is the current?",
        hint: "In series the resistances add. Then use I = V ÷ R.",
        answer: "1 A (the total resistance is 12 Ω)"
      },
      {
        question: "In the circuit from question 4, what is the potential difference across the 8 Ω resistor?",
        hint: "The same 1 A flows through both resistors. Use V = I × R for the 8 Ω one.",
        answer: "8 V (the other 4 V is across the 4 Ω resistor)"
      },
      {
        question: "A lamp is connected to a battery. A second identical lamp is added in parallel with it. What happens to the total resistance, and to the current from the battery?",
        hint: "A parallel branch gives the charge another route to take.",
        answer: "The total resistance goes down, so the current from the battery goes up."
      },
    ],
    realWorldConnection: 'Spacecraft engineers use these calculations to ensure solar panels and batteries safely power onboard computers without burning them out.',
    textbookContent: `
## Current, potential difference and resistance

*   **Current, $I$,** is the rate at which electric charge flows, in amperes (A).
*   **Potential difference, $V$,** often called voltage, is what drives the charge round the circuit, in volts (V).
*   **Resistance, $R$,** is how hard it is for the current to flow, in ohms ($\\Omega$).

Charge only flows if there is a source of potential difference, such as a battery, and a closed circuit with no gaps. In a single closed loop the current is the same at every point.

The charge that passes in a given time is:

$$Q = I t$$

where $Q$ is the charge in coulombs (C) and $t$ is the time in seconds.

### The relationship between $V$, $I$ and $R$

$$V = IR$$

It rearranges to $I = \\dfrac{V}{R}$ and $R = \\dfrac{V}{I}$.

For a given resistance, a bigger potential difference drives a bigger current. For a given potential difference, a bigger resistance lets less current through.

### Resistance does not always stay the same

*   A **fixed resistor** at a steady temperature keeps the same resistance, so doubling the potential difference doubles the current.
*   A **filament lamp** gets hotter as the current rises, and its resistance goes up.
*   A **diode** lets current through in one direction only.
*   A **thermistor** changes its resistance with temperature. The usual kind has less resistance when it is hotter.
*   A **light-dependent resistor (LDR)** has less resistance in brighter light.

### Series and parallel circuits

In a **series** circuit the components are in one loop, one after another.

*   The same current flows through every component.
*   The potential difference of the supply is shared between them.
*   The resistances add: $R_{\\text{total}} = R_1 + R_2$.

In a **parallel** circuit the components are on separate branches.

*   Each branch has the full potential difference of the supply across it.
*   The currents in the branches add up to the current from the supply.
*   Adding a branch gives the charge another route, so the total resistance goes down.

### Worked example

A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery.

1.  Total resistance: $100 + 200 = 300 \\ \\Omega$.
2.  Current: $I = \\dfrac{V}{R} = \\dfrac{6}{300} = 0.02$ A.
3.  Potential difference across the 100 $\\Omega$ resistor: $V = IR = 0.02 \\times 100 = 2$ V.
4.  Across the 200 $\\Omega$ resistor: $0.02 \\times 200 = 4$ V. The two add up to the 6 V of the battery.

### Power

The power a component transfers is:

$$P = VI = I^2 R$$

A spacecraft's heaters are resistors chosen to turn a known amount of electrical power into heat.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
*   [National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study) (Department for Education)
`
  },
  {
    id: 'waves',
    category: 'electronics',
    title: "Waves: Frequency, Wavelength and Speed",
    subtitle: "How the speed, frequency and wavelength of a wave are linked.",
    icon: 'Cpu',
    accentColor: 'emerald',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\lambda = \\frac{v}{f}',
    formulaLayout: [
      { type: 'variable', symbol: '\\lambda' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'v' }],
        denominator: [{ type: 'variable', symbol: 'f' }]
      }
    ],
    variables: [
      {
        symbol: '\\lambda',
        name: 'Wavelength',
        unit: 'Metres (m)',
        description: 'The physical distance between two consecutive peaks of a wave.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'v',
        name: 'Wave Velocity',
        unit: 'm/s',
        description: 'The speed at which the wave travels through space. For electromagnetic waves like radio, this is the speed of light.',
        color: 'text-teal-400'
      },
      {
        symbol: 'f',
        name: 'Frequency',
        unit: 'Hertz (Hz)',
        description: 'The number of wave cycles that pass a fixed point per second.',
        color: 'text-lime-400',
        range: { min: 1, max: 10, default: 2 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Oscillation',
        content: 'Signals, from sound to radio waves, travel as oscillating fields or pressures. A sine wave is the purest form of oscillation.',
        keyInsight: 'Frequency measures how rapidly the wave oscillates.',
        relatedVariables: ['f']
      },
      {
        stepNumber: 2,
        title: 'Speed of Propagation',
        content: 'Waves travel at a specific speed depending on the medium. In a vacuum, radio waves and light travel at approximately 300,000 km/s (c).',
        keyInsight: 'Wave speed connects time (frequency) to space (wavelength).',
        relatedVariables: ['v']
      },
      {
        stepNumber: 3,
        title: 'Inverse Relationship',
        content: 'Because the speed of light is constant, higher frequency waves must have shorter wavelengths. They are inversely proportional.',
        keyInsight: 'High frequency = short wavelength. Low frequency = long wavelength.',
        relatedVariables: ['\\lambda', 'f']
      }
    ],
    solvedExample: {
      problem: 'Find the wavelength ($\\lambda$) of a radio wave transmitting at $f = 100$ MHz ($10^8$ Hz).',
      steps: [
        'Convert the frequency to hertz: $100\\text{ MHz} = 100 \\times 10^6\\text{ Hz} = 10^8\\text{ Hz}$ (see [Converting Units](/study/units)).',
        'Note the speed of light $v = c \\approx 3 \\times 10^8$ m/s.',
        'Use the formula: $\\lambda = \\frac{v}{f}$.',
        'Substitute the numbers: $\\lambda = \\frac{3 \\times 10^8}{10^8}$.'
      ],
      resultFormula: '\\lambda = 3.0 \\text{ metres}'
    },
    practiceProblems: [
      {
        question: "A sound wave travels at 343 m/s and has a frequency of 343 Hz. What is its wavelength?",
        hint: "Divide the speed by the frequency.",
        answer: "1 metre"
      },
      {
        question: "A wave has a frequency of 4 Hz. What is its period?",
        hint: "The period is 1 divided by the frequency.",
        answer: "0.25 seconds"
      },
      {
        question: "Ripples on a pond have a wavelength of 1.5 m and a frequency of 2 Hz. How fast are they travelling?",
        hint: "Wave speed = frequency × wavelength.",
        answer: "3 m/s"
      },
      {
        question: "Which has the shorter wavelength: a 2 GHz Wi-Fi signal or a 5 GHz Wi-Fi signal?",
        hint: "Both travel at the same speed, so the higher frequency has the shorter wavelength.",
        answer: "The 5 GHz signal."
      },
      {
        question: "Is sound a transverse or a longitudinal wave, and why can it not travel through space?",
        hint: "Think about which way the air particles move, and what there is to vibrate in a vacuum.",
        answer: "Longitudinal: the particles vibrate back and forth along the direction of travel. Sound needs particles to pass the vibration on, and space is almost empty."
      },
      {
        question: "A spacecraft sends a radio signal at 8.4 GHz. Radio waves travel at $3.0 \\times 10^8$ m/s. What is the wavelength?",
        hint: "8.4 GHz is $8.4 \\times 10^9$ Hz (see [Converting Units](/study/units)). Divide the speed by the frequency.",
        answer: "About 0.036 m, or 3.6 cm"
      },
    ],
    realWorldConnection: 'Deep Space Network antennas must be precisely sized and shaped based on the wavelengths of the radio signals used to communicate with probes like Voyager.',
    textbookContent: `
## Describing a wave

A wave carries energy and information from one place to another. The wave travels; the water, air or rope it passes through only moves about its resting position and stays where it is.

Four quantities describe any wave:

*   **Amplitude:** the greatest distance a point on the wave moves from its rest position, in metres (m).
*   **Wavelength, $\\lambda$:** the distance from one point on a wave to the same point on the next one, for example from crest to crest, in metres (m).
*   **Frequency, $f$:** the number of complete waves passing a point each second, in hertz (Hz).
*   **Period, $T$:** the time one complete wave takes to pass, in seconds (s).

Frequency and period are two ways of saying the same thing:

$$T = \\frac{1}{f}$$

### The wave equation

Wave speed, frequency and wavelength are linked by one equation:

$$v = f\\lambda$$

It rearranges to $\\lambda = \\dfrac{v}{f}$ and $f = \\dfrac{v}{\\lambda}$.

The speed is set by what the wave is travelling through. So for waves in the same material, a higher frequency always means a shorter wavelength.

### Transverse and longitudinal waves

*   In a **transverse** wave the vibrations are at right angles to the direction the wave travels. Ripples on water are transverse, and so are light and radio waves.
*   In a **longitudinal** wave the vibrations are along the direction the wave travels. Sound in air is longitudinal: the air is squashed together and stretched apart as the wave passes.

### Worked example

A radio station broadcasts at 100 MHz. Radio waves travel at $3.0 \\times 10^8$ m/s. What is the wavelength?

1.  Write the frequency in hertz: $100 \\text{ MHz} = 1.0 \\times 10^8 \\text{ Hz}$.
2.  Use $\\lambda = \\dfrac{v}{f} = \\dfrac{3.0 \\times 10^8}{1.0 \\times 10^8}$.
3.  $\\lambda = 3.0$ m.

### Waves and spacecraft

Radio waves and light are electromagnetic waves. They need nothing to travel through, which is why a spacecraft can send signals across empty space. Sound cannot make that journey, because it needs particles to pass the vibration along.

Every radio wave travels at the same speed in space, so the frequency a spacecraft uses fixes the wavelength of its signal, and the wavelength decides how its antenna has to be built.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
`
  },
  {
    id: 'fractions',
    category: 'mathematics',
    title: "Fractions and Proportions",
    subtitle: "What a fraction means, using the share of a rocket's mass that is payload or fuel.",
    icon: 'Activity',
    accentColor: 'indigo',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: 'P = \\frac{m_p}{m_t}',
    formulaLayout: [
      { type: 'variable', symbol: 'P' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'm_p' }],
        denominator: [{ type: 'variable', symbol: 'm_t' }]
      }
    ],
    variables: [
      {
        symbol: 'P',
        name: 'Proportion',
        unit: 'Unitless',
        description: 'The fraction of the total mass that is payload or fuel.',
        color: 'text-indigo-400'
      },
      {
        symbol: 'm_p',
        name: 'Part Mass',
        unit: 'kg',
        description: 'The mass of the specific part (e.g., fuel or payload).',
        color: 'text-cyan-400'
      },
      {
        symbol: 'm_t',
        name: 'Total Mass',
        unit: 'kg',
        description: 'The total mass of the rocket.',
        color: 'text-sky-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "The Whole and the Parts",
        content: "A rocket consists of payload, structure, and fuel. A fraction represents how much of the whole is made up of one specific part. We need this basic understanding before moving to more advanced topics like [Probability](/study/probability).",
        keyInsight: "The denominator is the total mass, and the numerator is the part mass.",
        relatedVariables: ["m_p", "m_t"]
      },
      {
        stepNumber: 2,
        title: "Ratios in Space",
        content: "Understanding what fraction of a spacecraft is fuel is critical. If 3/4 of a rocket is fuel, only 1/4 remains for the structure and payload!",
        keyInsight: "High fuel fractions are necessary to reach orbit.",
        relatedVariables: ["P"]
      },
      {
        stepNumber: 3,
        title: "Equivalent Fractions",
        content: "Scaling up a small satellite to a massive rocket often requires keeping these proportions equivalent (e.g., 2/4 is the same ratio as 1/2).",
        keyInsight: "Proportions remain constant even if the scale changes.",
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'A rocket has a total mass of $10000$ kg. If the fuel mass is $7500$ kg, what fraction of the total mass is fuel?',
      steps: [
        'Identify the part ($m_p = 7500$) and the whole ($m_t = 10000$).',
        'Write the fraction: $P = \\frac{7500}{10000}$.',
        'Divide both numerator and denominator by 2500 to simplify.'
      ],
      resultFormula: 'P = \\frac{3}{4}'
    },
    practiceProblems: [
      {
        question: 'If a satellite is 1/5 scientific instruments and weighs 500 kg total, how heavy are the instruments?',
        hint: 'Multiply the total mass by the fraction.',
        answer: '100 kg'
      },
      {
        question: 'A lander has 200 kg of fuel and 800 kg total mass. What fraction is fuel?',
        hint: 'Divide 200 by 800 and simplify.',
        answer: '1/4'
      }
    ],
    realWorldConnection: 'The Tsiolkovsky rocket equation relies heavily on mass fractions to determine how fast a rocket can go in the vacuum of space.',
    textbookContent: `
## Mass Fractions and Rocket Performance

In orbital mechanics and aerospace engineering, absolute mass is less critical to a vehicle's performance than the ratio of its constituent masses. A mass fraction is a dimensionless ratio comparing the mass of a specific component (usually propellant) to the total mass of the system.

### Propellant Mass Fraction ($\\zeta$)

The propellant mass fraction represents the percentage of a rocket's total launch mass that consists solely of fuel and oxidiser:
$\\zeta = \\frac{m_{\\text{propellant}}}{m_{\\text{initial}}} = \\frac{m_{\\text{initial}} - m_{\\text{final}}}{m_{\\text{initial}}}$

### The Tsiolkovsky Rocket Equation

Formulated by Konstantin Tsiolkovsky in 1903, the ideal rocket equation dictates the maximum change in velocity ($\\Delta v$) a rocket can achieve in the absence of gravity and aerodynamic drag:
$\\Delta v = v_e \\ln \\left( \\frac{m_{\\text{initial}}}{m_{\\text{final}}} \\right)$
where $v_e$ is the effective exhaust velocity.

This logarithmic relationship is the "tyranny of the rocket equation." To linearly double the $\\Delta v$ capability of a spacecraft, the initial mass ratio must be squared. Because the structural mass of tanks, engines, and payloads limits how close $m_{\\text{final}}$ can get to zero, achieving orbital velocity requires extreme engineering to maximise the propellant mass fraction—often exceeding 85% for orbital launch vehicles.

*Reference: Sutton, G. P., & Biblarz, O. (2016). Rocket Propulsion Elements (9th ed.). Wiley.*
    

### References

*   [Euclid's Elements, Book VII (Proportions & Divisibility)](https://mathcs.clarku.edu/~djoyce/java/elements/bookVII/bookVII.html) (Euclid)
*   [The Art of Problem Solving: Prealgebra](https://artofproblemsolving.com/wiki/index.php/Prealgebra) (Richard Rusczyk, David Patrick, Ravi Boppana)
*   [Khan Academy: Fractions Mastery](https://www.khanacademy.org/math/arithmetic/fraction-arithmetic)
`
  },
  {
    id: 'binary',
    category: 'elementary-math',
    title: "Binary Numbers",
    subtitle: "How computers count using only 0 and 1, and how to convert between binary and decimal.",
    icon: 'Cpu',
    accentColor: 'emerald',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\text{Value} = \\sum_{i=0}^{n} b_i \\cdot 2^i',
    formulaLayout: [
      { type: 'variable', symbol: '\\text{Value}' },
      { type: 'operator', content: '=' },
      { type: 'static', latex: '\\sum_{i=0}^{n}' },
      { type: 'variable', symbol: 'b_i' },
      { type: 'operator', content: '\\cdot' },
      { type: 'static', latex: '2^i' }
    ],
    variables: [
      {
        symbol: 'b_i',
        name: 'Binary Digit (Bit)',
        unit: '0 or 1',
        description: 'A single digit in a binary number, representing a power of 2.',
        color: 'text-emerald-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Base-2 System',
        content: 'Unlike our normal Base-10 system which uses digits 0-9, binary only uses 0 and 1. Each position represents a power of 2 instead of a power of 10.',
        keyInsight: 'Computers use binary because it perfectly maps to electrical switches being OFF (0) or ON (1).',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Convert the binary number $1011_2$ to decimal.',
      steps: [
        'Write out the powers of 2 for each position from right to left: $2^3, 2^2, 2^1, 2^0$',
        'Multiply each bit by its corresponding power of 2: $1 \\cdot 8 + 0 \\cdot 4 + 1 \\cdot 2 + 1 \\cdot 1$',
        'Add them up: $8 + 0 + 2 + 1 = 11$'
      ],
      resultFormula: '1011_2 = 11_{10}'
    },
    practiceProblems: [
      {
        question: 'What is the binary number $100_2$ in decimal?',
        hint: 'The bits are 4, 2, and 1.',
        answer: '4'
      }
    ],
    realWorldConnection: 'Every piece of data on your computer, from this text to images and videos, is stored as a massive sequence of binary 1s and 0s.',
    textbookContent: `
## Binary Numeral System

The binary numeral system, or base-2 number system, represents numeric values using two different symbols: typically 0 (zero) and 1 (one).

### Positional Notation
In a positional numeral system, the base is the number of unique digits, including zero, used to represent numbers. In base-10, we use 0-9 and each position represents a power of 10 (1s, 10s, 100s). In binary (base-2), we use 0 and 1, and each position represents a power of 2 (1s, 2s, 4s, 8s, 16s, etc.).

### Conversion to Decimal
To convert a binary number to decimal, you sum the powers of 2 corresponding to each 1 bit.
For example, $1101_2$:
*   $1 \\times 2^3 = 8$
*   $1 \\times 2^2 = 4$
*   $0 \\times 2^1 = 0$
*   $1 \\times 2^0 = 1$
*   $8 + 4 + 0 + 1 = 13$

### References
*   [Digital Logic Design](https://en.wikipedia.org/wiki/Digital_logic) (Various authors)
`
  },
  {
    id: 'trigonometry',
    category: 'mathematics',
    title: "Trigonometry in Right-Angled Triangles",
    subtitle: "Find missing sides and angles using sine, cosine and tangent.",
    icon: 'Activity',
    accentColor: 'amber',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\sin(\\theta) = \\frac{O}{H}',
    formulaLayout: [
      { type: 'static', latex: '\\sin(' },
      { type: 'variable', symbol: '\\theta' },
      { type: 'static', latex: ')' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'O' }],
        denominator: [{ type: 'variable', symbol: 'H' }]
      }
    ],
    variables: [
      {
        symbol: '\\theta',
        name: 'Viewing Angle',
        unit: 'Degrees',
        description: 'The angle between the observer\'s horizon and the satellite.',
        color: 'text-amber-400'
      },
      {
        symbol: 'O',
        name: 'Opposite (Altitude)',
        unit: 'km',
        description: 'The vertical height of the satellite above the ground.',
        color: 'text-orange-400'
      },
      {
        symbol: 'H',
        name: 'Hypotenuse (Line of Sight)',
        unit: 'km',
        description: 'The direct distance from the observer to the satellite.',
        color: 'text-yellow-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "Right Triangles in Space",
        content: "Trigonometry allows us to find unknown distances in space by forming imaginary right triangles between planets, observers, and satellites. This builds upon the idea of breaking diagonal paths down into horizontal and vertical components, much like in [Vectors](/study/vectors).",
        keyInsight: "Angles and side lengths are deeply connected.",
        relatedVariables: []
      },
      {
        stepNumber: 2,
        title: "SOH CAH TOA",
        content: "The Sine ratio (SOH) connects the angle of observation with the Opposite side (altitude) and Hypotenuse (direct distance). When working with rotated coordinate systems, we use similar sine and cosine ratios in [Matrices](/study/matrices).",
        keyInsight: "Sine is Opposite divided by Hypotenuse.",
        relatedVariables: ["\\theta", "O", "H"]
      },
      {
        stepNumber: 3,
        title: "Tracking Satellites",
        content: "Ground stations use the viewing angle and radar distance (hypotenuse) to calculate exactly how high a satellite is orbiting.",
        keyInsight: "Radar gives us H, and sensors give us the angle, letting us find altitude.",
        relatedVariables: ["O"]
      }
    ],
    solvedExample: {
      problem: 'A ground station tracks a satellite at a line-of-sight distance ($H$) of $1000$ km, at an angle ($\\theta$) of $30^\\circ$ above the horizon. What is its altitude ($O$)?',
      steps: [
        'Use the sine ratio: $\\sin(\\theta) = \\frac{O}{H}$.',
        'Substitute knowns: $\\sin(30^\\circ) = \\frac{O}{1000}$.',
        'Recall that $\\sin(30^\\circ) = 0.5$.',
        'Multiply by 1000: $O = 0.5 \\cdot 1000$.'
      ],
      resultFormula: 'O = 500 \\text{ km}'
    },
    practiceProblems: [
      {
        question: "The hypotenuse of a right-angled triangle is 10 m and one angle is 30°. How long is the side opposite that angle? ($\\sin 30° = 0.5$)",
        hint: "Opposite = hypotenuse × sin θ.",
        answer: "5 m"
      },
      {
        question: "A 5 m ladder leans against a wall and makes an angle of 60° with the ground. How far is the foot of the ladder from the wall? ($\\cos 60° = 0.5$)",
        hint: "The ladder is the hypotenuse and the distance along the ground is the adjacent side, so use cosine.",
        answer: "2.5 m"
      },
      {
        question: "You stand 4 km from a launch pad and see a rocket at an angle of 45° above the horizon. How high is it? ($\\tan 45° = 1$)",
        hint: "The 4 km is the adjacent side and the height is the opposite side, so use tangent.",
        answer: "4 km"
      },
      {
        question: "The two shorter sides of a right-angled triangle are 6 cm and 8 cm. How long is the hypotenuse?",
        hint: "Use Pythagoras' theorem: $a^2 + b^2 = c^2$.",
        answer: "10 cm"
      },
      {
        question: "In a right-angled triangle the side opposite an angle is 5 cm and the hypotenuse is 10 cm. What is the angle?",
        hint: "Work out opposite ÷ hypotenuse, then use the inverse sine.",
        answer: "30°"
      },
      {
        question: "A star is 1.414 light-years away along your line of sight, at 45° to the plane of Earth's orbit. How far is it above that plane? ($\\sin 45° \\approx 0.707$)",
        hint: "Opposite = hypotenuse × sin θ.",
        answer: "About 1.0 light-year"
      },
    ],
    realWorldConnection: 'Parallax measurement uses trigonometry to determine the distance to nearby stars by observing them from opposite sides of Earth\'s orbit.',
    textbookContent: `
## Trigonometry in right-angled triangles

Trigonometry links the angles of a triangle to the lengths of its sides. In a right-angled triangle, pick one of the other two angles and call it $\\theta$. The sides then have names:

*   The **hypotenuse** is the longest side, opposite the right angle.
*   The **opposite** side is the one facing the angle $\\theta$.
*   The **adjacent** side is next to the angle $\\theta$, and is not the hypotenuse.

### The three ratios

$$\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}} \\qquad \\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}} \\qquad \\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}$$

Many people remember them as **SOH CAH TOA**.

### Finding a side

Choose the ratio that contains the side you know and the side you want.

*Example:* the hypotenuse is 10 m and the angle is 30°. Find the opposite side.

1.  Opposite and hypotenuse are in the sine ratio: $\\sin 30° = \\dfrac{\\text{opposite}}{10}$.
2.  Opposite $= 10 \\times \\sin 30° = 10 \\times 0.5 = 5$ m.

### Finding an angle

Work out the ratio, then use the inverse function on a calculator.

*Example:* the opposite side is 3 cm and the adjacent side is 4 cm.

1.  $\\tan\\theta = \\dfrac{3}{4} = 0.75$.
2.  $\\theta = \\tan^{-1}(0.75) \\approx 36.9°$.

### Pythagoras' theorem

When you know two sides and want the third, you do not need an angle. If $c$ is the hypotenuse:

$$a^2 + b^2 = c^2$$

*Example:* the shorter sides are 3 cm and 4 cm, so $c^2 = 9 + 16 = 25$ and $c = 5$ cm.

### Exact values worth knowing

| Angle | $\\sin$ | $\\cos$ | $\\tan$ |
|---|---|---|---|
| 0° | $0$ | $1$ | $0$ |
| 30° | $\\dfrac{1}{2}$ | $\\dfrac{\\sqrt{3}}{2}$ | $\\dfrac{1}{\\sqrt{3}}$ |
| 45° | $\\dfrac{\\sqrt{2}}{2}$ | $\\dfrac{\\sqrt{2}}{2}$ | $1$ |
| 60° | $\\dfrac{\\sqrt{3}}{2}$ | $\\dfrac{1}{2}$ | $\\sqrt{3}$ |
| 90° | $1$ | $0$ | not defined |

### Measuring the distance to a star

As Earth goes round the Sun, a nearby star appears to shift slightly against the far more distant stars behind it. Half of that shift is the parallax angle, $p$. The Sun, Earth and the star make a long, thin right-angled triangle. The side opposite $p$ is the distance from Earth to the Sun, and the adjacent side is the distance $d$ to the star, so:

$$\\tan p = \\frac{\\text{Earth to Sun}}{d}$$

Measure the angle, and the distance follows.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
*   [GCSE mathematics: subject content and assessment objectives](https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives) (Department for Education)
`
  },
  {
    id: 'calculus',
    category: 'mathematics',
    title: "Differentiation and Rates of Change",
    subtitle: "How a derivative gives velocity from position, and acceleration from velocity.",
    icon: 'Activity',
    accentColor: 'emerald',
    difficulty: 3,
    estimatedMinutes: 20,
    formula: 'v(t) = \\frac{d}{dt} s(t)',
    formulaLayout: [
      { type: 'variable', symbol: 'v(t)' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'static', latex: 'd' }],
        denominator: [{ type: 'static', latex: 'dt' }]
      },
      { type: 'variable', symbol: 's(t)' }
    ],
    variables: [
      {
        symbol: 'v(t)',
        name: 'Velocity',
        unit: 'm/s',
        description: 'The rate of change of position with respect to time.',
        color: 'text-emerald-400'
      },
      {
        symbol: 's(t)',
        name: 'Position Function',
        unit: 'm',
        description: 'The distance of the spacecraft from a reference point as a function of time.',
        color: 'text-teal-400'
      },
      {
        symbol: 't',
        name: 'Time',
        unit: 's',
        description: 'The time elapsed.',
        color: 'text-lime-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "Instantaneous Change",
        content: "While algebra gives average speed over a long trip, calculus allows us to find the exact velocity of a spacecraft at a single instant in time. This is the foundation for solving complex [Differential Equations](/study/diffeq).",
        keyInsight: "A derivative is simply a rate of change at a specific moment.",
        relatedVariables: ["v(t)"]
      },
      {
        stepNumber: 2,
        title: "The Derivative",
        content: "Taking the derivative of a position function gives the velocity function. Taking the derivative of velocity gives acceleration. These precise calculations allow us to model complex [Trajectories](/study/trajectory).",
        keyInsight: "Position -> Velocity -> Acceleration.",
        relatedVariables: ["s(t)", "v(t)"]
      },
      {
        stepNumber: 3,
        title: "Rocket Trajectories",
        content: "As a rocket burns fuel, its mass changes constantly, and its acceleration increases. Calculus is essential to model these dynamic, continuously changing systems.",
        keyInsight: "Calculus helps predict complex, changing motion.",
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'A probe\'s distance from a moon is given by $s(t) = 5t^2 + 10t$ metres. Find its velocity $v(t)$ at $t = 3$ seconds.',
      steps: [
        'Take the derivative of position: $v(t) = \\frac{d}{dt}(5t^2 + 10t)$.',
        'Apply the power rule: $v(t) = 10t + 10$.',
        'Substitute $t = 3$: $v(3) = 10(3) + 10$.',
        'Calculate the result: $30 + 10 = 40$.'
      ],
      resultFormula: 'v(3) = 40 \\text{ m/s}'
    },
    practiceProblems: [
      {
        question: 'If position is s(t) = 4t³, what is the velocity function v(t)?',
        hint: 'Use the power rule: bring down the exponent and subtract one.',
        answer: 'v(t) = 12t²'
      },
      {
        question: 'If velocity is v(t) = 20t, what is the acceleration (derivative of velocity) at t = 5?',
        hint: 'Take the derivative of 20t. It is constant.',
        answer: '20 m/s²'
      }
    ],
    realWorldConnection: 'Orbital mechanics heavily utilises differential equations (calculus) to predict the future positions of planets, moons, and artificial satellites over time.',
    textbookContent: `
## Differential Calculus and Rates of Change

Calculus, independently developed by Isaac Newton and Gottfried Wilhelm Leibniz in the late 17th century, is the mathematical study of continuous change. Differential calculus focuses on the concept of the derivative, which measures the instantaneous rate of change of a quantity with respect to another.

### The Derivative

If a function $s(t)$ represents the position of an object moving along a line at time $t$, the average velocity over a time interval $\\Delta t$ is $\\frac{\\Delta s}{\\Delta t}$. The instantaneous velocity $v(t)$ is defined as the limit of this average velocity as the time interval approaches zero:
$v(t) = \\lim_{\\Delta t \\to 0} \\frac{s(t + \\Delta t) - s(t)}{\\Delta t} = \\frac{ds}{dt}$

### Higher-Order Derivatives

Derivatives can themselves be differentiated. Acceleration $a(t)$ is the rate of change of velocity, and therefore the second derivative of position:
$a(t) = \\frac{dv}{dt} = \\frac{d^2s}{dt^2}$

### Numerical Integration (Euler's Method)

In computational physics, analytical solutions to complex differential equations (like chaotic multi-body gravitational systems) are often impossible. Instead, algorithms perform numerical integration to approximate the solution over small discrete time steps ($\\Delta t$).

Euler's method is the simplest first-order numerical procedure:
$s(t_{n+1}) \\approx s(t_n) + v(t_n) \\Delta t$
$v(t_{n+1}) \\approx v(t_n) + a(t_n) \\Delta t$

While Euler's method provides the foundation for understanding computational integration, modern spacecraft simulators utilise more stable and accurate higher-order algorithms like Runge-Kutta (RK4) to minimise accumulated truncation errors over time.

*Reference: Stewart, J. (2015). Calculus: Early Transcendentals (8th ed.). Cengage Learning.*
    

### References

*   [Calculus (4th Edition)](https://www.amazon.com/Calculus-4th-Michael-Spivak/dp/0914098918) (Michael Spivak)
*   [Calculus: Early Transcendentals](https://www.cengage.com/c/calculus-early-transcendentals-9e-stewart/9781337613927/) (James Stewart)
*   [MIT OCW: 18.01 Single Variable Calculus](https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/)
`
  },
  {
    id: "vectors",
    category: "mathematics",
    title: "Vectors: Magnitude and Direction",
    subtitle: "Add vectors, split them into components and find their size and direction.",
    icon: "Navigation",
    accentColor: "indigo",
    difficulty: 2,
    estimatedMinutes: 15,
    formula: "|\\vec{v}|^2 = v_x^2 + v_y^2",
    formulaLayout: [
      { type: "variable", symbol: "|\\vec{v}|" },
      { type: "static", latex: "^2" },
      { type: "operator", content: "=" },
      { type: "variable", symbol: "v_x" },
      { type: "static", latex: "^2" },
      { type: "operator", content: "+" },
      { type: "variable", symbol: "v_y" },
      { type: "static", latex: "^2" }
    ],
    variables: [
      {
        symbol: "|\\vec{v}|",
        name: "Speed",
        unit: "m/s",
        description: "The magnitude of the velocity vector: how fast the spacecraft is moving, ignoring direction.",
        color: "text-indigo-400"
      },
      {
        symbol: "v_x",
        name: "X-Velocity",
        unit: "m/s",
        description: "The horizontal component of the velocity vector.",
        color: "text-cyan-400"
      },
      {
        symbol: "v_y",
        name: "Y-Velocity",
        unit: "m/s",
        description: "The vertical component of the velocity vector.",
        color: "text-sky-400"
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "What is a Vector?",
        content: "Imagine drawing an arrow on a map. A vector is exactly that: a mathematical arrow that has both a length (called magnitude) and a direction. Unlike a simple number like '5 kg' (a scalar), a vector tells you '5 m/s going North'.",
        keyInsight: "A vector requires two pieces of information: how much (magnitude), and which way (direction).",
        relatedVariables: ["|\\vec{v}|"]
      },
      {
        stepNumber: 2,
        title: "Vector Components",
        content: "Instead of dealing with angles, it's often easier to break that diagonal arrow into a horizontal step (X) and a vertical step (Y). Any diagonal movement is just a combination of moving sideways and moving up or down.",
        keyInsight: "You can perfectly recreate any diagonal path by moving purely horizontally then vertically.",
        relatedVariables: ["v_x", "v_y"]
      },
      {
        stepNumber: 3,
        title: "The Pythagorean Theorem",
        content: "Because the X and Y steps form a 90-degree right angle, we can use the Pythagorean theorem ($a^2 + b^2 = c^2$) to find the length of the hypotenuse, which gives us the original vector's total length (magnitude).",
        keyInsight: "Squaring the components, adding them, and taking the square root gives you the total speed.",
        relatedVariables: ["|\\vec{v}|", "v_x", "v_y"]
      },
      {
        stepNumber: 4,
        title: "Vector Multiplication (Dot Product)",
        content: "What happens when you multiply two vectors? The Dot Product multiplies the parts of two vectors that are pointing in the same direction. It outputs a single normal number (a scalar). In physics, pushing a spacecraft (Force vector) in the direction it's moving (Displacement vector) gives us Work (Energy).",
        keyInsight: "Dot Product = How much do these two arrows align with each other?",
        relatedVariables: []
      },
      {
        stepNumber: 5,
        title: "Vector Multiplication (Cross Product)",
        content: "The Cross Product is the opposite: it multiplies the parts of two vectors that are perpendicular to each other, and it creates a brand new 3D vector pointing straight out of the surface (like a screw turning). This is used to calculate orbital Torque and Angular Momentum.",
        keyInsight: "Cross Product = How perpendicular are these two arrows, and what is the resulting 3D twist?",
        relatedVariables: []
      },
      {
        stepNumber: 6,
        title: "Transformations and Thrust",
        content: "When a spacecraft fires its thrusters, it essentially 'adds' a new thrust vector to its current velocity vector. If you want to change direction, you calculate a transformation to figure out exactly which angle to point your engines.",
        keyInsight: "Thrusting forward adds to your magnitude (speed). Thrusting sideways changes your direction.",
        relatedVariables: ["|\\vec{v}|"]
      }
    ],
    solvedExample: {
      problem: "A spacecraft is travelling with a horizontal velocity ($v_x$) of $3000$ m/s and a vertical velocity ($v_y$) of $4000$ m/s. What is its speed ($|\\vec{v}|$)?",
      steps: [
        "Identify the components: $v_x = 3000$ and $v_y = 4000$.",
        "Square both components: $3000^2 = 9,000,000$ and $4000^2 = 16,000,000$.",
        "Add the squared values together: $9,000,000 + 16,000,000 = 25,000,000$.",
        "Take the square root of the sum: $\\sqrt{25,000,000}$."
      ],
      resultFormula: "|\\vec{v}| = 5000 \\text{ m/s}"
    },
    practiceProblems: [
      {
        question: "If a probe has an x-velocity of 6 km/s and a y-velocity of 8 km/s, what is its speed?",
        hint: "Square both, add them, and take the square root. (Think of the 3-4-5 triangle rule).",
        answer: "10 km/s"
      },
      {
        question: "Does a vector with components (5, 0) have the same magnitude as a vector with components (0, 5)?",
        hint: "Calculate the magnitude for both.",
        answer: "Yes, both have a magnitude of 5."
      }
    ],
    realWorldConnection: "Navigation computers on the Apollo missions continuously calculated state vectors (position and velocity in 3D space) to ensure astronauts remained on the correct trajectory to the Moon.",
    textbookContent: `
## Vector Algebra and State Vectors

A vector is a mathematical object that has both a magnitude (length) and a direction. In classical mechanics, physical quantities like position, velocity, and force must be described as vectors, as opposed to scalars (which have only magnitude, like mass or temperature).

### Vector Notation and Components

In three-dimensional Cartesian space, a vector $\\vec{v}$ can be represented by its orthogonal components along the x, y, and z axes:
$$\\vec{v} = \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix} = x\\hat{i} + y\\hat{j} + z\\hat{k}$$

The magnitude of the vector is given by the Euclidean norm:
$$|\\vec{v}| = \\sqrt{x^2 + y^2 + z^2}$$

### The Orbital State Vector

In astrodynamics, the orbital state vector is the absolute foundation of spacecraft navigation. It consists of two 3-dimensional vectors grouped together:
1.  **Position Vector ($\\vec{r}$):** Determines the exact 3D coordinate of the spacecraft relative to the central body.
2.  **Velocity Vector ($\\vec{v}$):** Determines the 3D speed and heading of the spacecraft.

Combined, these six variables $[x, y, z, v_x, v_y, v_z]$ completely and deterministically define the spacecraft's current orbit. From a single accurate state vector reading at a known time $t$, Kepler's laws can be mathematically applied to project the spacecraft's exact position infinitely into the future (assuming no perturbing forces).

*Reference: Anton, H., & Rorres, C. (2013). Elementary Linear Algebra (11th ed.). Wiley.*
    `
  },
  {
    id: "matrices",
    category: "mathematics",
    title: "Matrices and Rotations",
    subtitle: "Use matrices to rotate and move points, as a spacecraft does to keep track of which way it faces.",
    icon: "Grid",
    accentColor: "amber",
    difficulty: 3,
    estimatedMinutes: 20,
    formula: "\\vec{v}' = R(\\theta) \\cdot \\vec{v}",
    formulaLayout: [
      { type: "variable", symbol: "\\vec{v}'" },
      { type: "operator", content: "=" },
      { type: "variable", symbol: "R(\\theta)" },
      { type: "operator", content: "\\cdot" },
      { type: "variable", symbol: "\\vec{v}" }
    ],
    variables: [
      {
        symbol: "\\vec{v}'",
        name: "Rotated Vector",
        unit: "Coordinates",
        description: "The new heading or position of the spacecraft after rotation.",
        color: "text-amber-400"
      },
      {
        symbol: "R(\\theta)",
        name: "Rotation Matrix",
        unit: "Matrix",
        description: "A matrix containing trigonometric functions (sine and cosine) that rotates a vector by a specific angle.",
        color: "text-orange-400"
      },
      {
        symbol: "\\vec{v}",
        name: "Original Vector",
        unit: "Coordinates",
        description: "The initial heading or position of the spacecraft.",
        color: "text-yellow-400"
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "Coordinate Systems",
        content: "Imagine looking at a [Vector](/study/vectors) arrow pointing 'Up'. Now tilt your head sideways. The arrow is still pointing to the same physical place, but to your eyes, it's now pointing 'Right'. Spacecraft do this constantly, rotating their frames of reference from pointing at the Sun, to pointing at Earth.",
        keyInsight: "To translate data between these systems without physically moving, we mathematically rotate the vectors.",
        relatedVariables: ["\\vec{v}", "\\vec{v}'"]
      },
      {
        stepNumber: 2,
        title: "The Rotation Matrix",
        content: "A rotation matrix is like a mathematical machine. You feed it your original X and Y coordinates, and it multiplies them by [Trigonometric functions](/study/trigonometry) (sines and cosines) to spit out the brand new rotated coordinates.",
        keyInsight: "Matrix multiplication smoothly combines the old coordinates to form the new ones.",
        relatedVariables: ["R(\\theta)"]
      },
      {
        stepNumber: 3,
        title: "Preserving Magnitude",
        content: "A pure rotation matrix changes the direction of a vector but preserves its magnitude (length). The spacecraft's speed or distance remains the exact same, we've just pivoted the camera.",
        keyInsight: "Rotation matrices are orthogonal, meaning they do not stretch or squish the vector.",
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: "Rotate a position vector $\\vec{v} = (1, 0)$ by $90^\\circ$ ($\\pi/2$ radians) anticlockwise.",
      steps: [
        "Set up the rotation matrix for $90^\\circ$: $R(90^\\circ) = \\begin{bmatrix} 0 & -1 \\\\ 1 & 0 \\end{bmatrix}$.",
        "Multiply the matrix by the vector: $\\begin{bmatrix} 0 & -1 \\\\ 1 & 0 \\end{bmatrix} \\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}$.",
        "Calculate the new x: $0 \\cdot 1 + (-1) \\cdot 0 = 0$.",
        "Calculate the new y: $1 \\cdot 1 + 0 \\cdot 0 = 1$."
      ],
      resultFormula: "\\vec{v}' = (0, 1)"
    },
    practiceProblems: [
      {
        question: "What happens if you multiply a vector by an identity matrix (a rotation of 0 degrees)?",
        hint: "The identity matrix has 1s on the diagonal and 0s elsewhere.",
        answer: "The vector remains exactly the same."
      },
      {
        question: "If you rotate the vector (0, 1) by 90 degrees clockwise, what is the new vector?",
        hint: "Clockwise rotation points it to the right on a standard grid.",
        answer: "(1, 0)"
      }
    ],
    realWorldConnection: "Attitude Control Systems (ACS) use 3D rotation matrices and quaternions to continuously track and adjust a satellite's orientation in space, ensuring solar panels point at the Sun and antennas at Earth.",
    textbookContent: `
## Linear Transformations and Matrices

A matrix is a rectangular array of numbers arranged in rows and columns. In linear algebra, matrices are fundamentally used to represent linear transformations between vector spaces.

### The Rotation Matrix

A rotation matrix $R$ is a transformation matrix that performs a rotation in Euclidean space. For a two-dimensional anticlockwise rotation by an angle $\\theta$ about the origin, the standard rotation matrix is defined as:
$$R(\\theta) = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}$$

To rotate a column vector $\\vec{v} = [x, y]^T$, the matrix is multiplied by the vector using the dot product rule (rows of the matrix multiplied by the column of the vector):
$$\\vec{v}' = R(\\theta) \\cdot \\vec{v} = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix} \\begin{bmatrix} x \\\\ y \\end{bmatrix} = \\begin{bmatrix} x\\cos\\theta - y\\sin\\theta \\\\ x\\sin\\theta + y\\cos\\theta \\end{bmatrix}$$

### Orthogonality and 3D Rotation

Rotation matrices are orthogonal matrices with a determinant of 1 ($R^T R = I$). This property ensures that rotations are rigid-body transformations: they preserve the length of the vector ($|\\vec{v}'| = |\\vec{v}|$) and the relative angles between multiple vectors.

In three-dimensional aerospace applications (Attitude Determination and Control), a spacecraft's orientation is described using three sequential matrices corresponding to roll, pitch, and yaw (Euler angles). Because matrix multiplication is non-commutative ($AB \\neq BA$), the order of these rotations strictly matters. To avoid mathematical singularities known as "gimbal lock" inherent in Euler angle sequences, modern flight software predominantly utilises 4-dimensional Quaternions instead of 3x3 matrices.

*Reference: Strang, G. (2016). Introduction to Linear Algebra (5th ed.). Wellesley-Cambridge Press.*
    `
  },
  {
    id: "probability",
    category: "mathematics",
    title: "Probability",
    subtitle: "Work out how likely events are, alone and combined, using spacecraft reliability as the example.",
    icon: "Dices",
    accentColor: "emerald",
    difficulty: 2,
    estimatedMinutes: 15,
    formula: "P_{sys} = 1 - (1 - p)^n",
    formulaLayout: [
      { type: "variable", symbol: "P_{sys}" },
      { type: "operator", content: "=" },
      { type: "static", latex: "1" },
      { type: "operator", content: "-" },
      { type: "static", latex: "(1" },
      { type: "operator", content: "-" },
      { type: "variable", symbol: "p" },
      { type: "static", latex: ")^n" }
    ],
    variables: [
      {
        symbol: "P_{sys}",
        name: "System Reliability",
        unit: "Probability (0 to 1)",
        description: "The overall probability that the redundant system will function successfully.",
        color: "text-emerald-400"
      },
      {
        symbol: "p",
        name: "Component Reliability",
        unit: "Probability (0 to 1)",
        description: "The probability that a single independent component functions successfully.",
        color: "text-teal-400"
      },
      {
        symbol: "n",
        name: "Redundant Components",
        unit: "Count",
        description: "The total number of parallel, independent backup components.",
        color: "text-lime-400"
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "The Risk of Failure",
        content: "In spaceflight, components fail. If a critical system relies on a single component with a 90% success rate, there is a 10% chance of complete mission failure. We express these chances as [Fractions](/study/fractions) or decimals (e.g. 0.10).",
        keyInsight: "For single-point failures, the system reliability equals the component reliability.",
        relatedVariables: ["p"]
      },
      {
        stepNumber: 2,
        title: "Adding Redundancy",
        content: "To increase reliability, engineers add backup components in parallel. The system only fails if ALL of the redundant components fail at the exact same time.",
        keyInsight: "The probability of all n components failing is the failure probability of one component raised to the power n.",
        relatedVariables: ["n"]
      },
      {
        stepNumber: 3,
        title: "Calculating System Success",
        content: "First, calculate the probability of a single failure (1 - p). Then, calculate the probability that all n components fail: (1 - p)^n. Finally, subtract that from 1 to find the probability of at least one success.",
        keyInsight: "Even with low-reliability parts, high redundancy can create an ultra-reliable system.",
        relatedVariables: ["P_{sys}", "p", "n"]
      }
    ],
    solvedExample: {
      problem: "A spacecraft's primary flight computer has a reliability of $0.90$ (90%). If the spacecraft has $n = 3$ identical, independent computers, what is the overall system reliability ($P_{sys}$)?",
      steps: [
        "Find the failure rate of one computer: $1 - 0.90 = 0.10$.",
        "Calculate the probability that ALL three fail: $0.10^3 = 0.10 \\times 0.10 \\times 0.10 = 0.001$.",
        "Subtract the total failure probability from 1 to find the success probability: $1 - 0.001$."
      ],
      resultFormula: "P_{sys} = 0.999 \\text{ (99.9\\%)}"
    },
    practiceProblems: [
      {
        question: "If a valve has a 50% chance of working (p = 0.5), how many valves do you need in parallel to achieve a system reliability of 87.5%?",
        hint: "Calculate 1 - (0.5)^n and see which n gives 0.875.",
        answer: "3 valves"
      },
      {
        question: "What is the failure probability of a dual-redundant system (n=2) if each component has a 99% success rate?",
        hint: "Calculate the failure rate (0.01) and square it.",
        answer: "0.0001 (or 0.01%)"
      }
    ],
    realWorldConnection: "The Space Shuttle flew with four redundant flight computers processing the same data, plus a fifth backup computer running independently written software, so that no single computer failure could endanger the vehicle.",
    textbookContent: `
## Independent Events and Redundancy

Probability measures how likely an event is, on a scale from 0 (impossible) to 1 (certain). It can be written as a fraction, a decimal or a percentage: $\\frac{9}{10} = 0.9 = 90\\%$.

### The Complement Rule

An event either happens or it does not, so the two probabilities add up to 1:
$$P(\\text{not } A) = 1 - P(A)$$

If a component works with probability $p$, it fails with probability $1 - p$.

### Independent Events (the AND rule)

Two events are **independent** if one happening does not change the probability of the other. For independent events, multiply the probabilities:
$$P(A \\text{ and } B) = P(A) \\times P(B)$$

So the probability that $n$ independent components **all** fail is $(1 - p)^n$.

### At Least One

"At least one works" is the complement of "all of them fail":
$$P(\\text{at least one works}) = 1 - (1 - p)^n$$

For components that each work with probability $p = 0.9$:

| Components ($n$) | All fail | At least one works |
|---|---|---|
| 1 | $0.1$ | $0.9$ |
| 2 | $0.01$ | $0.99$ |
| 3 | $0.001$ | $0.999$ |

### When the Model Breaks Down

The formula only holds if failures are independent. Real backups often share a power supply, a location or the same software, so one cause can knock out several at once. This is called a common-cause failure. It is why the Space Shuttle's fifth backup computer ran software written separately from the other four.

### References

*   [BBC Bitesize: GCSE Maths](https://www.bbc.co.uk/bitesize/subjects/z38pycw)
    `
  },
  {
    id: "diffeq",
    category: "mathematics",
    title: "Differential Equations",
    subtitle: "Model a quantity whose rate of change depends on its size, such as a satellite slowed by drag.",
    icon: "TrendingDown",
    accentColor: "indigo",
    difficulty: 3,
    estimatedMinutes: 25,
    formula: "\\frac{dv}{dt} = -k \\cdot v^2",
    formulaLayout: [
      {
        type: "fraction",
        numerator: [
          { type: "static", latex: "d" },
          { type: "variable", symbol: "v" }
        ],
        denominator: [
          { type: "static", latex: "d" },
          { type: "variable", symbol: "t" }
        ]
      },
      { type: "operator", content: "=" },
      { type: "static", latex: "-" },
      { type: "variable", symbol: "k" },
      { type: "operator", content: "\\cdot" },
      { type: "variable", symbol: "v" },
      { type: "static", latex: "^2" }
    ],
    variables: [
      {
        symbol: "v",
        name: "Velocity",
        unit: "m/s",
        description: "The current speed of the spacecraft. Drag increases with the square of the velocity.",
        color: "text-indigo-400"
      },
      {
        symbol: "t",
        name: "Time",
        unit: "s",
        description: "The continuous progression of time.",
        color: "text-cyan-400"
      },
      {
        symbol: "k",
        name: "Drag Constant",
        unit: "1/m",
        description: "A coefficient that factors in atmospheric density, spacecraft cross-section, and mass.",
        color: "text-sky-400"
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "Rates of Change",
        content: "If [Calculus](/study/calculus) is the study of change, Differential Equations are the formulas that use that change to predict the future. The expression $dv/dt$ represents acceleration—the exact rate at which velocity changes from moment to moment.",
        keyInsight: "Differential equations link the current state of a system to how fast it is changing.",
        relatedVariables: ["v", "t"]
      },
      {
        stepNumber: 2,
        title: "Quadratic Drag",
        content: "When falling into an atmosphere, air resistance is brutal. It's proportional to the square of velocity. If you double your speed, the drag force doesn't double—it quadruples! This creates a massive braking force.",
        keyInsight: "The v² term means a fast-moving re-entry vehicle experiences extreme deceleration initially.",
        relatedVariables: ["v"]
      },
      {
        stepNumber: 3,
        title: "Decay Curve",
        content: "Because the deceleration depends on velocity, the drag force shrinks as the spacecraft slows. Solving the equation gives $v = \\frac{v_0}{1 + k v_0 t}$: the speed falls steeply at first, then more and more gently. This is not exponential decay, which belongs to drag proportional to $v$ rather than $v^2$. Drag alone never settles at a steady speed; a steady (terminal) speed only appears once gravity is included.",
        keyInsight: "The negative sign ensures that drag opposes the direction of motion.",
        relatedVariables: ["k"]
      }
    ],
    solvedExample: {
      problem: "Calculate the instantaneous deceleration ($\\frac{dv}{dt}$) of a capsule re-entering at $v = 5000$ m/s, where the drag constant $k = 2 \\times 10^{-6}$.",
      steps: [
        "Square the velocity: $5000^2 = 25,000,000$.",
        "Multiply by the drag constant: $(2 \\times 10^{-6}) \\times 25,000,000$.",
        "Apply the negative sign to denote deceleration: $-50$."
      ],
      resultFormula: "\\frac{dv}{dt} = -50 \\text{ m/s}^2"
    },
    practiceProblems: [
      {
        question: "If a spacecraft's velocity triples, by what factor does its deceleration due to drag increase?",
        hint: "Look at the exponent on the velocity variable.",
        answer: "It increases by a factor of 9."
      },
      {
        question: "What happens to the rate of deceleration as the spacecraft slows down?",
        hint: "Consider what happens to v^2 as v gets smaller.",
        answer: "The deceleration rate decreases."
      }
    ],
    realWorldConnection: "Mission control uses complex sets of differential equations, factoring in variable atmospheric density and gravity, to predict exactly where a returning capsule will splash down in the ocean.",
    textbookContent: `
## Ordinary Differential Equations (ODEs)

A differential equation is a mathematical equation that relates one or more unknown functions and their derivatives. In physics, the function usually represents a physical quantity, the derivatives represent their rates of change, and the equation defines a physical law linking the two.

### The Drag Equation ODE

When a spacecraft enters an atmosphere, it experiences aerodynamic drag. The magnitude of the drag force is modelled by the equation:
$$F_D = \\frac{1}{2} \\rho v^2 C_D A$$

According to Newton's Second Law ($F = m a$), and knowing that acceleration is the derivative of velocity ($a = dv/dt$), we can express the deceleration of the spacecraft as a non-linear first-order Ordinary Differential Equation:
$$\\frac{dv}{dt} = -\\left( \\frac{\\rho C_D A}{2m} \\right) v^2$$

### Analytical vs. Numerical Solutions

If atmospheric density ($\\rho$) were constant, this ODE could be solved analytically by separating the variables. Writing $k = \\frac{\\rho C_D A}{2m}$:

$$\\frac{dv}{v^2} = -k \\, dt \\quad\\Rightarrow\\quad \\int_{v_0}^{v} \\frac{dv}{v^2} = -k\\int_0^t dt \\quad\\Rightarrow\\quad \\frac{1}{v} - \\frac{1}{v_0} = kt$$

$$v(t) = \\frac{v_0}{1 + k v_0 t}$$

The speed falls as $1/t$ for large $t$, which is slower than an exponential. However, in reality, atmospheric density changes exponentially with altitude, and gravity continues to accelerate the capsule downwards. 

This results in a coupled system of ODEs that has no closed-form analytical solution. Aerospace engineers must use numerical integration computers to simulate the reentry trajectory, dynamically calculating the updated velocity and position frame-by-frame until touchdown.

*Reference: Boyce, W. E., & DiPrima, R. C. (2012). Elementary Differential Equations and Boundary Value Problems (10th ed.). Wiley.*
    `
  },
  {
    id: 'arithmetic',
    category: 'elementary-math',
    title: "Order of Operations (BIDMAS)",
    subtitle: "Which part of a calculation to do first, and why it matters.",
    icon: 'Calculator',
    accentColor: 'indigo',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: '8 - 4 \\div 2 + (1 + 1)^2',
    formulaLayout: [
      { type: 'static', latex: 'BIDMAS:' },
      { type: 'variable', symbol: 'B' },
      { type: 'variable', symbol: 'I' },
      { type: 'variable', symbol: 'D' },
      { type: 'variable', symbol: 'M' },
      { type: 'variable', symbol: 'A' },
      { type: 'variable', symbol: 'S' }
    ],
    variables: [
      {
        symbol: 'B',
        name: 'Brackets',
        unit: '( )',
        description: 'Anything inside brackets is worked out first.',
        color: 'text-indigo-400'
      },
      {
        symbol: 'I',
        name: 'Indices',
        unit: 'x²',
        description: 'Indices (powers and roots) are worked out second.',
        color: 'text-cyan-400'
      },
      {
        symbol: 'D',
        name: 'Division',
        unit: '÷',
        description: 'Division and multiplication come third, worked from left to right.',
        color: 'text-amber-400'
      },
      {
        symbol: 'M',
        name: 'Multiplication',
        unit: '×',
        description: 'Multiplication and division come third, worked from left to right.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'A',
        name: 'Addition',
        unit: '+',
        description: 'Addition and subtraction come last, worked from left to right.',
        color: 'text-rose-400'
      },
      {
        symbol: 'S',
        name: 'Subtraction',
        unit: '−',
        description: 'Subtraction and addition come last, worked from left to right.',
        color: 'text-violet-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Brackets',
        content: 'Anything inside brackets must be worked out before anything outside them. If brackets sit inside other brackets, work from the inside out.',
        keyInsight: 'Brackets act as a VIP pass, moving the operation to the front of the queue.',
        relatedVariables: ['B']
      },
      {
        stepNumber: 2,
        title: 'Indices (Powers)',
        content: 'After brackets, work out any indices: powers and roots. A power is repeated multiplication, so it comes before ordinary multiplication.',
        keyInsight: 'Indices are worked out before multiplying, dividing, adding or subtracting.',
        relatedVariables: ['I']
      },
      {
        stepNumber: 3,
        title: 'Left-to-Right Operations',
        content: 'Division and Multiplication share the same priority, so work through them from left to right. Then Addition and Subtraction share the lowest priority, and are also worked from left to right.',
        keyInsight: 'The D before the M in BIDMAS does not mean divide first. Do whichever comes first reading left to right.',
        relatedVariables: ['D', 'M', 'A', 'S']
      }
    ],
    solvedExample: {
      problem: 'Evaluate the expression: $8 - 4 \\div 2 + (1 + 1)^2$',
      steps: [
        'First, work out the brackets: $(1 + 1) = 2$. The expression is now $8 - 4 \\div 2 + 2^2$.',
        'Next, work out the index: $2^2 = 4$. The expression is now $8 - 4 \\div 2 + 4$.',
        'Then do the division: $4 \\div 2 = 2$. The expression is now $8 - 2 + 4$.',
        'Finally, add and subtract from left to right: $8 - 2 = 6$, then $6 + 4 = 10$.'
      ],
      resultFormula: '= 10'
    },
    practiceProblems: [
      {
        question: 'Evaluate $10 - 2 \\times 3$.',
        hint: 'Remember to multiply before you subtract.',
        answer: '4'
      },
      {
        question: 'Evaluate $12 \\div 3 \\times 2$.',
        hint: 'Division and multiplication are worked from left to right.',
        answer: '8'
      }
    ],
    realWorldConnection: 'Computer programming relies heavily on the order of operations. Programmers add brackets to make sure a computer carries out a calculation in the order they intend.',
    textbookContent: `
## Arithmetic and Order of Operations

The order of operations is a collection of rules that dictate which procedures to perform first in order to evaluate a given mathematical expression. Without a standard order of operations, a single expression could yield multiple different, yet seemingly valid, results.

### The BIDMAS Rule

In UK schools the order of operations is remembered with the acronym **BIDMAS**. Some schools say **BODMAS**, where the O stands for "orders" (another word for powers).
1.  **B**rackets: work out anything inside brackets first.
2.  **I**ndices: work out powers and roots.
3.  **D**ivision and **M**ultiplication: work through these from left to right.
4.  **A**ddition and **S**ubtraction: work through these from left to right.

In the United States the same rule is taught as PEMDAS (parentheses, exponents, multiplication, division, addition, subtraction). The order is identical; only the names differ.

### The Left-to-Right Convention

A common misconception is that multiplication always precedes division, or that addition always precedes subtraction. In reality, Multiplication and Division are on the same "level" of priority. When both appear in an expression, you simply evaluate them from **left to right**. The same applies to Addition and Subtraction.

Consider the expression: $16 \\div 4 \\times 2$
*   **Incorrect (Multiply first):** $16 \\div 8 = 2$
*   **Correct (Left to right):** $4 \\times 2 = 8$

### Brackets Inside Brackets

When an expression has brackets inside brackets, such as $[ 2 + (3 \\times 4) ]$, always start with the innermost set and work outwards.

*   $[ 2 + (12) ]$
*   $14$

### References

*   [Khan Academy: Order of Operations](https://www.khanacademy.org/math/pre-algebra/pre-algebra-arith-prop/pre-algebra-order-of-operations/v/introduction-to-order-of-operations)
*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study)
    `
  },
  {
    id: 'basic-geometry',
    category: 'elementary-math',
    title: "Area and Perimeter",
    subtitle: "Measure the space inside a shape and the distance around it.",
    icon: 'Square',
    accentColor: 'emerald',
    difficulty: 1,
    estimatedMinutes: 12,
    formula: 'A = l \\times w, \\quad P = 2l + 2w',
    formulaLayout: [
      { type: 'variable', symbol: 'A' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'l' },
      { type: 'operator', content: '\\times' },
      { type: 'variable', symbol: 'w' },
      { type: 'static', latex: '\\qquad' },
      { type: 'variable', symbol: 'P' },
      { type: 'operator', content: '=' },
      { type: 'static', latex: '2' },
      { type: 'variable', symbol: 'l' },
      { type: 'operator', content: '+' },
      { type: 'static', latex: '2' },
      { type: 'variable', symbol: 'w' }
    ],
    variables: [
      {
        symbol: 'A',
        name: 'Area',
        unit: 'sq units',
        description: 'The amount of 2D space inside a closed figure.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'P',
        name: 'Perimeter',
        unit: 'units',
        description: 'The total distance around the outside edge of a figure.',
        color: 'text-rose-400'
      },
      {
        symbol: 'l',
        name: 'Length',
        unit: 'units',
        description: 'The measurement of the longer side of a rectangle.',
        color: 'text-indigo-400',
        range: { min: 1, max: 20, default: 5 }
      },
      {
        symbol: 'w',
        name: 'Width',
        unit: 'units',
        description: 'The measurement of the shorter side of a rectangle.',
        color: 'text-cyan-400',
        range: { min: 1, max: 20, default: 3 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'What is Area?',
        content: 'Area is the amount of flat space a shape takes up. You can think of it as the number of 1x1 unit squares needed to completely cover the inside of the shape without overlapping.',
        keyInsight: 'Area is measured in square units (e.g., square centimetres, square metres).',
        relatedVariables: ['A']
      },
      {
        stepNumber: 2,
        title: 'What is Perimeter?',
        content: 'Perimeter is the continuous line forming the boundary of a closed geometric figure. You can calculate it by simply adding up the lengths of all the outer sides.',
        keyInsight: 'Perimeter is a linear measurement (1D), like a piece of string wrapped around the shape.',
        relatedVariables: ['P']
      },
      {
        stepNumber: 3,
        title: 'Formulas for Rectangles',
        content: 'For a rectangle, the area is simply Length × Width. Because rectangles have two equal lengths and two equal widths, the perimeter is (2 × Length) + (2 × Width).',
        keyInsight: 'These formulas are shortcuts for counting squares (area) or adding all four sides individually (perimeter).',
        relatedVariables: ['l', 'w']
      }
    ],
    solvedExample: {
      problem: 'Find the Area and Perimeter of a rectangular garden with length $l = 8$ metres and width $w = 3$ metres.',
      steps: [
        'To find the Area, multiply length by width: $A = l \\times w$.',
        'Substitute the values: $A = 8 \\times 3 = 24$. The Area is 24 square metres.',
        'To find the Perimeter, add all four sides: $P = 2l + 2w$.',
        'Substitute the values: $P = 2(8) + 2(3) = 16 + 6 = 22$. The Perimeter is 22 metres.'
      ],
      resultFormula: 'A = 24 \\text{ m}^2, P = 22 \\text{ m}'
    },
    practiceProblems: [
      {
        question: 'A square has a side length of 4 cm. What is its area?',
        hint: 'A square is a special rectangle where length equals width.',
        answer: '16 square centimetres (16 cm²)'
      },
      {
        question: 'A rectangle has a perimeter of 20 m and a length of 6 m. What is its width?',
        hint: 'Subtract the two lengths from the perimeter, then divide the remainder by 2.',
        answer: '4 m'
      }
    ],
    realWorldConnection: 'Architects and builders use area to determine how much carpet or tile is needed for a floor, and perimeter to determine how much fencing is needed to enclose a garden.',
    textbookContent: `
## Basic Geometry: Area and Perimeter

Understanding area and perimeter is fundamental to geometry and has countless real-world applications. These concepts are first taught in primary school, bridging the gap between basic counting and abstract geometric formulas.

### Perimeter: The Outer Boundary

**Perimeter** is a linear measurement of the distance around a two-dimensional shape. It is a one-dimensional property.

For any polygon, the perimeter is found by summing the lengths of all its sides.
*   **Rectangle:** $P = l + w + l + w$ which simplifies to $P = 2l + 2w$ or $P = 2(l + w)$.
*   **Square:** Since all four sides ($s$) are equal, $P = s + s + s + s$ or $P = 4s$.

### Area: The Inside Space

**Area** measures the amount of surface space contained within a two-dimensional boundary. It is measured in square units (e.g., $\\text{cm}^2$, $\\text{m}^2$, $\\text{km}^2$).

Conceptually, finding the area of a rectangle is like covering it with a grid of unit squares and counting them. 
*   **Rectangle:** The formula $A = l \\times w$ represents multiplying the number of squares in one row (length) by the number of rows (width).
*   **Square:** $A = s \\times s$ or $A = s^2$.

### The Relationship Between Area and Perimeter

A common source of confusion is the relationship (or lack thereof) between area and perimeter. It is important to realise that:
1.  Shapes with the **same perimeter** can have **different areas**. For example, a rectangle with perimeter 20 can have dimensions $1 \\times 9$ (Area = 9) or $4 \\times 6$ (Area = 24).
2.  Shapes with the **same area** can have **different perimeters**. For example, a rectangle with area 16 can have dimensions $4 \\times 4$ (Perimeter = 16) or $2 \\times 8$ (Perimeter = 20).

### References

*   [Khan Academy: Area and Perimeter](https://www.khanacademy.org/math/basic-geo/basic-geo-area-and-perimeter)
*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study)
    `
  },
  {
    id: 'proportions',
    category: 'elementary-math',
    title: "Ratio and Proportion",
    subtitle: "Compare quantities, scale them up and down, and find a missing value.",
    icon: 'PieChart',
    accentColor: 'amber',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\frac{a}{b} = \\frac{c}{d}',
    formulaLayout: [
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'a' }],
        denominator: [{ type: 'variable', symbol: 'b' }]
      },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'c' }],
        denominator: [{ type: 'variable', symbol: 'd' }]
      }
    ],
    variables: [
      {
        symbol: 'a',
        name: 'Part 1',
        unit: 'units',
        description: 'The first quantity in the first ratio.',
        color: 'text-amber-400'
      },
      {
        symbol: 'b',
        name: 'Part 2',
        unit: 'units',
        description: 'The second quantity in the first ratio.',
        color: 'text-rose-400'
      },
      {
        symbol: 'c',
        name: 'Scaled Part 1',
        unit: 'units',
        description: 'The first quantity in the equivalent scaled ratio.',
        color: 'text-amber-400'
      },
      {
        symbol: 'd',
        name: 'Scaled Part 2',
        unit: 'units',
        description: 'The second quantity in the equivalent scaled ratio.',
        color: 'text-rose-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'What is a Ratio?',
        content: 'A ratio is a way to compare two or more quantities. If a recipe calls for 200 g of flour for every 100 g of sugar, the ratio of flour to sugar is 2 to 1 (written as 2:1 or 2/1).',
        keyInsight: 'Ratios describe the relative sizes of two or more values.',
        relatedVariables: ['a', 'b']
      },
      {
        stepNumber: 2,
        title: 'What is a Proportion?',
        content: 'A proportion is simply an equation stating that two ratios are equal. If 200 g of flour needs 100 g of sugar, then 400 g of flour will need 200 g of sugar.',
        keyInsight: 'Proportions are scaled-up or scaled-down versions of the same ratio.',
        relatedVariables: ['a', 'b', 'c', 'd']
      },
      {
        stepNumber: 3,
        title: 'Solving for an Unknown',
        content: 'If you know three parts of a proportion, you can find the fourth using cross-multiplication. For a/b = c/d, it is always true that a×d = b×c.',
        keyInsight: 'Cross-multiplication is a powerful tool to solve any proportion problem.',
        relatedVariables: ['a', 'b', 'c', 'd']
      }
    ],
    solvedExample: {
      problem: 'A car travels 150 miles on 15 litres of petrol. How many miles can it travel on 24 litres?',
      steps: [
        'Set up a proportion: $\\frac{\\text{miles}}{\\text{litres}} = \\frac{\\text{miles}}{\\text{litres}}$.',
        'Put in the known values: $\\frac{150}{15} = \\frac{x}{24}$.',
        'Cross-multiply: $150 \\times 24 = 15 \\times x$.',
        'Solve the equation: $3600 = 15x$, so $x = \\frac{3600}{15} = 240$.'
      ],
      resultFormula: 'x = 240 \\text{ miles}'
    },
    practiceProblems: [
      {
        question: 'If 3 apples cost £2, how much do 9 apples cost?',
        hint: 'Set up the ratio 3/2 = 9/x and cross-multiply.',
        answer: '£6'
      },
      {
        question: 'A map has a scale of 1 cm = 10 km. How many centimetres represent 45 km?',
        hint: 'Set up the ratio 1/10 = x/45.',
        answer: '4.5 cm'
      }
    ],
    realWorldConnection: 'Chefs use proportions constantly to scale recipes up or down depending on the number of guests. Mapmakers use ratios (scales) to accurately represent large geographic areas on small pieces of paper.',
    textbookContent: `
## Proportions and Ratios

Ratios and proportions are fundamental mathematical concepts used to describe relationships between quantities. They form the basis for understanding percentages, probability, trigonometry, and advanced algebra.

### Understanding Ratios

A **ratio** compares the size of two or more quantities. It tells us how much of one thing there is compared to another.
Ratios can be written in three main ways:
1.  Using a colon: $a : b$
2.  Using the word "to": $a \\text{ to } b$
3.  As a fraction: $\\frac{a}{b}$

For example, if a bowl contains 3 red marbles and 5 blue marbles, the ratio of red to blue marbles is $3:5$. The ratio of red marbles to *total* marbles is $3:8$.

### Equivalent Ratios and Proportions

Two ratios that represent the same relationship are called **equivalent ratios**. A **proportion** is an equation stating that two ratios are equal:
$\\frac{a}{b} = \\frac{c}{d}$

You can generate equivalent ratios by multiplying or dividing both terms of the ratio by the same non-zero number, similar to finding equivalent fractions.

### Cross-Multiplication

The most reliable method for solving proportional equations involving an unknown value is **cross-multiplication**. In any true proportion $\\frac{a}{b} = \\frac{c}{d}$, the product of the extremes equals the product of the means:
$a \\times d = b \\times c$

**Example:**
If $\\frac{4}{7} = \\frac{x}{21}$, then:
$4 \\times 21 = 7 \\times x$
$84 = 7x$
$x = 12$

### References

*   [Khan Academy: Ratios, rates, & percentages](https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic)
*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study)
    `
  },
  {
    id: 'decimals-percentages',
    category: 'elementary-math',
    title: "Fractions, Decimals and Percentages",
    subtitle: "Convert between fractions, decimals and percentages, and find a percentage of an amount.",
    icon: 'Percent',
    accentColor: 'violet',
    difficulty: 2,
    estimatedMinutes: 10,
    formula: '\\frac{X}{100} = 0.XX = XX\\%',
    formulaLayout: [
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'X' }],
        denominator: [{ type: 'static', latex: '100' }]
      },
      { type: 'operator', content: '=' },
      { type: 'static', latex: '0.' },
      { type: 'variable', symbol: 'X' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'X' },
      { type: 'static', latex: '\\%' }
    ],
    variables: [
      {
        symbol: 'X',
        name: 'The Number',
        unit: '',
        description: 'The numerical value representing parts per hundred.',
        color: 'text-violet-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Fractions to Decimals',
        content: 'Fractions are just division. To convert a fraction like 3/4 to a decimal, divide the top number by the bottom number (3 ÷ 4 = 0.75).',
        keyInsight: 'The fraction bar literally means "divided by".',
        relatedVariables: ['X']
      },
      {
        stepNumber: 2,
        title: 'Decimals to Percentages',
        content: 'Percent means "per 100". To convert a decimal to a percentage, multiply it by 100 (which shifts the decimal point two places to the right) and add a % sign. 0.75 becomes 75%.',
        keyInsight: 'Decimals and percentages are two ways of writing the same exact value.',
        relatedVariables: ['X']
      },
      {
        stepNumber: 3,
        title: 'Finding a Percentage of a Number',
        content: 'To find a percentage of a number, first convert the percentage to a decimal, then multiply. For example, to find 20% of 50: convert 20% to 0.20, then multiply 0.20 × 50 = 10.',
        keyInsight: 'The word "of" in maths often means "multiply".',
        relatedVariables: ['X']
      }
    ],
    solvedExample: {
      problem: 'A £40 shirt is on sale for 25% off. What is the discount amount, and what is the final price?',
      steps: [
        'Convert the percentage to a decimal: $25\\% = 0.25$.',
        'Find the discount amount by multiplying the original price by the decimal: $40 \\times 0.25 = 10$. The discount is £10.',
        'Subtract the discount from the original price to find the final price: $40 - 10 = 30$.'
      ],
      resultFormula: '\\text{Discount} = \\pounds 10, \\text{Final Price} = \\pounds 30'
    },
    practiceProblems: [
      {
        question: 'Write 4/5 as a percentage.',
        hint: 'First divide 4 by 5 to get a decimal, then multiply by 100.',
        answer: '80%'
      },
      {
        question: 'What is 15% of 200?',
        hint: 'Convert 15% to 0.15 and multiply by 200.',
        answer: '30'
      }
    ],
    realWorldConnection: 'Financial literacy relies heavily on percentages. Interest rates on loans, tax rates on purchases, and discounts during sales are all calculated using percentages and decimals.',
    textbookContent: `
## Decimals and Percentages

Fractions, decimals, and percentages are three different mathematical languages used to describe the exact same concept: a part of a whole. Fluently translating between these three forms is a core skill in school mathematics.

### The Base-10 Decimal System

Our number system is based on powers of 10. Just as the places to the left of the decimal point represent ones, tens, hundreds, and so on, the places to the right of the decimal point represent fractions with denominators that are powers of 10:
*   The first place to the right is the **tenths** place ($\\frac{1}{10}$).
*   The second place is the **hundredths** place ($\\frac{1}{100}$).
*   The third place is the **thousandths** place ($\\frac{1}{1000}$).

Therefore, the decimal $0.45$ can be read as "forty-five hundredths," which immediately translates to the fraction $\\frac{45}{100}$.

### Understanding Percentages

The word **percent** literally translates from Latin *per centum* as "by the hundred" or "for every 100". 
Therefore, $X\\%$ is exactly equal to the fraction $\\frac{X}{100}$.

### Translations

**1. Fraction to Decimal:**
Perform long division, dividing the numerator by the denominator.
*Example:* $\\frac{5}{8} = 5 \\div 8 = 0.625$

**2. Decimal to Percentage:**
Multiply the decimal by 100 (which moves the decimal point two places to the right) and append the $\\%$ symbol.
*Example:* $0.625 \\times 100 = 62.5\\%$

**3. Percentage to Decimal:**
Divide the percentage by 100 (which moves the decimal point two places to the left) and remove the $\\%$ symbol.
*Example:* $42\\% = 42 \\div 100 = 0.42$

### Calculating with Percentages

When solving real-world problems involving percentages (like calculating tax, tips, or discounts), the most reliable method is to first convert the percentage into its decimal form, and then perform the arithmetic. 
When asked to find a percentage *of* a number, the operation is multiplication.

*Example: Find a 15% tip on a £30 bill.*
$15\\% = 0.15$
$0.15 \\times 30 = 4.5$
The tip is £4.50.

### References

*   [Khan Academy: Decimals, fractions, and percentages](https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic/cc-6th-percent-decimals/v/representing-a-number-as-a-decimal-percent-and-fraction)
*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study)
    `
  },
  {
    id: 'angles',
    category: 'mathematics',
    title: "Radians, Arc Length and Sector Area",
    subtitle: "Measure angles in radians and use them to find arc lengths and sector areas.",
    icon: 'Activity',
    accentColor: 'cyan',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: 's = r \\cdot \\theta',
    formulaLayout: [
      { type: 'variable', symbol: 's' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'r' },
      { type: 'operator', content: '\\cdot' },
      { type: 'variable', symbol: '\\theta' }
    ],
    variables: [
      {
        symbol: 's',
        name: 'Arc Length',
        unit: 'm',
        description: 'The distance along the curved edge of a sector.',
        color: 'text-cyan-400'
      },
      {
        symbol: 'r',
        name: 'Radius',
        unit: 'm',
        description: 'The straight-line distance from the centre to the edge.',
        color: 'text-rose-400',
        range: { min: 1, max: 10, default: 5 }
      },
      {
        symbol: '\\theta',
        name: 'Angle (Radians)',
        unit: 'rad',
        description: 'The measure of the central angle in radians.',
        color: 'text-amber-400',
        range: { min: 0, max: 6.28, default: 1.57 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Degrees vs Radians',
        content: 'While degrees (360 in a circle) are common, mathematicians prefer radians. A radian is the angle created when the arc length equals the radius. A full circle is 2π radians.',
        keyInsight: 'Radians directly relate the angle to the physical distance around the circle.',
        relatedVariables: ['\\theta']
      },
      {
        stepNumber: 2,
        title: 'Arc Length',
        content: 'If you know the radius of a circle and the central angle in radians, the arc length is simply their product.',
        keyInsight: 'This formula only works if the angle is in radians!',
        relatedVariables: ['s', 'r', '\\theta']
      },
      {
        stepNumber: 3,
        title: 'Sector Area',
        content: 'The area of the "slice of pie" (sector) is given by A = (1/2) * r² * θ. This is directly derived from the area of a full circle.',
        keyInsight: 'Sector area scales quadratically with radius but linearly with the angle.',
        relatedVariables: ['r', '\\theta']
      }
    ],
    solvedExample: {
      problem: 'Find the arc length of a circular sector with radius $r = 4\\text{m}$ and angle $\\theta = \\frac{\\pi}{2}$ radians.',
      steps: [
        'Use the arc length formula: $s = r \\cdot \\theta$.',
        'Substitute the given values: $s = 4 \\cdot \\frac{\\pi}{2}$.',
        'Simplify the expression: $s = 2\\pi \\approx 6.28\\text{m}$.'
      ],
      resultFormula: 's = 2\\pi \\text{ m}'
    },
    practiceProblems: [
      {
        question: 'Convert 180 degrees to radians.',
        hint: 'A full circle (360 degrees) is 2π radians.',
        answer: 'π radians'
      },
      {
        question: 'If s = 10 and r = 5, what is θ in radians?',
        hint: 'Solve s = rθ for θ.',
        answer: '2 radians'
      }
    ],
    realWorldConnection: 'Civil engineers use arc length and central angles to design safe curves in roads and railways. The radius must be large enough (and the curve gentle enough) to prevent derailments or slipping.',
    textbookContent: `
## Angles and Circular Measurement

Angles measure the amount of rotation between two intersecting lines. While everyday applications use degrees, advanced mathematics and physics rely heavily on **radians**.

### Radians

A **radian** is defined as the angle subtended at the centre of a circle by an arc whose length is equal to the circle's radius. 
Because the total circumference of a circle is $C = 2\\pi r$, there are exactly $2\\pi$ radians in a full $360^\\circ$ rotation.

To convert between them:
$\\text{Radians} = \\text{Degrees} \\times \\frac{\\pi}{180^\\circ}$
$\\text{Degrees} = \\text{Radians} \\times \\frac{180^\\circ}{\\pi}$

### Arc Length

The **arc length** ($s$) is the distance along the curved edge of a circle. When the angle $\\theta$ is measured in radians, the formula is elegantly simple:
$$s = r \\cdot \\theta$$

*Why?* If $\\theta = 2\\pi$ (a full circle), the formula gives $s = r(2\\pi) = 2\\pi r$, which is the circumference.

### Sector Area

A **sector** is a portion of a circle enclosed by two radii and an arc (like a slice of pizza). The area of a sector is proportional to its central angle.
$$A = \\frac{1}{2} r^2 \\theta$$

*Why?* If $\\theta = 2\\pi$, the formula gives $A = \\frac{1}{2} r^2 (2\\pi) = \\pi r^2$, the area of the full circle.

### References

*   [Khan Academy: Radians & Arc Length](https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:trig/x2ec2f6f830c9fb89:radians/v/introduction-to-radians)
*   [Stewart Calculus (Early Transcendentals)](https://www.cengage.com/c/calculus-early-transcendentals-9e-stewart/9781337613927/)
    `
  },
  {
    id: 'multiplication',
    category: 'elementary-math',
    title: "Long Multiplication",
    subtitle: "Multiply large numbers step by step.",
    icon: 'Activity',
    accentColor: 'amber',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: 'a \\times b = a + a + \\cdots + a \\; (b \\text{ times})',
    formulaLayout: [
      { type: 'variable', symbol: 'a' },
      { type: 'operator', content: '\\times' },
      { type: 'variable', symbol: 'b' }
    ],
    variables: [
      {
        symbol: 'a',
        name: 'Multiplicand',
        unit: 'Whole Number',
        description: 'The number being multiplied.',
        color: 'text-amber-400'
      },
      {
        symbol: 'b',
        name: 'Multiplier',
        unit: 'Whole Number',
        description: 'The number of times to add the multiplicand.',
        color: 'text-orange-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Multiply Each Digit',
        content: 'Start from the rightmost digit of the multiplier. Multiply it by each digit of the multiplicand, right to left, carrying any tens digit.',
        keyInsight: 'Multiplication is repeated addition — 4 × 3 means 4 added together 3 times.',
        relatedVariables: ['a', 'b']
      },
      {
        stepNumber: 2,
        title: 'Shift & Add Partial Products',
        content: 'For each digit in the multiplier, write the partial product on a new row, shifted one place to the left. Then add all partial products together.',
        keyInsight: 'Each digit position represents a power of 10 — that is why you shift left.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Calculate $24 \\times 13$.',
      steps: [
        'Multiply $24 \\times 3 = 72$ (first partial product).',
        'Multiply $24 \\times 10 = 240$ (second partial product, shifted left).',
        'Add: $72 + 240 = 312$.'
      ],
      resultFormula: '24 \\times 13 = 312'
    },
    practiceProblems: [
      { question: 'Calculate 15 × 12.', hint: 'Partial products: 15×2=30, 15×10=150.', answer: '180' },
      { question: 'Calculate 23 × 11.', hint: 'Partial products: 23×1=23, 23×10=230.', answer: '253' }
    ],
    realWorldConnection: 'Computers multiply in a very similar way: a processor works through the digits of a binary number, shifting and adding partial products, just as you do in long multiplication.',
    textbookContent: `
## Long Multiplication

Long multiplication is a method of multiplying two numbers by breaking the problem into smaller, simpler steps using the distributive property of multiplication.

### The Distributive Property

Every multi-digit number can be broken into its place values:
$$24 \\times 13 = 24 \\times (10 + 3) = (24 \\times 10) + (24 \\times 3)$$

### Standard Algorithm

1. Write the two numbers vertically, larger on top.
2. Multiply the top number by the **ones digit** of the bottom — this is the first partial product.
3. Multiply the top number by the **tens digit** of the bottom, placing a zero placeholder in the ones column — this is the second partial product.
4. Add the partial products together.

### Carrying

When a multiplication produces a two-digit result (e.g. $7 \\times 8 = 56$), write down the ones digit and **carry** the tens digit to the next column to be added.

### References

*   [Khan Academy: Multi-digit Multiplication](https://www.khanacademy.org/math/arithmetic/x18ca194a:multiply-1-and-2-digit-numbers)
*   [Art of Problem Solving: Multiplication](https://artofproblemsolving.com/wiki/index.php/Multiplication)
    `
  },
  {
    id: 'fraction-ops',
    category: 'elementary-math',
    title: "Calculating with Fractions",
    subtitle: "Add, subtract, multiply and divide fractions.",
    icon: 'Sparkles',
    accentColor: 'violet',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}',
    formulaLayout: [
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'a' }],
        denominator: [{ type: 'variable', symbol: 'b' }]
      },
      { type: 'operator', content: '+' },
      {
        type: 'fraction',
        numerator: [{ type: 'variable', symbol: 'c' }],
        denominator: [{ type: 'variable', symbol: 'd' }]
      },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [
          { type: 'variable', symbol: 'ad' },
          { type: 'operator', content: '+' },
          { type: 'variable', symbol: 'bc' }
        ],
        denominator: [{ type: 'variable', symbol: 'bd' }]
      }
    ],
    variables: [
      { symbol: 'a', name: 'Numerator 1', unit: 'Integer', description: 'Top of the first fraction.', color: 'text-violet-400' },
      { symbol: 'b', name: 'Denominator 1', unit: 'Integer ≠ 0', description: 'Bottom of the first fraction.', color: 'text-purple-400' },
      { symbol: 'c', name: 'Numerator 2', unit: 'Integer', description: 'Top of the second fraction.', color: 'text-fuchsia-400' },
      { symbol: 'd', name: 'Denominator 2', unit: 'Integer ≠ 0', description: 'Bottom of the second fraction.', color: 'text-pink-400' }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Adding & Subtracting',
        content: 'To add or subtract fractions, they must share a common denominator. Find the LCM (Lowest Common Multiple) of the denominators, convert both fractions, then add or subtract the numerators.',
        keyInsight: 'You can only add like parts — you cannot add thirds and quarters directly.',
        relatedVariables: ['a', 'b', 'c', 'd']
      },
      {
        stepNumber: 2,
        title: 'Multiplying',
        content: 'To multiply two fractions, multiply the numerators together and the denominators together: $\\frac{a}{b} \\times \\frac{c}{d} = \\frac{ac}{bd}$.',
        keyInsight: 'No common denominator needed — multiplication is simpler than addition!',
        relatedVariables: []
      },
      {
        stepNumber: 3,
        title: 'Dividing (Keep-Change-Flip)',
        content: 'To divide by a fraction, multiply by its reciprocal: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c} = \\frac{ad}{bc}$.',
        keyInsight: 'Dividing by $\\frac{1}{2}$ is the same as multiplying by 2.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Calculate $\\frac{1}{3} + \\frac{1}{4}$.',
      steps: [
        'Find the LCM of 3 and 4, which is 12.',
        'Convert: $\\frac{1}{3} = \\frac{4}{12}$ and $\\frac{1}{4} = \\frac{3}{12}$.',
        'Add the numerators: $\\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.'
      ],
      resultFormula: '\\frac{1}{3} + \\frac{1}{4} = \\frac{7}{12}'
    },
    practiceProblems: [
      { question: 'Calculate 1/2 + 1/3.', hint: 'LCM of 2 and 3 is 6.', answer: '5/6' },
      { question: 'Calculate (2/3) × (3/4).', hint: 'Multiply tops and bottoms.', answer: '1/2' }
    ],
    realWorldConnection: 'Engineers use fraction arithmetic constantly when scaling recipes, mixing materials in ratios, or dividing resources across teams.',
    textbookContent: `
## Operations with Fractions

A **fraction** $\\frac{a}{b}$ represents $a$ equal parts of a whole that is divided into $b$ parts.

### Addition and Subtraction

Fractions can only be added or subtracted when they share a common denominator:
$$\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$$

### Multiplication

Multiply numerator by numerator, denominator by denominator:
$$\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}$$

### Division (Keep-Change-Flip)

To divide by a fraction, multiply by its **reciprocal**:
$$\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$$

### References

*   [Khan Academy: Fractions](https://www.khanacademy.org/math/arithmetic/fraction-arithmetic)
*   [BBC Bitesize: KS3 Maths](https://www.bbc.co.uk/bitesize/subjects/zqhs34j)
    `
  },
  {
    id: 'negative-numbers',
    category: 'elementary-math',
    title: "Negative Numbers",
    subtitle: "Use the number line to add, subtract, multiply and divide with negative numbers.",
    icon: 'Activity',
    accentColor: 'rose',
    difficulty: 1,
    estimatedMinutes: 10,
    formula: '-(-a) = a, \\quad (-a)(-b) = ab',
    formulaLayout: [
      { type: 'static', latex: '-(' },
      { type: 'variable', symbol: '-a' },
      { type: 'static', latex: ')' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'a' }
    ],
    variables: [
      { symbol: 'a', name: 'Positive Value', unit: 'Real Number', description: 'A value greater than zero.', color: 'text-rose-400' }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'The Number Line',
        content: 'Negative numbers lie to the left of zero on the number line. Adding a positive number moves right; adding a negative number moves left.',
        keyInsight: 'Subtracting is the same as adding a negative: $5 - 3 = 5 + (-3)$.',
        relatedVariables: []
      },
      {
        stepNumber: 2,
        title: 'Sign Rules for Multiplication',
        content: 'Positive × Positive = Positive. Negative × Negative = Positive. Positive × Negative = Negative.',
        keyInsight: 'Two negatives cancel out — mathematically and intuitively.',
        relatedVariables: []
      },
      {
        stepNumber: 3,
        title: 'Absolute Value',
        content: 'The absolute value $|a|$ is the distance of $a$ from zero on the number line, always non-negative: $|-5| = 5$.',
        keyInsight: 'Distance is never negative — that is what absolute value captures.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Calculate $(-3) \\times (-4) + (-2)$.',
      steps: [
        'Apply sign rule: $(-3) \\times (-4) = +12$ (negative × negative = positive).',
        'Add $-2$: $12 + (-2) = 12 - 2 = 10$.'
      ],
      resultFormula: '(-3)(-4) + (-2) = 10'
    },
    practiceProblems: [
      { question: 'What is (-5) + 8?', hint: 'Move 8 places right from -5.', answer: '3' },
      { question: 'What is (-3) × (-7)?', hint: 'Negative × negative = positive.', answer: '21' }
    ],
    realWorldConnection: 'Negative numbers model temperature below zero, debt in finance, and downward forces in physics.',
    textbookContent: `
## Negative Numbers and Signed Arithmetic

Negative numbers extend the counting numbers into values less than zero. They are fundamental to algebra, physics, finance, and computing.

### The Number Line

$$\\cdots -3, -2, -1, 0, +1, +2, +3 \\cdots$$

### Addition and Subtraction Rules

| Operation | Interpretation |
|---|---|
| $a + b$ | Move $b$ units right |
| $a + (-b)$ | Move $b$ units left (same as $a - b$) |
| $a - (-b)$ | Move $b$ units right (same as $a + b$) |

### Multiplication Sign Rules

| Signs | Product |
|---|---|
| $(+)(+)$ | Positive |
| $(-)(-) $ | Positive |
| $(+)(-)$ | Negative |

### Absolute Value

$$|a| = \\begin{cases} a & \\text{if } a \\geq 0 \\\\ -a & \\text{if } a < 0 \\end{cases}$$

### References

*   [Khan Academy: Negative Numbers](https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-factors-and-multiples/cc-6th-negative-numbers/v/negative-numbers-introduction)
*   [Art of Problem Solving: Integers](https://artofproblemsolving.com/wiki/index.php/Integer)
    `
  },
  {
    id: 'exponents-roots',
    category: 'elementary-math',
    title: "Powers and Roots",
    subtitle: "Work with powers and square roots, and write very large and very small numbers in standard form.",
    icon: 'Sparkles',
    accentColor: 'cyan',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: 'a^n = a \\times a \\times \\cdots \\times a',
    formulaLayout: [
      { type: 'variable', symbol: 'a' },
      { type: 'static', latex: '^n' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'a' },
      { type: 'operator', content: '\\times' },
      { type: 'variable', symbol: 'a' },
      { type: 'operator', content: '\\times' },
      { type: 'static', latex: '\\cdots' }
    ],
    variables: [
      { symbol: 'a', name: 'Base', unit: 'Real Number', description: 'The number being multiplied by itself.', color: 'text-cyan-400' },
      { symbol: 'n', name: 'Exponent / Power', unit: 'Integer', description: 'How many times the base is multiplied by itself.', color: 'text-sky-400' }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'What Is a Power?',
        content: '$a^n$ means the base $a$ is multiplied by itself $n$ times. For example, $2^4 = 2 \\times 2 \\times 2 \\times 2 = 16$.',
        keyInsight: 'Exponentiation is repeated multiplication, just as multiplication is repeated addition.',
        relatedVariables: ['a', 'n']
      },
      {
        stepNumber: 2,
        title: 'Key Exponent Laws',
        content: '$a^m \\times a^n = a^{m+n}$ (same base, add exponents). $(a^m)^n = a^{mn}$ (power of a power). $a^0 = 1$ for any $a \\ne 0$.',
        keyInsight: 'The laws of exponents let you simplify complex expressions without computing huge numbers.',
        relatedVariables: ['n']
      },
      {
        stepNumber: 3,
        title: 'Square & Cube Roots',
        content: 'The square root $\\sqrt{a}$ is the inverse of squaring: $\\sqrt{9} = 3$ because $3^2 = 9$. Roots are fractional exponents: $\\sqrt{a} = a^{1/2}$.',
        keyInsight: '$\\sqrt{a} = a^{1/2}$ — roots are just fractional exponents.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Simplify $2^3 \\times 2^4$.',
      steps: [
        'Same base ($2$), so add the exponents: $2^3 \\times 2^4 = 2^{3+4}$.',
        'Compute: $2^7 = 128$.'
      ],
      resultFormula: '2^3 \\times 2^4 = 2^7 = 128'
    },
    practiceProblems: [
      {
        question: "What is $3^2$?",
        hint: "3 × 3",
        answer: "9"
      },
      {
        question: "What is $2^5$?",
        hint: "Multiply five 2s together: 2 × 2 × 2 × 2 × 2.",
        answer: "32"
      },
      {
        question: "What is $\\sqrt{144}$?",
        hint: "Which number multiplied by itself makes 144?",
        answer: "12"
      },
      {
        question: "What is the cube root of 64?",
        hint: "Which number, used three times in a multiplication, makes 64?",
        answer: "4, because 4 × 4 × 4 = 64"
      },
      {
        question: "The Sun is about 150,000,000 km from Earth. Write this in standard form.",
        hint: "Move the decimal point until there is one digit in front of it, and count the places.",
        answer: "$1.5 \\times 10^8$ km"
      },
      {
        question: "Write 0.0031 in standard form.",
        hint: "The number is less than 1, so the power of ten is negative.",
        answer: "$3.1 \\times 10^{-3}$"
      },
      {
        question: "Which is larger: $4.2 \\times 10^5$ or $9.8 \\times 10^4$?",
        hint: "Compare the powers of ten first.",
        answer: "$4.2 \\times 10^5$, which is 420,000. The other is 98,000."
      },
    ],
    realWorldConnection: 'Standard form uses powers of 10 to write huge numbers compactly — the distance to the Sun is $1.5 \\times 10^{11}$ metres.',
    textbookContent: `
## Powers and roots

### Powers

A power is a short way to write repeated multiplication:

$$a^n = \\underbrace{a \\times a \\times \\cdots \\times a}_{n \\text{ times}}$$

In $2^5$, the 2 is the **base** and the 5 is the **index** (also called the power or exponent). So $2^5 = 2 \\times 2 \\times 2 \\times 2 \\times 2 = 32$.

A number to the power 2 is **squared**. A number to the power 3 is **cubed**.

It helps to recognise the first few powers of small numbers:

| Base | Powers |
|---|---|
| 2 | 2, 4, 8, 16, 32, 64 |
| 3 | 3, 9, 27, 81 |
| 4 | 4, 16, 64 |
| 5 | 5, 25, 125 |

### Roots

A root undoes a power.

*   The **square root** of 49 is 7, because $7^2 = 49$. It is written $\\sqrt{49} = 7$.
*   The **cube root** of 27 is 3, because $3^3 = 27$. It is written $\\sqrt[3]{27} = 3$.

Most roots do not come out as whole numbers. $\\sqrt{2}$ is 1.41421... and its decimals never end, so $\\sqrt{2}$ is the exact value and 1.41 is only an approximation.

### Rules for working with powers

| Rule | In symbols | Example |
|---|---|---|
| Multiplying: add the indices | $a^m \\times a^n = a^{m+n}$ | $2^3 \\times 2^4 = 2^7$ |
| Dividing: subtract the indices | $\\dfrac{a^m}{a^n} = a^{m-n}$ | $\\dfrac{5^6}{5^2} = 5^4$ |
| Power of a power: multiply the indices | $(a^m)^n = a^{mn}$ | $(3^2)^3 = 3^6$ |
| Power of zero | $a^0 = 1$ | $7^0 = 1$ |
| Negative index | $a^{-n} = \\dfrac{1}{a^n}$ | $10^{-3} = \\dfrac{1}{1000}$ |

### Standard form

Very large and very small numbers are written in **standard form** (also called scientific notation):

$$A \\times 10^n$$

where $A$ is at least 1 and less than 10, and $n$ is a whole number.

*   A large number has a positive power of ten: $93{,}000{,}000 = 9.3 \\times 10^7$.
*   A number smaller than 1 has a negative power of ten: $0.00056 = 5.6 \\times 10^{-4}$.

To compare two numbers in standard form, look at the power of ten first. $2 \\times 10^8$ is larger than $9 \\times 10^7$, even though 9 is larger than 2.

Scientists use standard form all the time. The distance from Earth to the Sun is about $1.5 \\times 10^{11}$ metres.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
`
  },

  // ─── THERMODYNAMICS ───────────────────────────────────────────────────────────
  {
    id: 'thermodynamics',
    category: 'physics',
    title: "Thermodynamics and the Ideal Gas Law",
    subtitle: "How the pressure, volume and temperature of a gas are linked, and what entropy means.",
    icon: 'Sparkles',
    accentColor: 'rose',
    difficulty: 3,
    estimatedMinutes: 20,
    formula: 'PV = nRT',
    formulaLayout: [
      { type: 'variable', symbol: 'P' },
      { type: 'variable', symbol: 'V' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'n' },
      { type: 'variable', symbol: 'R' },
      { type: 'variable', symbol: 'T' },
    ],
    variables: [
      {
        symbol: 'P',
        name: 'Pressure',
        unit: 'Pascals (Pa)',
        description: 'The force exerted per unit area by gas molecules colliding with the container walls.',
        color: 'text-rose-400',
        range: { min: 1, max: 10, default: 1 }
      },
      {
        symbol: 'V',
        name: 'Volume',
        unit: 'Cubic metres (m³)',
        description: 'The space occupied by the gas. As volume decreases, pressure rises if temperature stays constant.',
        color: 'text-orange-400',
        range: { min: 1, max: 10, default: 5 }
      },
      {
        symbol: 'n',
        name: 'Amount of Substance',
        unit: 'Moles (mol)',
        description: 'The number of moles of gas. One mole contains approximately 6.022 × 10²³ molecules.',
        color: 'text-amber-400'
      },
      {
        symbol: 'R',
        name: 'Ideal Gas Constant',
        unit: 'J/(mol·K)',
        description: 'A universal constant: R ≈ 8.314 J/(mol·K). It relates energy to temperature for one mole of an ideal gas.',
        color: 'text-yellow-400'
      },
      {
        symbol: 'T',
        name: 'Temperature',
        unit: 'Kelvin (K)',
        description: 'Absolute temperature. Always use Kelvin (K = °C + 273.15) — never Celsius in gas laws.',
        color: 'text-red-400',
        range: { min: 200, max: 600, default: 300 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'The Ideal Gas Model',
        content: 'An ideal gas is a theoretical model where gas molecules are perfectly elastic point particles that do not interact with each other. Real gases approximate this model well under low pressure and high temperature conditions.',
        keyInsight: 'Pressure is caused by enormous numbers of gas molecules bouncing off the container walls every second.',
        relatedVariables: ['P', 'V']
      },
      {
        stepNumber: 2,
        title: 'Four Gas Laws in One',
        content: 'PV = nRT combines Boyle\'s Law (P ∝ 1/V at constant T), Charles\'s Law (V ∝ T at constant P), the pressure law (P ∝ T at constant V) and Avogadro\'s Law (V ∝ n) into a single equation for predicting gas behaviour.',
        keyInsight: 'If you know any four of the five quantities, you can solve for the fifth.',
        relatedVariables: ['P', 'V', 'n', 'T']
      },
      {
        stepNumber: 3,
        title: 'Entropy & the Second Law',
        content: 'The Second Law of Thermodynamics states that the total entropy of an isolated system never decreases. Heat flows spontaneously from hot to cold — never the reverse — because the disordered state is statistically overwhelmingly more probable.',
        keyInsight: 'Entropy never decreases in an isolated system. Left alone, ordered systems tend towards disorder.',
        relatedVariables: ['T']
      }
    ],
    solvedExample: {
      problem: 'A sealed container holds $n = 2$ mol of gas at $T = 300$ K and $V = 0.05$ m³. Find the pressure $P$.',
      steps: [
        'Use the ideal gas law: $P = \\frac{nRT}{V}$.',
        'Substitute: $P = \\frac{2 \\times 8.314 \\times 300}{0.05}$.',
        'Numerator: $2 \\times 8.314 \\times 300 = 4988.4$ J.',
        'Divide: $P = \\frac{4988.4}{0.05}$.'
      ],
      resultFormula: 'P \\approx 99{,}768 \\text{ Pa} \\approx 0.985 \\text{ atm}'
    },
    practiceProblems: [
      {
        question: "Convert 27 °C to kelvin.",
        hint: "Add 273 to the Celsius temperature.",
        answer: "300 K"
      },
      {
        question: "The temperature of a gas in a sealed, rigid container doubles (in kelvin). What happens to the pressure?",
        hint: "With the volume and the amount of gas fixed, pressure is proportional to temperature.",
        answer: "The pressure doubles."
      },
      {
        question: "A gas has a volume of 4 litres at a pressure of 200 kPa. It expands at constant temperature until the pressure is 100 kPa. What is its new volume?",
        hint: "At constant temperature, pressure × volume stays the same.",
        answer: "8 litres"
      },
      {
        question: "Find the pressure of 1 mol of an ideal gas at 300 K in a volume of 0.025 m³. ($R = 8.31$ J mol⁻¹ K⁻¹)",
        hint: "Rearrange to p = nRT ÷ V.",
        answer: "About 99,700 Pa, or 99.7 kPa, which is close to normal air pressure"
      },
      {
        question: "A gas is heated from 300 K to 600 K. What happens to the average kinetic energy of its molecules?",
        hint: "The average kinetic energy is proportional to the temperature in kelvin.",
        answer: "It doubles."
      },
      {
        question: "Why must the temperature be in kelvin, not degrees Celsius, in the ideal gas equation?",
        hint: "Think about what the equation would give at 0 °C.",
        answer: "The Celsius scale has an arbitrary zero and can be negative, which would give zero or negative pressures. The kelvin scale starts at absolute zero, so pressure is proportional to it."
      },
    ],
    realWorldConnection: 'Spacecraft thermal control engineers apply thermodynamics daily — managing heat from the Sun, electronics, and the cold of deep space to keep instruments within safe operating temperatures.',
    textbookContent: `
## Ideal gases

### The model

An ideal gas is a simple picture of a real gas:

*   It is made of a very large number of tiny particles moving at random.
*   The particles take up almost no room compared with the container.
*   They do not attract or repel each other. They only interact when they collide.
*   No kinetic energy is lost in collisions.

The **pressure** of the gas comes from its particles hitting the walls of the container. More collisions each second, or harder ones, mean a higher pressure.

### The ideal gas equation

$$pV = nRT$$

| Symbol | Quantity | Unit |
|---|---|---|
| $p$ | pressure | pascals (Pa) |
| $V$ | volume | cubic metres (m³) |
| $n$ | amount of gas | moles (mol) |
| $R$ | molar gas constant | 8.31 J mol⁻¹ K⁻¹ |
| $T$ | temperature | kelvin (K) |

The same equation can be written for the number of molecules $N$ instead of the number of moles:

$$pV = NkT$$

where $k = 1.38 \\times 10^{-23}$ J K⁻¹ is the Boltzmann constant. The two forms agree because $Nk = nR$.

### Kelvin and absolute zero

The temperature must be in kelvin:

$$T \\text{ (K)} = \\theta \\text{ (°C)} + 273$$

Zero kelvin is **absolute zero**, the lowest temperature there can be. It is the temperature at which the particles of an ideal gas would have no kinetic energy.

### Three special cases

*   **Constant temperature:** $pV$ stays the same. Halve the volume and the pressure doubles.
*   **Constant volume:** $p$ is proportional to $T$. Double the kelvin temperature and the pressure doubles.
*   **Constant pressure:** $V$ is proportional to $T$.

### Temperature and the energy of molecules

The temperature of a gas tells you the average kinetic energy of its molecules:

$$\\text{average kinetic energy} = \\frac{3}{2}kT$$

*Example:* at 300 K the average is $\\frac{3}{2} \\times 1.38 \\times 10^{-23} \\times 300 = 6.21 \\times 10^{-21}$ J for each molecule.

### Internal energy

The **internal energy** of a substance is the total of the random kinetic and potential energies of its particles. For an ideal gas it is all kinetic. The energy needed to change the temperature of a mass $m$ by $\\Delta\\theta$ is:

$$E = mc\\,\\Delta\\theta$$

where $c$ is the specific heat capacity.

### Worked example

A sealed tank holds 2 mol of gas at 300 K in a volume of 0.05 m³. Find the pressure.

1.  Rearrange: $p = \\dfrac{nRT}{V}$.
2.  Substitute: $p = \\dfrac{2 \\times 8.31 \\times 300}{0.05}$.
3.  $p = 99{,}720$ Pa, about 99.7 kPa.

### In a rocket engine

Burning fuel makes very hot gas in a small chamber. A high temperature in a fixed volume means a high pressure, and that pressure drives the gas out through the nozzle at great speed.

### Going further: entropy

Entropy is not in the required A-level content, but it explains why heat flows the way it does. It measures the number of ways the particles and their energy can be arranged. Left alone, a system moves towards arrangements with more entropy, which is why energy spreads from hot objects to cold ones and never the other way by itself.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
`
  },

  // ─── MOMENTUM & COLLISIONS ────────────────────────────────────────────────────
  {
    id: 'momentum',
    category: 'mechanics',
    title: "Momentum and Collisions",
    subtitle: "Use conservation of momentum to work out what happens in collisions and rocket launches.",
    icon: 'Activity',
    accentColor: 'violet',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: 'p = mv',
    formulaLayout: [
      { type: 'variable', symbol: 'p' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'm' },
      { type: 'variable', symbol: 'v' },
    ],
    variables: [
      {
        symbol: 'p',
        name: 'Momentum',
        unit: 'kg·m/s',
        description: 'A vector quantity describing the quantity of motion an object has. The product of its mass and velocity.',
        color: 'text-violet-400'
      },
      {
        symbol: 'm',
        name: 'Mass',
        unit: 'Kilograms (kg)',
        description: 'The amount of matter in the object. More massive objects are harder to stop or start moving.',
        color: 'text-purple-400',
        range: { min: 1, max: 10, default: 3 }
      },
      {
        symbol: 'v',
        name: 'Velocity',
        unit: 'm/s',
        description: 'The speed and direction of the object. Momentum is a vector — direction matters.',
        color: 'text-indigo-400',
        range: { min: 1, max: 20, default: 5 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Momentum: The Quantity of Motion',
        content: 'Momentum $p = mv$ captures both how heavy an object is and how fast it moves. A slow-moving truck and a fast-moving bullet can have similar momenta despite very different masses and speeds.',
        keyInsight: 'Momentum depends on both mass AND velocity equally.',
        relatedVariables: ['p', 'm', 'v']
      },
      {
        stepNumber: 2,
        title: 'Conservation of Momentum',
        content: 'In a closed system with no external forces, the total momentum is conserved. Before and after any collision: $m_1v_1 + m_2v_2 = m_1v_1\' + m_2v_2\'$. This is one of the most powerful laws in all of physics.',
        keyInsight: 'Total momentum before a collision always equals total momentum after.',
        relatedVariables: ['p', 'm', 'v']
      },
      {
        stepNumber: 3,
        title: 'Impulse and Force',
        content: 'Impulse $J = F\\Delta t = \\Delta p$ links force and time to changes in momentum. This is why airbags work — they extend the collision time, reducing the peak force on passengers.',
        keyInsight: 'Same change in momentum over longer time = smaller force.',
        relatedVariables: ['p']
      }
    ],
    solvedExample: {
      problem: 'A $5$ kg ball moving at $10$ m/s collides with a stationary $3$ kg ball. After the collision, the 5 kg ball moves at $4$ m/s. Find the velocity of the 3 kg ball.',
      steps: [
        'Apply conservation of momentum: $p_{\\text{before}} = p_{\\text{after}}$.',
        'Before: $p = 5 \\times 10 + 3 \\times 0 = 50$ kg·m/s.',
        'After: $p = 5 \\times 4 + 3 \\times v_2 = 20 + 3v_2$.',
        'Set equal: $50 = 20 + 3v_2$, so $3v_2 = 30$.'
      ],
      resultFormula: 'v_2 = 10 \\text{ m/s}'
    },
    practiceProblems: [
      {
        question: "A 1,200 kg car travels at 20 m/s. What is its momentum?",
        hint: "Momentum = mass × velocity.",
        answer: "24,000 kg m/s"
      },
      {
        question: "A 3 kg trolley moving at 4 m/s hits a stationary 1 kg trolley and they stick together. How fast do they move afterwards?",
        hint: "The momentum before is 3 × 4. Afterwards the combined mass is 4 kg.",
        answer: "3 m/s"
      },
      {
        question: "Two 0.5 kg balls roll towards each other, each at 6 m/s. What is their total momentum?",
        hint: "Momentum has a direction. Call one direction positive and the other negative.",
        answer: "Zero. The two momenta are equal in size and opposite in direction."
      },
      {
        question: "Two ice skaters, 60 kg and 80 kg, push each other apart from rest. The 60 kg skater moves off at 4 m/s. How fast does the 80 kg skater move?",
        hint: "The total momentum was zero before, so it is zero afterwards: 60 × 4 = 80 × v.",
        answer: "3 m/s, in the opposite direction"
      },
      {
        question: "A 70 kg astronaut floating at rest throws a 2 kg tool away at 10 m/s. How fast does the astronaut move, and which way?",
        hint: "The total momentum stays at zero: 2 × 10 = 70 × v.",
        answer: "About 0.29 m/s, in the opposite direction to the tool"
      },
      {
        question: "A rocket in space has nothing to push against. How can it speed up?",
        hint: "Think about the momentum of the exhaust gas.",
        answer: "It throws exhaust gas out backwards at high speed. The gas gains momentum backwards, so the rocket gains the same amount of momentum forwards."
      },
    ],
    realWorldConnection: 'Spacecraft navigation uses momentum conservation. When a rocket expels propellant backward at high speed, the spacecraft is propelled forward — just like an astronaut throwing a spanner.',
    textbookContent: `
## Momentum

Momentum measures how hard it is to stop something that is moving. It depends on mass and on velocity:

$$p = mv$$

Mass $m$ is in kilograms (kg), velocity $v$ in metres per second (m/s), and momentum $p$ in kg m/s.

Momentum has a direction, the same as the velocity. In a problem along a line, choose one direction as positive. Anything moving the other way then has negative momentum.

### Conservation of momentum

When objects collide or push apart, and no outside force acts on them:

**total momentum before = total momentum after**

This is the principle of conservation of momentum. It comes from Newton's third law. During a collision the two objects push on each other with equal and opposite forces for the same length of time, so whatever momentum one loses, the other gains.

### Collisions

*Example:* a 2 kg trolley moving at 3 m/s hits a stationary 1 kg trolley, and they stick together.

1.  Momentum before: $(2 \\times 3) + (1 \\times 0) = 6$ kg m/s.
2.  Afterwards they move as one object of mass 3 kg at velocity $v$, so the momentum is $3v$.
3.  $3v = 6$, so $v = 2$ m/s.

Momentum is conserved whether the objects stick together or bounce apart. What differs is the kinetic energy: when objects stick together, some of it is transferred to other stores, such as heating and sound.

### Pushing apart

If two objects start at rest, their total momentum is zero. When they push each other apart it must still be zero, so they move in opposite directions with equal amounts of momentum. The lighter one moves faster.

*Example:* a 60 kg skater and an 80 kg skater push apart. If the lighter one moves at 4 m/s, then $60 \\times 4 = 80 \\times v$, so the heavier one moves at 3 m/s the other way.

### How a rocket works

A rocket is the same idea, kept going. The engine throws hot gas out of the back at very high speed. The gas gains momentum backwards, so the rocket gains an equal amount forwards. The rocket is not pushing against the ground or the air, which is why it works in empty space.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
`
  },

  // ─── STATISTICS & DATA ────────────────────────────────────────────────────────
  {
    id: 'statistics',
    category: 'mathematics',
    title: "Mean, Variance and Standard Deviation",
    subtitle: "Summarise a set of data by its average and by how spread out it is.",
    icon: 'Activity',
    accentColor: 'cyan',
    difficulty: 2,
    estimatedMinutes: 15,
    formula: '\\sigma = \\sqrt{\\frac{\\sum(x_i - \\mu)^2}{N}}',
    formulaLayout: [
      { type: 'variable', symbol: '\\sigma' },
      { type: 'static', latex: '^2' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [{ type: 'static', latex: '\\sum (x_i - \\mu)^2' }],
        denominator: [{ type: 'variable', symbol: 'N' }]
      }
    ],
    variables: [
      {
        symbol: '\\sigma',
        name: 'Standard Deviation',
        unit: 'Same unit as data',
        description: 'A measure of how spread out data values are around the mean. Small σ means data is tightly clustered; large σ means widely spread.',
        color: 'text-cyan-400'
      },
      {
        symbol: '\\mu',
        name: 'Mean (Average)',
        unit: 'Same unit as data',
        description: 'The arithmetic average of all data points: sum of all values divided by count.',
        color: 'text-teal-400'
      },
      {
        symbol: 'x_i',
        name: 'Individual Data Point',
        unit: 'Same unit as data',
        description: 'Each single measurement or value in the dataset.',
        color: 'text-sky-400'
      },
      {
        symbol: 'N',
        name: 'Number of Data Points',
        unit: 'Count',
        description: 'The total number of values in the dataset.',
        color: 'text-blue-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Measures of Central Tendency',
        content: 'The **mean** (average) $\\mu = \\frac{\\sum x_i}{N}$ finds the central value. The **median** is the middle value when sorted. The **mode** is the most frequent value. Each measure has different strengths depending on the data distribution.',
        keyInsight: 'Use median instead of mean when data has extreme outliers.',
        relatedVariables: ['\\mu', 'x_i', 'N']
      },
      {
        stepNumber: 2,
        title: 'Standard Deviation & Spread',
        content: 'Standard deviation $\\sigma$ measures how far data points typically stray from the mean. A dataset of sensor readings {100, 101, 99, 100} is much tighter than {50, 150, 80, 120} even if both have the same mean.',
        keyInsight: 'σ tells you the "typical distance" from the average.',
        relatedVariables: ['\\sigma', '\\mu', 'x_i']
      },
      {
        stepNumber: 3,
        title: 'The Normal Distribution',
        content: 'In a normal (bell curve) distribution, approximately 68% of data falls within ±1σ of the mean, 95% within ±2σ, and 99.7% within ±3σ. This is the famous empirical rule used in quality control, science, and AI model evaluation.',
        keyInsight: '68-95-99.7 rule: most data lies within 3 standard deviations of the mean.',
        relatedVariables: ['\\sigma', '\\mu']
      }
    ],
    solvedExample: {
      problem: 'Find the mean $\\mu$ and standard deviation $\\sigma$ for the dataset: $\\{2, 4, 4, 4, 5, 5, 7, 9\\}$.',
      steps: [
        'Calculate the mean: $\\mu = \\frac{2+4+4+4+5+5+7+9}{8} = \\frac{40}{8} = 5$.',
        'Calculate each squared deviation: $(2-5)^2=9$, $(4-5)^2=1$ (×3), $(5-5)^2=0$ (×2), $(7-5)^2=4$, $(9-5)^2=16$.',
        'Sum of squared deviations: $9 + 3 + 0 + 4 + 16 = 32$.',
        'Variance: $\\sigma^2 = \\frac{32}{8} = 4$.'
      ],
      resultFormula: '\\sigma = \\sqrt{4} = 2'
    },
    practiceProblems: [
      {
        question: 'A satellite sensor records temperatures: {-20, -18, -22, -19, -21}°C. What is the mean?',
        hint: 'Sum all values and divide by 5.',
        answer: '-20°C'
      },
      {
        question: 'Dataset A has σ = 0.1 and Dataset B has σ = 5. Which is more precise (consistent)?',
        hint: 'Lower standard deviation means tighter clustering around the mean.',
        answer: 'Dataset A — its values are much more consistent.'
      },
      {
        question: 'If the mean of 5 test scores is 80, and four scores are 75, 85, 90, 70, what is the fifth score?',
        hint: 'Total must be 5 × 80 = 400.',
        answer: '80'
      }
    ],
    realWorldConnection: 'Engineers use statistics to separate real signals from sensor noise. A reading several standard deviations from the mean is unlikely to be chance, so it is flagged for a closer look.',
    textbookContent: `
## Descriptive Statistics and Distributions

Statistics is the science of collecting, analysing, interpreting, and presenting data. In engineering and science, it is essential for understanding measurement uncertainty, signal processing, and model validation.

### Measures of Central Tendency

*   **Mean:** $\\mu = \\frac{1}{N} \\sum_{i=1}^{N} x_i$
*   **Median:** The middle value when data is sorted in ascending order.
*   **Mode:** The most frequently occurring value.

### Measures of Spread

*   **Variance:** $\\sigma^2 = \\frac{1}{N} \\sum_{i=1}^{N} (x_i - \\mu)^2$
*   **Standard Deviation:** $\\sigma = \\sqrt{\\sigma^2}$
*   **Range:** $x_{\\max} - x_{\\min}$

> **Note:** Population variance uses $1/N$. Sample variance uses $1/(N-1)$ (Bessel's correction).

### The Normal Distribution

$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

**The Empirical Rule (68-95-99.7):**

| Interval | % of Data |
|---|---|
| $\\mu \\pm 1\\sigma$ | ≈ 68.27% |
| $\\mu \\pm 2\\sigma$ | ≈ 95.45% |
| $\\mu \\pm 3\\sigma$ | ≈ 99.73% |

### Correlation vs. Causation

Two variables may be statistically correlated without one causing the other. Establishing causation requires controlled experiments.

### References

*   [The Art of Statistics](https://www.penguin.co.uk/books/294857/the-art-of-statistics-by-spiegelhalter-david/9780241258767) (David Spiegelhalter, Pelican)
*   [Statistics](https://www.amazon.co.uk/Statistics-4th-David-Freedman/dp/0393929728) (Freedman, Pisani & Purves, 4th ed.)
*   [Khan Academy: Statistics and Probability](https://www.khanacademy.org/math/statistics-probability)
    `
  },

  // ─── ELECTROMAGNETISM ─────────────────────────────────────────────────────────
  {
    id: 'electromagnetism',
    category: 'electronics',
    title: "Electromagnetic Induction and Faraday's Law",
    subtitle: "How a changing magnetic field produces a voltage in a coil.",
    icon: 'Cpu',
    accentColor: 'cyan',
    difficulty: 3,
    estimatedMinutes: 20,
    formula: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}',
    formulaLayout: [
      { type: 'variable', symbol: '\\mathcal{E}' },
      { type: 'operator', content: '=' },
      { type: 'static', latex: '-' },
      { type: 'variable', symbol: 'N' },
      {
        type: 'fraction',
        numerator: [{ type: 'static', latex: 'd\\Phi_B' }],
        denominator: [{ type: 'static', latex: 'dt' }]
      }
    ],
    variables: [
      {
        symbol: '\\mathcal{E}',
        name: 'Electromotive Force (EMF)',
        unit: 'Volts (V)',
        description: 'The voltage induced in a coil by a changing magnetic flux. The driving force behind electric generators and transformers.',
        color: 'text-cyan-400'
      },
      {
        symbol: 'N',
        name: 'Number of Turns',
        unit: 'Count',
        description: 'The number of loops in the coil. More turns amplify the induced EMF proportionally.',
        color: 'text-teal-400',
        range: { min: 1, max: 100, default: 10 }
      },
      {
        symbol: '\\Phi_B',
        name: 'Magnetic Flux',
        unit: 'Webers (Wb)',
        description: 'The total magnetic field passing through a surface: Φ_B = B·A·cos(θ).',
        color: 'text-sky-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Magnetic Fields',
        content: 'Moving electric charges create magnetic fields. A current-carrying wire produces a circular magnetic field around it. Bar magnets create dipole fields running from south to north pole internally, and north to south externally.',
        keyInsight: 'Electricity and magnetism are two faces of the same underlying force.',
        relatedVariables: ['\\Phi_B']
      },
      {
        stepNumber: 2,
        title: "Faraday's Law of Induction",
        content: "A changing magnetic flux through a coil induces an electromotive force (voltage). The faster the flux changes, the greater the induced EMF. This is the operating principle of every electric generator on Earth — from bicycle dynamos to nuclear power stations.",
        keyInsight: 'Change is key: a static field induces nothing; a changing field induces voltage.',
        relatedVariables: ['\\mathcal{E}', '\\Phi_B', 'N']
      },
      {
        stepNumber: 3,
        title: "Lenz's Law and the Negative Sign",
        content: "The negative sign in Faraday's law reflects Lenz's Law: the induced current flows in a direction that opposes the change in flux that created it. This is an expression of energy conservation — you must do work against the opposing force to move the magnet.",
        keyInsight: 'Induced currents always resist the change that caused them.',
        relatedVariables: ['\\mathcal{E}']
      }
    ],
    solvedExample: {
      problem: 'A coil with $N = 200$ turns experiences a change in magnetic flux from $\\Phi_B = 0.5$ Wb to $0.1$ Wb in $\\Delta t = 0.2$ s. Find the induced EMF.',
      steps: [
        'Rate of change: $\\frac{d\\Phi_B}{dt} = \\frac{0.1 - 0.5}{0.2} = \\frac{-0.4}{0.2} = -2$ Wb/s.',
        "Apply Faraday's Law: $\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}$.",
        'Substitute: $\\mathcal{E} = -200 \\times (-2)$.'
      ],
      resultFormula: '\\mathcal{E} = 400 \\text{ V}'
    },
    practiceProblems: [
      {
        question: 'If the number of turns N doubles but dΦ/dt stays constant, how does the induced EMF change?',
        hint: 'EMF is directly proportional to N.',
        answer: 'The EMF doubles.'
      },
      {
        question: 'A stationary magnet near a stationary coil: is any voltage induced?',
        hint: "Think about what Faraday's law requires.",
        answer: "No. Faraday's law requires a *changing* flux. Static fields produce no EMF."
      }
    ],
    realWorldConnection: "Every power station generator and every transformer on the electricity grid works by Faraday's law. So do wireless phone chargers, induction hobs and the pickups on an electric guitar.",
    textbookContent: `
## Faraday's Law of Electromagnetic Induction

Electromagnetic induction is the production of an electromotive force across an electrical conductor in a changing magnetic field. Independently discovered by Michael Faraday (1831) and Joseph Henry (1832).

### Magnetic Flux

$$\\Phi_B = \\iint_S \\vec{B} \\cdot d\\vec{A}$$

For a uniform field $B$ through flat area $A$ at angle $\\theta$ to the surface normal:
$$\\Phi_B = BA\\cos\\theta$$

The SI unit is the **Weber (Wb)**: $1 \\text{ Wb} = 1 \\text{ V}\\cdot\\text{s} = 1 \\text{ T}\\cdot\\text{m}^2$.

### Faraday's Law

For a single loop:
$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$

For a coil of $N$ turns:
$$\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}$$

### Lenz's Law

The negative sign encodes **Lenz's Law**: the induced emf drives a current whose magnetic field opposes the change in flux. This is a direct consequence of energy conservation.

### Maxwell's Equations

Faraday's Law in differential form (one of Maxwell's four equations):
$$\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$$

### Applications

*   **Generators:** Rotating a coil in a magnetic field continuously changes flux, generating AC power.
*   **Transformers:** Two coils share a core; changing flux in one induces emf in the other.
*   **Induction Charging:** Wireless charging pads use alternating magnetic fields to induce current.

### References

*   [Introduction to Electrodynamics, 4th ed.](https://www.cambridge.org/gb/universitypress/subjects/physics/electromagnetism-and-electrodynamics/introduction-electrodynamics-4th-edition) (David J. Griffiths, Cambridge)
*   [Feynman Lectures, Vol. II, Ch. 17: The Laws of Induction](https://www.feynmanlectures.caltech.edu/II_17.html)
*   [MIT OCW 8.02: Physics II — Electricity and Magnetism](https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/)
    `
  },

  // ─── QUANTUM BASICS ───────────────────────────────────────────────────────────
  {
    id: 'quantum',
    category: 'physics',
    title: "Photons and Quantum Physics",
    subtitle: "How light comes in packets called photons, and how to find the energy of one.",
    icon: 'Sparkles',
    accentColor: 'violet',
    difficulty: 4,
    estimatedMinutes: 25,
    formula: 'E = hf',
    formulaLayout: [
      { type: 'variable', symbol: 'E' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'h' },
      { type: 'variable', symbol: 'f' },
    ],
    variables: [
      {
        symbol: 'E',
        name: 'Photon Energy',
        unit: 'Joules (J) or eV',
        description: 'The discrete packet of energy carried by a single photon. Unlike classical waves, energy comes in indivisible chunks called quanta.',
        color: 'text-violet-400'
      },
      {
        symbol: 'h',
        name: "Planck's Constant",
        unit: 'J·s',
        description: 'A fundamental constant of nature: h ≈ 6.626 × 10⁻³⁴ J·s. It sets the scale of quantum effects — the minimum "grain size" of action in the universe.',
        color: 'text-purple-400'
      },
      {
        symbol: 'f',
        name: 'Frequency',
        unit: 'Hertz (Hz)',
        description: 'The frequency of the electromagnetic wave associated with the photon. Higher frequency (e.g. UV, X-rays) means more energetic photons.',
        color: 'text-indigo-400',
        range: { min: 1, max: 10, default: 5 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Planck and the Quantum',
        content: 'In 1900, Max Planck was trying to explain the spectrum of light given off by hot objects. Classical theory got it badly wrong: it predicted ever more energy at high frequencies, a failure later nicknamed the "ultraviolet catastrophe". Planck found a formula that matched the measurements by assuming energy is exchanged in discrete packets, or **quanta**, of size $E = hf$.',
        keyInsight: 'Energy is quantised — it exists in discrete chunks, not a continuous flow.',
        relatedVariables: ['E', 'h', 'f']
      },
      {
        stepNumber: 2,
        title: 'Wave-Particle Duality',
        content: "In 1905, Einstein used Planck's idea to explain the photoelectric effect: light behaves as particles (photons) when it hits a metal and ejects electrons. Yet light also exhibits wave interference. Matter itself — electrons, protons — also displays wave-like diffraction. This is wave-particle duality.",
        keyInsight: 'Light and matter are both waves AND particles, depending on how you observe them.',
        relatedVariables: ['E', 'f']
      },
      {
        stepNumber: 3,
        title: "Heisenberg's Uncertainty Principle",
        content: 'Werner Heisenberg showed that it is fundamentally impossible to simultaneously know both the exact position $x$ and exact momentum $p$ of a particle: $\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$. This is not a limitation of instruments — it is a fundamental property of the universe.',
        keyInsight: 'The more precisely you know position, the less precisely you can know momentum — and vice versa.',
        relatedVariables: ['h']
      }
    ],
    solvedExample: {
      problem: 'Calculate the energy of a photon of visible light with $f = 6.0 \\times 10^{14}$ Hz (green light).',
      steps: [
        'Use $E = hf$ with $h = 6.626 \\times 10^{-34}$ J·s.',
        'Substitute: $E = 6.626 \\times 10^{-34} \\times 6.0 \\times 10^{14}$.',
        'Multiply: $E = 6.626 \\times 6.0 \\times 10^{-20} = 39.756 \\times 10^{-20}$.'
      ],
      resultFormula: 'E \\approx 3.98 \\times 10^{-19} \\text{ J} \\approx 2.48 \\text{ eV}'
    },
    practiceProblems: [
      {
        question: 'A UV photon has twice the frequency of a green photon. How do their energies compare?',
        hint: 'E = hf. If f doubles, what happens to E?',
        answer: 'The UV photon has twice the energy.'
      },
      {
        question: 'Radio waves have frequencies around 10⁸ Hz. X-rays have frequencies around 10¹⁸ Hz. Which photons are more energetic, and by what factor?',
        hint: 'Compare the frequencies using E = hf.',
        answer: 'X-ray photons are 10¹⁰ (10 billion) times more energetic.'
      },
      {
        question: 'Why can UV light cause sunburn but visible light cannot, even at the same intensity?',
        hint: 'Think about individual photon energies, not total beam power.',
        answer: 'UV photons have higher individual energies (higher frequency) and can break chemical bonds in DNA molecules. Visible photons lack sufficient energy per quantum to do this, regardless of total beam intensity.'
      }
    ],
    realWorldConnection: 'Quantum mechanics underpins every semiconductor in your phone, spacecraft solar cells, GPS atomic clocks, and MRI scanners. Understanding quantisation is essential to all modern technology.',
    textbookContent: `
## Quantum Mechanics: Foundations

Quantum mechanics governs the behaviour of matter and energy at atomic and subatomic scales. It replaces deterministic classical mechanics with a probabilistic description.

### Planck's Quantum Hypothesis (1900)

Max Planck explained the spectrum of hot objects by postulating that electromagnetic oscillators emit or absorb energy only in discrete amounts:
$$E_n = nhf \\quad (n = 0, 1, 2, \\ldots)$$

where $h \\approx 6.626 \\times 10^{-34}$ J·s is **Planck's constant**.

### The Photoelectric Effect (Einstein, 1905)

Einstein proposed that light consists of discrete quanta (photons), each carrying energy $E = hf$. Above a threshold frequency $f_0$, electron kinetic energy scales linearly with frequency:
$$K_{\\max} = hf - \\phi$$
where $\\phi$ is the work function. Einstein won the 1921 Nobel Prize for this work.

### de Broglie Wavelength

All matter has an associated wavelength (de Broglie, 1924):
$$\\lambda = \\frac{h}{p} = \\frac{h}{mv}$$

Confirmed by the Davisson-Germer electron diffraction experiment (1927).

### The Heisenberg Uncertainty Principle

$$\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$$

where $\\hbar = h / (2\\pi)$ is the reduced Planck constant. Similarly: $\\Delta E \\cdot \\Delta t \\geq \\hbar / 2$.

### The Schrödinger Equation

$$i\\hbar \\frac{\\partial \\Psi}{\\partial t} = \\hat{H} \\Psi$$

The wavefunction $\\Psi$ gives the probability amplitude for finding the particle in a given state. The probability density is $|\\Psi|^2$.

### References

*   [Quantum Mechanics: The Theoretical Minimum](https://theoreticalminimum.com/courses/quantum-mechanics) (Leonard Susskind & Art Friedman)
*   [Feynman Lectures, Vol. III: Quantum Mechanics](https://www.feynmanlectures.caltech.edu/III_toc.html)
*   [Introduction to Quantum Mechanics, 3rd ed.](https://www.cambridge.org/core/books/introduction-to-quantum-mechanics/990799CA07A83FC5312402AF6860311E) (David J. Griffiths)
    `
  },
  {
    id: 'units',
    category: 'physics',
    title: "Converting Units",
    subtitle: 'Use prefixes and conversion factors to change the unit without changing the quantity.',
    icon: 'Activity',
    accentColor: 'cyan',
    difficulty: 1,
    estimatedMinutes: 15,
    formula: 'x_{\\text{base}} = x \\times 10^{n}',
    formulaLayout: [
      { type: 'variable', symbol: 'x_{\\text{base}}' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'x' },
      { type: 'operator', content: '\\times' },
      { type: 'variable', symbol: '10^{n}' }
    ],
    variables: [
      {
        symbol: 'x_{\\text{base}}',
        name: 'Value in the base unit',
        unit: 'e.g. m, A, Hz',
        description: 'The same quantity written with no prefix, ready to use in a formula.',
        color: 'text-cyan-400'
      },
      {
        symbol: 'x',
        name: 'Value with a prefix',
        unit: 'e.g. km, mA, MHz',
        description: 'The number as you were given it, in a unit that carries a prefix.',
        color: 'text-indigo-400'
      },
      {
        symbol: '10^{n}',
        name: 'Prefix factor',
        unit: 'power of ten',
        description: 'What the prefix stands for: kilo is 10³, milli is 10⁻³, mega is 10⁶ and so on.',
        color: 'text-amber-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Same Quantity, Different Number',
        content: 'A length of 2 km and a length of 2000 m are exactly the same distance. Converting units never changes the quantity; it changes the number and the unit together. A smaller unit needs a bigger number to describe the same thing.',
        keyInsight: 'Smaller unit, bigger number. Bigger unit, smaller number.',
        relatedVariables: ['x', 'x_{\\text{base}}']
      },
      {
        stepNumber: 2,
        title: 'Prefixes Are Powers of Ten',
        content: 'A prefix is shorthand for a power of ten: giga (G) is $10^9$, mega (M) is $10^6$, kilo (k) is $10^3$, centi (c) is $10^{-2}$, milli (m) is $10^{-3}$, micro (μ) is $10^{-6}$ and nano (n) is $10^{-9}$. To get to the base unit, replace the prefix with its power of ten: $20\\text{ mA} = 20 \\times 10^{-3}\\text{ A} = 0.02\\text{ A}$.',
        keyInsight: 'To reach the base unit, multiply by the prefix factor. To go back, divide by it.',
        relatedVariables: ['10^{n}']
      },
      {
        stepNumber: 3,
        title: 'Compound Units, One Unit at a Time',
        content: 'Units such as km/h are built from two units, so convert each one separately. For $72\\text{ km/h}$: the distance is $72\\text{ km} = 72\\,000\\text{ m}$ and the time is $1\\text{ h} = 3600\\text{ s}$, so the speed is $72\\,000 \\div 3600 = 20\\text{ m/s}$.',
        keyInsight: 'To change km/h into m/s, divide by 3.6. To change m/s into km/h, multiply by 3.6.',
        relatedVariables: ['x']
      },
      {
        stepNumber: 4,
        title: 'Areas and Volumes',
        content: 'Because $1\\text{ m} = 100\\text{ cm}$, a square metre is $100 \\times 100 = 10\\,000\\text{ cm}^2$ and a cubic metre is $100 \\times 100 \\times 100 = 1\\,000\\,000\\text{ cm}^3$. A common mistake is to use 100 for all three.',
        keyInsight: 'Square the length factor for an area and cube it for a volume.',
        relatedVariables: ['10^{n}']
      }
    ],
    solvedExample: {
      problem: 'A radio station broadcasts at $97.5$ MHz. Write this frequency in hertz, in standard form.',
      steps: [
        'Read the prefix: mega (M) means $10^6$.',
        'Replace the prefix with its power of ten: $97.5\\text{ MHz} = 97.5 \\times 10^6\\text{ Hz}$.',
        'Standard form needs a number between 1 and 10 at the front. Write $97.5$ as $9.75 \\times 10^1$.',
        'Combine the powers of ten: $9.75 \\times 10^1 \\times 10^6 = 9.75 \\times 10^7$.'
      ],
      resultFormula: '97.5\\text{ MHz} = 9.75 \\times 10^{7}\\text{ Hz}'
    },
    practiceProblems: [
      {
        question: 'Convert 450 mA to amperes.',
        hint: 'Milli means $10^{-3}$, so divide by 1000.',
        answer: '0.45 A'
      },
      {
        question: 'Convert 3.2 km to metres.',
        hint: 'Kilo means $10^3$, so multiply by 1000.',
        answer: '3200 m'
      },
      {
        question: 'A car travels at 90 km/h. What is its speed in m/s?',
        hint: 'Divide by 3.6, or convert 90 km to metres and 1 hour to seconds.',
        answer: '25 m/s'
      },
      {
        question: 'A cyclist travels at 15 m/s. What is this in km/h?',
        hint: 'Going from m/s to km/h, multiply by 3.6.',
        answer: '54 km/h'
      },
      {
        question: 'A tabletop has an area of 2 m². What is this in cm²?',
        hint: 'One square metre is $100 \\times 100$ square centimetres.',
        answer: '20 000 cm²'
      },
      {
        question: 'Red light has a wavelength of 650 nm. Write this in metres, in standard form.',
        hint: 'Nano means $10^{-9}$. Then move the decimal point so the number is between 1 and 10.',
        answer: '$6.5 \\times 10^{-7}$ m'
      }
    ],
    realWorldConnection: 'In 1999 NASA lost the Mars Climate Orbiter because of a unit mix-up. One team\'s software reported thruster impulse in pound-force seconds, and the navigation software expected newton seconds. Nobody converted, the spacecraft approached Mars far too low, and it was lost.',
    textbookContent: `
## Converting Units

Physics formulas only give the right answer if every quantity is in a consistent set of units, normally the SI base units. Converting first, then substituting, avoids most errors.

### SI Prefixes

| Prefix | Symbol | Factor | Example |
|---|---|---|---|
| giga | G | $10^{9}$ | 1 GW = 1 000 000 000 W |
| mega | M | $10^{6}$ | 1 MHz = 1 000 000 Hz |
| kilo | k | $10^{3}$ | 1 km = 1000 m |
| centi | c | $10^{-2}$ | 1 cm = 0.01 m |
| milli | m | $10^{-3}$ | 1 mA = 0.001 A |
| micro | μ | $10^{-6}$ | 1 μm = 0.000 001 m |
| nano | n | $10^{-9}$ | 1 nm = 0.000 000 001 m |

Take care with capital letters: m is milli but M is mega, a difference of a billion.

### Conversion Factors

A conversion factor is a fraction equal to 1, because its top and bottom are the same quantity in different units. Multiplying by it changes the units but not the quantity. Choose the fraction that cancels the unit you want to remove:

$$72\\ \\frac{\\text{km}}{\\text{h}} \\times \\frac{1000\\ \\text{m}}{1\\ \\text{km}} \\times \\frac{1\\ \\text{h}}{3600\\ \\text{s}} = 20\\ \\frac{\\text{m}}{\\text{s}}$$

The kilometres cancel, the hours cancel, and metres per second are left.

### Time

*   1 minute = 60 s
*   1 hour = 60 minutes = 3600 s
*   1 day = 24 hours = 86 400 s

### Area and Volume

Square the length factor for area and cube it for volume:

*   $1\\text{ m}^2 = 10^4\\text{ cm}^2$
*   $1\\text{ m}^3 = 10^6\\text{ cm}^3$
*   $1\\text{ litre} = 1000\\text{ cm}^3 = 10^{-3}\\text{ m}^3$

### Conversions That Are Not a Simple Multiplication

Temperature is the usual exception. To go from degrees Celsius to kelvin you add, you do not multiply:

$$T(\\text{K}) = T(^\\circ\\text{C}) + 273$$

### Useful Energy Conversions

*   $1\\text{ kWh} = 3.6 \\times 10^{6}\\text{ J}$, because 1 kW for 1 hour is 1000 W for 3600 s.
*   $1\\text{ eV} = 1.60 \\times 10^{-19}\\text{ J}$ (A-level).

### References

*   [BIPM: SI prefixes](https://www.bipm.org/en/measurement-units/si-prefixes)
*   [BBC Bitesize: GCSE Physics](https://www.bbc.co.uk/bitesize/subjects/zpm6fg8)
*   [NASA: Mars Climate Orbiter](https://science.nasa.gov/mission/mars-climate-orbiter/)
    `
  }
];
