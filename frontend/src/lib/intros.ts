import type { ConceptId } from '@/lib/study-modules';

export type LessonIntro = {
  /** What the clip shows and why it belongs to this lesson. Stated facts are checked; keep them that way. */
  caption: string;
  /** For screen readers, in place of the pictures. */
  alt: string;
  credit: string;
};

/**
 * Real footage that opens a lesson. A clip earns a place here only if it
 * shows the thing the lesson explains. Files live in /public/intros as
 * <lesson id>.mp4, .webm and -poster.jpg; sources and edits are recorded in
 * /public/intros/CREDITS.md.
 */
export const INTROS: Partial<Record<ConceptId, LessonIntro>> = {
  momentum: {
    caption:
      'Space Shuttle Discovery, October 2007. About two minutes after lift-off, small rockets on the two spent boosters fire to push them clear, and the Shuttle carries on climbing on its own engines. Those small rockets work like any rocket: they throw gas one way and are pushed the other.',
    alt: 'A Space Shuttle climbing through a dark blue sky as its two boosters separate and peel away, trailing flame.',
    credit: 'NASA',
  },
  diffeq: {
    caption:
      'Artemis II returning from the Moon, April 2026. Looking up from the Orion capsule as its three main parachutes open, sped up. Drag does the braking here, slowing the capsule from around 200 km/h to under 30 km/h for splashdown.',
    alt: 'Three large orange and white parachutes opening above a spacecraft window, against a hazy sky.',
    credit: 'NASA',
  },
  gears: {
    caption:
      'Mars, July 2021. The Perseverance rover’s navigation camera during a drive across Jezero Crater, sped up. Each of its six wheels has its own motor, geared right down: plenty of torque to climb rocks, and a top speed of about 150 metres an hour.',
    alt: 'A black and white view of a rocky Martian plain moving past as the rover drives.',
    credit: 'NASA/JPL-Caltech',
  },
  trajectory: {
    caption:
      'Earth from the International Space Station, sped up. The station is falling around the planet at about 7.7 km/s, which is fast enough to circle it roughly every 90 minutes.',
    alt: 'The curved edge of the Earth with clouds and blue ocean sliding past below, seen from orbit.',
    credit: 'NASA',
  },
  prism: {
    caption:
      'Sunrise from the International Space Station. The thin glowing line is the atmosphere seen edge-on. As sunlight passes through it, the air bends the light and scatters it into bands of colour.',
    alt: 'City lights on a dark Earth, then a thin arc of blue and white light spreading along the horizon as the Sun rises.',
    credit: 'NASA',
  },
  thermodynamics: {
    caption:
      'An RS-25 rocket engine igniting on the test stand at NASA’s Stennis Space Center, January 2026. Its fuel is stored colder than −180 °C and burns at more than 3,000 °C. The white clouds are frost, vapour and steam.',
    alt: 'A rocket engine on a test stand igniting: a burst of orange flame beneath the nozzle and white vapour pouring from frosted pipes.',
    credit: 'NASA',
  },
};
