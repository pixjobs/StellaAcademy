# Lesson content audit

**Date:** 11 October 2026
**Scope:** all 28 lessons in `frontend/src/lib/study-modules.ts`, the 41 flashcards in `GSAPSimulation.tsx`, and all 55 reference links.

## Status: corrections applied (11 October 2026)

Everything listed under "Errors that teach something wrong", "Smaller points" and "Display bugs" below has been corrected in the source, and each correction was checked on the rendered page. The American units, spellings and references have been replaced with UK ones (BIDMAS, metric units, pounds, the national curriculum). The three dead links are replaced or reduced to plain citations. Equations on their own line in the notes now render as centred display equations.

Not addressed, because they are content decisions and not corrections: the thinness of each lesson, lesson titles and subtitles that promise more than is taught, level fit, and overlap between lessons. See "Lesson by lesson" and "Recommendation". The lessons have still not been reviewed by a subject teacher.

A 29th lesson, **Converting Units** (GCSE physics), was added after the audit. It covers prefixes, compound units, and area and volume, with six practice questions and an interactive converter. Its numbers were worked by hand and the converter was tested against known values, but like the others it has not been reviewed by a teacher.

The sections below describe the content as it was found.

## Verdict

The arithmetic is sound: every worked example, all 58 practice answers and all 41 flashcard answers are correct (two have small rounding slips). The problems are elsewhere:

- **Seven lessons state something wrong or misleading** in their explanations or notes.
- **Eight lessons had visibly broken text on the page.** These are now fixed.
- **Every lesson is thin.** One formula, one worked example and about two practice questions is an introduction, not revision material.
- **The content is written for an American audience** and often for the wrong level.

None of this is hard to fix lesson by lesson. The larger decision is whether to keep 28 shallow lessons or make a smaller set properly good.

## What was and was not checked

Checked: every formula, definition, explanation, worked example, practice answer and flashcard, recomputing the numbers. Every lesson page was loaded in a browser and scanned for broken maths. Every reference link was requested.

Not checked:

- **Exam-board coverage.** No AQA, Edexcel or OCR specification was consulted. Level comments below are from general knowledge of the UK curriculum.
- **The animations' physics.** The text and numbers inside the simulations were read; whether each animation moves correctly was not verified.
- **Twelve reference links** that refuse automated requests (see the end).
- **Whether students learn from it.** Nothing here has been tried with a learner.

## Errors that teach something wrong

| Lesson | Problem | Correction |
|---|---|---|
| Dynamic Systems (`diffeq`) | Says drag proportional to v² gives "a smooth exponential decay curve, bringing the capsule to a safe, steady speed". | The solution of dv/dt = −kv² is v = v₀ / (1 + kv₀t), which falls off as 1/t, not exponentially. Drag alone never gives a steady speed; that needs gravity (terminal velocity). |
| Mission Probability (`probability`) | The notes are about Boolean algebra and logic gates, not probability. | Replace with notes on independent events, the complement rule and "at least one". |
| Gravity & Fields (`gravity`) | The vector form in the notes has the wrong sign for the definitions given. It defines r̂₁₂ as pointing from mass 1 to mass 2, then gives the force on mass 1 as −G m₁m₂/r² r̂₁₂, which points away from mass 2. | Either drop the minus sign or define the unit vector the other way round. |
| Thermodynamics | "The total entropy of an isolated system always increases." The step is titled "The Four Laws Combined" and names three. | Entropy never decreases (the notes say this correctly). Name the fourth law (pressure law) or retitle the step. |
| Long Multiplication | The headline formula says a × b is b added a times. The variable definitions and the key point say it is a added b times. It also claims long multiplication is "the foundation of all computer arithmetic". | Make the formula match the definitions. Drop or soften the computing claim. |
| Orbits & Trajectories (`trajectory`) | "Without the second burn, the spacecraft would fall back to its original orbit." | It stays on the transfer ellipse, returning to the original altitude once per orbit. |
| Vector Mathematics | Writes the magnitude as a vector: "v⃗² = vₓ² + v_y²" and "v⃗ = 5000 m/s", and calls it "total velocity". | Use \|v⃗\| or v for the magnitude and call it speed. |

Smaller points:

- **Unsupported real-world claims.** Electromagnetism says every ISS solar panel "drives power through transformer circuits" and that induction is used "in spacecraft docking for wireless power transfer". Statistics says a reading beyond 3σ "triggers an automatic spacecraft health alert". I could not support either; reword or cite.
- **History.** Quantum Mechanics says Planck solved the "ultraviolet catastrophe" in 1900. That is the common textbook story, but the term and the problem as stated came later.
- **Rounding.** Gravity gives 8870 N; the values shown give 8876 N, so ≈ 8880 N. Quantum gives 2.49 eV; it is 2.48 eV.
- **Thermodynamics** says molecules hit the walls "millions of times per second". The real figure is vastly larger.

## Display bugs

Fixed during the audit:

- **Decimals & Percentages:** the worked example read "A 40shirtisonsalefor25" and lost the rest of the question. A currency `$` was being read as the start of a formula. The same bug garbled a practice question in **Proportions & Ratios** and a tip example in the notes. Currency is now in pounds.
- **Statistics & Data:** the headline formula was shown without its square root, making it the formula for variance while labelled standard deviation. It now shows σ² = Σ(x − μ)² / N. Bold markers also showed as literal asterisks here and in **Quantum Mechanics**.
- **Light & Spectrometry:** a hint and an answer showed raw code (`\theta_r`).
- **Fraction Operations, Negative Numbers, Exponents & Roots:** key points and the real-world line showed raw formula code.
- **Notes headings** had their link marker on the wrong side (a library option was renamed by the earlier UK-spelling commit).
- **Units** in the glossary were forced to capitals (metres shown as "M").
- **Optics reference link** was broken by the same spelling commit ("catalogue" in a URL).

Still open:

- **Flashcards mark correct answers wrong.** They compare typed text exactly, so "0.5" for 1/2, "75%" for 75, "3/6" for 1/2 and ".05" for 0.05 are all rejected.
- **Area & Perimeter** shows only the area formula in the interactive formula, though perimeter is defined beside it.
- **Order of Operations:** the stored formula says 8 − 4 × 2 where the worked example and flashcard say 8 − 4 ÷ 2.
- **Binary Numbers** practice asks "What is 100 in decimal?" without saying the 100 is binary.

## Lesson by lesson

Level is the site's current label. "Fit" is whether the content matches that level.

| Lesson | Level | Fit | Main gaps |
|---|---|---|---|
| Light & Spectrometry | GCSE | Check | Snell's law with sines may be beyond some GCSE specifications. Title promises spectrometry; content is refraction. |
| Circuit Flow (Current) | GCSE | Good | Only I = V/R. No series and parallel, power, or charge. |
| Frequency & Signals | GCSE | Good | Subtitle promises "grid harmonics", which never appear. No period, amplitude, or transverse and longitudinal waves. |
| Binary Numbers | GCSE | Good | Thinnest lesson: one step, one practice question. No decimal to binary, addition or hexadecimal. |
| Orbital Trigonometry | GCSE | Good | Teaches sine only; cosine and tangent are named but not used. Two of the practice questions are contrived (a 90° triangle; light-years "relative to the orbital plane"). |
| Vector Mathematics | GCSE | Mixed | Magnitude by Pythagoras is GCSE. Dot and cross products are well beyond it. |
| Mission Probability | GCSE | Narrow | One formula for redundancy. No tree diagrams, and/or rules, or conditional probability. Notes are off-topic (see above). |
| Exponents & Roots | GCSE | Easy | Subtitle promises scientific notation; the steps skip it. Practice is 3² and √144. |
| Momentum & Collisions | GCSE | Good | The strongest lesson. Could add a "stick together" example. |
| Statistics & Data | GCSE | Mixed | Mean, median and mode are GCSE. Standard deviation and the normal distribution are A-level. |
| Gravity & Fields | A-level | Good | No field strength g, potential, or orbital speed, though title and subtitle promise fields and orbits. |
| Orbits & Trajectories | A-level | Poor | Hohmann transfers are not A-level material, and the only maths is averaging two numbers. The slider (delta-v) is unrelated to the formula. |
| Derivatives & Rate of Change | A-level | Good | Power rule only. No chain or product rule, no integration. |
| Orbital Transformations | A-level | Good (further maths) | Subtitle says "rotate and translate"; translation is not covered. |
| Dynamic Systems | A-level | Poor | Never solves a differential equation; it only evaluates one side. Separation of variables is mentioned, not shown. |
| Thermodynamics | A-level | Good | Title and subtitle promise heat and entropy; the worked content is the ideal gas law. |
| Electromagnetism | A-level | Good | Solid. One worked example only. |
| Quantum Mechanics | A-level | Good | Photon energy fits. The uncertainty principle and Schrödinger equation go beyond A-level. |
| Angle Workshop | A-level | Good | Was labelled GCSE; radians are A-level, so I moved it. Subtitle wording ("Intermediary concepts") is odd. |
| Gears & Torque | Foundations | Good | Fine as an introduction. |
| Fractions & Proportions | Foundations | Overlap | Covers the same ground as Fraction Operations and Proportions & Ratios. Claims equivalent fractions lead "naturally" to calculus. |
| Order of Operations | Foundations | US | Built around PEMDAS and "in the United States". UK schools teach BIDMAS or BODMAS. |
| Area & Perimeter | Foundations | US | Inches, feet, "yard", "elementary school". Flashcards include a triangle the lesson never teaches. |
| Proportions & Ratios | Foundations | US | Miles per gallon of "gas", cups of flour, inches on maps. |
| Decimals & Percentages | Foundations | US | "Percents", tipping. Formula notation "X/100 = 0.XX = XX%" is loose. |
| Long Multiplication | Foundations | Good | See the formula error above. |
| Fraction Operations | Foundations | Good | Real-world line says engineers scale recipes. |
| Negative Numbers | Foundations | Good | No subtraction of negatives or division in practice. |

## Patterns across the whole set

- **Practice is too light.** 58 questions across 28 lessons, about two each. Several are one-step recalls.
- **Titles and subtitles promise more than the lesson delivers.** At least eight lessons name topics they do not teach.
- **Titles are themed, not searchable.** "Dynamic Systems", "Orbital Transformations", "Mission Probability", "Circuit Flow (Current)", "Angle Workshop" and "Light & Spectrometry" hide the topic a student would search for.
- **Notes are pitched at university.** A GCSE lesson on Ohm's law explains the Drude model. Refraction cites Fermat's principle. References are university textbooks (Griffiths, Hecht, Strang, Boyce and DiPrima).
- **Foundations lessons cite the US Common Core** standards as references.
- **American English and units** remain in the content: PEMDAS, inches, feet, gallons, miles, "math", "percents", "maneuver", "wrench", "lightyear", and -ize spellings.
- **Only six lessons have a model you can adjust.** Nine are flashcards and thirteen are animations with no controls.

## Reference links

Dead (404):

- Fraction Operations: `nrich.maths.org/content/id/1341/fractions.pdf`
- Orbits & Trajectories: `store.doverpublications.com/products/9780486600611`
- Gears & Torque: `industrialpress.com/product/machinerys-handbook-31st-edition/`

Could not verify (the site refuses automated requests): six Feynman Lectures pages, four Art of Problem Solving pages and two Cambridge University Press pages. Open one of each by hand.

The other 39 links load.

## Recommendation

1. **Correct the seven errors and the open display bugs.** A day's work, and the site should not be promoted until it is done.
2. **Pick a narrow core and make it good.** GCSE physics is the natural choice: momentum, circuits, waves and refraction are already the best lessons. Take each to a fixed standard before adding breadth.
3. **Set that standard per lesson:** one topic named plainly, mapped to the specification point it covers; three worked examples of rising difficulty; ten or more practice questions with full worked answers; a model with at least one control; notes at the lesson's own level; UK units and spelling.
4. **Have a subject teacher review each lesson** before it is described as GCSE or A-level revision. AI-written content that nobody has checked is the main risk to trust.
5. **Park or relabel the lessons that do not fit** (Orbits & Trajectories, Dynamic Systems, the dot and cross product half of Vectors) as "beyond the syllabus" enrichment, which suits the space theme.
