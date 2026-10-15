# DfE source texts for the curriculum check

Plain-text copies of the Department for Education documents that `src/lib/curriculum.ts` quotes. They are
read by `scripts/content-checks/curriculum.ts`. Only the text is kept here; the downloaded originals are not
committed. To refresh, download the URL again, check the sha256, and redo the conversion below.

Downloaded 2026-10-14 from gov.uk / assets.publishing.service.gov.uk only.

| Source key | Publication | Downloaded from | sha256 of the original |
| --- | --- | --- | --- |
| ncMaths | National curriculum in England: mathematics programmes of study (HTML version, all key stages, updated 28 September 2021) | https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study | 655f063b41726a34147424290a93996e22f0c46f7517566d541a3ba946cae359 |
| ncScience | National curriculum in England: science programmes of study (HTML version, all key stages) | https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study | 6323345aa6e2b9929d00a34b66844aee97d0f5be17587c52fed3184de08371e3 |
| ncComputing | National curriculum in England: computing programmes of study (HTML version, all key stages) | https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study/national-curriculum-in-england-computing-programmes-of-study | bd3eada557e6e65be5249de55becffce7065437970635e4e00c2147071690165 |
| gcseMaths | GCSE mathematics: subject content and assessment objectives | https://assets.publishing.service.gov.uk/media/5a7cb5b040f0b6629523b52c/GCSE_mathematics_subject_content_and_assessment_objectives.pdf | 647a751b51c71d9ced1c9356aa70b15ceb1a4acb2fd5bc9af49619ead06d0ee6 |
| gcsePhysics | GCSE subject content for biology, chemistry and physics (GCSE single science, updated May 2019) | https://assets.publishing.service.gov.uk/media/5cd2b951ed915d50c208b4d5/GCSE_single_science_updated_May_2019.pdf | 511abad44dc6752a4d92bd8176e6a56e5eae3bd2f3159f10e18638c65039ad62 |
| alMaths | GCE AS and A level subject content for mathematics (with appendices) | https://assets.publishing.service.gov.uk/media/5a7f273a40f0b62305b85670/GCE_AS_and_A_level_subject_content_for_mathematics_with_appendices.pdf | 65cf23ce356eb4c1dab3d336236ab35ed9189461e7c29e5c98f4315242cb575d |
| alScience | GCE AS and A level subject content for science | https://assets.publishing.service.gov.uk/media/5a807949e5274a2e8ab50599/Science_AS_and_level_formatted.pdf | 9c86fcfa5a026fad5a36bffae3edb31900b4b37cd7901185abc19c89a6f10d61 |
| alFurtherMaths | GCE AS and A level subject content for further mathematics (with appendices) | https://assets.publishing.service.gov.uk/media/5a8185ebe5274a2e8ab54725/GCE_AS_and_A_level_subject_content_for_further_mathematics_with_appendices.pdf | cb800f94210a6832419c87189a3f323f21418e7584e2bf0a66d19932ad0b30fb |

The hash of an HTML page covers the whole page as served, including gov.uk's page furniture, so a later
download can hash differently even when the curriculum text is unchanged. Compare the extracted text instead.

## Why the national curriculum uses the HTML version

Each national curriculum publication page offers both PDFs (primary, secondary and, for mathematics, key
stage 4) and an HTML version covering every key stage. Their wording differs: the HTML version writes
numbers as numerals ("the 4 operations", "intervals across 0", "per 100", "in 2 {and 3} dimensional
figures") where the PDFs write words ("the four operations", "across zero", "per hundred", "in two {and
three}"), and the HTML has "between Earth and sun" where the secondary science PDF has "Sun".
`curriculum.ts` quotes the HTML wording, so the HTML version is the source used here. The PDFs were also
downloaded on 2026-10-14 for comparison and are not used:

| PDF | sha256 |
| --- | --- |
| https://assets.publishing.service.gov.uk/media/5a7da548ed915d2ac884cb07/PRIMARY_national_curriculum_-_Mathematics_220714.pdf | cfae407ffaa5766bba0f00932f9a1f70a945ac03f955e3cddd761a63e826a1e4 |
| https://assets.publishing.service.gov.uk/media/5a7c1408e5274a1f5cc75a68/SECONDARY_national_curriculum_-_Mathematics.pdf | faf4c691aae8012836f162f6f2d041bb83849024b1c80496bdcb1b30289cf7a3 |
| https://assets.publishing.service.gov.uk/media/5a7dc9dced915d2ac884d8ef/KS4_maths_PoS_FINAL_170714.pdf | 1d388d5455010cd0d7c1c5851cda4e39a884b7a1e6f17bc2db65a574475f6c75 |
| https://assets.publishing.service.gov.uk/media/5a806ebd40f0b62305b8b1fa/PRIMARY_national_curriculum_-_Science.pdf | 5aafcbad6d43eb3aed6dbedf73ee334342a6033551c3a4a4cc1ac3a171a5e359 |
| https://assets.publishing.service.gov.uk/media/5a7d563de5274a2af0ae2ffa/SECONDARY_national_curriculum_-_Science_220714.pdf | 8ec1ebae9fb00a6fff85a81e489117f036228106186aa8ab59486994ca0f6b42 |
| https://assets.publishing.service.gov.uk/media/5a7cb981ed915d682236228d/SECONDARY_national_curriculum_-_Computing.pdf | 83f2c295562bc324832d36864e6134775daa085e5e0884796c46c32d3eaa0f2f |

## How the text was made

- **PDFs** (gcseMaths, gcsePhysics, alMaths, alScience, alFurtherMaths): `pdftotext -enc UTF-8 <file>.pdf -`
  (poppler pdftotext 24.02.0, default reading-order mode, not `-layout`). Then one clean-up: page-number
  footers are removed, meaning a line holding only 1 to 3 digits that is the last line before a form feed
  (end of page). Without this, a page number lands in the middle of any statement that runs across a page
  break. Nothing else is changed.
- **HTML** (ncMaths, ncScience, ncComputing): the text of the page's `govspeak` body, taken with Python's
  standard-library `html.parser`. Block elements (paragraphs, list items, headings, table cells) start a new
  line; inline elements such as `<sup>` stay inline, so "cm<sup>2</sup>" becomes "cm2".
- Each file starts with a `===== SOURCE FILE: ... =====` line naming what it was made from.

## Known extraction artefacts

- alMaths: formulas set as equation objects come out with spaces between their glyphs, for example
  "f ( x )" where the page shows "f(x)" (checked by rendering page 10). The check does not remove these
  spaces, so a statement containing such a formula fails and needs a person to compare it with the PDF.
