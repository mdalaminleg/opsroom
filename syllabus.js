/**
 * Ops Room — default syllabus (static data)
 *
 * This file is NEVER modified at runtime. Custom subjects/papers/chapters
 * added via Settings are merged into the app_state JSON blob, not here.
 *
 * Shape:
 *   SYLLABUS = {
 *     subjects: [
 *       {
 *         id: "physics",              // stable, used as merge key
 *         name: "Physics",            // English name (UI chrome)
 *         nameBn: "পদার্থবিজ্ঞান",       // Bengali name (headings)
 *         papers: [
 *           { id: "physics-1", name: "1st Paper", nameBn: "১ম পত্র",
 *             chapters: [ { id: "physics-1-1", name: "ভৌত জগৎ ও পরিমাপ" }, ... ] }
 *         ]
 *       }
 *     ]
 *   }
 *
 * IDs are stable and are what progress state keys off. Do not renumber.
 */

window.SYLLABUS = {
  subjects: [
    // ── PHYSICS ─────────────────────────────────────────────────────────────
    {
      id: "physics",
      name: "Physics",
      nameBn: "পদার্থবিজ্ঞান",
      papers: [
        {
          id: "physics-1",
          name: "1st Paper",
          nameBn: "১ম পত্র",
          chapters: [
            { id: "physics-1-1", name: "ভৌত জগৎ ও পরিমাপ" },
            { id: "physics-1-2", name: "ভেক্টর" },
            { id: "physics-1-3", name: "গতিবিদ্যা" },
            { id: "physics-1-4", name: "নিউটনিয়ান বলবিদ্যা" },
            { id: "physics-1-5", name: "কাজ, ক্ষমতা ও শক্তি" },
            { id: "physics-1-6", name: "মহাকর্ষ ও অভিকর্ষ" },
            { id: "physics-1-7", name: "পদার্থের গাঠনিক ধর্ম" },
            { id: "physics-1-8", name: "পর্যাবৃত্ত গতি" },
            { id: "physics-1-9", name: "তরঙ্গ" },
            { id: "physics-1-10", name: "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব" },
          ],
        },
        {
          id: "physics-2",
          name: "2nd Paper",
          nameBn: "২য় পত্র",
          chapters: [
            { id: "physics-2-1", name: "তাপগতিবিদ্যা" },
            { id: "physics-2-2", name: "স্থির তড়িৎ" },
            { id: "physics-2-3", name: "চল তড়িৎ" },
            { id: "physics-2-4", name: "তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব" },
            { id: "physics-2-5", name: "তড়িৎ চুম্বকীয় আবেশ ও পরিবর্তী প্রবাহ" },
            { id: "physics-2-6", name: "জ্যামিতিক আলোকবিজ্ঞান" },
            { id: "physics-2-7", name: "ভৌত আলোকবিজ্ঞান" },
            { id: "physics-2-8", name: "আধুনিক পদার্থবিজ্ঞানের সূচনা" },
            { id: "physics-2-9", name: "পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান" },
            { id: "physics-2-10", name: "সেমিকন্ডাক্টর ও ইলেকট্রনিক্স" },
            { id: "physics-2-11", name: "জ্যোতির্বিজ্ঞান" },
          ],
        },
      ],
    },

    // ── CHEMISTRY ───────────────────────────────────────────────────────────
    {
      id: "chemistry",
      name: "Chemistry",
      nameBn: "রসায়ন",
      papers: [
        {
          id: "chemistry-1",
          name: "1st Paper",
          nameBn: "১ম পত্র",
          chapters: [
            { id: "chemistry-1-1", name: "ল্যাবরেটরির নিরাপদ ব্যবহার" },
            { id: "chemistry-1-2", name: "গুণগত রসায়ন" },
            { id: "chemistry-1-3", name: "মৌলসমূহের পর্যাবৃত ধর্ম ও রাসায়নিক বন্ধন" },
            { id: "chemistry-1-4", name: "রাসায়নিক পরিবর্তন" },
            { id: "chemistry-1-5", name: "কর্মমুখী রসায়ন" },
          ],
        },
        {
          id: "chemistry-2",
          name: "2nd Paper",
          nameBn: "২য় পত্র",
          chapters: [
            { id: "chemistry-2-1", name: "পরিবেশ রসায়ন" },
            { id: "chemistry-2-2", name: "জৈব রসায়ন" },
            { id: "chemistry-2-3", name: "পরিমাণগত রসায়ন" },
            { id: "chemistry-2-4", name: "তড়িৎ রসায়ন" },
            { id: "chemistry-2-5", name: "অর্থনৈতিক রসায়ন" },
          ],
        },
      ],
    },

    // ── BIOLOGY ─────────────────────────────────────────────────────────────
    {
      id: "biology",
      name: "Biology",
      nameBn: "জীববিজ্ঞান",
      papers: [
        {
          id: "biology-1",
          name: "1st Paper",
          nameBn: "১ম পত্র",
          chapters: [
            { id: "biology-1-1", name: "কোষ ও এর গঠন" },
            { id: "biology-1-2", name: "কোষ বিভাজন" },
            { id: "biology-1-3", name: "কোষ রসায়ন" },
            { id: "biology-1-4", name: "অণুজীব" },
            { id: "biology-1-5", name: "শৈবাল ও ছত্রাক" },
            { id: "biology-1-6", name: "ব্রায়োফাইটা ও টেরিডোফাইটা" },
            { id: "biology-1-7", name: "নগ্নবীজী ও আবৃতবীজী উদ্ভিদ" },
            { id: "biology-1-8", name: "টিস্যু ও টিস্যুতন্ত্র" },
            { id: "biology-1-9", name: "উদ্ভিদ শারীরতত্ত্ব" },
            { id: "biology-1-10", name: "উদ্ভিদ প্রজনন" },
            { id: "biology-1-11", name: "জীবপ্রযুক্তি" },
            { id: "biology-1-12", name: "জীবের পরিবেশ, বিস্তার ও সংরক্ষণ" },
          ],
        },
        {
          id: "biology-2",
          name: "2nd Paper",
          nameBn: "২য় পত্র",
          chapters: [
            { id: "biology-2-1", name: "প্রাণীর বিভিন্নতা ও শ্রেণীবিন্যাস" },
            { id: "biology-2-2", name: "প্রাণীর পরিচিতি" },
            { id: "biology-2-3", name: "পরিপাক ও শোষণ" },
            { id: "biology-2-4", name: "রক্ত ও সংবহন" },
            { id: "biology-2-5", name: "শ্বসন ও শ্বাসক্রিয়া" },
            { id: "biology-2-6", name: "বর্জ্য ও নিষ্কাশন" },
            { id: "biology-2-7", name: "চলন ও অঙ্গচালনা" },
            { id: "biology-2-8", name: "সমন্বয় ও নিয়ন্ত্রণ" },
            { id: "biology-2-9", name: "মানব জীবনের ধারাবাহিকতা" },
            { id: "biology-2-10", name: "মানবদেহের প্রতিরক্ষা" },
            { id: "biology-2-11", name: "জিনতত্ত্ব ও বিবর্তন" },
            { id: "biology-2-12", name: "প্রাণীর আচরণ" },
          ],
        },
      ],
    },

    // ── HIGHER MATH ─────────────────────────────────────────────────────────
    {
      id: "higher-math",
      name: "Higher Math",
      nameBn: "উচ্চতর গণিত",
      papers: [
        {
          id: "higher-math-1",
          name: "1st Paper",
          nameBn: "১ম পত্র",
          chapters: [
            { id: "higher-math-1-1", name: "ম্যাট্রিক্স ও নির্ণায়ক" },
            { id: "higher-math-1-2", name: "ভেক্টর" },
            { id: "higher-math-1-3", name: "সরলরেখা" },
            { id: "higher-math-1-4", name: "বৃত্ত" },
            { id: "higher-math-1-5", name: "বিন্যাস ও সমাবেশ" },
            { id: "higher-math-1-6", name: "ত্রিকোণমিতিক অনুপাত" },
            { id: "higher-math-1-7", name: "সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত" },
            { id: "higher-math-1-8", name: "ফাংশন ও ফাংশনের লেখচিত্র" },
            { id: "higher-math-1-9", name: "অন্তরীকরণ" },
            { id: "higher-math-1-10", name: "যোগজীকরণ" },
          ],
        },
        {
          id: "higher-math-2",
          name: "2nd Paper",
          nameBn: "২য় পত্র",
          chapters: [
            { id: "higher-math-2-1", name: "বাস্তব সংখ্যা ও অসমতা" },
            { id: "higher-math-2-2", name: "যোগাশ্রয়ী প্রোগ্রাম" },
            { id: "higher-math-2-3", name: "জটিল সংখ্যা" },
            { id: "higher-math-2-4", name: "বহুপদী ও বহুপদী সমীকরণ" },
            { id: "higher-math-2-5", name: "দ্বিপদী বিস্তৃতি" },
            { id: "higher-math-2-6", name: "কনিক" },
            { id: "higher-math-2-7", name: "বিপরীত ত্রিকোণমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ" },
            { id: "higher-math-2-8", name: "স্থিতিবিদ্যা" },
            { id: "higher-math-2-9", name: "গতিবিদ্যা" },
            { id: "higher-math-2-10", name: "বিস্তার পরিমাপ ও সম্ভাবনা" },
          ],
        },
      ],
    },
  ],
};

/**
 * Default "static" scope items that live outside subjects:
 *   - paper finals and subject finals are derived per subject/paper
 *   - full mock test is a single global instance
 * These are NOT listed here — they are structural, not data. See core.js.
 */

// Convenience counters used in a few places (dashboard totals, etc.)
window.SYLLABUS_META = (function () {
  const subjects = window.SYLLABUS.subjects;
  let chapters = 0;
  let papers = 0;
  for (const s of subjects) {
    for (const p of s.papers) {
      papers += 1;
      chapters += p.chapters.length;
    }
  }
  return { subjectCount: subjects.length, paperCount: papers, chapterCount: chapters };
})();
