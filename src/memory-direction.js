import { createMontageShot } from './animation-timeline.js';

function direct(lines, act, sections) {
  return sections.map(([start, end, image, from, to], index) => createMontageShot(
    lines.slice(start, end).map(line => ({ ...line, image: `assets/images/animation/act${act}/${image}.png` })),
    { id: `act${act}-${index + 1}`, from, to, transition: 'dissolve', hold: .08, settle: .94 },
  ));
}

export function buildAct2Sequence(lines) {
  const reading = 'P2-CG-CLASS_READING-001';
  const teacher = 'P2-CG-CLASS_TALK-TEACHER-001';
  const child = 'P2-CG-CLASS_TALK-AYAO-001';
  const playground = 'P2-CG-PLAYGROUND_ARGUMENT-001';
  const playgroundRun = 'P2-CG-PLAYGROUND_ARGUMENT-002';
  return direct(lines, 2, [
    [0, 3, reading, [50, 50, 1.02], [60, 43, 1.16]],
    [3, 8, reading, [66, 39, 1.28], [50, 50, 1.04]],
    [8, 12, child, [43, 43, 1.14], [43, 41, 1.28]],
    [12, 14, child, [43, 41, 1.28], [50, 50, 1.08]],
    [14, 17, teacher, [68, 39, 1.26], [60, 45, 1.12]],
    [17, 19, reading, [47, 50, 1.18], [50, 50, 1.04]],
    [19, 24, playground, [50, 50, 1.03], [39, 39, 1.24]],
    [24, 27, playground, [60, 42, 1.28], [50, 45, 1.12]],
    [27, 30, playground, [40, 39, 1.26], [58, 41, 1.26]],
    [30, 34, playground, [40, 39, 1.28], [49, 43, 1.12]],
    [34, 37, playgroundRun, [32, 45, 1.75], [50, 50, 1.02]],
  ]);
}

export function buildAct3Sequence(lines) {
  const wait = 'P3-CG-WAIT_HERE-001';
  const kick = 'P3-CG-KICK_SHUTTLECOCK-001';
  const father = 'P3-CG-FOSTER_FATHER-001';
  const back = 'P3-CG-LOOK_BACK-001';
  return direct(lines, 3, [
    [0, 4, wait, [50, 50, 1.03], [45, 47, 1.16]],
    [4, 6, kick, [46, 55, 1.22], [50, 50, 1.06]],
    [6, 16, father, [50, 50, 1.04], [44, 48, 1.18]],
    [16, 19, back, [50, 50, 1.03], [48, 51, 1.18]],
  ]);
}
