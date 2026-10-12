import { SkyTitle } from '@/components/Sky';
import LessonIndex from '@/components/study/LessonIndex';
import { lessonSummaries } from '@/lib/lessons';
import { SITE_URL } from '@/lib/site';

export default function StudyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Physics and maths lessons',
    itemListElement: lessonSummaries.map((lesson, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: lesson.title,
      url: `${SITE_URL}/study/${lesson.id}`,
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
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
