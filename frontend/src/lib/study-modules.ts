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
    title: 'Gravity & Fields',
    subtitle: 'Understand inverse-square attraction and orbital vectors.',
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
        question: 'If the distance between two masses is tripled, how does the gravitational force change?',
        hint: 'Look at the r² term in the denominator.',
        answer: 'The force becomes 1/9th as strong.'
      },
      {
        question: 'If the mass of the satellite is doubled, what happens to the gravitational force?',
        hint: 'Look at the relationship between F_g and m.',
        answer: 'The force is doubled.'
      }
    ],
    realWorldConnection: 'Engineers use this exact law to calculate the precise trajectories of spacecraft, ensuring they can slingshot around planets or establish stable orbits without burning excess fuel.',
    textbookContent: `
## Newton's Law of Universal Gravitation

The law of universal gravitation, formulated by Sir Isaac Newton in 1687, states that every point mass in the universe attracts every other point mass with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between them.

This relationship is expressed mathematically as:
$F = G \\frac{m_1 m_2}{r^2}$

### Key Components

*   **$F$ (Gravitational Force):** The magnitude of the attractive force between the two bodies, measured in Newtons (N). This force is mutual; body 1 attracts body 2 with the exact same force that body 2 attracts body 1 (Newton's Third Law).
*   **$G$ (Gravitational Constant):** An empirical physical constant. Its value is approximately $6.674 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$. This extremely small value explains why gravitational attraction is only noticeable when at least one mass is extraordinarily large (like a planet).
*   **$m_1, m_2$ (Masses):** The masses of the two interacting objects, measured in kilograms (kg).
*   **$r$ (Distance):** The straight-line distance between the centres of mass of the two objects, measured in metres (m).

### The Inverse-Square Law

The most defining characteristic of gravity is its $1/r^2$ decay. If you double the distance between two objects ($2r$), the gravitational force decreases to $(1/2)^2$, or one-quarter ($1/4$) of its original strength. If you triple the distance, the force becomes one-ninth ($1/9$). 

### Vector Representation

While the formula above calculates the *magnitude* of the force, force is fundamentally a vector quantity. The complete vector form of Newton's law is:
$\\vec{F}_{12} = -G \\frac{m_1 m_2}{|\\vec{r}_{12}|^2} \\hat{r}_{12}$

Where $\\vec{F}_{12}$ is the force exerted on mass 2 by mass 1, $\\vec{r}_{12}$ is the displacement vector from mass 1 to mass 2, and $\\hat{r}_{12}$ is the unit vector pointing from mass 1 to mass 2. The negative sign shows that the force is attractive: it pulls mass 2 back *towards* mass 1.

### Limitations

Newton's law is an excellent approximation for most engineering and orbital mechanics applications. However, it is fundamentally superseded by Albert Einstein's Theory of General Relativity (1915), which describes gravity not as a force, but as the curvature of spacetime caused by mass and energy. Newton's formulation breaks down under extreme conditions, such as near black holes or when describing the precise orbit of Mercury.
    

### References

*   [The Feynman Lectures on Physics, Vol. I, Ch. 7: The Theory of Gravitation](https://www.feynmanlectures.caltech.edu/I_07.html) (Richard P. Feynman)
*   [Philosophiæ Naturalis Principia Mathematica](https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica) (Isaac Newton, 1687)
*   [NASA JPL: Basics of Space Flight - Gravity & Mechanics](https://solarsystem.nasa.gov/basics/)
`
  },
  {
    id: 'prism',
    category: 'physics',
    title: 'Light & Spectrometry',
    subtitle: 'Examine light refraction and wavelength dispersion.',
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
    title: 'Gears & Torque',
    subtitle: 'Analyse rotational velocity and mechanical gear ratios.',
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
        question: 'If a driver gear has 20 teeth and the driven gear has 40 teeth, what is the gear ratio?',
        hint: 'Divide driven teeth by driver teeth.',
        answer: '2.0'
      },
      {
        question: 'If the driver gear turns at 100 RPM, how fast does the driven gear turn in the previous example?',
        hint: 'Divide the driver speed by the gear ratio.',
        answer: '50 RPM'
      }
    ],
    realWorldConnection: 'Rovers on Mars use highly geared motors to drive slowly over rocks while producing enormous amounts of torque to avoid getting stuck.',
    textbookContent: `
## Kinematics of Gear Trains

A gear train is a mechanical system formed by mounting gears on a frame so the teeth of the gears engage. Gear trains are fundamental in mechanical engineering to transmit torque and adjust the rotational speed between an input power source and an output load.

### The Gear Ratio

For two meshing gears (a driver and a driven gear), the fundamental kinematic relationship—assuming no slip between the teeth profiles—dictates that their pitch circles roll against each other without slipping. Therefore, their tangential velocities at the point of contact must be equal.

The gear ratio $R$ is defined by the inverse relationship between the number of teeth $N$ and the angular velocity $\\omega$:
$R = \\frac{\\omega_{\\text{in}}}{\\omega_{\\text{out}}} = \\frac{N_{\\text{out}}}{N_{\\text{in}}}$

### Torque Multiplication

By the principle of conservation of energy (power $P = \\tau \\omega$), the input power must equal the output power in an ideal, frictionless gear system:
$\\tau_{\\text{in}} \\omega_{\\text{in}} = \\tau_{\\text{out}} \\omega_{\\text{out}}$

Substituting the gear ratio yields the torque multiplication equation:
$\\tau_{\\text{out}} = \\tau_{\\text{in}} \\left( \\frac{\\omega_{\\text{in}}}{\\omega_{\\text{out}}} \\right) = \\tau_{\\text{in}} \\left( \\frac{N_{\\text{out}}}{N_{\\text{in}}} \\right)$

If $N_{\\text{out}} > N_{\\text{in}}$, the system is a *speed reducer* and a *torque multiplier*. This is critical in robotics and spacecraft mechanisms where electric motors operate at high speeds with low torque, but actuators require low speeds and high torque.

*Reference: Shigley, J. E., & Mischke, C. R. (2014). Mechanical Engineering Design (10th ed.). McGraw-Hill.*
    

### References

*   [Shigley's Mechanical Engineering Design](https://www.mheducation.com/highered/product/shigley-s-mechanical-engineering-design-budynas-nisbett/M9781260128315.html) (Richard G. Budynas, J. Keith Nisbett)
*   Machinery's Handbook, 31st Edition (Erik Oberg; Industrial Press)
*   [MIT OCW: 2.007 Design and Manufacturing I](https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/)
`
  },
  {
    id: 'trajectory',
    category: 'mechanics',
    title: 'Orbits & Trajectories',
    subtitle: 'Examine Hohmann transfers and orbital ascents.',
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
        question: 'What is the semi-major axis for a transfer from a 10,000 km orbit to a 20,000 km orbit?',
        hint: 'Average the two distances.',
        answer: '15,000 km'
      },
      {
        question: 'How many engine burns are required for a standard Hohmann transfer?',
        hint: 'Think about entering and exiting the transfer ellipse.',
        answer: 'Two.'
      }
    ],
    realWorldConnection: 'This trajectory is used by satellites moving from Low Earth Orbit to Geostationary Orbit, as well as missions sending probes to Mars.',
    textbookContent: `
## Orbital Manoeuvres: The Hohmann Transfer

In orbital mechanics, the Hohmann transfer orbit is an elliptical orbit used to transfer between two circular orbits of different radii around a central body in the same plane. It was first described by Walter Hohmann in 1925.

### The Vis-Viva Equation

The foundation for calculating required velocity changes ($\\Delta v$) is the vis-viva equation, derived from the conservation of specific mechanical energy:
$v^2 = GM \\left( \\frac{2}{r} - \\frac{1}{a} \\right)$
where $v$ is orbital velocity, $r$ is the current distance to the central body, $a$ is the semi-major axis, and $GM$ is the standard gravitational parameter ($\\mu$).

### Carrying Out the Manoeuvre

The Hohmann transfer requires two impulsive velocity changes (engine burns):

1.  **First Burn ($\\Delta v_1$):** Accelerates the spacecraft from the inner circular orbit (radius $r_1$) into an elliptical transfer orbit. The periapsis of this ellipse is $r_1$, and the apoapsis is $r_2$.
    $\\Delta v_1 = \\sqrt{\\frac{\\mu}{r_1}} \\left( \\sqrt{\\frac{2r_2}{r_1 + r_2}} - 1 \\right)$
2.  **Second Burn ($\\Delta v_2$):** Executed half an orbit later at apoapsis ($r_2$), accelerating the spacecraft again to circularise the orbit at the new altitude.
    $\\Delta v_2 = \\sqrt{\\frac{\\mu}{r_2}} \\left( 1 - \\sqrt{\\frac{2r_1}{r_1 + r_2}} \\right)$

The total $\\Delta v$ budget for the mission is the sum of both impulses: $\\Delta v_{\\text{total}} = \\Delta v_1 + \\Delta v_2$. The Hohmann transfer is proven to be the most fuel-efficient two-impulse transfer between coplanar circular orbits when the ratio of the final to initial radius is less than roughly 11.94.

*Reference: Bate, R. R., Mueller, D. D., & White, J. E. (1971). Fundamentals of Astrodynamics. Dover Publications.*
    

### References

*   Fundamentals of Astrodynamics (Roger R. Bate, Donald D. Mueller, Jerry E. White; Dover Publications)
*   [Orbital Mechanics for Engineering Students](https://www.elsevier.com/books/orbital-mechanics-for-engineering-students/curtis/978-0-08-102133-0) (Howard D. Curtis)
*   [NASA: Orbital Mechanics Educational Material](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/)
`
  },
  {
    id: 'circuit',
    category: 'electronics',
    title: 'Circuit Flow (Current)',
    subtitle: 'Study electron flow, resistance, and Ohm\'s Law.',
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
        question: 'If voltage is 5V and resistance is 100 Ω, what is the current?',
        hint: 'I = 5 / 100.',
        answer: '0.05 A (50 mA)'
      },
      {
        question: 'If you want 20 mA (0.02 A) of current from a 10V source, what resistor should you use?',
        hint: 'Work in amperes, not milliamperes (see [Converting Units](/study/units)), then rearrange to R = V / I.',
        answer: '500 Ω'
      }
    ],
    realWorldConnection: 'Spacecraft engineers use these calculations to ensure solar panels and batteries safely power onboard computers without burning them out.',
    textbookContent: `
## Ohm's Law and Linear Circuits

Ohm's law is a fundamental empirical relationship in electrical engineering and solid-state physics, stating that the current through a conductor between two points is directly proportional to the voltage across the two points.

Introduced by Georg Simon Ohm in 1827, it is defined mathematically as:
$I = \\frac{V}{R}$

### Phenomenological Basis

At a microscopic level, Ohm's law is a consequence of the Drude model of electrical conduction. Electrons in a metal are treated as a gas of free particles that accelerate in an applied electric field, but frequently scatter off the vibrating atoms of the crystal lattice. This scattering creates a macroscopic drift velocity proportional to the applied electric field, yielding a constant resistance $R$.

### Key Components

*   **$V$ (Voltage/Potential Difference):** The work done per unit charge to move a charge between two points, measured in Volts (V).
*   **$I$ (Current):** The rate of flow of electric charge, measured in Amperes (A).
*   **$R$ (Resistance):** The opposition to the flow of electric current, measured in Ohms ($\\Omega$).

### Power Dissipation (Joule Heating)

In a purely resistive circuit, the electrical energy is converted entirely into heat. The rate of energy dissipation (power) is given by Joule's first law, combining Ohm's Law and the power equation $P = VI$:
$P = I^2 R = \\frac{V^2}{R}$

This principle is crucial in spacecraft thermal management; resistive components deliberately (heaters) or inadvertently generate heat that must be dissipated via radiators into the vacuum of space.

*Reference: Nilsson, J. W., & Riedel, S. A. (2014). Electric Circuits (10th ed.). Pearson.*
    

### References

*   [The Art of Electronics (3rd Edition)](https://artofelectronics.net/) (Paul Horowitz, Winfield Hill)
*   [Fundamentals of Electric Circuits](https://www.mheducation.com/highered/product/fundamentals-electric-circuits-alexander-sadiku/M9781260226409.html) (Charles K. Alexander, Matthew Sadiku)
*   [MIT OCW: 6.002 Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/)
`
  },
  {
    id: 'waves',
    category: 'electronics',
    title: 'Frequency & Signals',
    subtitle: 'Examine waveform oscillation and grid harmonics.',
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
        question: 'If a wave has a speed of 343 m/s (sound) and a frequency of 343 Hz, what is its wavelength?',
        hint: 'Divide speed by frequency.',
        answer: '1 metre'
      },
      {
        question: 'Which has a shorter wavelength: a 2 GHz Wi-Fi signal or a 5 GHz Wi-Fi signal?',
        hint: 'Higher frequency means shorter wavelength.',
        answer: 'The 5 GHz signal.'
      }
    ],
    realWorldConnection: 'Deep Space Network antennas must be precisely sized and shaped based on the wavelengths of the radio signals used to communicate with probes like Voyager.',
    textbookContent: `
## Wave Kinematics and Electromagnetism

A wave is a propagating dynamic disturbance (change from equilibrium) of one or more quantities. For electromagnetic (EM) waves like light and radio signals, the disturbance is a self-propagating oscillation of coupled electric and magnetic fields.

The fundamental relationship governing periodic waves connects the wave speed $v$, the frequency $f$, and the spatial wavelength $\\lambda$:
$v = f \\cdot \\lambda$

### Wave Parameters

*   **$\\lambda$ (Wavelength):** The spatial period of the wave—the distance over which the wave's shape repeats. In the SI system, it is measured in metres (m).
*   **$f$ (Frequency):** The number of occurrences of a repeating event per unit of time, measured in Hertz (Hz), where 1 Hz = 1 cycle per second.
*   **$v$ (Phase Velocity):** The rate at which the phase of the wave propagates in space. For EM waves in a perfect vacuum, $v = c$ (the speed of light, $\\approx 3 \\times 10^8$ m/s).

### Implications for Antenna Design

In radio astronomy and spacecraft communications, antenna design is strictly dictated by the wavelength of the carrier signal. For optimal resonance and maximum power transmission/reception, the physical length of a dipole antenna is typically constructed to be exactly one half-wavelength ($\\lambda/2$).

For parabolic reflector antennas (like those used in the NASA Deep Space Network), the diameter of the dish determines the diffraction limit and gain of the antenna. The gain $G$ is proportional to $(D/\\lambda)^2$, meaning higher frequencies (shorter wavelengths) allow for much more tightly focused communication beams using the same physical hardware size.

*Reference: Griffiths, D. J. (2017). Introduction to Electrodynamics (4th ed.). Cambridge University Press.*
    

### References

*   [Vibrations and Waves (MIT Introductory Physics Series)](https://wwnorton.com/books/Vibrations-and-Waves/) (A.P. French)
*   [Fundamentals of Physics](https://www.wiley.com/en-us/Fundamentals+of+Physics%2C+12th+Edition-p-9781119801146) (David Halliday, Robert Resnick, Jearl Walker)
*   [The Physics Classroom: Properties of Waves](https://www.physicsclassroom.com/class/waves)
`
  },
  {
    id: 'fractions',
    category: 'mathematics',
    title: 'Fractions & Proportions',
    subtitle: 'Determine payload and fuel ratios for space missions.',
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
    title: 'Binary Numbers',
    subtitle: 'Learn the language of computers: Base-2.',
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
    title: 'Orbital Trigonometry',
    subtitle: 'Calculate altitudes and viewing angles using right triangles.',
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
        question: 'If the angle to a star is 45° and the line-of-sight distance is 1.414 light-years, what is the vertical distance relative to the orbital plane? (sin(45°) ≈ 0.707)',
        hint: 'O = H * sin(θ)',
        answer: 'About 1.0 light-year'
      },
      {
        question: 'A rocket launches straight up and is 100 km away (hypotenuse) from an observer who looks directly up at a 90° angle. What is its altitude?',
        hint: 'sin(90°) = 1.',
        answer: '100 km'
      }
    ],
    realWorldConnection: 'Parallax measurement uses trigonometry to determine the distance to nearby stars by observing them from opposite sides of Earth\'s orbit.',
    textbookContent: `
## Right-Triangle Trigonometry

Trigonometry is the branch of mathematics that studies relationships between side lengths and angles of triangles. It emerged in the Hellenistic world during the 3rd century BC from applications of geometry to astronomical studies.

For any right-angled triangle, the primary trigonometric functions (Sine, Cosine, and Tangent) map a given angle $\\theta$ to the ratio of two specific side lengths.

### The Tangent Function

The tangent of an angle is defined as the ratio of the length of the opposite side to the length of the adjacent side:
$\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}}$

### Astronomical Parallax

Trigonometry is the foundational mathematical tool used in astrophysics to measure interstellar distances. Stellar parallax is the apparent shift in position of a nearby star against the background of distant objects when viewed from opposite ends of Earth's orbit.

By forming a right triangle where:
1.  The **Adjacent** side is the unknown distance to the star ($d$).
2.  The **Opposite** side is the baseline radius of Earth's orbit (1 Astronomical Unit, or AU).
3.  $\\theta$ is the measured parallax angle ($p$).

Astronomers can solve for the distance using the small-angle approximation of the tangent function:
$d = \\frac{1 \\text{ AU}}{\\tan(p)} \\approx \\frac{1 \\text{ AU}}{p \\text{ (in radians)}}$

This technique is responsible for defining the unit of the "parsec" (parallax second)—the distance at which a star exhibits a parallax of one arcsecond.

*Reference: Carroll, B. W., & Ostlie, D. A. (2017). An Introduction to Modern Astrophysics (2nd ed.). Cambridge University Press.*
    

### References

*   [Trigonometry](https://link.springer.com/book/10.1007/978-1-4612-4074-7) (I.M. Gelfand, Mark Saul)
*   [Euler's Introductio in analysin infinitorum](https://en.wikipedia.org/wiki/Introductio_in_analysin_infinitorum) (Leonhard Euler, 1748)
*   [MIT OCW: 18.01 Single Variable Calculus (Trig Review)](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/)
`
  },
  {
    id: 'calculus',
    category: 'mathematics',
    title: 'Derivatives & Rate of Change',
    subtitle: 'Determine spacecraft velocity and acceleration using derivatives.',
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
    title: "Vector Mathematics",
    subtitle: "Calculate orbital thrust vectors and trajectories.",
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
    title: "Orbital Transformations",
    subtitle: "Rotate and translate spacecraft coordinate systems.",
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
    title: "Mission Probability",
    subtitle: "Calculate failure rates and redundancy for deep space missions.",
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
    title: "Dynamic Systems",
    subtitle: "Model continuous orbital decay and atmospheric drag.",
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
    title: 'Order of Operations',
    subtitle: 'Master the order of operations with BIDMAS.',
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
    title: 'Area & Perimeter',
    subtitle: 'Measure the space inside and around 2D shapes.',
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
    title: 'Proportions & Ratios',
    subtitle: 'Compare quantities and scale relationships.',
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
    title: 'Decimals & Percentages',
    subtitle: 'Convert between fractions, decimals and percentages.',
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
Multiply the decimal by 100 (which moves the decimal point two places to the right) and append the $\%$ symbol.
*Example:* $0.625 \\times 100 = 62.5\\%$

**3. Percentage to Decimal:**
Divide the percentage by 100 (which moves the decimal point two places to the left) and remove the $\%$ symbol.
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
    title: 'Angle Workshop',
    subtitle: 'Intermediary concepts of angles, radians, and arc lengths.',
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
    title: 'Long Multiplication',
    subtitle: 'Master multi-digit multiplication step by step.',
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
    title: 'Fraction Operations',
    subtitle: 'Add, subtract, multiply, and divide fractions.',
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
    title: 'Negative Numbers',
    subtitle: 'Navigate the number line and master signed arithmetic.',
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
    title: 'Exponents & Roots',
    subtitle: 'Understand powers, square roots, and scientific notation.',
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
      { question: 'What is 3²?', hint: '3 × 3', answer: '9' },
      { question: 'What is √144?', hint: 'What number times itself equals 144?', answer: '12' }
    ],
    realWorldConnection: 'Scientific notation uses powers of 10 to write huge numbers compactly — the distance to the Sun is $1.5 \\times 10^{11}$ metres.',
    textbookContent: `
## Exponents and Radicals

### Exponents (Powers)

$$a^n = \\underbrace{a \\times a \\times \\cdots \\times a}_{n \\text{ factors}}$$

### Laws of Exponents

| Law | Formula | Example |
|---|---|---|
| Product Rule | $a^m \\cdot a^n = a^{m+n}$ | $2^3 \\cdot 2^4 = 2^7$ |
| Quotient Rule | $\\dfrac{a^m}{a^n} = a^{m-n}$ | $\\dfrac{5^6}{5^2} = 5^4$ |
| Power of a Power | $(a^m)^n = a^{mn}$ | $(3^2)^3 = 3^6$ |
| Zero Exponent | $a^0 = 1$ | $7^0 = 1$ |
| Negative Exponent | $a^{-n} = \\dfrac{1}{a^n}$ | $2^{-3} = \\dfrac{1}{8}$ |

### Radicals (Roots)

$$\\sqrt[n]{a} = a^{1/n}$$

### Scientific Notation

$$93{,}000{,}000 = 9.3 \\times 10^7$$

### References

*   [Khan Academy: Exponents](https://www.khanacademy.org/math/pre-algebra/pre-algebra-exponents-radicals)
*   [Art of Problem Solving: Exponents](https://artofproblemsolving.com/wiki/index.php/Exponent)
    `
  },

  // ─── THERMODYNAMICS ───────────────────────────────────────────────────────────
  {
    id: 'thermodynamics',
    category: 'physics',
    title: 'Thermodynamics',
    subtitle: 'Explore heat, entropy, and the ideal gas law.',
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
    ] as any,
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
        question: 'If the temperature of a fixed-volume gas doubles (in Kelvin), what happens to the pressure?',
        hint: 'At constant V and n, P is proportional to T.',
        answer: 'The pressure doubles.'
      },
      {
        question: 'A gas occupies 4 L at 2 atm. If pressure drops to 1 atm at constant temperature, what is the new volume?',
        hint: 'Use Boyle\'s Law: P₁V₁ = P₂V₂.',
        answer: '8 L'
      },
      {
        question: 'Why must temperature be in Kelvin (not Celsius) for the ideal gas law?',
        hint: 'Think about what happens if T = 0°C in the formula.',
        answer: 'Celsius can be zero or negative, which would imply zero or negative pressure — physically impossible. Kelvin starts at absolute zero, ensuring T is always positive.'
      }
    ],
    realWorldConnection: 'Spacecraft thermal control engineers apply thermodynamics daily — managing heat from the Sun, electronics, and the cold of deep space to keep instruments within safe operating temperatures.',
    textbookContent: `
## The Ideal Gas Law and Thermodynamics

The **Ideal Gas Law** is the equation of state for a hypothetical ideal gas, a useful approximation for many real gases under standard conditions:

$$PV = nRT$$

### State Variables

| Symbol | Quantity | SI Unit |
|---|---|---|
| $P$ | Pressure | Pascal (Pa) |
| $V$ | Volume | Cubic metre (m³) |
| $n$ | Amount of substance | Mole (mol) |
| $R$ | Ideal gas constant | 8.314 J/(mol·K) |
| $T$ | Temperature | Kelvin (K) |

### The Four Laws it Unifies

*   **Boyle's Law (1662):** At constant temperature and amount, $PV = \\text{const}$, so $P \\propto 1/V$.
*   **Charles's Law (1787):** At constant pressure and amount, $V/T = \\text{const}$, so $V \\propto T$.
*   **Gay-Lussac's Law (1809):** At constant volume and amount, $P/T = \\text{const}$, so $P \\propto T$.
*   **Avogadro's Law (1811):** At constant pressure and temperature, $V/n = \\text{const}$, so $V \\propto n$.

### The Laws of Thermodynamics

1. **Zeroth Law:** If system A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C. (This defines temperature.)
2. **First Law (Conservation of Energy):** The change in internal energy equals heat added minus work done: $\\Delta U = Q - W$.
3. **Second Law:** The total entropy of an isolated system never decreases. Heat flows spontaneously from high to low temperature.
4. **Third Law:** As temperature approaches absolute zero, the entropy of a perfect crystal approaches a constant minimum.

### Entropy

Entropy $S$ is a measure of the number of microscopic configurations $\\Omega$ consistent with a macroscopic state:
$$S = k_B \\ln \\Omega$$
where $k_B = 1.38 \\times 10^{-23}$ J/K is the Boltzmann constant.

### References

*   [Thermal Physics](https://global.oup.com/academic/product/thermal-physics-9780198566434) (Blundell & Blundell, Oxford)
*   [Feynman Lectures on Physics, Vol. I, Ch. 39–44](https://www.feynmanlectures.caltech.edu/I_39.html)
*   [NIST: Thermophysical Properties](https://webbook.nist.gov/chemistry/fluid/)
    `
  },

  // ─── MOMENTUM & COLLISIONS ────────────────────────────────────────────────────
  {
    id: 'momentum',
    category: 'mechanics',
    title: 'Momentum & Collisions',
    subtitle: 'Apply conservation of momentum to impacts and launches.',
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
    ] as any,
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
        question: 'A 70 kg astronaut floating in space throws a 2 kg tool at 10 m/s. How fast do they recoil?',
        hint: 'Initial total momentum is zero. Use conservation of momentum.',
        answer: '≈ 0.286 m/s in the opposite direction'
      },
      {
        question: 'Two ice skaters (60 kg and 80 kg) push off each other from rest. The 60 kg skater moves at 4 m/s. How fast does the 80 kg skater move?',
        hint: 'Total initial momentum = 0. So 60×4 = 80×v.',
        answer: '3 m/s'
      }
    ],
    realWorldConnection: 'Spacecraft navigation uses momentum conservation. When a rocket expels propellant backward at high speed, the spacecraft is propelled forward — just like an astronaut throwing a spanner.',
    textbookContent: `
## Momentum, Impulse, and Conservation Laws

Linear momentum is a fundamental conserved quantity in classical mechanics. For a particle of mass $m$ moving with velocity $\\vec{v}$:

$$\\vec{p} = m\\vec{v}$$

### Newton's Second Law (Momentum Form)

Newton's original formulation of his second law:
$$\\vec{F} = \\frac{d\\vec{p}}{dt}$$

For constant mass, this reduces to $F = ma$. For variable mass systems (rockets burning fuel):
$$F = m\\frac{dv}{dt} + v_e\\frac{dm}{dt}$$
where $v_e$ is the exhaust velocity.

### Conservation of Linear Momentum

In an isolated system (no net external force):
$$\\vec{p}_{\\text{total}} = \\sum_i m_i \\vec{v}_i = \\text{constant}$$

### Types of Collisions

| Type | Kinetic Energy | Momentum |
|---|---|---|
| Elastic | Conserved | Conserved |
| Inelastic | Not conserved | Conserved |
| Perfectly Inelastic | Max KE lost | Conserved |

In a **perfectly inelastic** collision, objects stick together:
$$m_1 v_1 + m_2 v_2 = (m_1 + m_2) v_f$$

### Impulse–Momentum Theorem

$$J = \\int_{t_1}^{t_2} F\\,dt = \\Delta p$$

For constant force: $J = F \\Delta t$.

### The Tsiolkovsky Rocket Equation

From momentum conservation for variable mass systems:
$$\\Delta v = v_e \\ln\\left(\\frac{m_0}{m_f}\\right)$$

### References

*   [Classical Mechanics](https://www.cambridge.org/us/universitypress/subjects/physics/classical-mechanics-and-fluid-mechanics/classical-mechanics) (John R. Taylor, University Science Books)
*   [Feynman Lectures, Vol. I, Ch. 10: Conservation of Momentum](https://www.feynmanlectures.caltech.edu/I_10.html)
*   [NASA: How Rockets Work](https://www.grc.nasa.gov/WWW/k-12/airplane/rktpow.html)
    `
  },

  // ─── STATISTICS & DATA ────────────────────────────────────────────────────────
  {
    id: 'statistics',
    category: 'mathematics',
    title: 'Statistics & Data',
    subtitle: 'Analyse distributions, averages, and standard deviation.',
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
    ] as any,
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
    title: 'Electromagnetism',
    subtitle: "Explore Faraday's law, magnetic flux, and induced voltage.",
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
    ] as any,
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
    title: 'Quantum Mechanics',
    subtitle: "Discover wave-particle duality, Planck's constant, and photon energy.",
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
    ] as any,
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
    title: 'Converting Units',
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
