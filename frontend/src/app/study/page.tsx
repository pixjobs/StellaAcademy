import { SkyTitle } from '@/components/Sky';
import LessonIndex from '@/components/study/LessonIndex';
import { lessonSummaries } from '@/lib/lessons';

export default function StudyPage() {
  return (
    <>
      <SkyTitle title="All lessons">
        Physics and maths for ages 9 and up, from number foundations to A-level. Levels are our guide to difficulty,
        not a match to one exam board.
      </SkyTitle>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LessonIndex lessons={lessonSummaries} />
      </div>
    </>
  );
}
