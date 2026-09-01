(() => {
const SCALE = [
  { value: 0, label: "Never", detail: "Absent or almost absent" },
  { value: 1, label: "Rarely", detail: "A few times in 6 months" },
  { value: 2, label: "Sometimes", detail: "Recurring, but not most weeks" },
  { value: 3, label: "Often", detail: "Weekly or many relevant situations" },
  { value: 4, label: "Very often", detail: "Daily, near-daily, or major compensation" },
];

const CHOICES = {
  historicalYesNoUnsure: [
    { value: 1, label: "Yes" },
    { value: 0.5, label: "Unsure" },
    { value: 0, label: "No" },
    { value: 0.25, label: "No chance to know" },
  ],
  yesNoUnsure: [
    { value: 1, label: "Yes" },
    { value: 0.5, label: "Unsure" },
    { value: 0, label: "No" },
  ],
  safety: [
    { value: 4, label: "Yes" },
    { value: 2, label: "Unsure" },
    { value: 0, label: "No" },
    { value: 3, label: "Prefer not to say" },
  ],
  settings: [
    { value: 0, label: "No clear setting" },
    { value: 0.2, label: "One setting" },
    { value: 0.85, label: "Two settings" },
    { value: 1, label: "Three or more" },
    { value: 0.35, label: "Unsure" },
  ],
  impairment: [
    { value: 0, label: "No impairment" },
    { value: 0.35, label: "Mild" },
    { value: 0.7, label: "Moderate" },
    { value: 1, label: "Severe" },
  ],
  time: [
    { value: 0, label: "None or under 15 min" },
    { value: 0.35, label: "15-60 min" },
    { value: 0.8, label: "1-3 hours" },
    { value: 1, label: "3+ hours" },
  ],
  insight: [
    { value: 0, label: "Not believable" },
    { value: 0.35, label: "Somewhat" },
    { value: 0.7, label: "Very believable" },
    { value: 1, label: "Completely" },
  ],
  attentionDrift: [
    { value: 1, label: "Pulled away", detail: "By something more interesting, more urgent, or louder" },
    { value: 0, label: "Drifted on own", detail: "Gradually disconnected, spaced out, or drifted without anything pulling me" },
    { value: 0.5, label: "Both equally", detail: "Both patterns happen in roughly equal amounts" },
    { value: 0.25, label: "Neither fits", detail: "Neither pattern describes my experience well" },
  ],
  interestDuration: [
    { value: 1, label: "Short bursts", detail: "New intense topics every few weeks or months" },
    { value: 0, label: "Stable for years", detail: "One or a few core interests lasting years or most of my life" },
    { value: 0.5, label: "Both patterns", detail: "Short-burst enthusiasms alongside long-standing core interests" },
    { value: 0.25, label: "Neither fits", detail: "I do not have unusually intense interests" },
  ],
  rigidityAetiology: [
    { value: 1, label: "Sameness preferred", detail: "Predictability and routine feel right and reduce distress" },
    { value: 0, label: "Compensation needed", detail: "Without external structure I forget, lose track, or fail to start" },
    { value: 0.5, label: "Both reasons", detail: "Both apply in roughly equal measure" },
    { value: 0.25, label: "Neither fits", detail: "I do not rely on routines unusually" },
  ],
  stimFunction: [
    { value: 1, label: "Regulation", detail: "Regulate emotion, sensory input, or focus, especially during overload or transitions" },
    { value: 0, label: "Discharge restlessness", detail: "Release physical restlessness or stay alert during required or boring tasks" },
    { value: 0.5, label: "Both functions", detail: "Both reasons depending on the situation" },
    { value: 0.25, label: "Neither fits", detail: "I do not have noticeable repetitive movement or fidgeting" },
  ],
  // Static, one-time, or duration-threshold statements do not make sense on
  // the shared frequency scale. Values remain 0..4 so these items keep the
  // same domain-scoring range.
  agreement: [
    { value: 0, label: "Not at all true" },
    { value: 1, label: "A little true" },
    { value: 2, label: "Partly true" },
    { value: 3, label: "Mostly true" },
    { value: 4, label: "Completely true" },
  ],
  // Degree scale for the optional, unscored strengths section. Framed as
  // "how much is this like you" rather than a symptom frequency, so it reads
  // naturally for positive traits. buildStrengths() reports items at >= 3.
  strengthDegree: [
    { value: 0, label: "Not like me" },
    { value: 1, label: "A little" },
    { value: 2, label: "Somewhat" },
    { value: 3, label: "Quite like me" },
    { value: 4, label: "Very like me" },
  ],
};

const sections = [
  {
    id: "context",
    title: "Context and DSM Gates",
    note: "These questions help a clinician interpret scores. They are not scored as symptoms by themselves.",
    questions: [
      q("ctx-child-adhd-inatt", "Before age 12, I had attention, forgetfulness, disorganization, losing things, unfinished work, or careless-mistake problems that other people noticed or that caused real-life difficulties.", "choice", {
        condition: "context",
        domain: "adhdChildhoodInattentive",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-child-adhd-hyper", "Before age 12, I had restlessness, fidgeting, interrupting, impulsive actions, excessive talking, or difficulty waiting that other people noticed or that caused real-life difficulties.", "choice", {
        condition: "context",
        domain: "adhdChildhoodHyperImpulsive",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-child-asd-social", "In childhood, I had social-communication differences such as eye contact that felt uncomfortable or effortful for me (beyond my culture's or family's norms), difficulty with back-and-forth interaction, literal understanding, a tone of voice others found hard to read, or difficulty making or keeping peer relationships.", "choice", {
        condition: "context",
        domain: "asdEarlySocial",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-child-asd-rrb", "In childhood, I had strong need for sameness, intense interests, sensory sensitivity, repeated movements/speech, unusual play patterns, or distress with changes.", "choice", {
        condition: "context",
        domain: "asdEarlyRrb",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-developmental-regression", "In childhood, I lost or noticeably reduced previously used speech, social skills, play skills, daily-living skills, or regulation skills for a period of time.", "choice", {
        condition: "context",
        domain: "developmentalRegression",
        choices: "historicalYesNoUnsure",
      }),
      q("adir-tool1", "As a child, I sometimes used another person's hand or body to get something done for me instead of pointing, asking, or combining words with eye contact.", "choice", {
        condition: "context",
        domain: "asdEarlyRequesting",
        choices: "historicalYesNoUnsure",
      }),
      q("adir-ja1", "As a child, I rarely pointed, showed, or brought things to someone mainly to share interest, not to request help.", "choice", {
        condition: "context",
        domain: "asdEarlyJointAttention",
        choices: "historicalYesNoUnsure",
      }),
      q("adir-pron1", "I have been told, or I remember, that as a child I mixed up pronouns or names when referring to myself or other people.", "choice", {
        condition: "context",
        domain: "asdEarlyLanguageMarkers",
        choices: "historicalYesNoUnsure",
      }),
      q("adir-neo1", "As a child, I used made-up words, private labels, or fixed phrases in a consistent way that made sense to me but were not standard usage.", "choice", {
        condition: "context",
        domain: "asdEarlyLanguageMarkers",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-collateral", "A parent, older relative, school record, report card, or other childhood source could likely give examples about my early attention, activity level, social communication, routines, interests, or sensory patterns.", "choice", {
        condition: "context",
        domain: "collateralHistory",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-settings", "My current difficulties with attention, activity or impulse control, social communication, sensory input or routines, intrusive thoughts or rituals, or anxiety show up in these settings: home, work, school, relationships, errands, appointments, or online communication.", "choice", {
        condition: "context",
        domain: "settings",
        choices: "settings",
      }),
      q("ctx-impair", "Overall, difficulties with attention, activity or impulse control, social communication, sensory input or routines, intrusive thoughts or rituals, or anxiety reduce my quality of life or interfere with work, study, self-care, relationships, money, appointments, or daily tasks.", "choice", {
        condition: "context",
        domain: "globalImpairment",
        choices: "impairment",
      }),
      q("ctx-mask", "Other people may not notice my attention, social-communication, sensory, or self-regulation difficulties because I plan, rehearse, copy others, avoid situations, or recover alone afterward.", "scale", {
        condition: "context",
        domain: "masking",
      }),
      q("ctx-literal", "I answer questions very literally, so vague words like normal, often, social, or appropriate can make questionnaires hard to answer.", "scale", {
        condition: "context",
        domain: "literalInterpretation",
      }),
      q("ctx-support", "My functioning drops without practical supports such as accommodations, reminders, scripts, body doubling, routines, or environmental changes.", "scale", {
        condition: "context",
        domain: "supportNeed",
      }),
      q("ctx-lifetime-continuity", "Difficulties with attention, social communication, or self-regulation have been present across most of my adult life, including outside stressful or unusually difficult periods.", "choice", {
        condition: "context",
        domain: "lifetimeContinuity",
        choices: "agreement",
      }),
      q("ctx-symptom-free-intervals", "I have gone for a year or more without noticeable difficulties with attention, social communication, or self-regulation.", "scale", {
        condition: "context",
        domain: "symptomFreeIntervals",
      }),
      q("val-infrequency", "I have never in my life felt distracted, even briefly.", "choice", {
        condition: "validity",
        domain: "infrequency",
        choices: "yesNoUnsure",
      }),
    ],
  },
  {
    id: "adhd-inattention",
    title: "ADHD: Inattention and Executive Function",
    note: "Answer based on adult life during the last 6 months. Count the effort required even when the task eventually gets done.",
    questions: [
      q("adhd-i1", "I miss details or make mistakes because my attention slips, even when I understand the task.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i2", "I have trouble keeping attention on work, reading, conversations, chores, or forms unless the topic is highly interesting.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i3", "When someone speaks directly to me, I miss part of what they said because my attention moved elsewhere.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i4", "I start tasks but do not finish them because I lose focus, switch tasks, or get sidetracked.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i5", "I have difficulty organizing steps, materials, time, or priorities for tasks that matter.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i6", "I avoid or delay tasks that need sustained mental effort, even when I want the result.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i7", "I lose or misplace things needed for daily life, such as keys, wallet, phone, documents, tools, or messages.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i8", "I am pulled away from tasks by sounds, notifications, thoughts, visual details, or activity around me.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i9", "I forget routine obligations, appointments, chores, replies, bills, or planned errands.", "scale", {
        condition: "adhd",
        domain: "inattention",
      }),
      q("adhd-i10", "I can become so absorbed in an interesting activity that I lose track of time, miss obligations, forget to eat or move, and struggle to disengage even when I need to stop.", "scale", {
        condition: "adhd",
        domain: "hyperfocus",
      }),
      q("adhd-i11", "Once I lock into an interesting task, switching to a less interesting or required task takes intense effort, and I may resist or feel real distress at being interrupted.", "scale", {
        condition: "adhd",
        domain: "hyperfocus",
      }),
      q("cata-vig1", "My attention drops fastest during repetitive, predictable, or slow-paced tasks; novelty, urgency, movement, or strong interest helps me perform better.", "scale", {
        condition: "adhd",
        domain: "vigilance",
      }),
      q("cata-vig2", "My performance varies a lot across days or situations, even on the same task, depending on interest, urgency, energy, or external pressure.", "scale", {
        condition: "adhd",
        domain: "performanceVariability",
      }),
      q("cata-spd1", "My response speed is inconsistent: sometimes quick and sharp, other times delayed or slow without a clear reason.", "scale", {
        condition: "adhd",
        domain: "processingSpeedVariability",
      }),
      q("val-reverse-inatt", "I can usually hold a multi-step plan in my head and finish it without losing my place or needing to write each step down.", "scale", {
        condition: "validity",
        domain: "reverseInattention",
      }),
      q("val-consist-objects", "Items that I need such as keys, wallet, phone, papers, or tools are often not where I expect them when I want to use them.", "scale", {
        condition: "validity",
        domain: "consistencyObjects",
      }),
    ],
  },
  {
    id: "adhd-hyperimpulsive",
    title: "ADHD: Hyperactivity and Impulsivity",
    note: "For adults, hyperactivity can be internal restlessness, not only visible movement.",
    questions: [
      q("adhd-h1", "I fidget, tap, shift position, pick at objects, or need movement to stay regulated.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h2", "I leave my seat, pace, or need breaks from sitting when staying seated is expected.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h3", "I feel internally restless, driven, or unable to fully relax.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h4", "I have trouble doing leisure activities quietly or slowly because my body or mind wants more stimulation.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h5", "I feel driven to stay active, start new things, or take on more than planned even when I need to slow down.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h6", "I talk more than I intend to, give too much detail, or keep talking after I planned to stop.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h7", "I answer, decide, spend, send, or act before I have fully thought through the result.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h8", "Waiting my turn, waiting in lines, or waiting for replies is unusually hard for me.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
      q("adhd-h9", "I interrupt, finish other people's sentences, enter conversations abruptly, or intrude without meaning harm.", "scale", {
        condition: "adhd",
        domain: "hyperImpulsive",
      }),
    ],
  },
  {
    id: "adhd-executive-skills",
    title: "Executive Skills and Self-Regulation",
    note: "These questions map adult executive-function domains often assessed alongside ADHD. They are not ADHD diagnostic criteria by themselves.",
    questions: [
      q("adhd-e1", "I have trouble holding instructions, numbers, steps, or what I came to do in mind long enough to use them.", "scale", {
        condition: "adhd",
        domain: "workingMemory",
      }),
      q("adhd-e2", "I lose my place in multi-step tasks unless I write things down, check repeatedly, or keep prompts visible.", "scale", {
        condition: "adhd",
        domain: "workingMemory",
      }),
      q("adhd-e3", "I underestimate or overestimate how long tasks will take, even for tasks I have done before.", "scale", {
        condition: "adhd",
        domain: "timeManagement",
      }),
      q("adhd-e4", "I am late, rush at the last minute, or miss deadlines because time does not feel concrete until it is urgent.", "scale", {
        condition: "adhd",
        domain: "timeManagement",
      }),
      q("adhd-e5", "Starting tasks is hard even when I know exactly what to do and want the task finished.", "scale", {
        condition: "adhd",
        domain: "taskInitiation",
      }),
      q("adhd-e6", "I need outside pressure, another person, a deadline, or a strong emotion to begin important tasks.", "scale", {
        condition: "adhd",
        domain: "taskInitiation",
      }),
      q("adhd-e7", "I have trouble choosing the order of steps, deciding what matters first, or making a realistic plan.", "scale", {
        condition: "adhd",
        domain: "planning",
      }),
      q("adhd-e8", "Large or open-ended tasks become stuck because I cannot break them into clear next actions.", "scale", {
        condition: "adhd",
        domain: "planning",
      }),
      q("adhd-e9", "My spaces, files, messages, notes, or task systems become disorganized enough that I lose time or miss information.", "scale", {
        condition: "adhd",
        domain: "organization",
      }),
      q("adhd-e10", "I create organization systems but stop using them when they become boring, hidden, too complex, or interrupted.", "scale", {
        condition: "adhd",
        domain: "organization",
      }),
      q("adhd-e11", "I keep going with an unhelpful plan because switching strategies takes too much effort in the moment.", "scale", {
        condition: "adhd",
        domain: "flexibility",
      }),
      q("adhd-e12", "Interruptions or changed priorities make it hard to restart, re-plan, or return to what I was doing.", "scale", {
        condition: "adhd",
        domain: "flexibility",
      }),
      q("adhd-e13", "I do not notice I am off task, over-talking, rushing, stuck, or missing the point until later.", "scale", {
        condition: "adhd",
        domain: "selfMonitoring",
      }),
      q("adhd-e14", "After tasks or conversations, I realize I missed cues, skipped steps, or made avoidable errors that I did not catch at the time.", "scale", {
        condition: "adhd",
        domain: "selfMonitoring",
      }),
      q("adhd-e15", "Frustration, excitement, stress, boredom, or sudden demands can quickly override my plan or make my reaction bigger than intended.", "scale", {
        condition: "adhd",
        domain: "emotionalControl",
      }),
      q("adhd-e16", "Under stress or pressure, my attention, memory, planning, or impulse control drops sharply.", "scale", {
        condition: "adhd",
        domain: "stressTolerance",
      }),
      q("adhd-e17", "I start doing something impulsive before I can stop myself — clicking, sending, spending, speaking, or moving — even when I knew I should wait.", "scale", {
        condition: "adhd",
        domain: "behavioralRegulation",
      }),
      q("adhd-e18", "Once I have started a response, action, or behavior, I find it hard to interrupt or reverse it mid-flow.", "scale", {
        condition: "adhd",
        domain: "behavioralRegulation",
      }),
      q("adhd-e19", "Perceived criticism, failure, rejection, or disappointing someone important causes sudden intense emotional pain that feels overwhelming or out of proportion.", "scale", {
        condition: "adhd",
        domain: "rejectionSensitivity",
      }),
      q("diva-emolab1", "My mood can shift quickly from calm to irritable, frustrated, or low, even when the trigger is small or unclear.", "scale", {
        condition: "adhd",
        domain: "emotionalLability",
      }),
      q("diva-emolab2", "When I experience a rapid mood shift, it tends to resolve within hours rather than lasting for days.", "scale", {
        condition: "adhd",
        domain: "emotionalLability",
      }),
      q("diva-self1", "I carry a persistent sense that I am lazy, unreliable, broken, or less capable, even when part of me knows that may not be fair.", "scale", {
        condition: "adhd",
        domain: "selfConcept",
      }),
      q("diva-self2", "Years of forgetting, underperforming, or not following through have reduced my confidence in my own reliability or abilities.", "scale", {
        condition: "adhd",
        domain: "selfConcept",
      }),
      q("caars-self2", "I hide how much effort attention, planning, organization, or following through takes me because I feel embarrassed that other adults seem to manage these tasks more easily.", "scale", {
        condition: "adhd",
        domain: "selfConcept",
      }),
      q("val-reverse-emotion", "When I get frustrated, disappointed, or upset, I can usually return to a calm state quickly and without needing much outside help.", "scale", {
        condition: "validity",
        domain: "reverseEmotional",
      }),
    ],
  },
  {
    id: "adhd-impact",
    title: "ADHD: Adult Impact and Functioning",
    note: "These questions map adult impairment domains often explored in structured ADHD interviews.",
    questions: [
      q("diva-work1", "Attention, impulsivity, emotional regulation, or task-starting difficulties noticeably affect my work performance, study output, deadlines, errors, or career progress.", "scale", {
        condition: "adhd",
        domain: "workEducationImpairment",
      }),
      q("diva-work2", "I have lost opportunities, changed roles, underperformed, or needed accommodations because attention or self-regulation created problems, not because of lack of ability or interest.", "scale", {
        condition: "adhd",
        domain: "workEducationImpairment",
      }),
      q("diva-rel1", "Attention, impulsivity, lateness, over-committing, emotional reactions, or unfinished promises noticeably affect my relationships with a partner, family, friends, or close colleagues.", "scale", {
        condition: "adhd",
        domain: "relationshipImpairment",
      }),
      q("caars-rel1", "Someone close to me has had to compensate for, manage around, or repair the effects of my attention or impulsivity difficulties in ways that created tension or resentment.", "scale", {
        condition: "adhd",
        domain: "relationshipImpairment",
      }),
      q("diva-adl1", "Meals, hygiene, sleep routines, medications, household tasks, finances, appointments, or paperwork regularly fall apart because of attention or self-regulation difficulties.", "scale", {
        condition: "adhd",
        domain: "dailyLivingImpairment",
      }),
      q("diva-adl2", "I rely on another person, alarms, apps, visible reminders, body doubling, or other external structures to manage daily tasks that many adults handle more automatically.", "scale", {
        condition: "adhd",
        domain: "dailyLivingImpairment",
      }),
    ],
  },
  {
    id: "asd-social",
    title: "Autism Spectrum: Social Communication",
    note: "These questions avoid assuming that wanting friends means social communication is easy.",
    questions: [
      q("asd-a1", "Back-and-forth conversation takes conscious effort, such as tracking when to speak, what to ask, or when to stop.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("asd-a2", "People around me tell me I share too little, too much, too intensely, or at unexpected times, even when my intent is friendly or neutral.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("asd-a3", "I often need scripts, rehearsal, or rules to start, continue, or end social interactions.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("ados-init1", "In conversations, I am more likely to wait for others to start topics, ask questions, or introduce something new than to initiate those things myself.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("asd-a4", "I miss or have to consciously calculate facial expressions, tone, gestures, implied meaning, or body language.", "scale", {
        condition: "asd",
        domain: "nonverbalCommunication",
      }),
      q("asd-a5", "My facial expression, voice tone, eye contact, gestures, or body posture are read by others as different from what I mean.", "scale", {
        condition: "asd",
        domain: "nonverbalCommunication",
      }),
      q("asd-a6", "Eye contact, facial monitoring, or reading body language costs enough energy that it can reduce how well I process words.", "scale", {
        condition: "asd",
        domain: "nonverbalCommunication",
      }),
      q("asd-a7", "I find it difficult to know how relationships change by context, such as coworker, friend, partner, family, stranger, or authority figure.", "scale", {
        condition: "asd",
        domain: "relationships",
      }),
      q("asd-a8", "Friendships or group belonging are hard to start, maintain, or repair, even when I want connection.", "scale", {
        condition: "asd",
        domain: "relationships",
      }),
      q("asd-a9", "I need extra recovery time after social interaction because decoding, filtering, or performing took effort.", "scale", {
        condition: "asd",
        domain: "relationships",
      }),
      q("asd-a10", "In live interactions, I may not spontaneously show, share, point out, or respond to enjoyment, interest, surprise, or concern in the way other people expect, even with people I know well.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("mig-exit1", "I have difficulty knowing when a conversation or social interaction is ending; I may talk too long, leave abruptly, or miss signs that the other person wants to move on.", "scale", {
        condition: "asd",
        domain: "socialTiming",
      }),
      q("mig-exit2", "I find it hard to tell whether someone is still interested in talking with me or is politely waiting for the interaction to finish.", "scale", {
        condition: "asd",
        domain: "socialTiming",
      }),
      q("ados-insight1", "In real time, I have limited sense of how I come across to other people; I often learn later that I was perceived differently from how I intended.", "scale", {
        condition: "asd",
        domain: "socialInsight",
      }),
      q("val-reverse-social", "I can usually read other people's facial expressions, tone of voice, and body language easily and without having to think about it.", "scale", {
        condition: "validity",
        domain: "reverseSocial",
      }),
      q("val-consist-mentalize", "Working out what other people are thinking or feeling during a conversation is hard for me.", "scale", {
        condition: "validity",
        domain: "consistencyMentalize",
      }),
    ],
  },
  {
    id: "asd-language-empathy-camouflage",
    title: "Autism Spectrum: Language, Camouflaging, Mentalizing, and Empathy",
    note: "These questions cover adult pragmatic language, AQ-style cognitive traits, CAT-Q-style camouflaging, and EQ-style empathy domains using original wording.",
    questions: [
      q("asd-c1", "I take idioms, hints, sarcasm, teasing, or indirect requests literally unless the context is made clear.", "scale", {
        condition: "asd",
        domain: "pragmaticLanguage",
      }),
      q("asd-c2", "Fast group conversations, overlapping speech, or sudden topic changes make it hard to know what is being meant or expected.", "scale", {
        condition: "asd",
        domain: "pragmaticLanguage",
      }),
      q("asd-c3", "I understand words better than implied meaning, subtext, social timing, or what someone expects me to infer.", "scale", {
        condition: "asd",
        domain: "pragmaticLanguage",
      }),
      q("ados-narr1", "When I describe something that happened, other people often seem confused, ask for more context, or tell me I left out important background information.", "scale", {
        condition: "asd",
        domain: "narrativePragmatics",
      }),
      q("ados-narr2", "I find it hard to judge how much detail, context, sequence, or explanation someone needs to understand a story I am telling.", "scale", {
        condition: "asd",
        domain: "narrativePragmatics",
      }),
      q("ados-idio1", "I use words, phrases, or expressions in ways that have personal meaning to me but that other people sometimes do not understand or find unusual.", "scale", {
        condition: "asd",
        domain: "idiosyncraticLanguage",
      }),
      q("ados-idio2", "I have invented words, repurposed existing words, or built private labels because ordinary terms do not quite work for what I mean.", "scale", {
        condition: "asd",
        domain: "idiosyncraticLanguage",
      }),
      q("mig-humor1", "I often do not know whether something is meant as a joke, irony, teasing, or sarcasm unless the other person signals it clearly.", "scale", {
        condition: "asd",
        domain: "humorProcessing",
      }),
      q("mig-humor2", "Other people describe my humor as unusual, very literal, very precise, too dark, or different from what they expected.", "scale", {
        condition: "asd",
        domain: "humorProcessing",
      }),
      q("asd-c4", "I notice small patterns, errors, details, sounds, numbers, textures, or system rules that other people often miss.", "scale", {
        condition: "asd",
        domain: "attentionToDetail",
      }),
      q("asd-c5", "I become absorbed in classifying, comparing, optimizing, debugging, mapping, or systematizing information.", "scale", {
        condition: "asd",
        domain: "attentionToDetail",
      }),
      q("asd-c6", "Open-ended imagining, role-play, fictional social situations, or vague possibilities are harder for me than concrete facts, examples, or systems.", "scale", {
        condition: "asd",
        domain: "imagination",
      }),
      q("asd-c7", "When plans are vague, I need concrete examples, exact expectations, or a model before I can imagine what to do.", "scale", {
        condition: "asd",
        domain: "imagination",
      }),
      q("asd-c8", "I study people, scripts, media, rules, or past interactions to work out how to behave socially.", "scale", {
        condition: "asd",
        domain: "camouflageCompensation",
      }),
      q("asd-c9", "I prepare facial expressions, eye contact, gestures, tone, small talk, or answers before social situations.", "scale", {
        condition: "asd",
        domain: "camouflageCompensation",
      }),
      q("asd-c10", "I hide stimming, sensory distress, confusion, intense interests, literal reactions, or the need to leave so I appear typical.", "scale", {
        condition: "asd",
        domain: "camouflageMasking",
      }),
      q("asd-c11", "I copy others' social style, clothing, humor, gestures, opinions, or interests to blend in, sometimes so seamlessly that I lose track of which traits are originally mine.", "scale", {
        condition: "asd",
        domain: "camouflageAssimilation",
      }),
      q("asd-c12", "After socializing, I feel depleted because I was monitoring and adjusting how I appeared.", "scale", {
        condition: "asd",
        domain: "camouflageAssimilation",
      }),
      q("asd-c13", "I struggle to infer what someone is thinking or feeling unless they say it directly or I can reason it out from clear evidence.", "scale", {
        condition: "asd",
        domain: "cognitiveEmpathy",
      }),
      q("asd-c14", "When someone is upset, I may care deeply but not know what response, facial expression, words, or action they expect.", "scale", {
        condition: "asd",
        domain: "empathicResponse",
      }),
      q("adir-comf1", "When someone near me is visibly upset or in pain, my response may be delayed, practical, uncertain, or less visible than expected even when I care, and people sometimes assume I do not care because my face, voice, timing, or reaction does not match what they expect.", "scale", {
        condition: "asd",
        domain: "empathicResponse",
      }),
      q("asd-c15", "Other people's emotions can feel contagious or overwhelming in my body, even when I care about them and want to respond well.", "scale", {
        condition: "asd",
        domain: "emotionalReactivity",
      }),
      q("asd-c17", "I have difficulty knowing what I am feeling, naming my emotions, or telling the difference between emotions and physical sensations.", "scale", {
        condition: "asd",
        domain: "alexithymia",
      }),
      q("asd-c18", "My feelings about events or situations can take hours or days to surface, or I notice them mainly through physical tension, fatigue, or behavior changes rather than as a clear emotion.", "scale", {
        condition: "asd",
        domain: "alexithymia",
      }),
      q("asd-c19", "I often understand what someone likely meant or felt only later, after I replay the conversation or compare it with other evidence.", "scale", {
        condition: "asd",
        domain: "cognitiveEmpathy",
      }),
      q("asd-c20", "How much I mask varies a lot by context — I may mask more at work, with strangers, or in unfamiliar settings, and less with safer people or when alone.", "scale", {
        condition: "asd",
        domain: "camouflageAssimilation",
      }),
      q("afab-interest-content", "My intense or absorbing interests often focus on people, characters, animals, languages, cultures, or social systems, as much as or more than on objects, machines, or technical topics.", "scale", {
        condition: "asd",
        domain: "interestContent",
      }),
    ],
  },
  {
    id: "asd-rrb",
    title: "Autism Spectrum: Repetition, Sameness, Interests, and Sensory Profile",
    note: "Include private or subtle patterns, not only behaviors that other people can see.",
    questions: [
      q("asd-b1", "I repeat movements, sounds, phrases, pacing, rocking, or hand movements, or I spin, tap, flick, twirl, smell, or repeatedly handle objects, to regulate or soothe myself.", "scale", {
        condition: "asd",
        domain: "repetitiveBehavior",
      }),
      q("asd-b2", "I repeat or replay words, sounds, conversations, media, numbers, or phrases in an automatic, calming, or absorbing way.", "scale", {
        condition: "asd",
        domain: "repetitiveBehavior",
      }),
      q("asd-b3", "I arrange, line up, categorize, collect, or repeat actions in ways that feel calming, necessary, or absorbing.", "scale", {
        condition: "asd",
        domain: "repetitiveBehavior",
      }),
      q("asd-b13", "I fixate on, stare at, or become absorbed by moving things, lights, visual patterns, or specific objects in a way that is hard to interrupt.", "scale", {
        condition: "asd",
        domain: "repetitiveBehavior",
      }),
      q("asd-b4", "Unexpected changes to plans, routines, routes, food, timing, or rules cause distress that is hard for me to move through.", "scale", {
        condition: "asd",
        domain: "sameness",
      }),
      q("asd-b5", "Transitions between tasks, places, roles, or topics are hard unless I get warning, time, or a clear sequence.", "scale", {
        condition: "asd",
        domain: "sameness",
      }),
      q("asd-b6", "I rely on routines, exact methods, repeated meals, repeated clothing, repeated routes, or predictable environments to function.", "scale", {
        condition: "asd",
        domain: "sameness",
      }),
      q("asd-b7", "My interests can become intense, detailed, long-lasting, or absorbing enough that time, conversation, or routines revolve around them.", "scale", {
        condition: "asd",
        domain: "focusedInterests",
      }),
      q("asd-b8", "I spend a lot of time researching, organizing, collecting, practicing, or talking about specific topics or systems.", "scale", {
        condition: "asd",
        domain: "focusedInterests",
      }),
      q("asd-b9", "It is hard to stop an interest or switch away from it, even when another task is important.", "scale", {
        condition: "asd",
        domain: "focusedInterests",
      }),
      q("asd-b10", "Sounds, light, textures, smells, temperature, pain, food textures, clothing, or crowded spaces cause strong distress, avoidance, pain, or shutdown.", "scale", {
        condition: "asd",
        domain: "sensory",
      }),
      q("asd-b11", "I seek specific sensory input, such as pressure, motion, textures, sounds, visual patterns, flavors, or controlled lighting.", "scale", {
        condition: "asd",
        domain: "sensory",
      }),
      q("asd-b12", "Sensory overload, shutdown, meltdown, nausea, pain, or irritability can happen when the environment is too much.", "scale", {
        condition: "asd",
        domain: "sensory",
      }),
    ],
  },
  {
    id: "asd-adult-profile",
    title: "Autism Spectrum: Adult Profile and Legacy Asperger's Notes",
    note: "Asperger's is no longer a separate DSM diagnosis; many people with that older label are now considered under autism spectrum disorder.",
    questions: [
      q("asd-p1", "As far as I know, my spoken language developed on time or early, while differences in social understanding, sensory processing, routines, or intense interests were present.", "choice", {
        condition: "asd",
        domain: "aspergerProfile",
        choices: "agreement",
      }),
      q("asd-p2", "My academic or verbal strengths cause people to underestimate my support needs, so I can appear capable in structured settings while struggling with unstructured social expectations or daily-life demands.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
      }),
      q("asd-p3", "Within my own culture and community, I have been described as blunt, formal, monotone, too intense, too quiet, or socially hard to read.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
      }),
      q("afab-late-recognition", "I first recognized that I might be autistic in adulthood — through online communities, a relative's diagnosis, or seeing myself reflected in media — rather than through childhood school or clinical flagging.", "choice", {
        condition: "asd",
        domain: "aspergerProfile",
        choices: "agreement",
      }),
    ],
  },
  {
    id: "asd-support-level",
    title: "Autism Spectrum: Support Level",
    note: "These questions estimate support intensity for discussion. DSM support levels must be assigned by a clinician.",
    questions: [
      q("asd-l1", "I need scripts, written communication, a support person, or extra preparation for important conversations, appointments, interviews, or conflicts.", "scale", {
        condition: "asd",
        domain: "supportSocial",
      }),
      q("asd-l2", "I need other people to help explain, mediate, repair, or prevent social misunderstandings.", "scale", {
        condition: "asd",
        domain: "supportSocial",
      }),
      q("asd-l3", "Without accommodations, social-communication demands can stop me from working, studying, attending appointments, or maintaining relationships.", "scale", {
        condition: "asd",
        domain: "supportSocial",
      }),
      q("asd-l4", "Changes, transitions, sensory demands, or disrupted routines can derail the rest of my day even when I try to adapt.", "scale", {
        condition: "asd",
        domain: "supportRrb",
      }),
      q("asd-l5", "I need predictable routines, reduced sensory input, advance notice, or environmental control to avoid shutdowns, meltdowns, or burnout.", "scale", {
        condition: "asd",
        domain: "supportRrb",
      }),
      q("asd-l6", "When I am overwhelmed or focused, it is hard to interrupt routines, regulating behaviors, interests, or sensory needs even for important demands.", "scale", {
        condition: "asd",
        domain: "supportRrb",
      }),
      q("asd-l7", "I need help, prompting, reminders, or external structure for daily living tasks such as meals, hygiene, cleaning, paperwork, money, scheduling, transport, or medical care.", "scale", {
        condition: "asd",
        domain: "adaptiveFunction",
      }),
      q("asd-l8", "My supports, routines, accommodations, or recovery time make me appear more independent than I would be without them.", "scale", {
        condition: "asd",
        domain: "adaptiveFunction",
      }),
      q("asd-l9", "I miss body signals such as hunger, thirst, pain, fatigue, needing the bathroom, or emotional overload until they become intense, and I rely on external prompts such as routines, alarms, another person, or visible supplies to notice needs like eating, drinking, resting, medication, or hygiene.", "scale", {
        condition: "asd",
        domain: "interoception",
      }),
      q("asd-l10", "I have shutdowns, meltdowns, loss of speech, freezing, or major recovery crashes after overload.", "scale", {
        condition: "asd",
        domain: "supportRrb",
      }),
      q("asd-l11", "I have had extended periods of exhaustion, withdrawal, reduced speech, or loss of previously-held skills caused by accumulated demands, masking, or overload — distinct from ordinary tiredness — and afterward I can need days or weeks of reduced demand before my thinking, speech, daily living, or emotional regulation returns toward baseline.", "scale", {
        condition: "asd",
        domain: "autisticBurnout",
      }),
      q("mig-motor1", "I am noticeably clumsy, uncoordinated, or physically awkward, such as bumping into things, misjudging distances, tripping, or struggling with fine or gross motor tasks.", "scale", {
        condition: "asd",
        domain: "motorCoordination",
      }),
      q("mig-motor2", "My sense of where my body is in space, where my limbs are, or how much force or grip I am using is unreliable; I may grip too hard, walk too close, misjudge distances, bump into things, or not realize I am in someone's way unless I look or consciously check.", "scale", {
        condition: "asd",
        domain: "motorCoordination",
      }),
    ],
  },
  {
    id: "pattern-clarification",
    title: "Pattern Clarification",
    note: "These questions ask about the quality or type of patterns described elsewhere, so similar-looking experiences from different conditions can be told apart.",
    questions: [
      q("disc-drift", "When my attention leaves the current task, the most common reason is:", "choice", {
        condition: "discriminator",
        domain: "attentionDrift",
        choices: "attentionDrift",
      }),
      q("disc-interest", "My intense interests typically follow this pattern:", "choice", {
        condition: "discriminator",
        domain: "interestDuration",
        choices: "interestDuration",
      }),
      q("disc-rigidity", "I rely on routines and predictable structure mainly because:", "choice", {
        condition: "discriminator",
        domain: "rigidityAetiology",
        choices: "rigidityAetiology",
      }),
      q("disc-stim", "My repetitive movements, pacing, or fidgeting most often serve to:", "choice", {
        condition: "discriminator",
        domain: "stimFunction",
        choices: "stimFunction",
      }),
    ],
  },
  {
    id: "ocd",
    title: "OCD: Intrusions, Rituals, Avoidance, and Insight",
    note: "OCD can include visible rituals, mental rituals, reassurance, checking, avoidance, or repeated review.",
    questions: [
      q("ocd-o1", "Unwanted thoughts, images, urges, or doubts repeat in my mind and feel hard to dismiss.", "scale", {
        condition: "ocd",
        domain: "obsessions",
      }),
      q("ocd-o2", "Unwanted thoughts, images, urges, or doubts that repeat in my mind feel intrusive, distressing, or inconsistent with what I value.", "scale", {
        condition: "ocd",
        domain: "obsessions",
      }),
      q("ocd-o3", "I try to neutralize, cancel, solve, or disprove unwanted thoughts, images, urges, or doubts so I can feel safe or certain.", "scale", {
        condition: "ocd",
        domain: "obsessions",
      }),
      q("ocd-c1", "I repeat behaviors such as checking, washing, ordering, touching, counting, arranging, rereading, or redoing.", "scale", {
        condition: "ocd",
        domain: "compulsions",
      }),
      q("ocd-c2", "I repeat mental actions such as reviewing, praying, counting, comparing, reassurance-seeking, confessing, or self-testing.", "scale", {
        condition: "ocd",
        domain: "mentalCompulsions",
      }),
      q("ocd-c3", "I feel driven to do a ritual until it feels complete, safe, right, clean, certain, or neutralized.", "scale", {
        condition: "ocd",
        domain: "compulsions",
      }),
      q("ocd-a1", "I avoid people, places, objects, media, tasks, or decisions because they trigger intrusive thoughts or rituals.", "scale", {
        condition: "ocd",
        domain: "avoidance",
      }),
      q("ocd-a2", "I seek reassurance, research, ask repeated questions, or review memories to reduce doubt.", "scale", {
        condition: "ocd",
        domain: "avoidance",
      }),
      q("ocd-s1", "Intrusive thoughts or rituals cause distress even when I know the fear may not be realistic.", "scale", {
        condition: "ocd",
        domain: "distressInterference",
      }),
      q("ocd-s2", "Intrusive thoughts, rituals, reassurance, or avoidance interfere with work, study, relationships, self-care, sleep, or leaving the house.", "scale", {
        condition: "ocd",
        domain: "distressInterference",
      }),
      q("ocd-s3", "I try to resist or delay rituals, checking, reassurance, or mental review, but the urge is hard to control.", "scale", {
        condition: "ocd",
        domain: "controlResistance",
      }),
      q("ocd-s4", "People close to me change plans, answer repeated questions, check things, or avoid topics to reduce my anxiety or rituals.", "scale", {
        condition: "ocd",
        domain: "accommodation",
      }),
      q("ocd-t1", "On a typical day, obsessions, compulsions, avoidance, or reassurance take this much time.", "choice", {
        condition: "ocd",
        domain: "timeBurden",
        choices: "time",
      }),
      q("ocd-i1", "When an intrusive fear or doubt is active, the feared outcome feels this believable even if I later recognize it may not be realistic.", "choice", {
        condition: "ocd",
        domain: "insight",
        choices: "insight",
      }),
      q("ocd-tic", "I currently have or previously had motor or vocal tics.", "choice", {
        condition: "ocd",
        domain: "ticRelated",
        choices: "historicalYesNoUnsure",
      }),
    ],
  },
  {
    id: "ocd-themes",
    title: "OCD Symptom Themes",
    note: "Themes can shift over time. These are discussion flags, not separate formal DSM subtypes.",
    questions: [
      q("ocd-theme-contam", "My intrusive thoughts, rituals, avoidance, or reassurance focus on contamination, illness, chemicals, bodily fluids, dirt, or cleanliness.", "scale", {
        condition: "ocd",
        domain: "themeContamination",
      }),
      q("ocd-theme-check", "My intrusive thoughts, rituals, avoidance, or reassurance focus on checking, mistakes, responsibility, safety, appliances, locks, messages, driving, or preventing harm.", "scale", {
        condition: "ocd",
        domain: "themeChecking",
      }),
      q("ocd-theme-order", "My intrusive thoughts, rituals, avoidance, or reassurance focus on symmetry, exactness, arranging, counting, evenness, or making things feel just right.", "scale", {
        condition: "ocd",
        domain: "themeSymmetry",
      }),
      q("ocd-theme-taboo", "My unwanted thoughts, images, urges, or doubts focus on sexual, violent, religious, moral, identity, or relationship themes that feel taboo or unacceptable to me.", "scale", {
        condition: "ocd",
        domain: "themeIntrusive",
      }),
      q("ocd-theme-health", "My intrusive thoughts, rituals, avoidance, or reassurance focus on health, body sensations, illness, medical reassurance, or checking symptoms.", "scale", {
        condition: "ocd",
        domain: "themeHealth",
      }),
      q("ocd-theme-hoard", "I have difficulty discarding possessions because of distress, a sense of responsibility, or fear that I will need them later.", "scale", {
        condition: "ocd",
        domain: "themeHoarding",
      }),
      q("ocd-theme-bfrb", "I have skin-picking, hair-pulling, nail-biting, cheek-biting, or similar urges or behaviors that are difficult to control or cause distress, injury, or interference.", "scale", {
        condition: "ocd",
        domain: "themeBfrb",
      }),
    ],
  },
  {
    id: "cds",
    title: "Cognitive Disengagement Syndrome",
    note: "CDS is an active research construct, not a DSM diagnosis. It is included because it can overlap with or differ from ADHD inattention.",
    questions: [
      q("cds-c1", "I feel mentally foggy, spacey, or not fully connected to what is happening around me.", "scale", {
        condition: "cds",
        domain: "cognitiveFog",
      }),
      q("cds-c2", "My mind drifts, wanders, or daydreams even when I am trying to stay with the task.", "scale", {
        condition: "cds",
        domain: "cognitiveFog",
      }),
      q("cds-c3", "I stare, pause, or get stuck before responding because my thoughts feel slow to arrive.", "scale", {
        condition: "cds",
        domain: "cognitiveFog",
      }),
      q("cds-c4", "I lose track of what I am doing because my attention disconnects rather than jumps to something more interesting.", "scale", {
        condition: "cds",
        domain: "cognitiveFog",
      }),
      q("cds-h1", "I feel sluggish, low-energy, sleepy, or under-activated during the day even when I am not choosing to rest.", "scale", {
        condition: "cds",
        domain: "hypoactivity",
      }),
      q("cds-h2", "I move, start tasks, answer, or shift attention slowly enough that deadlines, conversations, errands, or daily routines become harder.", "scale", {
        condition: "cds",
        domain: "hypoactivity",
      }),
      q("cds-h4", "I tire quickly from ordinary thinking, conversation, reading, or decision-making.", "scale", {
        condition: "cds",
        domain: "hypoactivity",
      }),
      q("cds-s1", "I withdraw, become quiet, or seem absent because staying mentally engaged takes too much effort.", "scale", {
        condition: "cds",
        domain: "withdrawal",
      }),
      q("cds-s2", "People may see me as passive, distant, or uninterested when I am actually foggy, slow, or overloaded.", "scale", {
        condition: "cds",
        domain: "withdrawal",
      }),
    ],
  },
  {
    id: "anxiety",
    title: "Anxiety",
    note: "This section emphasizes adult generalized anxiety while also flagging social, panic, and avoidance patterns.",
    questions: [
      q("anx-g1", "I worry about everyday areas such as work, health, money, family, being late, mistakes, or responsibilities more than the situation realistically calls for.", "scale", {
        condition: "anxiety",
        domain: "gadWorry",
      }),
      q("anx-g2", "Once worry starts, I have trouble controlling it, postponing it, or letting it end.", "scale", {
        condition: "anxiety",
        domain: "gadWorry",
      }),
      q("anx-g3", "Worry is present on more days than not.", "choice", {
        condition: "anxiety",
        domain: "gadWorry",
        choices: "agreement",
      }),
      q("anx-s1", "Anxiety makes me restless, keyed up, irritable, on edge, or unable to relax.", "scale", {
        condition: "anxiety",
        domain: "gadSymptoms",
      }),
      q("anx-s2", "Anxiety or worry contributes to fatigue, poor sleep, muscle tension, headaches, stomach problems, trembling, sweating, or shortness of breath.", "scale", {
        condition: "anxiety",
        domain: "gadSymptoms",
      }),
      q("anx-s3", "Anxiety makes it harder to concentrate, decide, remember, or stay present.", "scale", {
        condition: "anxiety",
        domain: "gadSymptoms",
      }),
      q("anx-iu1", "Uncertainty about plans, outcomes, decisions, or what others are thinking makes me feel anxious, tense, or unable to act.", "scale", {
        condition: "anxiety",
        domain: "intoleranceOfUncertainty",
      }),
      q("anx-iu2", "I take steps to reduce uncertainty — over-preparing, double-checking, seeking repeated reassurance, avoiding open-ended situations, or refusing to commit until I have more information.", "scale", {
        condition: "anxiety",
        domain: "intoleranceOfUncertainty",
      }),
      q("anx-social1", "I fear being judged, rejected, embarrassed, watched, or misunderstood in social or performance situations.", "scale", {
        condition: "anxiety",
        domain: "socialAnxiety",
      }),
      q("anx-social2", "I avoid social, work, school, phone, appointment, or performance situations because of anxiety.", "scale", {
        condition: "anxiety",
        domain: "socialAnxiety",
      }),
      q("anx-panic1", "I have sudden intense surges of fear or panic with body symptoms such as racing heart, dizziness, choking, chest tightness, shaking, or fear of losing control.", "scale", {
        condition: "anxiety",
        domain: "panic",
      }),
      q("anx-panic2", "I avoid places or situations because I fear panic, escape difficulty, or being unable to get help.", "scale", {
        condition: "anxiety",
        domain: "panic",
      }),
      q("anx-duration", "Anxiety, worry, panic, social fear, or avoidance has been a recurring problem for 6 months or longer.", "choice", {
        condition: "anxiety",
        domain: "duration",
        choices: "yesNoUnsure",
      }),
    ],
  },
  {
    id: "differential",
    title: "Differential and Safety Notes",
    note: "These items do not diagnose another condition. They help decide what a clinician should rule out or prioritize.",
    questions: [
      q("diff-sleep-circadian", "Insufficient sleep, insomnia, nightmares, shift work, inconsistent sleep timing, or irregular sleep routines often affect my attention, energy, or mood.", "scale", {
        condition: "differential",
        domain: "sleepCircadian",
      }),
      q("diff-sleep-breathing", "Daytime sleepiness, loud snoring, waking up choking or gasping, morning headaches, or possible sleep apnea may affect my attention, energy, or mood.", "scale", {
        condition: "differential",
        domain: "sleepBreathing",
      }),
      q("diff-mood", "Low mood, grief, depression, hopelessness, or loss of interest often affects my attention, energy, motivation, or worry.", "scale", {
        condition: "differential",
        domain: "mood",
      }),
      q("diff-burnout", "Burnout or prolonged overload from work, caregiving, school, masking, sensory stress, or life demands often affects my attention, energy, motivation, or daily functioning.", "scale", {
        condition: "differential",
        domain: "burnout",
      }),
      q("diff-trauma", "Trauma reminders, chronic stress, unsafe environments, or dissociation often affect my alertness, avoidance, memory, or attention.", "scale", {
        condition: "differential",
        domain: "trauma",
      }),
      q("diff-ptsd-intrusion", "Unwanted memories, flashbacks, or distressing dreams of a past event push into my mind, or I suddenly feel or act as if it is happening again.", "scale", {
        condition: "differential",
        domain: "ptsdComplex",
      }),
      q("diff-ptsd-avoidance", "I deliberately steer away from people, places, activities, conversations, thoughts, or feelings that bring a distressing past event back to mind.", "scale", {
        condition: "differential",
        domain: "ptsdComplex",
      }),
      q("diff-ptsd-cognition", "Since a distressing event, I have been weighed down by persistent shame, guilt, or blame, by a bleak view of myself or others, or by being unable to feel positive emotions.", "scale", {
        condition: "differential",
        domain: "ptsdComplex",
      }),
      q("diff-ptsd-arousal", "I feel constantly on guard or easily startled, or I become irritable, angry, or reckless in a way that feels connected to past stress or danger.", "scale", {
        condition: "differential",
        domain: "ptsdComplex",
      }),
      q("diff-ptsd-dissociation", "I have episodes where the world or my body feels unreal, dreamlike, or far away, or where I lose track of time or cannot recall what happened.", "scale", {
        condition: "differential",
        domain: "ptsdComplex",
      }),
      q("diff-bpd-identity", "My sense of who I am shifts substantially depending on who I am with, recent feedback, or life events.", "scale", {
        condition: "differential",
        domain: "borderlinePattern",
      }),
      q("diff-bpd-splitting", "My view of important people can swing between very positive and very negative within hours or days, depending on how an interaction went.", "scale", {
        condition: "differential",
        domain: "borderlinePattern",
      }),
      q("diff-bpd-emptiness", "I have long stretches of feeling empty or hollow inside, which is different from feeling under-stimulated or bored.", "scale", {
        condition: "differential",
        domain: "borderlinePattern",
      }),
      q("diff-bpd-abandonment", "Anticipated or perceived rejection by an important person produces a level of distress that organises a lot of my behaviour.", "scale", {
        condition: "differential",
        domain: "borderlinePattern",
      }),
      q("diff-iad-direction", "My health-related worry focuses mainly on the possibility of having a serious disease itself, rather than on contamination, on doing rituals, or on neutralising a feared outcome.", "choice", {
        condition: "differential",
        domain: "iadDirection",
        choices: "yesNoUnsure",
      }),
      q("diff-hoard-direction", "Difficulty discarding things comes mainly from genuine attachment to items or distress at losing them, rather than from a sense of contamination, exactness, or avoiding a feared consequence.", "choice", {
        condition: "differential",
        domain: "hoardingDirection",
        choices: "yesNoUnsure",
      }),
      q("diff-substance", "Alcohol, cannabis, stimulants, sedatives, medications, caffeine, or other substances often change my attention, anxiety, sleep, mood, or energy.", "scale", {
        condition: "differential",
        domain: "substanceMedication",
      }),
      q("diff-medical", "Medical issues such as thyroid disease, anemia, pain, neurological symptoms, hormonal changes, long COVID, or another condition often affect my attention, anxiety, sleep, mood, or energy.", "scale", {
        condition: "differential",
        domain: "medical",
      }),
      q("diff-mania", "I have periods lasting several days or longer when my mood is unusually elevated or irritable, with much more energy, less need for sleep, racing thoughts, risk-taking, or feeling unusually powerful.", "scale", {
        condition: "differential",
        domain: "mania",
      }),
      q("diff-psychosis", "While fully awake, I have experiences such as hearing or seeing things others do not, strong paranoia, or beliefs others say are not based in reality.", "scale", {
        condition: "differential",
        domain: "psychosis",
      }),
      q("diff-learning", "Reading, writing, math, speech/language, coordination, or learning difficulties have affected school, work, forms, tests, or daily tasks across my life.", "scale", {
        condition: "differential",
        domain: "learningLanguage",
      }),
      q("diff-risk-self", "In the past month, I have had thoughts of harming myself or not wanting to live.", "choice", {
        condition: "differential",
        domain: "riskSelf",
        choices: "safety",
      }),
      q("diff-risk-other", "In the past month, I have had thoughts of harming someone else.", "choice", {
        condition: "differential",
        domain: "riskOther",
        choices: "safety",
      }),
    ],
  },
  {
    id: "strengths",
    title: "Strengths and Positive Traits (Optional)",
    note: "Optional and not scored. These describe strengths often reported by ADHD and autistic adults. They do not affect your screening results and are not required to generate a report — they are here so you can bring a fuller, more balanced picture to a clinical conversation. Skip any that do not apply.",
    optional: true,
    questions: [
      q("str-hyperfocus", "When something genuinely interests me, I can focus on it so intensely that I lose track of time and produce a large amount of work in one stretch.", "choice", {
        condition: "strengths",
        domain: "strengthHyperfocus",
        choices: "strengthDegree",
        label: "Hyperfocus and sustained output",
      }),
      q("str-drive", "In areas I care about, I bring unusually high energy, drive, and persistence that can move a project or a group forward.", "choice", {
        condition: "strengths",
        domain: "strengthDrive",
        choices: "strengthDegree",
        label: "High drive and energy in areas of interest",
      }),
      q("str-ideation", "I generate ideas, associations, or creative solutions quickly, often connecting things other people treat as unrelated.", "choice", {
        condition: "strengths",
        domain: "strengthIdeation",
        choices: "strengthDegree",
        label: "Rapid idea generation and creativity",
      }),
      q("str-expertise", "My focused interests have given me deep, detailed knowledge or skill in one or more subjects.", "choice", {
        condition: "strengths",
        domain: "strengthExpertise",
        choices: "strengthDegree",
        label: "Deep expertise from focused interests",
      }),
      q("str-pattern", "I readily notice patterns, systems, inconsistencies, or underlying structure that other people tend to miss.", "choice", {
        condition: "strengths",
        domain: "strengthPattern",
        choices: "strengthDegree",
        label: "Pattern recognition and systemizing",
      }),
      q("str-justice", "I have a strong sense of fairness and honesty, and I will act on it even when doing so is inconvenient for me.", "choice", {
        condition: "strengths",
        domain: "strengthJustice",
        choices: "strengthDegree",
        label: "Fairness, honesty, and justice sensitivity",
      }),
      q("str-detail", "I am thorough and accurate with detail, and I often catch errors or small differences that others overlook.", "choice", {
        condition: "strengths",
        domain: "strengthDetail",
        choices: "strengthDegree",
        label: "Attention to detail and accuracy",
      }),
    ],
  },
];

const conditionLabels = {
  adhd: "ADHD",
  asd: "Autism Spectrum",
  audhd: "AuDHD Co-occurrence",
  ocd: "OCD",
  cds: "CDS",
  anxiety: "Anxiety",
};

function q(id, text, type, meta = {}) {
  return { id, text, type, ...meta };
}

const SCREENING_MODULES = [
  { key: "adhd", label: "ADHD" },
  { key: "asd", label: "Autism spectrum" },
  { key: "ocd", label: "OCD" },
  { key: "cds", label: "CDS" },
  { key: "anxiety", label: "Anxiety" },
];

const SCREENING_MODULE_KEYS = SCREENING_MODULES.map((module) => module.key);
const DEFAULT_SCREENING_SCOPE = {
  conditions: [...SCREENING_MODULE_KEYS],
  includeOverlap: true,
};

// Supporting questions are routed only to the condition modules that need
// them. Core condition questions remain intact: focused screening selects
// whole condition modules rather than cherry-picking items within a score.
const CONTEXT_SCOPE_BY_ID = {
  "ctx-child-adhd-inatt": ["adhd"],
  "ctx-child-adhd-hyper": ["adhd"],
  "ctx-child-asd-social": ["asd"],
  "ctx-child-asd-rrb": ["asd"],
  "ctx-developmental-regression": ["asd"],
  "adir-tool1": ["asd"],
  "adir-ja1": ["asd"],
  "adir-pron1": ["asd"],
  "adir-neo1": ["asd"],
  "ctx-collateral": ["adhd", "asd"],
  "ctx-settings": [...SCREENING_MODULE_KEYS],
  "ctx-impair": [...SCREENING_MODULE_KEYS],
  "ctx-mask": ["adhd", "asd"],
  "ctx-literal": [...SCREENING_MODULE_KEYS],
  "ctx-support": ["adhd", "asd"],
  "ctx-lifetime-continuity": ["adhd", "asd"],
  "ctx-symptom-free-intervals": ["adhd", "asd"],
};

const VALIDITY_SCOPE_BY_ID = {
  "val-infrequency": ["adhd", "cds"],
  "val-reverse-inatt": ["adhd"],
  "val-consist-objects": ["adhd"],
  "val-reverse-emotion": ["adhd"],
  "val-reverse-social": ["asd"],
  "val-consist-mentalize": ["asd"],
};

// These forced-choice items contribute directly to the named scores, so they
// remain part of a focused module even when the broader overlap layer is off.
const DISCRIMINATOR_SCOPE_BY_DOMAIN = {
  attentionDrift: ["adhd", "cds"],
  interestDuration: ["adhd", "asd"],
  rigidityAetiology: ["adhd", "asd"],
  stimFunction: ["adhd", "asd"],
};

const DIFFERENTIAL_SCOPE_BY_DOMAIN = {
  sleepCircadian: ["adhd", "cds", "anxiety"],
  sleepBreathing: ["adhd", "cds", "anxiety"],
  mood: ["adhd", "asd", "cds", "anxiety"],
  burnout: ["adhd", "asd", "cds", "anxiety"],
  trauma: [...SCREENING_MODULE_KEYS],
  ptsdComplex: [...SCREENING_MODULE_KEYS],
  borderlinePattern: ["adhd", "asd"],
  iadDirection: ["ocd"],
  hoardingDirection: ["ocd"],
  substanceMedication: ["adhd", "ocd", "cds", "anxiety"],
  medical: [...SCREENING_MODULE_KEYS],
  learningLanguage: ["adhd", "asd", "cds"],
};

const ALWAYS_INCLUDED_DIFFERENTIAL_DOMAINS = new Set(["mania", "psychosis", "riskSelf", "riskOther"]);

// A small number of questions from an unselected condition can be administered
// as overlap-only discussion prompts. They never produce that condition's
// percentage unless its full module is selected.
const BRIDGE_SCOPE_BY_ID = {
  "anx-s3": ["adhd", "cds"],
  "anx-iu1": ["adhd", "asd", "ocd"],
  "anx-iu2": ["adhd", "asd", "ocd"],
  "anx-social1": ["asd"],
  "anx-social2": ["asd"],
  "ocd-o1": ["asd"],
  "ocd-c3": ["asd"],
  "ocd-a1": ["asd"],
};

function normalizeScreeningScope(scope = DEFAULT_SCREENING_SCOPE) {
  const requested = Array.isArray(scope?.conditions) ? scope.conditions : DEFAULT_SCREENING_SCOPE.conditions;
  const conditions = SCREENING_MODULE_KEYS.filter((key) => requested.includes(key));
  return {
    conditions,
    includeOverlap: scope?.includeOverlap !== false,
  };
}

function questionRoleInScope(question, scope = DEFAULT_SCREENING_SCOPE) {
  const normalized = normalizeScreeningScope(scope);
  const selected = new Set(normalized.conditions);
  const intersects = (keys) => Array.isArray(keys) && keys.some((key) => selected.has(key));

  if (selected.has(question.condition)) return "selected";

  if (normalized.includeOverlap && intersects(BRIDGE_SCOPE_BY_ID[question.id])) {
    return "bridge";
  }

  if (question.condition === "strengths") {
    return selected.has("adhd") || selected.has("asd") ? "optional" : null;
  }
  if (question.condition === "context") {
    return intersects(CONTEXT_SCOPE_BY_ID[question.id]) ? "shared" : null;
  }
  if (question.condition === "validity") {
    return intersects(VALIDITY_SCOPE_BY_ID[question.id]) ? "shared" : null;
  }
  if (question.condition === "discriminator") {
    return intersects(DISCRIMINATOR_SCOPE_BY_DOMAIN[question.domain]) ? "shared" : null;
  }
  if (question.condition === "differential") {
    if (ALWAYS_INCLUDED_DIFFERENTIAL_DOMAINS.has(question.domain)) return "shared";
    if (!normalized.includeOverlap) return null;
    return intersects(DIFFERENTIAL_SCOPE_BY_DOMAIN[question.domain]) ? "overlap" : null;
  }
  return null;
}

function questionsForScope(sectionList, scope = DEFAULT_SCREENING_SCOPE) {
  return sectionList.flatMap((section) => section.questions
    .map((question) => ({
      ...question,
      section: section.id,
      optional: Boolean(section.optional),
      scopeRole: questionRoleInScope(question, scope),
    }))
    .filter((question) => question.scopeRole !== null));
}

window.SCREENING_QUESTION_DATA = {
  SCALE,
  CHOICES,
  sections,
  conditionLabels,
  SCREENING_MODULES,
  DEFAULT_SCREENING_SCOPE,
  normalizeScreeningScope,
  questionRoleInScope,
  questionsForScope,
};
})();
