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
    formula: 'F = \\frac{GMm}{r^2}',
    formulaLayout: [
      { type: 'variable', symbol: 'F' },
      { type: 'operator', content: '=' },
      {
        type: 'fraction',
        numerator: [
          { type: 'variable', symbol: 'G' },
          { type: 'variable', symbol: 'M' },
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
        symbol: 'F',
        name: 'Gravitational force',
        unit: 'newtons (N)',
        description: 'The pull between the two masses. It always attracts.',
        color: 'text-indigo-400'
      },
      {
        symbol: 'G',
        name: 'Gravitational constant',
        unit: 'N m² kg⁻²',
        description: 'A fixed number, $6.67 \\times 10^{-11}$, the same everywhere in the universe.',
        color: 'text-violet-400'
      },
      {
        symbol: 'M',
        name: 'Larger mass',
        unit: 'kilograms (kg)',
        description: 'Usually a planet or a star.',
        color: 'text-cyan-400',
        range: { min: 1, max: 10, default: 1 }
      },
      {
        symbol: 'm',
        name: 'Smaller mass',
        unit: 'kilograms (kg)',
        description: 'For example a satellite or a spacecraft.',
        color: 'text-sky-400'
      },
      {
        symbol: 'r',
        name: 'Distance between centres',
        unit: 'metres (m)',
        description: 'Measured from the centre of one mass to the centre of the other, not from the surface.',
        color: 'text-rose-400',
        range: { min: 1, max: 10, default: 2 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Every mass attracts every other mass',
        content: 'Any two masses pull on each other. The pull is bigger when either mass is bigger: the force is proportional to each mass.',
        keyInsight: 'Gravity only ever pulls. It never pushes masses apart.',
        relatedVariables: ['M', 'm']
      },
      {
        stepNumber: 2,
        title: 'The inverse square law',
        content: 'The force also depends on how far apart the centres of the masses are. Move twice as far from the centre of a planet and its pull falls to a quarter.',
        keyInsight: 'Gravity weakens with the square of the distance from the centre.',
        relatedVariables: ['r', 'F']
      },
      {
        stepNumber: 3,
        title: 'Orbiting is falling',
        content: 'A satellite in orbit is falling towards Earth the whole time, but it moves sideways so fast that the ground curves away beneath it as quickly as it falls. The speed needed for a circular orbit of radius $r$ is $v = \\sqrt{GM/r}$.',
        keyInsight: 'An orbit is a fall that never reaches the ground.',
        relatedVariables: ['F']
      },
      {
        stepNumber: 4,
        title: 'Field strength and weight',
        content: 'Field strength, $g$, is the pull of gravity on each kilogram. At Earth\'s surface it is 9.81 N/kg, so an object of mass $m$ has a weight of $W = mg$.',
        keyInsight: 'Weight is a force, in newtons. Mass is in kilograms.',
        relatedVariables: ['F', 'm']
      }
    ],
    solvedExample: {
      problem: 'Find the gravitational force between Earth ($M = 5.97 \\times 10^{24}$ kg) and a $1000$ kg satellite in a low orbit, $r = 6.7 \\times 10^6$ m from Earth\'s centre.',
      steps: [
        'Write down the constant: $G = 6.67 \\times 10^{-11}$ N m² kg⁻².',
        'Substitute into $F = \\dfrac{GMm}{r^2}$: $F = \\dfrac{6.67 \\times 10^{-11} \\times 5.97 \\times 10^{24} \\times 1000}{(6.7 \\times 10^6)^2}$.',
        'Work out the top and the bottom: $F = \\dfrac{3.98 \\times 10^{17}}{4.49 \\times 10^{13}}$.'
      ],
      resultFormula: 'F \\approx 8870 \\text{ N}'
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
    realWorldConnection: 'Mission planners use this law to work out how fast a spacecraft must travel to stay in orbit at any height.',
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

The force is always attractive. It follows an **inverse square law**: double the distance and the force falls to a quarter.

### Field strength around a planet

Dividing the force by $m$ gives the field strength at a distance $r$ from the centre of a mass $M$:

$$g = \\frac{GM}{r^2}$$

*Example:* at Earth's surface, with $M = 5.97 \\times 10^{24}$ kg and $r = 6.37 \\times 10^6$ m:

$$g = \\frac{6.67 \\times 10^{-11} \\times 5.97 \\times 10^{24}}{(6.37 \\times 10^6)^2} = 9.81 \\text{ N/kg}$$

At the height of the International Space Station, about 400 km up, $r = 6.77 \\times 10^6$ m and $g$ is still 8.7 N/kg. Gravity has hardly weakened, so why do astronauts float? Practice question 6 asks exactly that.

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

### Next on the journey

You can now work out how fast a satellite must move to stay in a circular orbit. How does a spacecraft climb to a higher one? That is the next lesson.

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
        keyInsight: 'Violet and blue light slow down slightly more in glass than red light, so they bend more.',
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
        question: "What happens to the speed of light when it passes from air into glass?",
        hint: "Glass is a denser material for light than air.",
        answer: "It slows down."
      },
      {
        question: "Light enters a glass block at an angle. Does it bend towards or away from the normal?",
        hint: "Light that slows down bends towards the normal.",
        answer: "Towards the normal."
      },
      {
        question: "Light leaves a glass block into air at an angle. Does it bend towards or away from the normal?",
        hint: "It speeds up as it leaves the glass.",
        answer: "Away from the normal."
      },
      {
        question: "A ray of light meets a glass block along the normal (at 90° to the surface). What happens to its direction?",
        hint: "Think about which side of the ray reaches the glass first.",
        answer: "It does not change direction, although it still slows down."
      },
      {
        question: "Why does a prism split white light into colours?",
        hint: "Different colours travel at slightly different speeds in glass.",
        answer: "Each colour is refracted by a different amount: violet slows the most and bends the most, red the least. So the colours spread out into a spectrum."
      },
      {
        question: "Going further: light passes from air (n = 1.0) into water (n = 1.33) at 45° to the normal. Find the angle of refraction.",
        hint: "Use $n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2$.",
        answer: "About 32.1°"
      },
    ],
    realWorldConnection: 'Spectrometers use prisms or diffraction gratings to analyse the light from distant stars, revealing their chemical composition.',
    textbookContent: `
## Refraction

When light passes from one material into another, such as from air into glass or water, it can change direction. This is called **refraction**.

### Why light bends

Light travels at different speeds in different materials. It is fastest in a vacuum, almost as fast in air, slower in water and slower still in glass.

Picture a line of people walking side by side from a pavement onto sand at an angle. The people who reach the sand first slow down first, so the whole line swings round. Light does the same when one side of a beam reaches the slower material first.

### Rays and the normal

We draw light as **rays**: straight lines with arrows. The **normal** is a line drawn at right angles to the surface where the ray meets it. Angles are measured from the normal.

*   Light that **slows down** (air into glass) bends **towards** the normal.
*   Light that **speeds up** (glass into air) bends **away** from the normal.
*   Light that meets the surface **along** the normal does not change direction, although it still changes speed.

### Lenses

A convex lens is thicker in the middle. Light passing through it is refracted towards the middle, so parallel rays are brought together at a point called the focus. The lens in your eye focuses light onto the back of the eye in this way, and so do the lenses in cameras and telescopes.

### Colours and prisms

White light is a mixture of colours. Each colour has a different frequency: red has the lowest frequency of visible light and violet the highest.

In glass, violet light slows down slightly more than red light, so it is refracted slightly more. A triangular **prism** therefore spreads white light out into a band of colours called a **spectrum**: red, orange, yellow, green, blue, indigo and violet. This spreading is called **dispersion**.

### Absorbed, transmitted, reflected

Materials treat different wavelengths of light differently. They may absorb some, let some through (transmit) and reflect some. Glass transmits visible light but absorbs much of the ultraviolet. A red filter transmits red light and absorbs the other colours.

### Going further: Snell's law

The Department for Education content describes refraction in words. Some specifications also ask you to calculate angles using **Snell's law**:

$$n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2$$

Here $n$ is the **refractive index** of each material (how many times slower light travels in it than in a vacuum) and $\\theta$ is the angle to the normal. Light entering glass ($n_2 = 1.5$) from air ($n_1 = 1.0$) at $30°$:

1.  $1.0 \\times \\sin 30° = 1.5 \\times \\sin \\theta_2$
2.  $\\sin \\theta_2 = \\dfrac{0.5}{1.5} = 0.333$
3.  $\\theta_2 = \\sin^{-1}(0.333) \\approx 19.5°$

### Reading starlight

Astronomers pass starlight through a prism or a similar device to spread it into a spectrum. Dark lines in the spectrum show which colours the gases in a star have absorbed, and that tells us what the star is made of, without anyone ever going there.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study) (Department for Education)
*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
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
        name: 'Gear ratio',
        unit: 'no unit',
        description: 'Teeth on the driven gear divided by teeth on the driver gear.',
        color: 'text-amber-400',
        range: { min: 1, max: 5, default: 2 }
      },
      {
        symbol: 'N_{\\text{driven}}',
        name: 'Teeth on the driven gear',
        unit: 'teeth',
        description: 'The gear that is turned by the other one.',
        color: 'text-orange-400'
      },
      {
        symbol: 'N_{\\text{driver}}',
        name: 'Teeth on the driver gear',
        unit: 'teeth',
        description: 'The gear turned by the motor, the pedals or your hand.',
        color: 'text-yellow-400'
      },
      {
        symbol: '\\omega_{\\text{driver}}',
        name: 'Speed of the driver gear',
        unit: 'turns per minute',
        description: 'How many times the driver gear goes round each minute.',
        color: 'text-rose-400'
      },
      {
        symbol: '\\omega_{\\text{driven}}',
        name: 'Speed of the driven gear',
        unit: 'turns per minute',
        description: 'How many times the driven gear goes round each minute.',
        color: 'text-red-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Meshing gears pass on a turning effect',
        content: 'A gear is a wheel with teeth around its edge. When two gears mesh and the driver gear turns, its teeth push on the teeth of the driven gear, so the turning effect passes from one shaft to the next.',
        keyInsight: 'The driver gear pushes; the driven gear is pushed.',
        relatedVariables: ['\\text{Ratio}']
      },
      {
        stepNumber: 2,
        title: 'The gear ratio',
        content: 'The gear ratio is the number of teeth on the driven gear divided by the number on the driver gear. A 10-tooth gear driving a 40-tooth gear has a ratio of 4, so the driven gear turns once for every four turns of the driver.',
        keyInsight: 'A ratio bigger than 1 means the driven gear turns more slowly than the driver.',
        relatedVariables: ['N_{\\text{driven}}', 'N_{\\text{driver}}']
      },
      {
        stepNumber: 3,
        title: 'Speed or turning force, not both',
        content: 'The turning effect of a force is its moment: the force times its distance from the pivot, measured at right angles to the force, in newton metres (N m). When a small gear drives a large one, the large gear turns more slowly but with a larger moment.',
        keyInsight: 'Slower but stronger, or faster but weaker.',
        relatedVariables: ['\\omega_{\\text{driver}}', '\\omega_{\\text{driven}}']
      }
    ],
    solvedExample: {
      problem: 'A motor turns a 12-tooth gear 90 times a minute with a moment of 5 N m. It drives a 36-tooth gear. How fast does the driven gear turn, and with what moment?',
      steps: [
        'Gear ratio: $\\dfrac{36}{12} = 3$.',
        'Speed of the driven gear: $90 \\div 3 = 30$ turns per minute.',
        'Moment on the driven gear: $5 \\times 3 = 15$ N m.'
      ],
      resultFormula: '30 \\text{ turns per minute, with a moment of } 15 \\text{ N m}'
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
    realWorldConnection: 'Each wheel of a Mars rover is driven by a small electric motor through gears, so the wheel turns slowly but with a large moment, enough to climb over rocks.',
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
*   Two meshing gears with teeth on the outside turn in opposite directions.

### Gear ratio

$$\\text{gear ratio} = \\frac{\\text{teeth on the driven gear}}{\\text{teeth on the driver gear}}$$

The **driver** is the gear being turned by the motor or the pedals. The **driven** gear is the one it turns.

If there is no friction:

*   speed of the driven gear = speed of the driver ÷ gear ratio
*   moment on the driven gear = moment on the driver × gear ratio

### You cannot get something for nothing

A gear ratio bigger than 1 gives a larger moment but a slower turn. A ratio smaller than 1 gives a faster turn but a smaller moment. Gears never give more of both. A simple machine can make a force bigger only by making the movement smaller.

### Where gears matter

A bicycle's low gear lets you climb a hill with less push on the pedals, in exchange for more turns of them. Engineers use the same trade wherever a small motor has to move something heavy, such as a car's gearbox.

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
        name: 'Semi-major axis',
        unit: 'kilometres (km) or metres (m)',
        description: 'Half the length of the transfer ellipse, measured along its longest line.',
        color: 'text-amber-400'
      },
      {
        symbol: 'r_1',
        name: 'Radius of the starting orbit',
        unit: 'kilometres (km) or metres (m)',
        description: 'Measured from the centre of Earth.',
        color: 'text-orange-400'
      },
      {
        symbol: 'r_2',
        name: 'Radius of the target orbit',
        unit: 'kilometres (km) or metres (m)',
        description: 'Also measured from the centre of Earth.',
        color: 'text-yellow-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Changing orbit takes two burns',
        content: 'To climb to a higher circular orbit, a spacecraft usually makes two short engine burns, with a long coast in between. This is called a Hohmann transfer.',
        keyInsight: 'Speed up, coast, then speed up again.',
        relatedVariables: []
      },
      {
        stepNumber: 2,
        title: 'The transfer ellipse',
        content: 'The first burn speeds the spacecraft up, so it climbs away along an ellipse, a stretched circle. The ellipse touches the starting orbit at its lowest point and the target orbit at its highest.',
        keyInsight: 'The semi-major axis of the ellipse is the average of the two orbit radii.',
        relatedVariables: ['a', 'r_1', 'r_2']
      },
      {
        stepNumber: 3,
        title: 'The second burn',
        content: 'At the top of the ellipse the spacecraft is moving too slowly for a circular orbit at that height. The second burn speeds it up to the right speed. Remember from gravity that lower orbits are faster: $v = \\sqrt{GM/r}$.',
        keyInsight: 'Without the second burn, the spacecraft swings back down to where it started.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'A spacecraft is to move from a low orbit of radius 6,700 km to geostationary orbit, of radius 42,000 km (about 36,000 km above the ground), where a satellite stays above one spot on the equator. Find the semi-major axis of the transfer ellipse.',
      steps: [
        'Add the radii: $6{,}700 + 42{,}000 = 48{,}700$ km.',
        'Halve the total: $a = 48{,}700 \\div 2$.'
      ],
      resultFormula: 'a = 24{,}350 \\text{ km}'
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
    realWorldConnection: 'Many communications satellites are launched onto a transfer ellipse like this one, then fire their own engine at its highest point to settle into geostationary orbit.',
    textbookContent: `
## Changing orbit

### Speed in a circular orbit

For a satellite in a circular orbit, gravity supplies the force for circular motion (see [Gravity and Newton's Law of Gravitation](/study/gravity)):

$$\\frac{GMm}{r^2} = \\frac{mv^2}{r} \\qquad \\text{so} \\qquad v = \\sqrt{\\frac{GM}{r}}$$

The higher the orbit, the slower the satellite. For Earth, $GM = 3.986 \\times 10^{14}$ m³ s⁻², or $3.986 \\times 10^5$ km³ s⁻² if you work in kilometres.

The time for one orbit is the distance round divided by the speed:

$$T = \\frac{2\\pi r}{v} = 2\\pi\\sqrt{\\frac{r^3}{GM}}$$

### The problem

A spacecraft in a low orbit cannot simply point at a higher orbit and fire its engine. Whatever it does, it keeps orbiting. Usually the most economical way to climb between two circular orbits is the **Hohmann transfer**, which uses two short engine burns.

1.  **Burn 1.** The spacecraft speeds up. It is now moving too fast for its circular orbit, so it climbs away along an ellipse.
2.  **Coast.** It travels half way round that ellipse, slowing down as it climbs, until it reaches the height of the target orbit.
3.  **Burn 2.** At the top it is moving too slowly for a circular orbit at that height, so it speeds up again to match the circular speed of the new orbit.

### The transfer ellipse

The ellipse just touches the inner orbit at its lowest point and the outer orbit at its highest. If the two orbits have radii $r_1$ and $r_2$, the ellipse is $r_1 + r_2$ long from end to end. Half of that is its **semi-major axis**:

$$a = \\frac{r_1 + r_2}{2}$$

### Going further: speeds and timing

These results are not in the required A-level content. They follow from the conservation of energy.

The speed at a distance $r$ from Earth's centre, on an ellipse of semi-major axis $a$, is given by:

$$v^2 = GM\\left(\\frac{2}{r} - \\frac{1}{a}\\right)$$

The transfer takes half the period of the ellipse:

$$t = \\pi\\sqrt{\\frac{a^3}{GM}}$$

For a transfer from 300 km above the ground to geostationary orbit, burn 1 adds about 2.4 km/s, burn 2 adds about 1.5 km/s, and the coast takes about 5 hours 15 minutes.

### Faster twice, yet slower

The spacecraft speeds up at both burns, but ends up moving more slowly than when it started: about 3.1 km/s in geostationary orbit against 7.7 km/s in the low one. The energy from the engine has gone into raising the spacecraft against gravity, not into keeping it fast.

### Next on the journey

That completes the climb to orbit. The next mission, Navigate, is about finding your way once you are up there, starting with trigonometry.

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
        unit: 'amperes (A)',
        description: 'The rate at which electric charge flows round the circuit.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'V',
        name: 'Potential difference',
        unit: 'volts (V)',
        description: 'Often called voltage. It is what drives the charge round the circuit.',
        color: 'text-teal-400'
      },
      {
        symbol: 'R',
        name: 'Resistance',
        unit: 'ohms (Ω)',
        description: 'How hard it is for the current to flow through a component.',
        color: 'text-lime-400',
        range: { min: 10, max: 1000, default: 100 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Potential difference drives the current',
        content: 'A battery provides a potential difference. It drives charge round the circuit, but only if the circuit is a complete loop with no gaps. Around a single loop, the current is the same everywhere.',
        keyInsight: 'No potential difference, or a gap in the circuit, means no current.',
        relatedVariables: ['V', 'I']
      },
      {
        stepNumber: 2,
        title: 'Resistance limits the current',
        content: 'Every component and wire has some resistance. With the same potential difference across it, a component with more resistance lets less current through. Resistors are often added to a circuit to keep the current low enough for a delicate component such as an LED.',
        keyInsight: 'More resistance means less current for the same potential difference.',
        relatedVariables: ['R', 'I']
      },
      {
        stepNumber: 3,
        title: 'How the three are linked',
        content: 'The three are linked by $V = IR$, which rearranges to $I = \\dfrac{V}{R}$ and $R = \\dfrac{V}{I}$. For a fixed resistor at a steady temperature the resistance stays the same, so doubling the potential difference doubles the current. For some components, such as a filament lamp, the resistance changes as the current changes.',
        keyInsight: 'Resistance is the ratio of potential difference to current: $R = V \\div I$.',
        relatedVariables: ['I', 'V', 'R']
      }
    ],
    solvedExample: {
      problem: 'A $150$ Ω resistor is connected to a $12$ V battery. Find the current through it.',
      steps: [
        'Use $I = \\dfrac{V}{R}$.',
        'Substitute: $I = \\dfrac{12}{150}$.',
        'Work it out: $I = 0.08$ A. A milliampere (mA) is a thousandth of an ampere, so this is $80$ mA.'
      ],
      resultFormula: 'I = 0.08 \\text{ A, or } 80 \\text{ mA}'
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
    realWorldConnection: 'A spacecraft runs on electricity from its solar panels and batteries. Engineers use these relationships to work out the current each part will draw, and to choose wires and fuses that can carry it.',
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

Power is measured in watts (W). A spacecraft's heaters are resistors chosen to transfer a known amount of electrical power to heating.

### Next on the journey

The spacecraft now has power. But how does it send word home across millions of kilometres of space? It sends waves, the subject of the next lesson.

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
        unit: 'metres (m)',
        description: 'The distance from one point on a wave to the same point on the next one, for example from crest to crest.',
        color: 'text-emerald-400'
      },
      {
        symbol: 'v',
        name: 'Wave speed',
        unit: 'm/s',
        description: 'How fast the wave travels. It is set by what the wave travels through. Radio waves and light travel at $3.0 \\times 10^8$ m/s in space.',
        color: 'text-teal-400'
      },
      {
        symbol: 'f',
        name: 'Frequency',
        unit: 'hertz (Hz)',
        description: 'The number of complete waves passing a point each second.',
        color: 'text-lime-400',
        range: { min: 1, max: 10, default: 2 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'What a wave is',
        content: 'A wave carries energy and information from place to place. The water, air or rope it passes through only moves back and forth about where it started. Frequency counts how many waves pass each second; the period, $T = \\dfrac{1}{f}$, is how long one wave takes.',
        keyInsight: 'The wave moves on, but the material it passes through stays where it is.',
        relatedVariables: ['f']
      },
      {
        stepNumber: 2,
        title: 'The wave equation',
        content: 'Each second, $f$ waves pass a point, and each one is $\\lambda$ long. So in one second the wave travels $f \\times \\lambda$: that is its speed, $v = f\\lambda$.',
        keyInsight: 'Wave speed = frequency × wavelength.',
        relatedVariables: ['v', 'f', '\\lambda']
      },
      {
        stepNumber: 3,
        title: 'Higher frequency, shorter wavelength',
        content: 'Radio waves of every frequency travel through space at the same speed. Sound of every pitch travels through air at the same speed. When the speed stays the same, doubling the frequency halves the wavelength.',
        keyInsight: 'At a fixed speed, high frequency means short wavelength and low frequency means long wavelength.',
        relatedVariables: ['\\lambda', 'f']
      }
    ],
    solvedExample: {
      problem: 'A radio station broadcasts at $100$ MHz. Taking the speed of radio waves as $3.0 \\times 10^8$ m/s, what is the wavelength?',
      steps: [
        'Write the frequency in hertz: $100\\text{ MHz} = 100 \\times 10^6\\text{ Hz} = 1.0 \\times 10^8\\text{ Hz}$ (see [Converting Units](/study/units)).',
        'Use $\\lambda = \\dfrac{v}{f}$.',
        'Substitute: $\\lambda = \\dfrac{3.0 \\times 10^8}{1.0 \\times 10^8}$.'
      ],
      resultFormula: '\\lambda = 3.0 \\text{ m}'
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
    realWorldConnection: "NASA's Deep Space Network keeps in touch with distant spacecraft, such as Voyager 1, using radio dishes up to 70 metres across in California, Spain and Australia. Radio waves need nothing to travel through, so the signals cross billions of kilometres of empty space.",
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

The speed is set by what the wave is travelling through. For sound in air, and for radio waves and light in space, the speed is the same whatever the frequency, so a higher frequency means a shorter wavelength.

### Transverse and longitudinal waves

*   In a **transverse** wave the vibrations are at right angles to the direction the wave travels. Ripples on water are transverse, and so are light and radio waves.
*   In a **longitudinal** wave the vibrations are along the direction the wave travels. Sound in air is longitudinal: the air is squashed together and stretched apart as the wave passes.

### Waves and spacecraft

Radio waves and light are electromagnetic waves. They need nothing to travel through, which is why a spacecraft can send signals across empty space. Sound cannot make that journey, because it needs particles to pass the vibration along.

Every radio wave travels at the same speed in space, so the frequency a spacecraft uses fixes the wavelength of its signal, and the wavelength decides how its antenna has to be built.

### Next on the journey

A radio wave can carry a message home, but how is the message written? Spacecraft send everything as a long string of 1s and 0s. That is the next lesson.

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
        question: "Write two fractions that are equivalent to 2/3.",
        hint: "Multiply the top and the bottom by the same number.",
        answer: "For example 4/6 and 6/9 (any fraction where the bottom is 1½ times the top)"
      },
      {
        question: "Write 3/10 as a number of hundredths.",
        hint: "Multiply the top and bottom by 10.",
        answer: "30/100"
      },
      {
        question: "Write 12/16 in its simplest form.",
        hint: "Find the biggest number that divides into both 12 and 16.",
        answer: "3/4 (divide both by 4)"
      },
      {
        question: "A satellite has a mass of 500 kg. One fifth of it is scientific instruments. What is the mass of the instruments?",
        hint: "Divide 500 into 5 equal parts.",
        answer: "100 kg"
      },
      {
        question: "A lander has a mass of 800 kg, and 200 kg of that is fuel. What fraction of the lander is fuel?",
        hint: "Write the part over the whole, then simplify.",
        answer: "200/800 = 1/4"
      },
      {
        question: "What is 3/4 of 60?",
        hint: "Find 1/4 of 60 first, then multiply by 3.",
        answer: "45"
      },
    ],
    realWorldConnection: 'Rocket engineers describe a rocket in fractions of its mass: how much is fuel, how much is the rocket itself and how much is the spacecraft it carries.',
    textbookContent: `
## What a fraction means

A fraction describes part of a whole that has been split into **equal** parts.

$\\dfrac{3}{4}$

*   The bottom number, the **denominator**, says how many equal parts the whole is split into: 4.
*   The top number, the **numerator**, says how many of those parts you have: 3.

### Equivalent fractions

Different fractions can describe the same amount. Half a pizza is the same as two quarters or four eighths:

$\\dfrac{1}{2} = \\dfrac{2}{4} = \\dfrac{4}{8} = \\dfrac{50}{100}$

These are **equivalent fractions**. To make one, multiply or divide the top and the bottom by the same number. The size of the fraction does not change.

### Tenths and hundredths

Tenths and hundredths link fractions to decimals and percentages. Multiply the top and bottom by 10 to turn tenths into hundredths:

*   $\\dfrac{3}{10} = \\dfrac{30}{100}$
*   $\\dfrac{7}{10} = \\dfrac{70}{100}$

Some other fractions can be turned into hundredths too: $\\dfrac{1}{4} = \\dfrac{25}{100}$ and $\\dfrac{1}{5} = \\dfrac{20}{100}$.

### Simplest form

A fraction is in its **simplest form** when no number except 1 divides into both the top and the bottom. To simplify, divide both by the biggest number that goes into each:

$\\dfrac{12}{16} = \\dfrac{3}{4}$ (dividing both by 4)

### One amount as a fraction of another

To say what fraction one amount is of another, put the part over the whole and simplify. A lander of 800 kg carrying 200 kg of fuel is

$\\dfrac{200}{800} = \\dfrac{1}{4}$ fuel.

In key stage 3 you will also write fractions bigger than 1 this way. A 15 m rocket next to a 10 m one is $\\dfrac{15}{10} = \\dfrac{3}{2}$ times as tall.

### A fraction of an amount

To find a fraction of an amount, divide by the bottom number, then multiply by the top number. For $\\dfrac{3}{5}$ of 500 kg:

1.  $500 \\div 5 = 100$, so one fifth is 100 kg.
2.  $100 \\times 3 = 300$, so three fifths is 300 kg.

### Rockets are mostly fuel

A large rocket on the launch pad is mostly fuel. Often more than four fifths of its mass is fuel, and only a small fraction is the spacecraft it is launching. Engineers talk about rockets in fractions like this all the time.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        name: 'Bit (binary digit)',
        unit: '0 or 1',
        description: 'One digit of a binary number. Counting from the right and starting at 0, the bit in place $i$ is worth $2^i$ if it is a 1, and nothing if it is a 0.',
        color: 'text-emerald-400'
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Only two digits',
        content: 'Binary numbers are written with just two digits, 0 and 1. Each one is called a bit. A computer can store a bit in anything that has two states, such as a tiny switch that is off (0) or on (1).',
        keyInsight: 'Two states are easy to build and hard to mix up, which is why computers use binary.',
        relatedVariables: ['b_i']
      },
      {
        stepNumber: 2,
        title: 'Place values double',
        content: 'In our everyday denary numbers (base 10, also called decimal), each place is worth ten times the place to its right. In binary each place is worth two times the place to its right: 1, 2, 4, 8, 16 and so on, which are the powers of 2.',
        keyInsight: 'Read a binary number by adding the place values that hold a 1.',
        relatedVariables: ['b_i']
      }
    ],
    solvedExample: {
      problem: 'Convert the binary number $10110$ to denary.',
      steps: [
        'Write the place values over the bits, from the right: $1, 2, 4, 8, 16$.',
        'The 1s are in the 16s, 4s and 2s places.',
        'Add those place values: $16 + 4 + 2 = 22$.'
      ],
      resultFormula: '10110 \\text{ in binary} = 22 \\text{ in denary}'
    },
    practiceProblems: [
      {
        question: "What is the binary number 100 in denary?",
        hint: "The place values from the right are 1, 2 and 4.",
        answer: "4"
      },
      {
        question: "What is the binary number 1011 in denary?",
        hint: "Add the place values where there is a 1: 8, 2 and 1.",
        answer: "11"
      },
      {
        question: "Write 13 in binary.",
        hint: "Take away the biggest powers of 2 that fit: 8, then 4, then 1.",
        answer: "1101"
      },
      {
        question: "Write 25 in binary.",
        hint: "25 = 16 + 8 + 1.",
        answer: "11001"
      },
      {
        question: "Add the binary numbers 101 and 11.",
        hint: "1 + 1 = 10 in binary: write 0 and carry 1.",
        answer: "1000 (5 + 3 = 8)"
      },
      {
        question: "Add the binary numbers 1101 and 111.",
        hint: "Work from the right, carrying as you go. Check by converting to denary.",
        answer: "10100 (13 + 7 = 20)"
      },
    ],
    realWorldConnection: 'Every command sent up to a spacecraft, and every reading and photo it sends back, travels as a stream of 0s and 1s.',
    textbookContent: `
## Binary numbers

Computers store everything as **binary**: numbers written with only two digits, 0 and 1. A 0 or a 1 is called a **bit**. Inside a computer each bit is held by something with two states, like a tiny switch that is either off (0) or on (1).

### Place values

Our everyday numbers are **denary** (base 10, also called decimal). Each place is worth ten times the place to its right: ones, tens, hundreds.

In binary each place is worth **two** times the place to its right:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- | --- |

Eight bits make a **byte**, which can hold any whole number from 0 to 255.

### Binary to denary

Add up the place values where there is a 1, and ignore the places with a 0. The worked example does this for $10110$.

### Denary to binary

Take away the biggest place value that fits, write a 1 there, and repeat with what is left. Write a 0 in every place that does not fit. For 19:

1.  16 fits into 19: write 1 in the 16s place, leaving 3.
2.  8 does not fit into 3: write 0 in the 8s place.
3.  4 does not fit into 3: write 0 in the 4s place.
4.  2 fits into 3: write 1 in the 2s place, leaving 1.
5.  1 fits: write 1 in the 1s place, leaving 0.

So $19 = 10011$ in binary.

### Adding in binary

Add column by column from the right, as in denary, but remember:

*   $0 + 0 = 0$
*   $0 + 1 = 1$
*   $1 + 1 = 10$: write 0 and carry 1
*   $1 + 1 + 1 = 11$: write 1 and carry 1

For $110 + 11$: the right column is $0 + 1 = 1$; the middle column is $1 + 1 = 10$ (write 0, carry 1); the left column is $1 + 0 + 1 = 10$ (write 0, carry 1), and the carried 1 goes in a new place on the left. The answer is $1001$. Check in denary: $6 + 3 = 9$.

### Pictures from Mars

Every photo a Mars rover takes is stored as numbers that give the brightness of each tiny dot in the picture. Those numbers are sent to Earth by radio as a long stream of 0s and 1s, usually passed on by a spacecraft orbiting Mars. Back on Earth, computers turn the bits back into numbers and the numbers back into a picture.

### Next on the journey

A spacecraft far from Earth cannot be repaired. If its computer fails, the stream of bits stops. How likely is that, and how do engineers make it less likely? That is the next lesson, on probability.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: computing programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study) (Department for Education)
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
        question: "If position is $s = 4t^3$, find the velocity $v$.",
        hint: "Differentiate: multiply by the power, then take 1 off the power.",
        answer: "$v = 12t^2$"
      },
      {
        question: "If velocity is $v = 20t$, what is the acceleration?",
        hint: "Differentiate the velocity.",
        answer: "$20$ m/s², at every time"
      },
      {
        question: "A probe's position is $s = 5t^2 + 10t$ metres. Find its acceleration.",
        hint: "Differentiate twice.",
        answer: "$10$ m/s²"
      },
      {
        question: "Find the gradient of the curve $y = x^2$ at the point where $x = 3$.",
        hint: "Differentiate, then substitute $x = 3$.",
        answer: "6"
      },
      {
        question: "Show that the chord of $y = x^2$ from $x = 3$ to $x = 3 + h$ has gradient $6 + h$, and say what happens as $h \\to 0$.",
        hint: "Gradient = change in $y$ ÷ change in $x$, and $(3 + h)^2 = 9 + 6h + h^2$.",
        answer: "$\\frac{9 + 6h + h^2 - 9}{h} = 6 + h$, which tends to 6: the gradient of the tangent."
      },
      {
        question: "A rover's velocity is $v = 3t^2 + 2$ m/s. How far does it travel between $t = 0$ and $t = 2$ s?",
        hint: "Integrate the velocity between the limits.",
        answer: "12 m ($\\left[t^3 + 2t\\right]_0^2 = 8 + 4$)"
      },
    ],
    realWorldConnection: 'Orbital mechanics heavily utilises differential equations (calculus) to predict the future positions of planets, moons, and artificial satellites over time.',
    textbookContent: `
## Differentiation and rates of change

### Gradient of a curve

The gradient of a straight line is the same everywhere. A curve's gradient changes as you move along it. The gradient at a point is the gradient of the **tangent** there: the straight line that just touches the curve at that point.

### The gradient as a limit

To find the gradient of $y = x^2$ at $x = 3$, take a nearby point at $x = 3 + h$. The **chord** between them has gradient

$$\\frac{(3 + h)^2 - 3^2}{h} = \\frac{6h + h^2}{h} = 6 + h$$

As $h$ gets smaller, the chord gets closer to the tangent, and its gradient gets closer to 6. The gradient of the tangent is the **limit** of the chord's gradient as $h \\to 0$. Doing this for a general point is called **differentiation from first principles**.

### The derivative

The result is the **derivative**, written $\\dfrac{dy}{dx}$ or $f'(x)$. It gives the gradient at any point and tells you how fast $y$ is changing compared with $x$: a **rate of change**.

For powers of $x$:

$$y = x^n \\quad \\Rightarrow \\quad \\frac{dy}{dx} = nx^{n-1}$$

Multiply by the power, then take one off the power. Constants multiply through, and terms are differentiated one at a time: if $y = 5x^2 + 10x$, then $\\dfrac{dy}{dx} = 10x + 10$.

### Motion in a straight line

For an object moving along a line with displacement $s$ at time $t$:

*   velocity is the rate of change of displacement: $v = \\dfrac{ds}{dt}$
*   acceleration is the rate of change of velocity: $a = \\dfrac{dv}{dt}$

Going the other way, **integrate**: displacement is the integral of velocity, and velocity is the integral of acceleration.

### Worked example

A probe's distance from a moon is $s = 5t^2 + 10t$ metres. Find its velocity at $t = 3$ s.

1.  $v = \\dfrac{ds}{dt} = 10t + 10$
2.  $v(3) = 10 \\times 3 + 10 = 40$ m/s
3.  The acceleration is $a = \\dfrac{dv}{dt} = 10$ m/s², the same at every moment.

### Rockets and changing motion

A rocket's speed changes every instant as it burns fuel. Flight computers do not use one average speed. They track the rate of change of position and velocity moment by moment, which is exactly what derivatives describe.

### Sources

The topics in these notes follow the Department for Education document below.

*   [GCE AS and A level subject content for mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics) (Department for Education)
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
        title: "Adding Vectors",
        content: "To add two vectors, draw them tip to tail: the second starts where the first ends. The resultant goes from the start of the first to the end of the second. In column form, add the top numbers together and the bottom numbers together.",
        keyInsight: "Adding vectors means following one journey and then the other.",
        relatedVariables: []
      },
      {
        stepNumber: 5,
        title: "Multiplying by a Number",
        content: "Multiplying a vector by a number stretches it without turning it: 2a is twice as long as a and points the same way, while -a points the opposite way. Vectors that are multiples of each other are parallel.",
        keyInsight: "If one vector is a multiple of another, they are parallel.",
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
        question: "$\\mathbf{a} = \\begin{pmatrix} 3 \\\\ 2 \\end{pmatrix}$ and $\\mathbf{b} = \\begin{pmatrix} 1 \\\\ -4 \\end{pmatrix}$. Work out $\\mathbf{a} + \\mathbf{b}$.",
        hint: "Add the top numbers, then add the bottom numbers.",
        answer: "$\\begin{pmatrix} 4 \\\\ -2 \\end{pmatrix}$"
      },
      {
        question: "Using the same vectors, work out $\\mathbf{a} - \\mathbf{b}$.",
        hint: "Subtract the top numbers, then the bottom numbers.",
        answer: "$\\begin{pmatrix} 2 \\\\ 6 \\end{pmatrix}$"
      },
      {
        question: "Work out $3\\mathbf{a}$.",
        hint: "Multiply both numbers by 3.",
        answer: "$\\begin{pmatrix} 9 \\\\ 6 \\end{pmatrix}$"
      },
      {
        question: "A probe moves at 6 km/s in the x direction and 8 km/s in the y direction. What is its speed?",
        hint: "Use Pythagoras: square both, add, then take the square root.",
        answer: "10 km/s"
      },
      {
        question: "Find the magnitude of $\\begin{pmatrix} -5 \\\\ 12 \\end{pmatrix}$.",
        hint: "Squaring a negative number gives a positive.",
        answer: "13"
      },
      {
        question: "A spacecraft moves at 4 km/s east and 3 km/s north. Find its speed and its direction, as an angle north of east.",
        hint: "Speed by Pythagoras; angle using tan θ = north ÷ east.",
        answer: "5 km/s, about 36.9° north of east"
      },
    ],
    realWorldConnection: "Navigation computers on the Apollo missions continuously calculated state vectors (position and velocity in 3D space) to ensure astronauts remained on the correct trajectory to the Moon.",
    textbookContent: `
## Vectors

A **scalar** has size only, such as a mass of 5 kg or a time of 10 s. A **vector** has size **and** direction, such as a velocity of 5 m/s north or a force of 20 N downwards. The size of a vector is called its **magnitude**.

### Writing vectors

A vector can be drawn as an arrow: its length shows the magnitude and it points in the direction. In print, vectors are written in bold, $\\mathbf{a}$, or with an arrow, $\\overrightarrow{AB}$ for the journey from A to B.

A **column vector** gives the steps across and up:

$$\\mathbf{a} = \\begin{pmatrix} 3 \\\\ 2 \\end{pmatrix}$$

means 3 to the right and 2 up. Negative numbers mean left or down.

### Adding and subtracting

To add vectors, draw them **tip to tail**: the second starts where the first ends. The sum, called the **resultant**, goes from the start of the first to the end of the second. In columns, add the matching numbers:

$$\\begin{pmatrix} 3 \\\\ 2 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ -4 \\end{pmatrix} = \\begin{pmatrix} 4 \\\\ -2 \\end{pmatrix}$$

Subtracting $\\mathbf{b}$ is the same as adding $-\\mathbf{b}$, the vector of the same size pointing the opposite way.

### Multiplying by a number

Multiplying a vector by a number (a **scalar**) stretches it: $2\\mathbf{a}$ is twice as long as $\\mathbf{a}$ and points the same way; $-\\mathbf{a}$ points the opposite way. Vectors that are multiples of each other are **parallel**.

### Proving things with vectors

Vectors let you prove facts about shapes. If $\\overrightarrow{AB} = 2\\overrightarrow{CD}$, the lines AB and CD are parallel and AB is twice as long. If $\\overrightarrow{PQ} = k\\overrightarrow{QR}$, then P, Q and R lie on one straight line.

### Magnitude and direction

The steps across and up form a right-angled triangle, so Pythagoras gives the magnitude:

$$|\\mathbf{a}| = \\sqrt{x^2 + y^2}$$

and trigonometry gives the direction, as an angle $\\theta$ above the x direction:

$$\\tan \\theta = \\frac{y}{x}$$

### Splitting a vector into parts

In A-level physics you also go the other way: you **resolve** a vector into two parts at right angles. A velocity $v$ at angle $\\theta$ to the horizontal has a horizontal part $v \\cos \\theta$ and a vertical part $v \\sin \\theta$.

### Worked example

A spacecraft has a horizontal velocity of 3000 m/s and a vertical velocity of 4000 m/s. Its speed is

$$\\sqrt{3000^2 + 4000^2} = \\sqrt{25\\,000\\,000} = 5000 \\text{ m/s}$$

and it is climbing at $\\tan^{-1}\\!\\left(\\dfrac{4000}{3000}\\right) \\approx 53°$ above the horizontal.

### Steering with thrusters

When a spacecraft fires a thruster, it adds a new velocity to the one it already has. Firing straight ahead adds to its speed. Firing sideways changes its direction. Mission planners add these vectors to work out exactly which way to point the engine and for how long.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE mathematics: subject content and assessment objectives](https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives) (Department for Education)
*   [GCE AS and A level subject content for mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics) (Department for Education)
*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
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
        question: "$\\mathbf{A} = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$ and $\\mathbf{B} = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$. Find $\\mathbf{A} + \\mathbf{B}$.",
        hint: "Add the numbers in matching positions.",
        answer: "$\\begin{pmatrix} 1 & 3 \\\\ 4 & 4 \\end{pmatrix}$"
      },
      {
        question: "Find $2\\mathbf{A}$.",
        hint: "Multiply every number by 2.",
        answer: "$\\begin{pmatrix} 2 & 4 \\\\ 6 & 8 \\end{pmatrix}$"
      },
      {
        question: "Find $\\mathbf{AB}$.",
        hint: "Each entry is a row of $\\mathbf{A}$ times a column of $\\mathbf{B}$: multiply in pairs and add.",
        answer: "$\\begin{pmatrix} 2 & 1 \\\\ 4 & 3 \\end{pmatrix}$"
      },
      {
        question: "What does multiplying a vector by the identity matrix $\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$ do?",
        hint: "Try it on $\\begin{pmatrix} x \\\\ y \\end{pmatrix}$.",
        answer: "Nothing: the vector is unchanged."
      },
      {
        question: "Rotate the vector $\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$ by 90° clockwise.",
        hint: "The clockwise matrix is $\\begin{pmatrix} 0 & 1 \\\\ -1 & 0 \\end{pmatrix}$.",
        answer: "$\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$"
      },
      {
        question: "Find the single matrix for a reflection in the x-axis followed by a rotation of 90° anticlockwise. What transformation is it?",
        hint: "The first transformation goes on the right: work out $\\mathbf{RM}$ with $\\mathbf{M} = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$ and $\\mathbf{R} = \\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$.",
        answer: "$\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$, a reflection in the line $y = x$."
      },
    ],
    realWorldConnection: "Attitude Control Systems (ACS) use 3D rotation matrices and quaternions to continuously track and adjust a satellite's orientation in space, ensuring solar panels point at the Sun and antennas at Earth.",
    textbookContent: `
## Matrices

A **matrix** is a rectangular grid of numbers. A matrix with 2 rows and 3 columns is a $2 \\times 3$ matrix.

### Adding, subtracting and multiplying by a number

Matrices of the same size are added or subtracted by combining the numbers in matching positions:

$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} + \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix} = \\begin{pmatrix} 1 & 3 \\\\ 4 & 4 \\end{pmatrix}$$

To multiply by a number (a **scalar**), multiply every entry: $2\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} = \\begin{pmatrix} 2 & 4 \\\\ 6 & 8 \\end{pmatrix}$.

### Multiplying matrices

Two matrices can be multiplied when the first has as many columns as the second has rows: they are **conformable**. Each entry of the answer is a row of the first times a column of the second, multiplied in pairs and added:

$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae + bg & af + bh \\\\ ce + dg & cf + dh \\end{pmatrix}$$

Order matters: in general $\\mathbf{AB}$ is not the same as $\\mathbf{BA}$.

The **identity matrix** $\\mathbf{I} = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$ leaves anything it multiplies unchanged, like multiplying by 1.

### Matrices as transformations

A $2 \\times 2$ matrix moves every point of the plane: multiply the matrix by the point's position vector. Some to know:

| Transformation | Matrix |
| --- | --- |
| Rotation by $\\theta$ anticlockwise about the origin | $\\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}$ |
| Reflection in the x-axis | $\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$ |
| Reflection in $y = x$ | $\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$ |
| Enlargement, scale factor $k$, centre the origin | $\\begin{pmatrix} k & 0 \\\\ 0 & k \\end{pmatrix}$ |

A quick way to find a matrix: its first column is where $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ goes, and its second column is where $\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$ goes.

### One transformation after another

To do $\\mathbf{M}$ first and then $\\mathbf{R}$, multiply $\\mathbf{RM}$: the first transformation is on the **right**, next to the vector it acts on. Reflecting in the x-axis and then rotating 90° anticlockwise gives

$$\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix} = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$

which is a reflection in the line $y = x$.

### Turning a spacecraft

A spacecraft keeps track of which way it faces using matrices. A star tracker measures the directions of known stars in the spacecraft's own frame; a rotation matrix converts between that frame and a fixed one. Rotations do not change lengths, so the stars stay the same distance apart, just as a rotation matrix keeps every vector the same length.

### Sources

The topics in these notes follow the Department for Education document below.

*   [GCE AS and A level subject content for further mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-further-mathematics) (Department for Education)
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
        name: "Probability the system works",
        unit: "no unit (0 to 1)",
        description: "The probability that at least one of the copies works, so the system keeps going.",
        color: "text-emerald-400"
      },
      {
        symbol: "p",
        name: "Probability one copy works",
        unit: "no unit (0 to 1)",
        description: "The probability that a single copy, such as one flight computer, works. Its chance of failing is $1 - p$.",
        color: "text-teal-400"
      },
      {
        symbol: "n",
        name: "Number of copies",
        unit: "a whole number",
        description: "How many copies work side by side as backups for each other. Their failures are assumed to be independent.",
        color: "text-lime-400"
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: "From impossible to certain",
        content: "A probability is a number from 0, for something impossible, to 1, for something certain. It can be a fraction, a decimal or a percentage (see [fractions](/study/fractions)). Something either happens or it does not, so $P(\\text{not } A) = 1 - P(A)$.",
        keyInsight: "Add up the probabilities of every possible outcome and you always get 1.",
        relatedVariables: ["p"]
      },
      {
        stepNumber: 2,
        title: "Both events: multiply",
        content: "If one event does not change the chance of the other, the two are independent, and the probability that both happen is $P(A) \\times P(B)$. If the first event does change the chances, as when a counter is taken from a bag and not put back, the events are dependent and the second probability must be worked out again.",
        keyInsight: "Multiply for both, but only use the plain product when the events are independent.",
        relatedVariables: ["p"]
      },
      {
        stepNumber: 3,
        title: "Backups make a system reliable",
        content: "A system with $n$ copies working side by side fails only if every copy fails. If each copy fails with probability $1 - p$, independently, all $n$ fail with probability $(1 - p)^n$. So the system works with probability $P_{sys} = 1 - (1 - p)^n$.",
        keyInsight: "A few backups can make a system far more reliable than any one part, as long as the parts fail independently.",
        relatedVariables: ["P_{sys}", "p", "n"]
      }
    ],
    solvedExample: {
      problem: "Each of a spacecraft's flight computers works with probability $0.9$ (90%). The spacecraft carries $n = 3$ of them, and their failures are independent. What is the probability $P_{sys}$ that at least one works?",
      steps: [
        "The probability that one computer fails: $1 - 0.9 = 0.1$.",
        "The probability that all three fail: $0.1 \\times 0.1 \\times 0.1 = 0.001$.",
        "The probability that the system works: $P_{sys} = 1 - 0.001$."
      ],
      resultFormula: "P_{sys} = 0.999 \\text{, or } 99.9\\%"
    },
    practiceProblems: [
      {
        question: "The probability that it rains tomorrow is 0.3. What is the probability that it does not rain?",
        hint: "The probabilities of all the outcomes add up to 1.",
        answer: "0.7"
      },
      {
        question: "A bag holds 3 red counters and 5 blue counters. One is picked at random. What is the probability it is red?",
        hint: "Count the red counters and the total number of counters.",
        answer: "3/8"
      },
      {
        question: "Two fair coins are tossed. What is the probability of two heads?",
        hint: "The coins are independent, so multiply.",
        answer: "1/4"
      },
      {
        question: "The probability a launch leaves on time is 0.8. Separately, the probability of good weather at the landing site is 0.9. What is the probability of both?",
        hint: "The events are independent, so multiply.",
        answer: "0.72"
      },
      {
        question: "From the bag in question 2, two counters are taken without putting the first back. What is the probability both are red?",
        hint: "After one red is taken, there are 2 red counters left out of 7.",
        answer: "3/28 (3/8 × 2/7 = 6/56)"
      },
      {
        question: "Each valve on a spacecraft works with probability 0.5, independently. How many valves in parallel are needed for the system to work with probability 0.875?",
        hint: "The system fails only if every valve fails. Try 1 − 0.5ⁿ for n = 1, 2, 3.",
        answer: "3 valves (1 − 0.5³ = 0.875)"
      },
    ],
    realWorldConnection: "The Space Shuttle flew with five flight computers. Four ran the same software and checked each other's results, and the fifth ran separately written backup software, so that one computer failing would not put the crew in danger.",
    textbookContent: `
## Probability

Probability measures how likely something is, on a scale from 0 (impossible) to 1 (certain). It can be written as a fraction, a decimal or a percentage: $\\dfrac{9}{10} = 0.9 = 90\\%$.

### Equally likely outcomes

When all the outcomes are equally likely:

$$P(\\text{event}) = \\frac{\\text{number of outcomes in the event}}{\\text{total number of outcomes}}$$

A bag holds 2 green and 7 yellow counters. $P(\\text{green}) = \\dfrac{2}{9}$.

### All the outcomes add up to 1

The probabilities of all the possible outcomes add up to 1. So the probability that something does **not** happen is

$$P(\\text{not } A) = 1 - P(A)$$

If the chance that a radio message is lost is 0.05, the chance that it gets through is 0.95.

### Either one or the other: add

Two events are **mutually exclusive** if they cannot both happen. For these, add the probabilities:

$$P(A \\text{ or } B) = P(A) + P(B)$$

### Both: multiply, if independent

Two events are **independent** if one happening does not change the probability of the other, like two coin tosses. For independent events, multiply:

$$P(A \\text{ and } B) = P(A) \\times P(B)$$

### Tree diagrams

A tree diagram shows two or more events one after another. Each event branches into its outcomes, with the probability written on each branch.

*   Multiply **along** the branches to find the probability of a path.
*   Add the results of different paths when more than one path gives what you want.
*   The probabilities on the branches leaving any one point add up to 1.

### Dependent events

If you take a counter and do not put it back, the second pick depends on the first. These events are **dependent**: the probabilities on the second branches change.

With 2 green and 7 yellow counters, taking two without replacement:

$$P(\\text{green, then green}) = \\frac{2}{9} \\times \\frac{1}{8} = \\frac{2}{72} = \\frac{1}{36}$$

After the first green there is 1 green left out of 8 counters.

### Assumptions

Calculations like these assume things: that a coin is fair, that picks are random, that events really are independent. If the assumption is wrong, so is the answer. Two parts made in the same factory batch may fail together, so they are not truly independent.

### Backups in spacecraft

Engineers make spacecraft reliable by fitting backups that work side by side (in parallel). The system fails only if every copy fails. With $n$ copies that each work with probability $p$, and fail independently:

$$P_{sys} = 1 - (1 - p)^n$$

The worked example shows three computers that are each 90% reliable giving a system that is 99.9% reliable. That only holds if their failures really are independent. Copies that share a power supply, or the same fault in their software, can fail together.

### Next on the journey

The spacecraft now has power, can send its data home, and is built to keep working. Next it looks outwards. What can the light from a distant star tell us? The next mission begins by splitting light with a prism.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
*   [GCSE mathematics: subject content and assessment objectives](https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives) (Department for Education)
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
        question: "Drag on a capsule is modelled by $\\frac{dv}{dt} = -kv^2$. If its speed triples, what happens to the deceleration?",
        hint: "Look at the power on $v$.",
        answer: "It is 9 times as large."
      },
      {
        question: "In the same model, what happens to the deceleration as the capsule slows down?",
        hint: "What happens to $v^2$ as $v$ gets smaller?",
        answer: "It gets smaller, so the capsule slows more and more gently."
      },
      {
        question: "Solve $\\frac{dy}{dx} = 2x$, given that $y = 3$ when $x = 0$.",
        hint: "Integrate, then use the condition to find the constant.",
        answer: "$y = x^2 + 3$"
      },
      {
        question: "Solve $\\frac{dy}{dx} = y$, given that $y = 5$ when $x = 0$.",
        hint: "Separate the variables: $\\int \\frac{1}{y}\\,dy = \\int 1\\,dx$.",
        answer: "$y = 5e^x$"
      },
      {
        question: "A population $P$ grows at a rate proportional to its size. Write a differential equation for this.",
        hint: "'Proportional to' means 'equals a constant times'.",
        answer: "$\\frac{dP}{dt} = kP$, with $k > 0$"
      },
      {
        question: "A capsule enters the atmosphere at $v_0 = 5000$ m/s, with $\\frac{dv}{dt} = -kv^2$ and $k = 2 \\times 10^{-6}$ per metre. Use $v = \\frac{v_0}{1 + kv_0 t}$ to find its speed after 10 s.",
        hint: "Work out $kv_0 t$ first.",
        answer: "About 4,545 m/s ($5000 \\div 1.1$)"
      },
    ],
    realWorldConnection: "Mission control uses complex sets of differential equations, factoring in variable atmospheric density and gravity, to predict exactly where a returning capsule will splash down in the ocean.",
    textbookContent: `
## Differential equations

A **differential equation** links a quantity to its rate of change. It describes how something changes, and solving it tells you what the quantity is at any time.

### Building one

Many models start from a sentence about a rate:

*   "The population grows at a rate proportional to its size": $\\dfrac{dP}{dt} = kP$.
*   "The body cools at a rate proportional to the difference between its temperature and the room's": $\\dfrac{dT}{dt} = -k(T - T_{\\text{room}})$.
*   "Drag slows the capsule at a rate proportional to the square of its speed": $\\dfrac{dv}{dt} = -kv^2$.

"Proportional to" means "equals a constant times". A minus sign shows the quantity is decreasing.

### Separating the variables

A **first-order** equation where the right-hand side is a function of $x$ times a function of $y$ can be solved by **separating the variables**: get all the $y$ terms on one side and all the $x$ terms on the other, then integrate both sides.

$$\\frac{dy}{dx} = y \\quad \\Rightarrow \\quad \\int \\frac{1}{y}\\,dy = \\int 1\\,dx \\quad \\Rightarrow \\quad \\ln|y| = x + c$$

So $y = Ae^x$. This **general solution** has an unknown constant.

### Particular solutions

A **particular solution** uses a known value, such as the starting value, to find the constant. If $y = 5$ when $x = 0$, then $A = 5$ and $y = 5e^x$.

### Worked example: drag on a capsule

$\\dfrac{dv}{dt} = -kv^2$, with speed $v_0$ at $t = 0$.

1.  Separate: $\\displaystyle\\int v^{-2}\\,dv = \\int -k\\,dt$
2.  Integrate: $-\\dfrac{1}{v} = -kt + c$
3.  At $t = 0$: $c = -\\dfrac{1}{v_0}$, so $\\dfrac{1}{v} = kt + \\dfrac{1}{v_0}$
4.  Rearrange: $v = \\dfrac{v_0}{1 + kv_0 t}$

The speed falls steeply at first, while drag is large, then more and more gently.

### Coming home from space

A capsule returning from orbit hits the top of the atmosphere at nearly 8 km/s. Drag, which grows with the square of speed, does most of the braking. Real re-entry models add gravity, the thinning of the air with height and the capsule's angle, giving equations that computers solve step by step. The simple model above shows the same shape: hard braking early, gentler later.

### Sources

The topics in these notes follow the Department for Education document below.

*   [GCE AS and A level subject content for mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics) (Department for Education)
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
        question: "Work out 6 + 4 × 5.",
        hint: "Multiply before you add.",
        answer: "26"
      },
      {
        question: "Work out (6 + 4) × 5.",
        hint: "Brackets come first.",
        answer: "50"
      },
      {
        question: "Work out 18 ÷ 3 × 2.",
        hint: "Division and multiplication have the same rank, so work from left to right.",
        answer: "12 (18 ÷ 3 = 6, then 6 × 2 = 12)"
      },
      {
        question: "Work out 3² + 4 × 2.",
        hint: "3² means 3 × 3. Do that, then the multiplication, then the addition.",
        answer: "17 (9 + 8)"
      },
      {
        question: "Put one pair of brackets into 2 + 3 × 4 so that the answer is 20.",
        hint: "Which part has to happen first to make 20?",
        answer: "(2 + 3) × 4 = 20"
      },
      {
        question: "A rover makes 4 trips of 3 km, then drives 2 km back to its lander. Write this as one calculation and work it out.",
        hint: "The trips are a multiplication; the drive back is added on.",
        answer: "4 × 3 + 2 = 14 km"
      },
    ],
    realWorldConnection: 'Computer programming relies heavily on the order of operations. Programmers add brackets to make sure a computer carries out a calculation in the order they intend.',
    textbookContent: `
## Doing a calculation in the right order

What is $2 + 3 \\times 4$? If you add first you get 20. If you multiply first you get 14. Both cannot be right, so mathematicians agreed a rule that everyone follows. The answer is **14**.

### BIDMAS

The rule says which part of a calculation to do first. In the UK it is remembered as **BIDMAS**:

1.  **B**rackets: work out anything inside brackets first.
2.  **I**ndices: squared and cubed numbers, such as $3^2 = 3 \\times 3 = 9$.
3.  **D**ivision and **M**ultiplication.
4.  **A**ddition and **S**ubtraction.

Some schools say BODMAS. The O stands for "orders", which is another word for indices. The rule is the same.

### Multiply and divide in the order you read them

Division and multiplication have the same rank. When both appear, work from **left to right**:

$16 \\div 4 \\times 2 = 4 \\times 2 = 8$

It is not $16 \\div 8 = 2$. The D coming before the M in BIDMAS does not mean "divide first".

### Add and subtract in the order you read them

Addition and subtraction also share a rank, so they are worked from left to right too:

$10 - 4 + 3 = 6 + 3 = 9$

### Brackets change the order

Brackets let you choose what happens first:

*   $2 + 3 \\times 4 = 2 + 12 = 14$
*   $(2 + 3) \\times 4 = 5 \\times 4 = 20$

### Worked example

Work out $20 - 3 \\times (2 + 4)$.

1.  Brackets first: $2 + 4 = 6$. Now it is $20 - 3 \\times 6$.
2.  Multiply: $3 \\times 6 = 18$. Now it is $20 - 18$.
3.  Subtract: $20 - 18 = 2$.

### Packing food for a space mission

Three astronauts each eat 2 packed meals a day on a 5-day trip, and the crew takes 4 spare meals. The number of meals is

$3 \\times 2 \\times 5 + 4 = 30 + 4 = 34$

If you added $5 + 4$ first you would pack 54 meals, far more than the spacecraft has room for. The order matters.

In key stage 3 you will use the same order with powers, roots and other operations.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        content: 'Perimeter is the distance all the way round the edge of a shape. Find it by adding up the lengths of all the sides.',
        keyInsight: 'Perimeter is a length, like a piece of string laid round the edge of the shape.',
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
        question: "A square has sides 4 cm long. What is its area?",
        hint: "A square is a rectangle whose length and width are the same.",
        answer: "16 cm²"
      },
      {
        question: "A rectangle has a perimeter of 20 m and a length of 6 m. What is its width?",
        hint: "Take the two lengths away from the perimeter, then halve what is left.",
        answer: "4 m"
      },
      {
        question: "A rectangle is 7 cm long and 5 cm wide. Find its area and its perimeter.",
        hint: "Area is length × width. Perimeter is all four sides added.",
        answer: "Area 35 cm², perimeter 24 cm"
      },
      {
        question: "A rectangle 10 m by 6 m has a 4 m by 2 m rectangle cut from one corner, making an L shape. Find the area and perimeter of the L shape.",
        hint: "Take the small area from the big one. For the perimeter, the cut-out corner's sides add up to the same as the corner they replace.",
        answer: "Area 52 m² (60 − 8), perimeter 32 m"
      },
      {
        question: "Draw or describe two rectangles that each have an area of 24 cm² but different perimeters.",
        hint: "Find pairs of numbers that multiply to make 24.",
        answer: "For example 4 cm by 6 cm (perimeter 20 cm) and 3 cm by 8 cm (perimeter 22 cm)"
      },
      {
        question: "Each solar panel on a space station is 3 m by 2 m. How many panels are needed to cover 30 m²?",
        hint: "Find the area of one panel first.",
        answer: "5 panels (each is 6 m²)"
      },
    ],
    realWorldConnection: 'Architects and builders use area to determine how much carpet or tile is needed for a floor, and perimeter to determine how much fencing is needed to enclose a garden.',
    textbookContent: `
## Area and perimeter

### Perimeter

The **perimeter** is the distance all the way round the edge of a flat shape. To find it, add up the lengths of all the sides.

A rectangle has two lengths ($l$) and two widths ($w$), so

$P = l + w + l + w = 2l + 2w$

Perimeter is a length, so it is measured in centimetres (cm) or metres (m).

### Area

The **area** is the amount of flat space inside a shape. Imagine covering the shape with squares 1 cm along each side and counting them. Area is measured in **square centimetres** (cm²) or **square metres** (m²).

A rectangle 5 squares long and 3 squares wide has 3 rows of 5 squares, so

$A = l \\times w = 5 \\times 3 = 15$ cm²

### Shapes made of rectangles

An L shape can be split into rectangles, or seen as a big rectangle with a corner cut out. Take a rectangle 8 m by 6 m with a 3 m by 2 m corner removed:

*   **Area:** $8 \\times 6 = 48$, take away $3 \\times 2 = 6$. The area is 42 m².
*   **Perimeter:** the two sides of the cut-out add up to the same as the corner they replaced, so the perimeter is still $2 \\times 8 + 2 \\times 6 = 28$ m. You can check by adding all six sides.

### Estimating the area of an irregular shape

Draw the shape on squared paper. Count every whole square inside it. Then count each square that is half or more inside as one more, and ignore any that are less than half inside. The total is a good estimate of the area.

### Same area, different perimeter

Shapes with the same area can have different perimeters. These rectangles all have an area of 16 cm²:

| Rectangle | Area | Perimeter |
| --- | --- | --- |
| 4 cm by 4 cm | 16 cm² | 16 cm |
| 2 cm by 8 cm | 16 cm² | 20 cm |
| 1 cm by 16 cm | 16 cm² | 34 cm |

It works the other way too: shapes with the same perimeter can have different areas.

### Solar panels in space

Spacecraft make their electricity from sunlight with solar panels. The more area the panels have, the more sunlight they catch. A panel 3 m long and 2 m wide has an area of 6 m², so five of them cover 30 m².

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        question: "Write the ratio 12 : 18 in its simplest form.",
        hint: "Divide both parts by the biggest number that goes into each.",
        answer: "2 : 3"
      },
      {
        question: "Share £60 in the ratio 2 : 3.",
        hint: "There are 2 + 3 = 5 parts. Find one part first.",
        answer: "£24 and £36"
      },
      {
        question: "3 apples cost £2. How much do 9 apples cost?",
        hint: "The number of apples has been multiplied by 3.",
        answer: "£6"
      },
      {
        question: "A map uses 1 cm for every 10 km. How many centimetres show 45 km?",
        hint: "Divide the real distance by 10.",
        answer: "4.5 cm"
      },
      {
        question: "Food for 4 astronauts lasts 30 days. How long would the same food last 6 astronauts?",
        hint: "More astronauts means fewer days: this is inverse proportion. Work out the number of astronaut-days first.",
        answer: "20 days (4 × 30 = 120 astronaut-days, and 120 ÷ 6 = 20)"
      },
      {
        question: "Weight on Mars is 0.38 times weight on Earth. A rover weighs 9,000 N on Earth. What does it weigh on Mars?",
        hint: "Weight on Mars is directly proportional to weight on Earth.",
        answer: "3,420 N"
      },
    ],
    realWorldConnection: 'Chefs use proportions constantly to scale recipes up or down depending on the number of guests. Mapmakers use ratios (scales) to accurately represent large geographic areas on small pieces of paper.',
    textbookContent: `
## Ratio and proportion

### Ratios

A **ratio** compares two or more quantities. If a mixture has 2 parts fuel to 3 parts oxidiser, the ratio of fuel to oxidiser is $2 : 3$. Order matters: oxidiser to fuel is $3 : 2$.

To write a ratio in its **simplest form**, divide every part by the same number, as you would simplify a fraction:

$$12 : 18 = 2 : 3 \\quad \\text{(dividing both by 6)}$$

### Ratios and fractions

A ratio can also be written as fractions of the whole. In $2 : 3$ there are $2 + 3 = 5$ parts, so the first quantity is $\\dfrac{2}{5}$ of the total and the second is $\\dfrac{3}{5}$. The first is $\\dfrac{2}{3}$ of the second.

To share £60 in the ratio $2 : 3$: one part is $60 \\div 5 = 12$, so the shares are $2 \\times 12 = £24$ and $3 \\times 12 = £36$.

### Direct proportion

Two quantities are in **direct proportion** when doubling one doubles the other. Their ratio stays the same, so

$$\\frac{a}{b} = \\frac{c}{d}$$

If you know three of the values, you can find the fourth. A car goes 150 miles on 15 litres of fuel. On 24 litres it goes

$$\\frac{150}{15} = \\frac{x}{24} \\quad \\Rightarrow \\quad x = 10 \\times 24 = 240 \\text{ miles}$$

Algebraically, $y = kx$ for some fixed number $k$. On a graph, direct proportion is a straight line through the origin.

### Inverse proportion

Two quantities are in **inverse proportion** when doubling one halves the other. Their product stays the same:

$$xy = k \\quad \\text{or} \\quad y = \\frac{k}{x}$$

At 50 km/h a journey takes 6 hours; at 100 km/h it takes 3 hours. Speed × time is 300 each time. On a graph, inverse proportion is a curve that gets closer and closer to the axes without touching them.

### Worked example

Food for 4 astronauts lasts 30 days. How long does it last 6 astronauts?

1.  More astronauts means fewer days, so this is inverse proportion.
2.  The fixed product is $4 \\times 30 = 120$ astronaut-days of food.
3.  For 6 astronauts: $120 \\div 6 = 20$ days.

### Weight on other worlds

Your weight on Mars is directly proportional to your weight on Earth: it is about $0.38$ times as much, because Mars pulls more weakly. A rover that weighs 9,000 N on Earth weighs $0.38 \\times 9{,}000 = 3{,}420$ N on Mars. Its mass is the same on both planets.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        question: "Write 4/5 as a percentage.",
        hint: "Change 4/5 into hundredths.",
        answer: "80% (4/5 = 80/100)"
      },
      {
        question: "Write 0.35 as a percentage and as a fraction in its simplest form.",
        hint: "0.35 is 35 hundredths.",
        answer: "35% and 7/20"
      },
      {
        question: "What is 15% of 200?",
        hint: "Find 10% and 5%, then add them.",
        answer: "30 (20 + 10)"
      },
      {
        question: "Which is largest: 0.6, 5/8 or 62%?",
        hint: "Change them all into percentages. 5/8 = 0.625.",
        answer: "5/8, which is 62.5%"
      },
      {
        question: "A fuel tank holds 800 litres and is 25% full. How many litres are in it?",
        hint: "25% is the same as 1/4.",
        answer: "200 litres"
      },
      {
        question: "A probe sends 20 pictures and 9 of them show clouds. What percentage show clouds?",
        hint: "Change 9/20 into hundredths.",
        answer: "45% (9/20 = 45/100)"
      },
    ],
    realWorldConnection: 'Financial literacy relies heavily on percentages. Interest rates on loans, tax rates on purchases, and discounts during sales are all calculated using percentages and decimals.',
    textbookContent: `
## Fractions, decimals and percentages

Fractions, decimals and percentages are three ways of writing the same amount. Half can be written as $\\dfrac{1}{2}$, as 0.5 or as 50%.

### Per cent means "out of 100"

The sign % means **per cent**, or "parts per 100". So 37% means 37 out of every 100:

$37\\% = \\dfrac{37}{100} = 0.37$

### Ones worth knowing by heart

| Fraction | Decimal | Percentage |
| --- | --- | --- |
| $\\dfrac{1}{2}$ | 0.5 | 50% |
| $\\dfrac{1}{4}$ | 0.25 | 25% |
| $\\dfrac{3}{4}$ | 0.75 | 75% |
| $\\dfrac{1}{5}$ | 0.2 | 20% |
| $\\dfrac{1}{10}$ | 0.1 | 10% |
| $\\dfrac{1}{100}$ | 0.01 | 1% |

### Changing from one to another

*   **Fraction to percentage:** make the denominator 100. $\\dfrac{3}{5} = \\dfrac{60}{100} = 60\\%$
*   **Fraction to decimal:** divide the top by the bottom. $\\dfrac{3}{8} = 3 \\div 8 = 0.375$
*   **Decimal to percentage:** multiply by 100. $0.45 \\times 100 = 45\\%$
*   **Percentage to decimal:** divide by 100. $42\\% = 42 \\div 100 = 0.42$

### A percentage of an amount

Build it up from percentages that are easy to find:

*   10% is a tenth: divide by 10.
*   50% is a half and 25% is a quarter.
*   1% is a hundredth: divide by 100.

For 15% of 200: 10% is 20 and 5% is 10, so 15% is $20 + 10 = 30$.

### Comparing amounts

To compare amounts written in different ways, change them all into the same form. Which is biggest: 0.3, $\\dfrac{1}{4}$ or 28%? As percentages they are 30%, 25% and 28%, so 0.3 is the biggest.

### Reading a fuel gauge

Mission control shows how full a rocket's tanks are as a percentage. A tank showing 75% is $\\dfrac{3}{4}$ full. If the full tank holds 800 litres, 75% is $800 \\div 4 \\times 3 = 600$ litres.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        question: "Convert 180° to radians.",
        hint: "A full turn, 360°, is $2\\pi$ radians.",
        answer: "$\\pi$ radians"
      },
      {
        question: "Convert 60° to radians.",
        hint: "Multiply by $\\frac{\\pi}{180}$.",
        answer: "$\\frac{\\pi}{3}$ radians"
      },
      {
        question: "An arc has length 10 cm on a circle of radius 5 cm. What angle does it make at the centre, in radians?",
        hint: "Rearrange $s = r\\theta$.",
        answer: "2 radians"
      },
      {
        question: "Find the area of a sector of radius 6 cm with an angle of $\\frac{\\pi}{3}$ radians.",
        hint: "Use $A = \\frac{1}{2} r^2 \\theta$.",
        answer: "$6\\pi \\approx 18.8$ cm²"
      },
      {
        question: "Using degrees: find the length of an arc of angle 72° on a circle of radius 10 cm.",
        hint: "72° is $\\frac{72}{360}$ of the full circle.",
        answer: "$4\\pi \\approx 12.6$ cm"
      },
      {
        question: "A geostationary satellite orbits 42,164 km from the centre of the Earth and goes round once a day. How far does it travel in one hour?",
        hint: "In one hour it turns $\\frac{2\\pi}{24}$ radians. Then use $s = r\\theta$.",
        answer: "About 11,000 km ($42{,}164 \\times \\frac{\\pi}{12} \\approx 11{,}040$ km)"
      },
    ],
    realWorldConnection: 'Civil engineers use arc length and central angles to design safe curves in roads and railways. The radius must be large enough (and the curve gentle enough) to prevent derailments or slipping.',
    textbookContent: `
## Radians, arcs and sectors

### Arcs and sectors in degrees

An **arc** is part of the circumference of a circle. A **sector** is the slice between two radii, like a slice of pie. If the angle at the centre is $\\theta$ degrees, the arc and sector are that fraction of the whole circle:

$$\\text{arc length} = \\frac{\\theta}{360} \\times 2\\pi r \\qquad \\text{sector area} = \\frac{\\theta}{360} \\times \\pi r^2$$

### Radians

At A-level, angles are usually measured in **radians**. One radian is the angle at the centre of a circle made by an arc as long as the radius.

The whole circumference is $2\\pi r$, which is $2\\pi$ radius-lengths, so

$$360° = 2\\pi \\text{ radians} \\qquad 180° = \\pi \\text{ radians}$$

*   Degrees to radians: multiply by $\\dfrac{\\pi}{180}$. So $60° = \\dfrac{\\pi}{3}$.
*   Radians to degrees: multiply by $\\dfrac{180}{\\pi}$. So $2 \\text{ rad} \\approx 114.6°$.

### Arcs and sectors in radians

With $\\theta$ in radians, the formulas become much simpler, because the $\\dfrac{\\theta}{2\\pi}$ fraction cancels:

$$s = r\\theta \\qquad A = \\frac{1}{2} r^2 \\theta$$

These formulas only work with the angle in radians.

### Worked example

Find the arc length and sector area for $r = 4$ m and $\\theta = \\dfrac{\\pi}{2}$.

1.  $s = 4 \\times \\dfrac{\\pi}{2} = 2\\pi \\approx 6.28$ m
2.  $A = \\dfrac{1}{2} \\times 16 \\times \\dfrac{\\pi}{2} = 4\\pi \\approx 12.6$ m²

### Why radians are used

In radians, an angle is a ratio of two lengths, arc over radius, so it has no unit. That is why later results, such as $\\sin\\theta \\approx \\theta$ for small angles and the derivative of $\\sin x$ being $\\cos x$, only work in radians.

### Satellites going round

A satellite in a circular orbit sweeps out equal angles in equal times. A geostationary satellite, 42,164 km from the centre of the Earth, turns $2\\pi$ radians a day, which is $\\dfrac{\\pi}{12}$ radians an hour. Each hour it travels $s = r\\theta = 42{,}164 \\times \\dfrac{\\pi}{12} \\approx 11{,}000$ km.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE mathematics: subject content and assessment objectives](https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives) (Department for Education)
*   [GCE AS and A level subject content for mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics) (Department for Education)
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
        content: 'Start from the ones digit of the bottom number. Multiply it by each digit of the top number, right to left, carrying any tens digit.',
        keyInsight: 'Multiplication is repeated addition — 4 × 3 means 4 added together 3 times.',
        relatedVariables: ['a', 'b']
      },
      {
        stepNumber: 2,
        title: 'Shift & Add Partial Products',
        content: 'For each digit in the bottom number, write the partial product on a new row, shifted one place to the left. Then add all partial products together.',
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
      {
        question: "Work out 15 × 12.",
        hint: "Find 15 × 10 and 15 × 2, then add them.",
        answer: "180"
      },
      {
        question: "Work out 23 × 14.",
        hint: "Find 23 × 4 and 23 × 10, then add them.",
        answer: "322 (92 + 230)"
      },
      {
        question: "Work out 47 × 36.",
        hint: "Find 47 × 6 and 47 × 30. Remember to carry.",
        answer: "1,692 (282 + 1,410)"
      },
      {
        question: "Work out 325 × 18.",
        hint: "Find 325 × 8 and 325 × 10, then add them.",
        answer: "5,850 (2,600 + 3,250)"
      },
      {
        question: "Work out 2,406 × 15.",
        hint: "Find 2,406 × 5 and 2,406 × 10, then add them.",
        answer: "36,090 (12,030 + 24,060)"
      },
      {
        question: "A rocket's engines burn 1,250 kg of fuel every second. How much fuel do they burn in 24 seconds?",
        hint: "Find 1,250 × 4 and 1,250 × 20, then add them.",
        answer: "30,000 kg (5,000 + 25,000)"
      },
    ],
    realWorldConnection: 'Computers multiply in a very similar way: a processor works through the digits of a binary number, shifting and adding partial products, just as you do in long multiplication.',
    textbookContent: `
## Long multiplication

Times tables take you up to $12 \\times 12$. For bigger numbers, such as $24 \\times 13$, you split the problem into smaller multiplications you already know how to do.

### Why it works

Split the second number into tens and ones: $13 = 10 + 3$. Then multiply by each part and add the answers:

$24 \\times 13 = (24 \\times 10) + (24 \\times 3) = 240 + 72 = 312$

Each answer on the way is called a **partial product**.

### The written method

Write the bigger number on top and the smaller one underneath, lining up the ones.

1.  Multiply the top number by the **ones** digit of the bottom number. Write the answer on the first row: $24 \\times 3 = 72$.
2.  Multiply the top number by the **tens** digit. Because it is really tens, write a 0 in the ones column first, then the answer: $24 \\times 10 = 240$.
3.  Add the rows: $72 + 240 = 312$.

### Carrying

When one digit times another gives a two-digit answer, write down the ones digit and carry the tens to the next column. For $47 \\times 6$:

*   $7 \\times 6 = 42$. Write 2 and carry 4.
*   $4 \\times 6 = 24$, plus the 4 carried, is 28.
*   The answer is 282.

### Bigger numbers

The method works the same way for a four-digit number times a two-digit number. For $1{,}234 \\times 25$:

1.  $1{,}234 \\times 5 = 6{,}170$
2.  $1{,}234 \\times 20 = 24{,}680$
3.  $6{,}170 + 24{,}680 = 30{,}850$

### Check with an estimate

Round the numbers and multiply in your head. $1{,}234$ is about $1{,}200$, and $1{,}200 \\times 25 = 30{,}000$. The answer $30{,}850$ is close, so it is probably right. An answer of $3{,}085$ would be wrong by a whole place value.

### Orbits in a year

The International Space Station goes round the Earth about 16 times a day. In a year of 365 days that is

$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$ orbits.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
        content: 'To add or subtract fractions, they must share a common denominator. Find a common multiple of the denominators, convert both fractions, then add or subtract the numerators.',
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
        title: 'Dividing by a Whole Number',
        content: 'To divide a fraction by a whole number, keep the numerator and multiply the denominator by the whole number: $\\frac{1}{2} \\div 3 = \\frac{1}{6}$. Dividing by another fraction comes in key stage 3.',
        keyInsight: 'Dividing by 3 shares the fraction into 3 equal parts, so each part is smaller.',
        relatedVariables: []
      }
    ],
    solvedExample: {
      problem: 'Calculate $\\frac{1}{3} + \\frac{1}{4}$.',
      steps: [
        'Find a number that 3 and 4 both divide into: 12.',
        'Convert: $\\frac{1}{3} = \\frac{4}{12}$ and $\\frac{1}{4} = \\frac{3}{12}$.',
        'Add the numerators: $\\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.'
      ],
      resultFormula: '\\frac{1}{3} + \\frac{1}{4} = \\frac{7}{12}'
    },
    practiceProblems: [
      {
        question: "Work out 1/2 + 1/3.",
        hint: "Change both into sixths.",
        answer: "5/6"
      },
      {
        question: "Work out 5/6 − 1/4.",
        hint: "Change both into twelfths.",
        answer: "7/12 (10/12 − 3/12)"
      },
      {
        question: "Work out 2 1/4 + 1 2/3.",
        hint: "Add the whole numbers, then add the fractions using twelfths.",
        answer: "3 11/12"
      },
      {
        question: "Work out 2/3 × 3/4 and give the answer in its simplest form.",
        hint: "Multiply the tops, multiply the bottoms, then simplify.",
        answer: "1/2 (6/12 simplified)"
      },
      {
        question: "Work out 3/5 × 1/2.",
        hint: "Multiply the tops and the bottoms.",
        answer: "3/10"
      },
      {
        question: "Two thirds of a water supply is shared equally between 4 astronauts. What fraction of the supply does each get?",
        hint: "Work out 2/3 ÷ 4 by multiplying the denominator by 4, then simplify.",
        answer: "1/6 (2/12 simplified)"
      },
    ],
    realWorldConnection: 'Engineers use fraction arithmetic constantly when scaling recipes, mixing materials in ratios, or dividing resources across teams.',
    textbookContent: `
## Calculating with fractions

### Adding and subtracting

When the denominators are the same, add or subtract the numerators and keep the denominator:

$\\dfrac{2}{7} + \\dfrac{3}{7} = \\dfrac{5}{7}$

When the denominators are different, first change the fractions into **equivalent fractions** with the same denominator. Use a number that both denominators divide into, called a **common multiple**:

$\\dfrac{1}{3} + \\dfrac{1}{4} = \\dfrac{4}{12} + \\dfrac{3}{12} = \\dfrac{7}{12}$

Subtracting works the same way:

$\\dfrac{3}{4} - \\dfrac{1}{6} = \\dfrac{9}{12} - \\dfrac{2}{12} = \\dfrac{7}{12}$

### Mixed numbers

A **mixed number** has a whole number and a fraction, such as $1\\tfrac{1}{2}$. To add mixed numbers, add the whole numbers, then add the fractions:

$1\\tfrac{1}{2} + 2\\tfrac{1}{3} = 3 + \\dfrac{3}{6} + \\dfrac{2}{6} = 3\\tfrac{5}{6}$

For subtraction it is often easier to turn each mixed number into an **improper fraction** first, where the top is bigger than the bottom:

$3\\tfrac{1}{4} - 1\\tfrac{1}{2} = \\dfrac{13}{4} - \\dfrac{6}{4} = \\dfrac{7}{4} = 1\\tfrac{3}{4}$

### Multiplying

To multiply two fractions, multiply the numerators together and the denominators together, then simplify:

$\\dfrac{2}{3} \\times \\dfrac{3}{4} = \\dfrac{6}{12} = \\dfrac{1}{2}$

Multiplying by a fraction is like finding a fraction **of** something. Half of a quarter is $\\dfrac{1}{2} \\times \\dfrac{1}{4} = \\dfrac{1}{8}$.

### Dividing by a whole number

Dividing a fraction by a whole number shares it into that many equal parts. Half a bar shared between 3 people gives each of them a sixth:

$\\dfrac{1}{2} \\div 3 = \\dfrac{1}{6}$

Keep the numerator and multiply the denominator by the whole number:

$\\dfrac{3}{4} \\div 2 = \\dfrac{3}{8}$

Dividing one fraction by another fraction comes later, in key stage 3.

### A rover's battery

A Mars rover's battery is $\\dfrac{3}{4}$ full. Each drive uses $\\dfrac{1}{8}$ of a full battery. After two drives the battery holds

$\\dfrac{3}{4} - \\dfrac{2}{8} = \\dfrac{6}{8} - \\dfrac{2}{8} = \\dfrac{4}{8} = \\dfrac{1}{2}$

so it is half full.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
      {
        question: "Work out −5 + 8.",
        hint: "Start at −5 on the number line and move 8 to the right.",
        answer: "3"
      },
      {
        question: "Work out −3 − (−7).",
        hint: "Subtracting a negative is the same as adding: −3 + 7.",
        answer: "4"
      },
      {
        question: "Work out −2.5 × 4.",
        hint: "Work out 2.5 × 4, then decide the sign: one negative.",
        answer: "−10"
      },
      {
        question: "Work out (−3) × (−7).",
        hint: "Two negatives multiplied give a positive.",
        answer: "21"
      },
      {
        question: "Work out 36 ÷ (−4).",
        hint: "Signs that differ give a negative answer.",
        answer: "−9"
      },
      {
        question: "The Moon's surface reaches about 120 °C in sunlight and falls to about −130 °C at night. What is the difference?",
        hint: "Find the interval across 0: from −130 up to 0, then from 0 up to 120.",
        answer: "250 °C"
      },
    ],
    realWorldConnection: 'Negative numbers model temperature below zero, debt in finance, and downward forces in physics.',
    textbookContent: `
## Negative numbers

Negative numbers are numbers less than zero. You meet them as temperatures below freezing, as depths below sea level and as money owed.

### The number line

On a number line the negative numbers sit to the left of zero:

$$\\cdots,\\ -3,\\ -2,\\ -1,\\ 0,\\ 1,\\ 2,\\ 3,\\ \\cdots$$

A number further to the right is bigger. So $-2$ is bigger than $-5$, even though 5 is bigger than 2.

### Adding and subtracting

*   Adding a positive number moves you **right**: $-5 + 8 = 3$.
*   Subtracting a positive number moves you **left**: $4 - 9 = -5$.
*   Adding a negative number is the same as subtracting: $6 + (-2) = 6 - 2 = 4$.
*   Subtracting a negative number is the same as adding: $-3 - (-7) = -3 + 7 = 4$.

### Intervals across zero

To find the difference between a positive and a negative number, count the steps to zero and then on from zero. From $-8$ °C to $5$ °C is 8 degrees up to 0 and 5 more, a rise of 13 degrees. As a calculation: $5 - (-8) = 13$.

### Multiplying and dividing

Work out the size of the answer as normal, then decide the sign:

| Signs | Answer | Example |
| --- | --- | --- |
| positive and positive | positive | $3 \\times 4 = 12$ |
| negative and negative | positive | $(-3) \\times (-4) = 12$ |
| positive and negative | negative | $3 \\times (-4) = -12$ |

Division follows the same rules: $(-12) \\div (-4) = 3$ and $12 \\div (-4) = -3$.

The same rules apply to decimals and fractions: $-2.5 \\times 4 = -10$ and $-\\dfrac{1}{2} \\times -\\dfrac{2}{3} = \\dfrac{1}{3}$.

### Worked example

Work out $(-3) \\times (-4) + (-2)$.

1.  Multiply first: $(-3) \\times (-4) = 12$.
2.  Then add: $12 + (-2) = 12 - 2 = 10$.

### Hot and cold on the Moon

The Moon has no air to hold heat. In sunlight its surface reaches about $120$ °C; at night it falls to about $-130$ °C. The change between them is

$$120 - (-130) = 120 + 130 = 250 \\text{ °C}$$

Spacecraft that land there must survive that whole range.

### Sources

The topics in these notes follow the Department for Education document below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
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
    subtitle: "How the pressure, volume and temperature of a gas are linked, and why hot gas drives a rocket engine.",
    icon: 'Sparkles',
    accentColor: 'rose',
    difficulty: 3,
    estimatedMinutes: 20,
    formula: 'pV = nRT',
    formulaLayout: [
      { type: 'variable', symbol: 'p' },
      { type: 'variable', symbol: 'V' },
      { type: 'operator', content: '=' },
      { type: 'variable', symbol: 'n' },
      { type: 'variable', symbol: 'R' },
      { type: 'variable', symbol: 'T' },
    ],
    variables: [
      {
        symbol: 'p',
        name: 'Pressure',
        unit: 'pascals (Pa)',
        description: 'The push of the gas particles on each square metre of the container walls.',
        color: 'text-rose-400',
        range: { min: 1, max: 10, default: 1 }
      },
      {
        symbol: 'V',
        name: 'Volume',
        unit: 'cubic metres (m³)',
        description: 'The space the gas fills. One litre is 0.001 m³.',
        color: 'text-orange-400',
        range: { min: 1, max: 10, default: 5 }
      },
      {
        symbol: 'n',
        name: 'Amount of gas',
        unit: 'moles (mol)',
        description: 'One mole is about $6.02 \\times 10^{23}$ particles.',
        color: 'text-amber-400'
      },
      {
        symbol: 'R',
        name: 'Molar gas constant',
        unit: 'J mol⁻¹ K⁻¹',
        description: 'A fixed number, 8.31, the same for every ideal gas.',
        color: 'text-yellow-400'
      },
      {
        symbol: 'T',
        name: 'Temperature',
        unit: 'kelvin (K)',
        description: 'Temperature measured from absolute zero. Add 273 to a temperature in degrees Celsius.',
        color: 'text-red-400',
        range: { min: 200, max: 600, default: 300 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'The ideal gas model',
        content: 'Picture a gas as a huge number of tiny particles moving at random. They take up almost no room and only affect each other when they collide. Pressure is the push of these particles hitting the walls of their container.',
        keyInsight: 'Hotter gas means faster particles: their average kinetic energy is proportional to the temperature in kelvin.',
        relatedVariables: ['p', 'V']
      },
      {
        stepNumber: 2,
        title: 'One equation for pressure, volume and temperature',
        content: 'The equation $pV = nRT$ links the pressure, volume and temperature of an amount of gas. Hold one quantity steady and the others follow simple rules: at a steady temperature, $pV$ stays the same; in a fixed volume, pressure is proportional to the temperature in kelvin.',
        keyInsight: 'Always use kelvin, never degrees Celsius.',
        relatedVariables: ['p', 'V', 'n', 'T']
      },
      {
        stepNumber: 3,
        title: 'Hot gas drives a rocket engine',
        content: 'A rocket engine burns fuel in a small chamber. Burning makes a lot of extremely hot gas in a small space, so its pressure is very high. That pressure forces the gas out of the nozzle at great speed.',
        keyInsight: 'A lot of hot gas in a small space means a high pressure.',
        relatedVariables: ['p', 'T']
      }
    ],
    solvedExample: {
      problem: 'A sealed tank holds 2 mol of gas at 400 K in a volume of 0.1 m³. Find the pressure. Take $R = 8.31$ J mol⁻¹ K⁻¹.',
      steps: [
        'Rearrange $pV = nRT$ to give $p = \\dfrac{nRT}{V}$.',
        'Substitute: $p = \\dfrac{2 \\times 8.31 \\times 400}{0.1}$.',
        'Top line: $2 \\times 8.31 \\times 400 = 6648$.',
        'Divide: $6648 \\div 0.1 = 66\\,480$ Pa.'
      ],
      resultFormula: 'p = 66\\,480 \\text{ Pa, about } 66.5 \\text{ kPa}'
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
    realWorldConnection: 'The four RS-25 engines on NASA’s SLS Moon rocket, the same type that flew on the Space Shuttle, burn liquid hydrogen and oxygen at up to about 3,300 °C.',
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
*   **Constant volume:** $p$ is proportional to $T$.
*   **Constant pressure:** $V$ is proportional to $T$.

### Temperature and the energy of molecules

The temperature of a gas tells you the average kinetic energy of its molecules:

$$\\text{average kinetic energy} = \\frac{3}{2}kT$$

*Example:* at 300 K the average is $\\frac{3}{2} \\times 1.38 \\times 10^{-23} \\times 300 = 6.21 \\times 10^{-21}$ J for each molecule.

### Internal energy

The **internal energy** of a substance is the total of the random kinetic and potential energies of its particles. For an ideal gas it is all kinetic. The energy needed to change the temperature of a mass $m$ by $\\Delta\\theta$ is:

$$E = mc\\,\\Delta\\theta$$

where $c$ is the specific heat capacity.

### In a rocket engine

Burning the fuel makes a large amount of very hot gas in a small chamber, so its pressure is very high. The nozzle lets that high-pressure gas escape in one direction only, which is what gives the rocket its push (see [Momentum and Collisions](/study/momentum)).

### Going further: entropy

Entropy is not in the required A-level content, but it explains why heat flows the way it does. It measures the number of ways the particles and their energy can be arranged. Left alone, a system moves towards arrangements with more entropy, which is why energy spreads from hot objects to cold ones and never the other way by itself.

### Next on the journey

Hot gas gives a rocket its push. What is it working against? Gravity, the subject of the next lesson.

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
    subtitle: "Use conservation of momentum to work out what happens in collisions, and see how a rocket speeds up.",
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
        unit: 'kg m/s',
        description: 'Mass times velocity, in the direction the object is moving.',
        color: 'text-violet-400'
      },
      {
        symbol: 'm',
        name: 'Mass',
        unit: 'kilograms (kg)',
        description: 'How much matter the object has. More mass makes it harder to start or stop.',
        color: 'text-purple-400',
        range: { min: 1, max: 10, default: 3 }
      },
      {
        symbol: 'v',
        name: 'Velocity',
        unit: 'm/s',
        description: 'Speed in a particular direction.',
        color: 'text-indigo-400',
        range: { min: 1, max: 20, default: 5 }
      }
    ],
    conceptSteps: [
      {
        stepNumber: 1,
        title: 'Momentum is mass times velocity',
        content: 'Momentum, $p = mv$, measures how hard it is to stop something that is moving. Double the mass or double the velocity and the momentum doubles. Momentum also has a direction, the same as the velocity.',
        keyInsight: 'More mass or more speed means more momentum.',
        relatedVariables: ['p', 'm', 'v']
      },
      {
        stepNumber: 2,
        title: 'Total momentum is conserved',
        content: "When objects collide or push apart, and no outside force acts on them, the total momentum before equals the total momentum after. This comes from Newton's third law: the objects push on each other with equal and opposite forces for the same length of time, so the change in one object's momentum is equal and opposite to the change in the other's. Added together, the total does not change.",
        keyInsight: 'Momentum is not lost when objects stick together. Some kinetic energy is transferred to heating and sound, but the total momentum stays the same.',
        relatedVariables: ['p', 'm', 'v']
      },
      {
        stepNumber: 3,
        title: 'A rocket pushes on the gas it throws out',
        content: 'Two objects that start at rest have a total momentum of zero, so when they push apart they move in opposite directions, and the lighter one moves faster. A rocket does this all the time: it throws hot gas (the exhaust) out of the back at high speed, the gas gains momentum backwards, and with no outside force, the rocket gains the same amount forwards.',
        keyInsight: 'A rocket does not push against the air or the ground. That is why it works in space.',
        relatedVariables: ['p', 'm', 'v']
      }
    ],
    solvedExample: {
      problem: 'A $5$ kg ball moving at $10$ m/s collides with a stationary $3$ kg ball. After the collision, the 5 kg ball carries on in the same direction at $4$ m/s. Find the velocity of the 3 kg ball.',
      steps: [
        'Apply conservation of momentum: $p_{\\text{before}} = p_{\\text{after}}$.',
        'Before: $p = 5 \\times 10 + 3 \\times 0 = 50$ kg m/s.',
        'After: $p = 5 \\times 4 + 3 \\times v_2 = 20 + 3v_2$.',
        'Set equal: $50 = 20 + 3v_2$, so $3v_2 = 30$. The answer is positive, so the 3 kg ball moves off in the same direction.'
      ],
      resultFormula: 'v_2 = 10 \\text{ m/s, in the same direction}'
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
    realWorldConnection: 'A large rocket throws out tonnes of hot gas every second, at high speed. The rocket pushes the gas down, and the gas pushes the rocket up with an equal and opposite force.',
    textbookContent: `
## Momentum

Momentum depends on mass and on velocity:

$$p = mv$$

Mass $m$ is in kilograms (kg), velocity $v$ in metres per second (m/s), and momentum $p$ in kg m/s.

Because velocity has a direction, so does momentum. In a problem along a line, take one direction as positive; momentum the other way is then negative.

### Conservation of momentum

When objects collide or push apart, and no outside force acts on them:

**total momentum before = total momentum after**

This is the principle of conservation of momentum. It comes from Newton's third law. During a collision the two objects push on each other with equal and opposite forces for the same length of time, so the change in one object's momentum is equal and opposite to the change in the other's. Added together, the total does not change.

### Collisions

*Example:* a 2 kg trolley moving at 3 m/s hits a stationary 1 kg trolley, and they stick together.

1.  Momentum before: $(2 \\times 3) + (1 \\times 0) = 6$ kg m/s.
2.  Afterwards they move as one object of mass 3 kg at velocity $v$, so the momentum is $3v$.
3.  $3v = 6$, so $v = 2$ m/s.

Momentum is conserved whether the objects stick together or bounce apart. Kinetic energy is different. When objects stick together, some of it is always transferred to other stores, such as heating and sound. Most real bounces lose some too.

### Pushing apart

If two objects start at rest, their total momentum is zero. When they push each other apart it must still be zero, so they move in opposite directions with equal amounts of momentum. The lighter one moves faster.

### How a rocket works

A rocket is the same idea, kept going. The engine throws hot gas out of the back at very high speed. The gas gains momentum backwards. With no outside force acting, the rocket gains an equal amount forwards. The rocket is not pushing against the ground or the air, which is why it works in empty space.

### Next on the journey

So where does fast, high-pressure gas come from? That is the next lesson, on gases and the rocket engine.

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
        question: "A satellite sensor records temperatures of −20, −18, −22, −19 and −21 °C. What is the mean?",
        hint: "Add the values and divide by 5.",
        answer: "−20 °C"
      },
      {
        question: "Find the median and the range of 3, 7, 7, 9, 12, 15.",
        hint: "With six values, the median is halfway between the 3rd and 4th.",
        answer: "Median 8, range 12"
      },
      {
        question: "The mean of five test scores is 80. Four of them are 75, 85, 90 and 70. What is the fifth?",
        hint: "The five scores must total 5 × 80 = 400.",
        answer: "80"
      },
      {
        question: "Find the standard deviation of 4, 8, 6 and 2.",
        hint: "The mean is 5. Square each distance from the mean, find the mean of those squares, then take the square root.",
        answer: "$\\sqrt{5} \\approx 2.24$"
      },
      {
        question: "For 10 readings, $\\sum x = 50$ and $\\sum x^2 = 290$. Find the mean and the standard deviation.",
        hint: "Use $\\sigma^2 = \\frac{\\sum x^2}{n} - \\bar{x}^2$.",
        answer: "Mean 5, standard deviation 2 (variance 29 − 25 = 4)"
      },
      {
        question: "Two thermometers are tested. Readings from A have a standard deviation of 0.1 °C, readings from B 0.5 °C, about the same mean. Which is more precise?",
        hint: "Precise means the readings agree closely with each other.",
        answer: "A: its readings are spread out less."
      },
    ],
    realWorldConnection: 'Engineers use statistics to separate real signals from sensor noise. A reading several standard deviations from the mean is unlikely to be chance, so it is flagged for a closer look.',
    textbookContent: `
## Averages and spread

A set of data is usually summarised by two numbers: one for its centre, and one for how spread out it is.

### Averages

*   The **mean** is the total divided by the number of values: $\\bar{x} = \\dfrac{\\sum x}{n}$.
*   The **median** is the middle value when the data is in order. With an even number of values, it is halfway between the middle two.
*   The **mode** is the value that occurs most often.

The mean uses every value, but one extreme value can pull it a long way. The median is not affected by extreme values, so it is often better for skewed data, such as incomes.

### Spread

*   The **range** is the largest value minus the smallest. It depends only on the two extremes.
*   The **interquartile range** is the upper quartile minus the lower quartile: the spread of the middle half of the data.
*   The **standard deviation** measures how far values typically are from the mean, using every value.

### Standard deviation

The **variance** is the mean of the squared distances from the mean, and the standard deviation $\\sigma$ is its square root:

$$\\sigma^2 = \\frac{\\sum (x - \\bar{x})^2}{n}$$

An equivalent form is easier with **summary statistics**, when you are given $n$, $\\sum x$ and $\\sum x^2$ rather than the data:

$$\\sigma^2 = \\frac{\\sum x^2}{n} - \\bar{x}^2$$

Some calculators and textbooks divide by $n - 1$ instead of $n$ when estimating from a sample. Use the form your specification asks for.

### Worked example

Find the mean and standard deviation of 2, 4, 4, 4, 5, 5, 7, 9.

1.  Mean: $\\bar{x} = \\dfrac{40}{8} = 5$.
2.  Squared distances from 5: $9, 1, 1, 1, 0, 0, 4, 16$, which total 32.
3.  Variance: $\\dfrac{32}{8} = 4$, so $\\sigma = 2$.

Check with summary statistics: $\\sum x^2 = 232$, and $\\dfrac{232}{8} - 5^2 = 29 - 25 = 4$.

### Outliers

An **outlier** is a value far from the rest. Two common rules mark a value as an outlier if it is more than 2 standard deviations from the mean, or more than 1.5 interquartile ranges beyond a quartile. A question will tell you which to use. Check an outlier before removing it: it may be an error, or it may be the most interesting result.

### Sensor readings in space

A spacecraft's sensors are never perfectly steady. Engineers work out the usual mean and standard deviation of each reading. A reading many standard deviations from the mean is very unlikely to be chance, so the software flags it for a closer look.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
*   [GCE AS and A level subject content for mathematics](https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics) (Department for Education)
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
        question: "The number of turns on a coil is doubled, and the flux through it changes at the same rate. What happens to the induced emf?",
        hint: "The emf is proportional to the number of turns.",
        answer: "It doubles."
      },
      {
        question: "A magnet rests next to a coil, and neither moves. Is a voltage induced?",
        hint: "Induction needs a change in the field through the coil.",
        answer: "No. The flux through the coil is not changing."
      },
      {
        question: "A magnetic field of 0.2 T passes straight through a loop of area 0.05 m². What is the flux through the loop?",
        hint: "$\\Phi = BA$.",
        answer: "0.01 Wb"
      },
      {
        question: "The flux through a 200-turn coil falls from 0.5 Wb to 0.1 Wb in 0.2 s. What is the size of the induced emf?",
        hint: "emf = number of turns × change in flux ÷ time taken.",
        answer: "400 V"
      },
      {
        question: "A 100-turn coil of area 0.02 m² sits in a field that rises from 0 to 0.3 T in 0.1 s, at right angles to the coil. Find the induced emf.",
        hint: "Find the change in flux, $\\Delta\\Phi = A \\Delta B$, first.",
        answer: "6 V ($100 \\times 0.006 \\div 0.1$)"
      },
      {
        question: "The north pole of a magnet is pushed into a coil. Which pole forms at the end of the coil facing the magnet, and why?",
        hint: "The induced current opposes the change that causes it.",
        answer: "A north pole, which repels the magnet and opposes its approach (Lenz's law)."
      },
    ],
    realWorldConnection: "Every power station generator and every transformer on the electricity grid works by Faraday's law. So do wireless phone chargers, induction hobs and the pickups on an electric guitar.",
    textbookContent: `
## Electromagnetic induction

When the magnetic field through a coil changes, a voltage is produced across the coil. This is **electromagnetic induction**. If the coil is part of a complete circuit, the voltage drives a current.

### What makes it happen

A voltage is induced when:

*   a magnet moves into or out of a coil,
*   a coil moves or turns in a magnetic field, or
*   the current in a nearby electromagnet changes.

The key is **change**. A magnet sitting still next to a coil induces nothing.

### Magnetic flux

**Magnetic flux** $\\Phi$ measures how much magnetic field passes through an area. For a field $B$ at right angles to an area $A$:

$$\\Phi = BA$$

Flux is measured in webers (Wb). For a coil of $N$ turns, the **flux linkage** is $N\\Phi$.

### Faraday's law

The induced emf equals the rate of change of flux linkage:

$$\\mathcal{E} = -N\\frac{\\Delta \\Phi}{\\Delta t}$$

More turns, a stronger field, or a faster change all give a larger emf.

### Lenz's law

The minus sign is **Lenz's law**: the induced current flows in the direction that **opposes** the change causing it. Push the north pole of a magnet into a coil and the coil's near end becomes a north pole, pushing back. You have to do work to move the magnet, and that work becomes electrical energy. Lenz's law is the conservation of energy at work.

### Worked example

A 200-turn coil has the flux through it fall from 0.5 Wb to 0.1 Wb in 0.2 s.

1.  Change in flux: $0.1 - 0.5 = -0.4$ Wb.
2.  Rate of change: $-0.4 \\div 0.2 = -2$ Wb/s.
3.  $\\mathcal{E} = -200 \\times (-2) = 400$ V.

### Where it is used

Generators in power stations turn coils in magnetic fields. Transformers change voltages using a changing current in one coil to induce a voltage in another. Wireless chargers and induction hobs work the same way.

### A tether in orbit

In 1996 the Space Shuttle unreeled a conducting cable about 20 km long. Moving at orbital speed through the Earth's magnetic field, the cable had an emf of about 3,500 volts induced along it, just as Faraday's law predicts for a conductor cutting through a field.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
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
        title: 'Electron Diffraction',
        content: 'Electrons fired through a thin layer of graphite spread into rings, a diffraction pattern, just as light does through a grating. Diffraction is a wave effect, so this shows that particles can behave as waves, with a wavelength $\\lambda = \\frac{h}{p}$.',
        keyInsight: 'Faster electrons have more momentum and so a shorter wavelength, which makes smaller diffraction rings.',
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
        question: "An ultraviolet photon has twice the frequency of a green photon. How do their energies compare?",
        hint: "$E = hf$.",
        answer: "The ultraviolet photon has twice the energy."
      },
      {
        question: "Radio waves have frequencies around $10^8$ Hz and X-rays around $10^{18}$ Hz. Which photons carry more energy, and by what factor?",
        hint: "Compare the frequencies.",
        answer: "X-ray photons, by a factor of about $10^{10}$."
      },
      {
        question: "Find the energy of a photon of frequency $5.0 \\times 10^{14}$ Hz. Use $h = 6.63 \\times 10^{-34}$ J s.",
        hint: "Multiply $h$ by $f$.",
        answer: "About $3.3 \\times 10^{-19}$ J"
      },
      {
        question: "Light with photons of 3.0 eV falls on a metal whose work function is 2.3 eV. What is the greatest kinetic energy of the electrons released?",
        hint: "Each photon gives all its energy to one electron, which must pay the work function to escape.",
        answer: "0.7 eV"
      },
      {
        question: "Bright red light releases no electrons from a metal, but dim blue light does. Why?",
        hint: "Think about the energy of one photon, not the brightness of the beam.",
        answer: "Each red photon has too little energy to release an electron, however many there are. Each blue photon has enough."
      },
      {
        question: "An electron has momentum $1.0 \\times 10^{-24}$ kg m/s. Find its de Broglie wavelength, using $h = 6.63 \\times 10^{-34}$ J s.",
        hint: "$\\lambda = \\frac{h}{p}$.",
        answer: "About $6.6 \\times 10^{-10}$ m, similar to the spacing of atoms in a crystal, so the electrons can be diffracted."
      },
    ],
    realWorldConnection: 'Quantum mechanics underpins every semiconductor in your phone, spacecraft solar cells, GPS atomic clocks, and MRI scanners. Understanding quantisation is essential to all modern technology.',
    textbookContent: `
## Photons

### Light as packets of energy

Light is a wave: it shows diffraction and interference. But when light gives up its energy, it does so in separate packets called **photons**. The energy of one photon depends only on its frequency:

$$E = hf$$

where $h = 6.63 \\times 10^{-34}$ J s is the **Planck constant**. Using $c = f\\lambda$, this is also $E = \\dfrac{hc}{\\lambda}$. A brighter beam has more photons, not more energetic ones.

Photon energies are tiny, so they are often given in **electronvolts**: $1 \\text{ eV} = 1.60 \\times 10^{-19}$ J.

### Evidence: the photoelectric effect

Shining light on a clean metal can release electrons. Experiments show that:

*   below a certain **threshold frequency**, no electrons are released, however bright the light;
*   above it, electrons are released straight away, even in very dim light;
*   the greatest energy of the electrons depends on the frequency, not the brightness.

A wave model cannot explain this. The photon model can: each electron absorbs one photon. If $hf$ is less than the **work function** $\\phi$, the energy needed to escape, the electron stays put. Otherwise

$$hf = \\phi + E_{k(\\text{max})}$$

### Evidence: line spectra

A hot gas gives out light at only certain sharp frequencies. Electrons in atoms can only have certain energy levels. When an electron drops between two levels it gives out one photon, whose energy $hf$ equals the difference between the levels. Each element has its own set of levels, so its own set of lines.

### Wave-particle duality

Light behaves as a wave when it travels and as a particle when it is absorbed. Matter does the same in reverse: particles such as electrons can behave as waves. Their **de Broglie wavelength** is

$$\\lambda = \\frac{h}{p}$$

where $p$ is the momentum.

### Evidence: electron diffraction

A beam of electrons fired through a thin layer of graphite makes rings on a screen, a diffraction pattern, just like light through a grating. Diffraction is a wave effect, and it only shows up clearly when the wavelength is about the size of the gaps, here the spacing between atoms. Faster electrons have shorter wavelengths and make smaller rings, as $\\lambda = \\dfrac{h}{p}$ predicts.

### Worked example

Find the energy of a photon of green light, $f = 6.0 \\times 10^{14}$ Hz.

1.  $E = hf = 6.63 \\times 10^{-34} \\times 6.0 \\times 10^{14}$
2.  $E \\approx 3.98 \\times 10^{-19}$ J
3.  In electronvolts: $\\dfrac{3.98 \\times 10^{-19}}{1.60 \\times 10^{-19}} \\approx 2.5$ eV

### Reading the light of stars

The dark and bright lines in a star's spectrum are photons absorbed or given out as electrons jump between energy levels. Because each element has its own pattern of lines, astronomers can tell what a star is made of from its light alone.

### Sources

The topics in these notes follow the Department for Education document below.

*   [GCE AS and A level subject content for science](https://www.gov.uk/government/publications/gce-as-and-a-level-for-science) (Department for Education)
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
        unit: 'for example m, A, Hz',
        description: 'The same quantity in the SI unit, ready to use in a formula.',
        color: 'text-cyan-400'
      },
      {
        symbol: 'x',
        name: 'Value with a prefix',
        unit: 'for example km, mA, MHz',
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
        title: 'Same quantity, different number',
        content: 'A length of 2 km and a length of 2000 m are exactly the same distance. Converting units never changes the quantity; it changes the number and the unit together. A smaller unit needs a bigger number to describe the same thing.',
        keyInsight: 'Smaller unit, bigger number. Bigger unit, smaller number.',
        relatedVariables: ['x', 'x_{\\text{base}}']
      },
      {
        stepNumber: 2,
        title: 'Prefixes are powers of ten',
        content: 'A prefix is shorthand for a power of ten: giga (G) is $10^9$, mega (M) is $10^6$, kilo (k) is $10^3$, centi (c) is $10^{-2}$, milli (m) is $10^{-3}$, micro (μ) is $10^{-6}$ and nano (n) is $10^{-9}$. To get to the base unit, replace the prefix with its power of ten: $20\\text{ mA} = 20 \\times 10^{-3}\\text{ A} = 0.02\\text{ A}$.',
        keyInsight: 'To reach the base unit, multiply by the prefix factor. To go back, divide by it.',
        relatedVariables: ['10^{n}']
      },
      {
        stepNumber: 3,
        title: 'Units made of two units',
        content: 'Units such as km/h are built from two units, so convert each one separately. For $72\\text{ km/h}$: the distance is $72\\text{ km} = 72\\,000\\text{ m}$ and the time is $1\\text{ h} = 3600\\text{ s}$, so the speed is $72\\,000 \\div 3600 = 20\\text{ m/s}$.',
        keyInsight: 'To change km/h into m/s, divide by 3.6. To change m/s into km/h, multiply by 3.6.',
        relatedVariables: ['x']
      },
      {
        stepNumber: 4,
        title: 'Areas and volumes',
        content: 'Because $1\\text{ m} = 100\\text{ cm}$, a square metre is $100 \\times 100 = 10\\,000\\text{ cm}^2$ and a cubic metre is $100 \\times 100 \\times 100 = 1\\,000\\,000\\text{ cm}^3$. A common mistake is to use 100 for areas and volumes as well as lengths.',
        keyInsight: 'For an area, square the length factor. For a volume, cube it.',
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
        question: "Convert 450 mA to amperes.",
        hint: "Milli means $10^{-3}$, so divide by 1000.",
        answer: "0.45 A"
      },
      {
        question: "Convert 3.2 km to metres.",
        hint: "Kilo means $10^3$, so multiply by 1000.",
        answer: "3200 m"
      },
      {
        question: "A car travels at 90 km/h. What is its speed in m/s?",
        hint: "Divide by 3.6, or convert 90 km to metres and 1 hour to seconds.",
        answer: "25 m/s"
      },
      {
        question: "A cyclist travels at 15 m/s. What is this in km/h?",
        hint: "Going from m/s to km/h, multiply by 3.6.",
        answer: "54 km/h"
      },
      {
        question: "A tabletop has an area of 2 m². What is this in cm²?",
        hint: "One square metre is $100 \\times 100$ square centimetres.",
        answer: "20 000 cm²"
      },
      {
        question: "Red light has a wavelength of 650 nm. Write this in metres, in standard form.",
        hint: "Nano means $10^{-9}$. Then move the decimal point so the number is between 1 and 10.",
        answer: "$6.5 \\times 10^{-7}$ m"
      },
    ],
    realWorldConnection: 'In 1999 NASA lost the Mars Climate Orbiter because of a unit mix-up. One team\'s software reported thruster impulse in pound-force seconds, and the navigation software expected newton seconds. Nobody converted, the spacecraft approached Mars far too low, and it was lost.',
    textbookContent: `
## Converting units

A physics formula only gives the right answer if every quantity is in units that fit together, normally the SI units: metres, kilograms, seconds, amperes and so on. Convert first, then put the numbers into the formula.

### Prefixes

A prefix in front of a unit stands for a power of ten:

| Prefix | Symbol | Factor | Example |
| --- | --- | --- | --- |
| tera | T | $10^{12}$ | 1 TW = 1 000 000 000 000 W |
| giga | G | $10^{9}$ | 1 GW = 1 000 000 000 W |
| mega | M | $10^{6}$ | 1 MHz = 1 000 000 Hz |
| kilo | k | $10^{3}$ | 1 km = 1000 m |
| centi | c | $10^{-2}$ | 1 cm = 0.01 m |
| milli | m | $10^{-3}$ | 1 mA = 0.001 A |
| micro | μ | $10^{-6}$ | 1 μm = 0.000 001 m |
| nano | n | $10^{-9}$ | 1 nm = 0.000 000 001 m |

To reach the base unit, replace the prefix with its factor. Take care with capitals: m is milli but M is mega.

### Units made of two units

For a unit such as km/h, convert each part separately, as in the 72 km/h example in the idea above.

The shortcut: divide km/h by 3.6 to get m/s, and multiply m/s by 3.6 to get km/h.

### Areas and volumes

Because $1 \\text{ m} = 100 \\text{ cm}$:

*   $1 \\text{ m}^2 = 100 \\times 100 = 10\\,000 \\text{ cm}^2$
*   $1 \\text{ m}^3 = 100 \\times 100 \\times 100 = 1\\,000\\,000 \\text{ cm}^3$

Square the length factor for an area and cube it for a volume. Volumes of liquid are often in litres: $1 \\text{ litre} = 1000 \\text{ cm}^3$, and $1 \\text{ m}^3 = 1000$ litres.

### Standard form

Very large and very small answers are written in standard form. The Moon is on average about 384 000 km from Earth:

$$384\\,000 \\text{ km} = 3.84 \\times 10^8 \\text{ m}$$

### A spacecraft lost to units

Writing the unit with every number, every time, is how engineers avoid mistakes like the one that lost the Mars Climate Orbiter.

### Sources

The topics in these notes follow the Department for Education documents below.

*   [National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study) (Department for Education)
*   [GCSE subject content for biology, chemistry and physics](https://www.gov.uk/government/publications/gcse-single-science) (Department for Education)
`
  }
];
