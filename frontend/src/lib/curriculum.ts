import type { ConceptId } from '@/lib/study-modules';

/**
 * Where each lesson sits in the curriculum for England.
 *
 * Every statement is quoted from a Department for Education document on gov.uk:
 * the national curriculum programmes of study, or the GCSE and A-level subject
 * content that every exam board's specification must cover. Nothing here comes
 * from an exam board, a publisher or a revision site. Superscripts lost when the
 * documents are read as plain text have been put back; nothing else is altered.
 *
 * Checked against the published documents on 12 October 2026.
 */
export const CURRICULUM_CHECKED = '12 October 2026';

export const CURRICULUM_SOURCES = {
  ncMaths: { title: 'National curriculum in England: mathematics programmes of study', url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study' },
  ncScience: { title: 'National curriculum in England: science programmes of study', url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study' },
  ncComputing: { title: 'National curriculum in England: computing programmes of study', url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study' },
  gcseMaths: { title: 'GCSE mathematics: subject content and assessment objectives', url: 'https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives' },
  gcsePhysics: { title: 'GCSE subject content for biology, chemistry and physics', url: 'https://www.gov.uk/government/publications/gcse-single-science' },
  alMaths: { title: 'GCE AS and A level subject content for mathematics', url: 'https://www.gov.uk/government/publications/gce-as-and-a-level-mathematics' },
  alScience: { title: 'GCE AS and A level subject content for science', url: 'https://www.gov.uk/government/publications/gce-as-and-a-level-for-science' },
  alFurtherMaths: { title: 'GCE AS and A level subject content for further mathematics', url: 'https://www.gov.uk/government/publications/gce-as-and-a-level-further-mathematics' },
} as const;

export type CurriculumSource = keyof typeof CURRICULUM_SOURCES;

export type CurriculumPlace = {
  /** The stage the lesson mainly belongs to, in words. */
  stage: string;
  /** What the official documents say pupils should be taught, word for word. */
  statements: { source: CurriculumSource; where: string; text: string }[];
  /** Where the lesson goes further than, or differs from, the official content. */
  note?: string;
};

export const CURRICULUM: Record<ConceptId, CurriculumPlace> = {
  arithmetic: {
    stage: "Key stage 2, Year 6",
    statements: [
      { source: 'ncMaths', where: "Year 6", text: "use their knowledge of the order of operations to carry out calculations involving the 4 operations" },
      { source: 'ncMaths', where: "Key stage 3", text: "use conventional notation for the priority of operations, including brackets, powers, roots and reciprocals" },
    ],
  },
  multiplication: {
    stage: "Key stage 2, Years 5 and 6",
    statements: [
      { source: 'ncMaths', where: "Year 5", text: "multiply numbers up to 4 digits by a one- or two-digit number using a formal written method, including long multiplication for two-digit numbers" },
      { source: 'ncMaths', where: "Year 6", text: "multiply multi-digit numbers up to 4 digits by a two-digit whole number using the formal written method of long multiplication" },
    ],
  },
  fractions: {
    stage: "Key stage 2, Year 5, leading into key stage 3",
    statements: [
      { source: 'ncMaths', where: "Year 5", text: "identify, name and write equivalent fractions of a given fraction, represented visually, including tenths and hundredths" },
      { source: 'ncMaths', where: "Key stage 3", text: "express 1 quantity as a fraction of another, where the fraction is less than 1 and greater than 1" },
    ],
  },
  "fraction-ops": {
    stage: "Key stage 2, Year 6",
    statements: [
      { source: 'ncMaths', where: "Year 6", text: "add and subtract fractions with different denominators and mixed numbers, using the concept of equivalent fractions" },
      { source: 'ncMaths', where: "Year 6", text: "multiply simple pairs of proper fractions, writing the answer in its simplest form" },
      { source: 'ncMaths', where: "Year 6", text: "divide proper fractions by whole numbers" },
    ],
    note: "Dividing one fraction by another is taught in key stage 3; Year 6 covers dividing a fraction by a whole number.",
  },
  "decimals-percentages": {
    stage: "Key stage 2, Years 5 and 6",
    statements: [
      { source: 'ncMaths', where: "Year 5", text: "recognise the per cent symbol (%) and understand that per cent relates to ‘number of parts per 100’, and write percentages as a fraction with denominator 100, and as a decimal fraction" },
      { source: 'ncMaths', where: "Year 6", text: "recall and use equivalences between simple fractions, decimals and percentages, including in different contexts" },
    ],
  },
  "basic-geometry": {
    stage: "Key stage 2, Years 5 and 6",
    statements: [
      { source: 'ncMaths', where: "Year 5", text: "measure and calculate the perimeter of composite rectilinear shapes in centimetres and metres" },
      { source: 'ncMaths', where: "Year 5", text: "calculate and compare the area of rectangles (including squares), including using standard units, square centimetres (cm²) and square metres (m²), and estimate the area of irregular shapes" },
      { source: 'ncMaths', where: "Year 6", text: "recognise that shapes with the same areas can have different perimeters and vice versa" },
    ],
  },
  "negative-numbers": {
    stage: "Key stage 3",
    statements: [
      { source: 'ncMaths', where: "Year 6", text: "use negative numbers in context, and calculate intervals across 0" },
      { source: 'ncMaths', where: "Key stage 3", text: "use the 4 operations, including formal written methods, applied to integers, decimals, proper and improper fractions, and mixed numbers, all both positive and negative" },
    ],
    note: "Negative numbers are first met in context in key stage 2. Multiplying and dividing with them is key stage 3 work.",
  },
  proportions: {
    stage: "Key stage 3",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "use ratio notation, including reduction to simplest form" },
      { source: 'ncMaths', where: "Key stage 3", text: "understand that a multiplicative relationship between 2 quantities can be expressed as a ratio or a fraction" },
      { source: 'ncMaths', where: "Key stage 3", text: "solve problems involving direct and inverse proportion, including graphical and algebraic representations" },
    ],
  },
  "exponents-roots": {
    stage: "Key stage 3",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "use integer powers and associated real roots (square, cube and higher), recognise powers of 2, 3, 4, 5 and distinguish between exact representations of roots and their decimal approximations" },
      { source: 'ncMaths', where: "Key stage 3", text: "interpret and compare numbers in standard form A x 10ⁿ 1≤A<10, where n is a positive or negative integer or 0" },
    ],
  },
  binary: {
    stage: "Key stage 3 computing",
    statements: [
      { source: 'ncComputing', where: "Key stage 3", text: "understand how numbers can be represented in binary, and be able to carry out simple operations on binary numbers [for example, binary addition, and conversion between binary and decimal]" },
    ],
    note: "Binary sits in the computing curriculum, not the mathematics one.",
  },
  gears: {
    stage: "GCSE physics (key stage 4)",
    statements: [
      { source: 'ncScience', where: "Year 5", text: "recognise that some mechanisms including levers, pulleys and gears allow a smaller force to have a greater effect" },
      { source: 'ncScience', where: "Key stage 3", text: "simple machines give bigger force but at the expense of smaller movement (and vice versa): product of force and displacement unchanged" },
      { source: 'gcsePhysics', where: "GCSE physics: Forces", text: "explain how levers and gears transmit the rotational effects of forces" },
    ],
    note: "Gears are first met in Year 5 science. Working out gear ratios and turning forces is GCSE work.",
  },
  units: {
    stage: "GCSE (key stage 4), building on key stage 3",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "change freely between related standard units [for example time, length, area, volume/capacity, mass]" },
      { source: 'gcsePhysics', where: "GCSE: Working scientifically", text: "use prefixes and powers of ten for orders of magnitude (e.g. tera, giga, mega, kilo, centi, milli, micro and nano)" },
      { source: 'gcsePhysics', where: "GCSE: Working scientifically", text: "interconvert units" },
    ],
  },
  circuit: {
    stage: "GCSE physics (key stage 4), building on key stage 3",
    statements: [
      { source: 'ncScience', where: "Key stage 3", text: "potential difference, measured in volts, battery and bulb ratings; resistance, measured in ohms, as the ratio of potential difference (p.d.) to current" },
      { source: 'gcsePhysics', where: "GCSE physics: Electricity", text: "recall that current (I) depends on both resistance (R) and potential difference (V) and the units in which these are measured; recall and apply the relationship between I, R and V" },
    ],
  },
  waves: {
    stage: "GCSE physics (key stage 4)",
    statements: [
      { source: 'gcsePhysics', where: "GCSE physics: Waves in matter", text: "describe wave motion in terms of amplitude, wavelength, frequency and period; define wavelength and frequency and describe and apply the relationship between these and the wave velocity" },
      { source: 'gcsePhysics', where: "GCSE physics: Waves in matter", text: "describe the difference between transverse and longitudinal waves" },
    ],
  },
  prism: {
    stage: "GCSE physics (key stage 4), building on key stage 3",
    statements: [
      { source: 'ncScience', where: "Key stage 3", text: "use of ray model to explain imaging in mirrors, the pinhole camera, the refraction of light and action of convex lens in focusing (qualitative); the human eye" },
      { source: 'ncScience', where: "Key stage 3", text: "colours and the different frequencies of light, white light and prisms (qualitative only)" },
      { source: 'gcsePhysics', where: "GCSE physics: Light and electromagnetic waves", text: "recall that different substances may absorb, transmit, refract, or reflect these waves in ways that vary with wavelength; explain how some effects are related to differences in the velocity of the waves in different substances" },
    ],
    note: "The Department for Education content treats refraction in words. Calculating with Snell's law goes further than it requires, so check whether your own specification asks for it.",
  },
  momentum: {
    stage: "GCSE physics (key stage 4)",
    statements: [
      { source: 'gcsePhysics', where: "GCSE physics: Forces and motion", text: "define momentum and describe examples of momentum in collisions" },
      { source: 'alScience', where: "A-level physics: Mechanics (momentum)", text: "principle of conservation of momentum" },
      { source: 'alScience', where: "A-level physics: Mechanics (momentum)", text: "calculations for one-dimensional problems" },
    ],
    note: "Conservation of momentum is listed in the A-level content. Check your own GCSE specification for how far it goes.",
  },
  trigonometry: {
    stage: "GCSE mathematics (key stage 4), building on key stage 3",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "use Pythagoras’ Theorem and trigonometric ratios in similar triangles to solve problems involving right-angled triangles" },
      { source: 'ncMaths', where: "Key stage 4", text: "apply Pythagoras’ Theorem and trigonometric ratios to find angles and lengths in right-angled triangles {and, where possible, general triangles} in 2 {and 3} dimensional figures" },
    ],
  },
  probability: {
    stage: "GCSE mathematics (key stage 4), building on key stage 3",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "understand that the probabilities of all possible outcomes sum to 1" },
      { source: 'gcseMaths', where: "GCSE mathematics: Probability", text: "calculate the probability of independent and dependent combined events, including using tree diagrams and other representations, and know the underlying assumptions" },
    ],
  },
  vectors: {
    stage: "GCSE mathematics (key stage 4)",
    statements: [
      { source: 'gcseMaths', where: "GCSE mathematics: Vectors", text: "apply addition and subtraction of vectors, multiplication of vectors by a scalar, and diagrammatic and column representations of vectors; use vectors to construct geometric arguments and proofs" },
      { source: 'alScience', where: "A-level physics: Vectors and scalars", text: "resolution of vectors into two components at right angles" },
      { source: 'alMaths', where: "A-level mathematics: Vectors", text: "Calculate the magnitude and direction of a vector and convert between component form and magnitude/direction form" },
    ],
    note: "Finding the size and direction of a vector from its components is listed in the A-level content.",
  },
  statistics: {
    stage: "A-level mathematics",
    statements: [
      { source: 'ncMaths', where: "Key stage 3", text: "describe, interpret and compare observed distributions of a single variable through: appropriate graphical representation involving discrete, continuous and grouped data; and appropriate measures of central tendency (mean, mode, median) and spread (range, consideration of outliers)" },
      { source: 'alMaths', where: "A-level mathematics: Data presentation and interpretation", text: "Interpret measures of central tendency and variation, extending to standard deviation" },
      { source: 'alMaths', where: "A-level mathematics: Data presentation and interpretation", text: "Be able to calculate standard deviation, including from summary statistics" },
    ],
    note: "Mean, median, mode and range are key stage 3 work. Variance and standard deviation come in at A-level.",
  },
  angles: {
    stage: "A-level mathematics",
    statements: [
      { source: 'gcseMaths', where: "GCSE mathematics: Geometry and measures", text: "calculate arc lengths, angles and areas of sectors of circles" },
      { source: 'alMaths', where: "A-level mathematics: Trigonometry", text: "Work with radian measure, including use for arc length and area of sector" },
    ],
    note: "Arc lengths and sector areas using degrees are GCSE work. Radians are introduced at A-level.",
  },
  gravity: {
    stage: "A-level physics",
    statements: [
      { source: 'alScience', where: "A-level physics: Fields", text: "gravitational force and inverse square field for point (or spherical) masses" },
      { source: 'ncScience', where: "Key stage 3", text: "gravity force, weight = mass x gravitational field strength (g), on Earth g=10 N/kg, different on other planets and stars; gravity forces between Earth and Moon, and between Earth and sun (qualitative only)" },
    ],
  },
  trajectory: {
    stage: "A-level physics",
    statements: [
      { source: 'gcsePhysics', where: "GCSE physics: Space physics", text: "explain for circular orbits how the force of gravity can lead to changing velocity of a planet but unchanged speed, and explain how, for a stable orbit, the radius must change if this speed changes (qualitative only)" },
      { source: 'alScience', where: "A-level physics: Mechanics", text: "application of F = ma = mv²/r = mrω² to motion in a circle at constant speed" },
    ],
    note: "Hohmann transfers are not named in the Department for Education content. This lesson applies the A-level ideas of gravity and circular motion to a real spaceflight problem.",
  },
  calculus: {
    stage: "A-level mathematics",
    statements: [
      { source: 'alMaths', where: "A-level mathematics: Differentiation", text: "Understand and use the derivative of f(x) as the gradient of the tangent to the graph of y = f(x) at a general point (x, y);the gradient of the tangent as a limit; interpretation as a rate of change" },
      { source: 'alMaths', where: "A-level mathematics: Kinematics", text: "Use calculus in kinematics for motion in a straight line" },
    ],
  },
  thermodynamics: {
    stage: "A-level physics",
    statements: [
      { source: 'gcsePhysics', where: "GCSE physics: equations", text: "for gases: pressure x volume = constant (for a given mass of gas and at a constant temperature)" },
      { source: 'alScience', where: "A-level physics: Matter", text: "ideal gases; pV = NkT" },
      { source: 'alScience', where: "A-level physics: Matter", text: "absolute zero" },
      { source: 'alScience', where: "A-level physics: Matter", text: "relationship between temperature and average molecular kinetic energy" },
    ],
    note: "The official content writes the ideal gas equation as pV = NkT. This lesson uses the equivalent form pV = nRT. Entropy is not in the required content.",
  },
  electromagnetism: {
    stage: "A-level physics",
    statements: [
      { source: 'gcsePhysics', where: "GCSE physics: Magnetism and electromagnetism", text: "recall that a change in the magnetic field around a conductor can give rise to an induced potential difference across its ends" },
      { source: 'alScience', where: "A-level physics: Fields", text: "Faraday’s and Lenz’s laws" },
      { source: 'alScience', where: "A-level physics: Fields", text: "emf equals rate of change of magnetic flux linkage" },
    ],
  },
  quantum: {
    stage: "A-level physics",
    statements: [
      { source: 'alScience', where: "A-level physics: Quantum and nuclear physics", text: "photon model to explain observable phenomena" },
      { source: 'alScience', where: "A-level physics: Quantum and nuclear physics", text: "evidence supporting the photon model" },
      { source: 'alScience', where: "A-level physics: Quantum and nuclear physics", text: "wave-particle duality, particle diffraction" },
    ],
  },
  matrices: {
    stage: "A-level further mathematics",
    statements: [
      { source: 'alFurtherMaths', where: "A-level further mathematics: Matrices", text: "Add, subtract and multiply conformable matrices; multiply a matrix by a scalar" },
      { source: 'alFurtherMaths', where: "A-level further mathematics: Matrices", text: "Use matrices to represent linear transformations in 2-D; successive transformations" },
    ],
    note: "Matrices are in further mathematics, not A-level mathematics.",
  },
  diffeq: {
    stage: "A-level mathematics",
    statements: [
      { source: 'alMaths', where: "A-level mathematics: Differentiation", text: "Construct simple differential equations in pure mathematics and in context" },
      { source: 'alMaths', where: "A-level mathematics: Integration", text: "Evaluate the analytical solution of simple first order differential equations with separable variables, including finding particular solutions" },
    ],
  },
};
