// Workshop content. Case studies, instructions, and questions are reproduced verbatim from
// "The Ethics of Using AI as Instructors" planning document (revised September 2026) supplied by Marc Watkins.

export const site = {
  title: 'The Ethics of Using AI as Instructors',
  short: 'Ethics of AI as Instructors',
  subtitle: 'A faculty workshop on AI in course design, assessment, and feedback',
  dek: 'Nine case studies on how generative AI is already entering our teaching. Talk them through at your table, notice who they touch, and leave with a duty of care you wrote yourself.',
  seating: 'Participants will seat themselves at each table based on the topic they would most like to discuss: AI for course design; AI for designing and administering assessments; AI for grading and feedback.',
  host: 'AI Institute & Center for Excellence in Teaching and Learning (CETL) · University of Mississippi',
  authors: ['Marc Watkins', 'Emily Donahue', 'Danielle Clevenger'],
  authorLine: 'Marc Watkins, Emily Donahue, and Danielle Clevenger',
  orgs: 'AI Institute and the Center for Excellence in Teaching and Learning (CETL), University of Mississippi',
  slides: 'https://docs.google.com/presentation/d/1xMyxOfrgDmjD3sRmYIqTmcfiyG89-CF2oIFzbx3ZnOg/edit?usp=sharing',
  live: 'https://mwatkins03-netizen.github.io/Ethical-AI-In-Course-Design-Workshop-Fable-5.1/'
};

export const tracks = [
  {
    id: 'courses',
    short: 'Course design',
    title: 'Designing Courses and Lesson Plans',
    color: '#006BA6',
    blurb: 'AI for course design: syllabi, assignment sheets, readings, slide decks, lesson plans.',
    cases: [
      {
        id: 'courses-1',
        title: 'The AI use statement',
        text: [
          'You use AI to help draft your syllabi and assignment sheets at the beginning of the semester. This seems to work well and saves a lot of labor, leaving you more time for individual meetings with your students. Because you value transparency, you include an “AI use statement” at the bottom of each document you create that details how you used AI in the process.',
          'One day as you’re grading, you notice that a student has submitted work that relies a bit too heavily on AI. When you raise the issue with the student, they note that they’ve used AI in exactly the ways you outlined in your own “AI use statements”—adding that if you use AI to create your course materials, they should be allowed to use it for their assignments as well.'
        ]
      },
      {
        id: 'courses-2',
        title: 'A course that no longer sounds like you',
        text: [
          'You’re working hard to create a more equitable and inclusive classroom. You frequently turn to AI for suggestions about diversifying your readings and examples; revising the language in your documents to make it more inclusive; and identifying potential equity concerns that you might have missed on your own.',
          'Your course now feels a little unfamiliar, and the language in your materials no longer sounds like you. But students seem to be responding well. You’re even seeing improvements in assignment grades among historically marginalized groups in your course.'
        ]
      },
      {
        id: 'courses-3',
        title: 'Every lesson, generated',
        text: [
          'You upload your syllabus and course texts to an AI tool and ask it to generate slide decks and lesson plans for every course meeting—which you use faithfully. Some lessons work better than others, but you decide to keep using the AI-generated lessons because they save so much time throughout the week.'
        ]
      }
    ]
  },
  {
    id: 'assessments',
    short: 'Assessment',
    title: 'Designing and Administering Assessments',
    color: '#CF142B',
    blurb: 'AI for designing and administering assessments: exams, proctoring, detection.',
    cases: [
      {
        id: 'assessments-1',
        title: 'No two exams alike',
        text: [
          'You use an AI program trained on your course materials to generate and randomize test questions so that no two exams look alike. After one exam, a student comes to your office hours to lodge a complaint about their grade. They contend that the exam they received was more challenging than those of their friends and demand that they be allowed a re-take.'
        ]
      },
      {
        id: 'assessments-2',
        title: 'The security measures seem to be working',
        text: [
          'Academic misconduct is out of control in your classes. You decide to begin using AI detection software for homework and AI-powered proctoring for take-home exams. You’re troubled by reporting that suggests these tools can be biased toward non-white students, neurodivergent students, students who speak English as a second language, etc. But the security measures seem to be working. As far as you can tell, you’ve received no AI-generated work, and students are learning the material more deeply than they have since ChatGPT first came out.'
        ]
      },
      {
        id: 'assessments-3',
        title: 'The oral exam transcript',
        text: [
          'You use an AI agent to proctor oral exams, which allows you to ensure learning for a large number of students. One day, when reviewing a transcript for a student’s exam, you notice that the student disclosed some very personal information to the AI mid-exam. The conversation was recorded and stored on a third-party server. You’re now wondering if the student fully understood this before they spoke and whether they would be concerned about who might have access to this data.'
        ],
        source: {
          label: 'Fighting fire with fire: scalable oral exams (Behind the Enemy Lines, Dec. 2025)',
          href: 'https://www.behind-the-enemy-lines.com/2025/12/fighting-fire-with-fire-scalable-oral.html'
        }
      }
    ]
  },
  {
    id: 'grading',
    short: 'Grading & feedback',
    title: 'Grading and Feedback',
    color: '#142142',
    blurb: 'AI for grading and feedback: comments, grades, consistency, encouragement.',
    cases: [
      {
        id: 'grading-1',
        title: 'Words you didn’t write',
        text: [
          'You use an AI tool to provide written feedback on students’ work and suggest a grade. You double check everything, of course, but the AI does a pretty good job, and for the most part, you let its grades and comments stand.',
          'One day, a student comes up to you after class to thank you for the encouraging feedback on their latest paper. They tell you that they’ve never been very confident in their work but that the feedback they received has motivated them to change their major. You’re glad that the student found the feedback encouraging, but somewhat troubled by the fact that an AI-generated judgement has (for better or for worse) potentially changed the course of this student’s life.'
        ],
        source: {
          label: '“I built an AI grading tool. Then a student thanked me for words I didn’t write.” (EdSurge)',
          href: 'https://www.edsurge.com/news/i-built-an-ai-grading-tool-then-a-student-thanked-me-for-words-i-didnt-write'
        }
      },
      {
        id: 'grading-2',
        title: 'The TA who isn’t coming back',
        text: [
          'One of the TAs for your large class has to take unexpected medical leave for the rest of the semester, and there is no one to replace them. You begin experimenting with AI to handle the grading and feedback your TA was responsible for.',
          'You’re concerned, at first, about how students will respond to AI-generated feedback. But the students who receive it are impressed by how quick and thorough it is. You also suspect that the AI grades more consistently than you and your other TAs. You consider using it more widely and more often.'
        ]
      },
      {
        id: 'grading-3',
        title: 'More grade complaints than usual',
        text: [
          'You’re using an AI grader in your class, and you’ve been transparent with students about that fact. The semester starts off okay, but within a few weeks, you notice that you’re receiving way more grade complaints than usual. Some students are constantly challenging the AI’s judgements of their work, referencing the inaccuracy or hallucinations of AI outputs in general. When you go in to re-evaluate the student work, some of their complaints seem valid and some don’t.'
        ]
      }
    ]
  }
];

// Questions to consider for each case study (verbatim, in the document's order).
export const caseQuestions = [
  { id: 'q1', short: 'Values', text: 'What values are at play in each case study? How might these values compete with or oppose one another?' },
  { id: 'q2', short: 'Impact', text: 'Who is directly impacted by these uses of AI? Who is indirectly impacted? In what ways?' },
  { id: 'q3', short: 'Scale', text: 'What might happen if this kind of AI use became common in your department? In the university as a whole? In your field or discipline?' },
  { id: 'q4', short: 'Consequences', text: 'What are the short-term consequences of these AI uses? What might some long-term consequences be?' }
];

// Instructions from the document, verbatim.
export const instructions = {
  curiosities: [
    'Consider your concerns and curiosities about instructors’ use of AI as related to your table’s topic (or just in general).',
    'If you’re at a quiet table, write about these curiosities and concerns on your own. For all other tables, introduce yourself and share aloud with your table mates. Designate one person as your table’s notetaker to record thoughts and questions on the paper provided.'
  ],
  cases: [
    'If you’re at a quiet table, choose one or more of the case studies to consider and write about on your own.',
    'For all other tables, read the case studies aloud and consider the associated questions. Don’t forget to take notes on your table’s conversation.'
  ],
  takeaways: 'For all tables, write or think quietly about this on your own.'
};

// Takeaways, Questions, and Commitments prompts (verbatim).
export const takeawayPrompts = {
  duty: 'What is your “duty of care”?',
  values: 'What values or principles will you use to guide your own use of AI? What should guide department or university policy around AI use?',
  questions: 'What questions are you leaving with?'
};

// Illustrated paper cards in the hero gallery: SVG art drawn for this workshop in the style of the
// Teaching for Discernment cards (whose WebGL renderer is reused), colored from the UM brand palette.
export const pages = [
  { id: 'curiosities', num: '01', title: 'Curiosities and Concerns', sub: 'Your starting point', target: '#step-curiosities', asset: './assets/cards/step-03.svg', accent: '#FFCD6B', effect: 2 },
  { id: 'cases', num: '02', title: 'Case Studies', sub: 'Three cases for your topic', target: '#step-cases', asset: './assets/cards/step-02.svg', accent: '#006BA6', effect: 1 },
  { id: 'takeaways', num: '03', title: 'Takeaways, Questions, and Commitments', sub: 'Your duty of care', target: '#step-takeaways', asset: './assets/cards/step-04.svg', accent: '#142142', effect: 3 },
  { id: 'export', num: '04', title: 'Take it with you', sub: 'Export your notes', target: '#step-export', asset: './assets/cards/step-05.svg', accent: '#FF544A', effect: 4 }
];

// Three ways to respond. Every prompt in the workshop works in any of these modes.
export const responseModes = [
  { id: 'talk', label: 'Talk it through', short: 'Talk', tagline: 'Discuss at your table; your notetaker writes on the paper provided.', text: 'Use the prompts as a discussion guide. Nothing to type; jot a line here only if you want it in your export.' },
  { id: 'type', label: 'Type it here', short: 'Type', tagline: 'Quiet table, or prefer to write? Type here and export at the end.', text: 'Type under each prompt. Your words are saved in this browser only and bundled into one file you download at the end.' },
  { id: 'record', label: 'Record my voice', short: 'Record', tagline: 'Speak your response; keep the audio and an editable transcript.', text: 'Press Record and talk. The audio is saved on this device and, if you choose, transcribed into an editable text box.' }
];

export const localOnly = {
  badge: 'Everything you write or record stays on this device',
  short: 'Stored locally · nothing is sent anywhere',
  long: 'This site has no server, no accounts, and no analytics. Typed notes live in this browser’s local storage and recordings in its IndexedDB. Nothing leaves your device unless you download the export file yourself and choose to share it. Clearing your browser data, or pressing “Clear my notes,” erases it.'
};

// Seed phrases for the values / principles builder (drafted for review; edit freely).
export const principleSeeds = [
  'Students should know when AI has touched their work or their grade.',
  'A human reads everything before it reaches a student.',
  'What I ask of students, I hold myself to.',
  'Student data does not go to a tool I have not vetted.',
  'Efficiency gains should buy time for students, not just save it.',
  'Equity claims about a tool need evidence, not vibes.',
  'My voice stays in my course materials.',
  'Assessment should measure learning, not compliance.',
  'Policy should be written with students, not just about them.'
];

export const disclosure = {
  human: 'Marc Watkins, Emily Donahue, and Danielle Clevenger (University of Mississippi), with the AI Institute and CETL, wrote the workshop plan, the nine case studies, the instructions, the four discussion questions, and the takeaway prompts, and designed the session. The authors directed the design, reviewed every screen, and take responsibility for the pedagogical framing.',
  ai: 'Anthropic Claude (Fable 5.1, via Claude Code) built the site from the facilitators’ planning document: information architecture, HTML/CSS/JavaScript, the paper-and-motion visual system adapted from the earlier Teaching for Discernment site, the four illustrated step cards (SVG drawings made for this workshop in the style of the Teaching for Discernment cards, whose WebGL card renderer is reused), the Talk / Type / Record response modes, the audio recorder and transcription wiring, the principle seed phrases, the accessibility statement draft, and the export engine. The looping tree-canopy video was AI-generated for Teaching for Discernment in August 2026 and is reused here.',
  limits: 'Case studies, instructions, questions, and takeaway prompts appear verbatim as written by the facilitators; AI did not alter them. Principle seeds and the accessibility statement are AI-drafted suggestions the authors reviewed and may edit. AI output is not authorship or scholarship. Linked articles are external and may change.',
  data: 'This static site collects no data, uses no analytics, requires no accounts, and sends nothing to any server or AI system. Typed notes are saved only in this browser’s local storage, and audio recordings only in this browser’s IndexedDB, until you export or clear them.',
  speech: 'Optional transcription uses the speech-recognition service built into your browser. In Chrome and Edge that means the audio is processed by Google’s or Microsoft’s speech servers while you record; Safari may process it on the device. The recording itself is never uploaded by this site. If you would rather not use a speech service, untick transcription and record audio only, or type.',
  brand: 'Colors follow the University of Mississippi brand palette published on the UM Brand Portal (Lyceum red, Oxford navy, Magnolia white, with Powder Blue, Tupelo, Landshark, and Faulkner accents). Type is set in IBM Plex Sans and IBM Plex Serif, two of the university’s brand typefaces, loaded from Google Fonts under their open license; the licensed brand faces Matrole, Handelson One, and Termina are not embedded.',
  date: 'Disclosure prepared September 8, 2026; updated September 26, 2026.'
};

export const accessibility = {
  target: 'This site is designed to meet WCAG 2.1 Level AA, the technical standard adopted under ADA Title II for public universities.',
  features: [
    'Every control works with a keyboard: the illustrated cards respond to arrow keys and Enter, case tabs and mode switches are real buttons, and panels close with Escape.',
    'All motion can be stopped. The Motion toggle in the header pauses the background video, the card animation, and the film grain; the site also honors your operating system’s reduced-motion setting.',
    'Text and interface colors come from the University of Mississippi brand palette and meet at least a 4.5:1 contrast ratio on the Faulkner paper background. Text reflows to a 320-pixel-wide screen with no horizontal scrolling and can be zoomed to 200%.',
    'Every field has a visible label. Recording controls announce their state to screen readers, and transcripts land in an editable text field so anyone can correct them.',
    'Audio is optional. Every prompt can be answered by talking at the table, typing, or recording, and the export works with or without recordings.',
    'The background video has no sound and is decorative; it is hidden from assistive technology.'
  ],
  known: 'Known limits: live speech transcription depends on your browser and microphone and may be inaccurate; please review transcripts. The print/PDF export uses your browser’s print dialog.',
  contact: 'If you meet a barrier on this site, tell a facilitator during the workshop or contact the AI Institute at the University of Mississippi so it can be fixed. The University’s accessibility resources are available through Student Disability Services and the Office of Equal Opportunity and Regulatory Compliance.'
};
