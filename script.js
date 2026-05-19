const STORAGE_KEY = "adult-combined-screening-v1";

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
};

const DISPLAY_CHUNK_SIZE = 10;

const sections = [
  {
    id: "context",
    title: "Context and DSM Gates",
    note: "These questions help a clinician interpret scores. They are not scored as symptoms by themselves.",
    questions: [
      q("ctx-child-adhd", "Before age 12, I had attention, restlessness, impulsivity, or organization problems that other people noticed or that caused real-life difficulties.", "choice", {
        condition: "context",
        domain: "adhdChildhood",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-child-asd", "In childhood, I had social-communication differences, strong need for sameness, intense interests, sensory sensitivity, or repeated movements/speech.", "choice", {
        condition: "context",
        domain: "asdEarly",
        choices: "historicalYesNoUnsure",
      }),
      q("ctx-settings", "My current difficulties show up in these settings: home, work, school, relationships, errands, appointments, or online communication.", "choice", {
        condition: "context",
        domain: "settings",
        choices: "settings",
      }),
      q("ctx-impair", "Overall, these patterns reduce my quality of life or interfere with work, study, self-care, relationships, money, appointments, or daily tasks.", "choice", {
        condition: "context",
        domain: "globalImpairment",
        choices: "impairment",
      }),
      q("ctx-mask", "Other people may not notice my difficulties because I plan, rehearse, copy others, avoid situations, or recover alone afterward.", "scale", {
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
      q("adhd-e15", "Frustration, excitement, rejection, stress, or boredom can quickly override my plan or make my reaction bigger than intended.", "scale", {
        condition: "adhd",
        domain: "emotionalControl",
      }),
      q("adhd-e16", "Under stress or pressure, my attention, memory, planning, or impulse control drops sharply.", "scale", {
        condition: "adhd",
        domain: "stressTolerance",
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
      q("asd-a2", "People tell me I share too little, too much, too intensely, or at unexpected times, even when my intent is friendly or neutral.", "scale", {
        condition: "asd",
        domain: "socialReciprocity",
      }),
      q("asd-a3", "I often need scripts, rehearsal, or rules to start, continue, or end social interactions.", "scale", {
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
      q("asd-c11", "I copy others' social style, clothing, humor, gestures, opinions, or interests to blend in.", "scale", {
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
      q("asd-c15", "Other people's emotions can feel confusing, contagious, overwhelming, or delayed in me.", "scale", {
        condition: "asd",
        domain: "emotionalReactivity",
      }),
      q("asd-c16", "People assume I do not care because my face, voice, timing, or practical response does not match what they expect.", "scale", {
        condition: "asd",
        domain: "empathicResponse",
      }),
    ],
  },
  {
    id: "asd-rrb",
    title: "Autism Spectrum: Repetition, Sameness, Interests, and Sensory Profile",
    note: "Include private or subtle patterns, not only behaviors that other people can see.",
    questions: [
      q("asd-b1", "I repeat movements, sounds, phrases, touch patterns, pacing, rocking, hand movements, or other actions to regulate myself.", "scale", {
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
      q("asd-p1", "As far as I know, I had spoken language on time or early, while social understanding, sensory issues, routines, or intense interests were still present.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
      }),
      q("asd-p2", "My academic or verbal strengths have caused people to underestimate my support needs.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
      }),
      q("asd-p3", "I have been described as blunt, formal, monotone, too intense, too quiet, or socially hard to read.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
      }),
      q("asd-p4", "I can appear capable in structured settings but have difficulty with unstructured social expectations or daily-life demands.", "scale", {
        condition: "asd",
        domain: "aspergerProfile",
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
      q("asd-l9", "I miss body signals such as hunger, thirst, pain, fatigue, needing the bathroom, or emotional overload until they become intense.", "scale", {
        condition: "asd",
        domain: "sensory",
      }),
      q("asd-l10", "I have shutdowns, meltdowns, loss of speech, freezing, or major recovery crashes after overload.", "scale", {
        condition: "asd",
        domain: "supportRrb",
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
      q("ocd-o2", "These repeated thoughts feel intrusive, distressing, or inconsistent with what I value.", "scale", {
        condition: "ocd",
        domain: "obsessions",
      }),
      q("ocd-o3", "I try to neutralize, cancel, solve, or prove these thoughts wrong so I can feel safe or certain.", "scale", {
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
        choices: "yesNoUnsure",
      }),
    ],
  },
  {
    id: "ocd-themes",
    title: "OCD Symptom Themes",
    note: "Themes can shift over time. These are discussion flags, not separate formal DSM subtypes.",
    questions: [
      q("ocd-theme-contam", "Contamination, illness, chemicals, bodily fluids, dirt, or cleanliness fears are a major theme.", "scale", {
        condition: "ocd",
        domain: "themeContamination",
      }),
      q("ocd-theme-check", "Checking, mistakes, responsibility, safety, appliances, locks, messages, driving, or harm prevention are major themes.", "scale", {
        condition: "ocd",
        domain: "themeChecking",
      }),
      q("ocd-theme-order", "Symmetry, exactness, arranging, counting, evenness, or needing things to feel just right are major themes.", "scale", {
        condition: "ocd",
        domain: "themeSymmetry",
      }),
      q("ocd-theme-taboo", "Unwanted taboo, sexual, violent, religious, moral, identity, or relationship thoughts are major themes.", "scale", {
        condition: "ocd",
        domain: "themeIntrusive",
      }),
      q("ocd-theme-health", "Health anxiety, body sensations, medical reassurance, or repeated checking of symptoms are major themes.", "scale", {
        condition: "ocd",
        domain: "themeHealth",
      }),
      q("ocd-theme-hoard", "Difficulty discarding possessions because of distress, responsibility, or fear of needing them is a major theme.", "scale", {
        condition: "ocd",
        domain: "themeHoarding",
      }),
      q("ocd-theme-bfrb", "Skin picking, hair pulling, nail biting, cheek biting, or similar body-focused repetitive behaviors are a major issue.", "scale", {
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
      q("cds-h2", "I move, start tasks, answer, or shift attention more slowly than the situation requires.", "scale", {
        condition: "cds",
        domain: "hypoactivity",
      }),
      q("cds-h3", "My pace is slow enough that deadlines, conversations, errands, or daily routines become harder.", "scale", {
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
      q("anx-g3", "Worry is present on more days than not.", "scale", {
        condition: "anxiety",
        domain: "gadWorry",
      }),
      q("anx-s1", "Anxiety makes me restless, keyed up, or unable to relax.", "scale", {
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
      q("anx-s4", "I become irritable, on edge, or easily overwhelmed when anxious.", "scale", {
        condition: "anxiety",
        domain: "gadSymptoms",
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
      q("anx-duration", "This anxiety pattern has lasted 6 months or longer.", "choice", {
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
      q("diff-sleep", "Sleep problems, shift work, insomnia, nightmares, possible sleep apnea, or irregular sleep happen often enough to affect my attention, energy, or mood.", "scale", {
        condition: "differential",
        domain: "sleep",
      }),
      q("diff-mood", "Low mood, grief, burnout, depression, or loss of interest often affects my attention, energy, motivation, or worry.", "scale", {
        condition: "differential",
        domain: "mood",
      }),
      q("diff-trauma", "Trauma reminders, chronic stress, unsafe environments, or dissociation often affect my alertness, avoidance, memory, or attention.", "scale", {
        condition: "differential",
        domain: "trauma",
      }),
      q("diff-substance", "Alcohol, cannabis, stimulants, sedatives, medications, caffeine, or other substances often change my attention, anxiety, sleep, mood, or energy.", "scale", {
        condition: "differential",
        domain: "substanceMedical",
      }),
      q("diff-medical", "Medical issues such as thyroid disease, anemia, pain, neurological symptoms, hormonal changes, long COVID, or another condition often affect my attention, anxiety, sleep, mood, or energy.", "scale", {
        condition: "differential",
        domain: "substanceMedical",
      }),
      q("diff-mania", "I have periods lasting hours or days when my mood is unusually elevated or irritable, with much more energy, less need for sleep, racing thoughts, risk-taking, or feeling unusually powerful.", "scale", {
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
      q("diff-risk", "In the past month, have you had thoughts of harming yourself, not wanting to live, or harming someone else?", "choice", {
        condition: "differential",
        domain: "risk",
        choices: "safety",
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

function allQuestions() {
  return sections.flatMap((section) => section.questions.map((question) => ({ ...question, section: section.id })));
}

function displayQuestionGroups() {
  const queues = sections.map((section) => section.questions.map((question) => ({ ...question, sourceSection: section.id })));
  const mixed = [];
  let hasQuestions = true;

  while (hasQuestions) {
    hasQuestions = false;
    queues.forEach((queue) => {
      const next = queue.shift();
      if (next) {
        mixed.push(next);
        hasQuestions = true;
      }
    });
  }

  const groups = [];
  for (let index = 0; index < mixed.length; index += DISPLAY_CHUNK_SIZE) {
    const questions = mixed.slice(index, index + DISPLAY_CHUNK_SIZE);
    const start = index + 1;
    const end = index + questions.length;
    groups.push({
      id: `part-${groups.length + 1}`,
      title: `Part ${groups.length + 1}`,
      note: `Mixed questions ${start}-${end} of ${mixed.length}. Answer based on the last 6 months unless the question asks about earlier life.`,
      questions,
      offset: index,
    });
  }
  return groups;
}

function byId(id) {
  return document.getElementById(id);
}

function renderQuestionnaire() {
  const container = byId("questionnaire");
  const sectionTemplate = byId("sectionTemplate");
  const scaleTemplate = byId("scaleQuestionTemplate");
  const choiceTemplate = byId("choiceQuestionTemplate");

  displayQuestionGroups().forEach((section) => {
    const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
    sectionNode.id = section.id;
    sectionNode.querySelector("legend").textContent = section.title;
    sectionNode.querySelector(".section-note").textContent = section.note;
    const list = sectionNode.querySelector(".question-list");

    section.questions.forEach((question, questionIndex) => {
      const template = question.type === "choice" ? choiceTemplate : scaleTemplate;
      const row = template.content.firstElementChild.cloneNode(true);
      const number = `Q${section.offset + questionIndex + 1}`;
      row.dataset.questionId = question.id;
      row.querySelector(".question-code").textContent = number;
      row.querySelector(".question-copy").textContent = question.text;
      row.querySelector(".question-help").textContent = helpText(question);

      const optionContainer = row.querySelector(question.type === "choice" ? ".choice-options" : ".scale-options");
      const options = question.type === "choice" ? CHOICES[question.choices] : SCALE;
      options.forEach((option) => {
        const label = document.createElement("label");
        label.className = "option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option.value;
        input.dataset.label = option.label;
        const span = document.createElement("span");
        const optionTitle = document.createElement("strong");
        optionTitle.className = "option-title";
        optionTitle.textContent = option.label;
        span.append(optionTitle);
        if (option.detail) {
          const optionDetail = document.createElement("small");
          optionDetail.className = "option-detail";
          optionDetail.textContent = option.detail;
          span.append(optionDetail);
        }
        label.append(input, span);
        optionContainer.append(label);
      });

      list.append(row);
    });

    container.append(sectionNode);
  });
}

function helpText(question) {
  if (question.type === "choice") {
    return "Choose the closest option.";
  }
  return "Use the frequency definitions in the answer buttons; count effort and compensation too.";
}

function getAnswers() {
  const data = {
    profile: {
      clientName: byId("clientName").value.trim(),
      clientAge: byId("clientAge").value.trim(),
      reportDate: byId("reportDate").value,
      mainConcern: byId("mainConcern").value.trim(),
    },
    answers: {},
  };

  allQuestions().forEach((question) => {
    const checked = document.querySelector(`input[name="${question.id}"]:checked`);
    if (checked) {
      data.answers[question.id] = {
        value: Number(checked.value),
        label: checked.dataset.label,
      };
    }
  });

  return data;
}

function saveAnswers() {
  const data = getAnswers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  byId("saveState").textContent = "Saved locally in this browser.";
  updateProgress();
}

function restoreAnswers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    Object.entries(data.profile || {}).forEach(([key, value]) => {
      const field = byId(key);
      if (field) field.value = value;
    });

    Object.entries(data.answers || {}).forEach(([id, answer]) => {
      const input = document.querySelector(`input[name="${id}"][value="${answer.value}"]`);
      if (input) input.checked = true;
    });

    byId("saveState").textContent = "Restored local answers.";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function scoreAssessment() {
  const data = getAnswers();
  const questions = allQuestions();
  const answers = data.answers;
  const value = (id) => answers[id]?.value ?? 0;
  const profileValue = (domain) => domainAverage("context", domain, questions, answers);

  const context = {
    adhdChildhood: choiceDomain("context", "adhdChildhood", questions, answers),
    asdEarly: choiceDomain("context", "asdEarly", questions, answers),
    settings: choiceDomain("context", "settings", questions, answers),
    impairment: choiceDomain("context", "globalImpairment", questions, answers),
    masking: profileValue("masking"),
    literalInterpretation: profileValue("literalInterpretation"),
    supportNeed: profileValue("supportNeed"),
  };

  const adhd = scoreAdhd(questions, answers, context);
  const asd = scoreAsd(questions, answers, context);
  const ocd = scoreOcd(questions, answers, context);
  const cds = scoreCds(questions, answers, context);
  const anxiety = scoreAnxiety(questions, answers, context);
  const differential = scoreDifferential(questions, answers);
  const audhd = scoreAudhd(adhd, asd);

  const completion = completionStats(questions, answers);

  return {
    data,
    context,
    completion,
    conditions: { adhd, asd, audhd, ocd, cds, anxiety },
    differential,
    rawValue: value,
  };
}

function scoreAdhd(questions, answers, context) {
  const inattentive = domainStats("adhd", "inattention", questions, answers);
  const hyper = domainStats("adhd", "hyperImpulsive", questions, answers);
  const executiveDomains = [
    ["Working memory", "workingMemory"],
    ["Time management", "timeManagement"],
    ["Task initiation", "taskInitiation"],
    ["Planning/prioritization", "planning"],
    ["Organization", "organization"],
    ["Flexibility/shifting", "flexibility"],
    ["Self-monitoring/metacognition", "selfMonitoring"],
    ["Emotional control", "emotionalControl"],
    ["Stress tolerance", "stressTolerance"],
  ].map(([label, domain]) => [label, domainStats("adhd", domain, questions, answers)]);
  const executiveComposite = average(executiveDomains.map(([, stats]) => stats.percent));
  const symptomBase = Math.max(inattentive.percent, hyper.percent, (inattentive.percent + hyper.percent) / 2);
  const gate = weightedAverage([
    [context.adhdChildhood * 100, 0.34],
    [context.settings * 100, 0.28],
    [context.impairment * 100, 0.38],
  ]);
  const percent = clamp(Math.round(symptomBase * 0.66 + gate * 0.24 + executiveComposite * 0.1));

  let presentation = "Subthreshold or mixed traits";
  if (inattentive.countOften >= 5 && hyper.countOften >= 5) {
    presentation = "Combined presentation signal";
  } else if (inattentive.countOften >= 5) {
    presentation = "Predominantly inattentive presentation signal";
  } else if (hyper.countOften >= 5) {
    presentation = "Predominantly hyperactive-impulsive presentation signal";
  } else if (inattentive.percent >= 55 && hyper.percent >= 55) {
    presentation = "Broad ADHD traits below adult DSM-style symptom-count threshold";
  } else if (inattentive.percent >= hyper.percent + 12) {
    presentation = "Inattentive traits";
  } else if (hyper.percent >= inattentive.percent + 12) {
    presentation = "Hyperactive-impulsive traits";
  }

  return {
    key: "adhd",
    label: "ADHD",
    percent,
    level: level(percent),
    summary: presentation,
    domains: {
      "Inattention": inattentive,
      "Hyperactivity/impulsivity": hyper,
      "Executive skills composite": { percent: executiveComposite },
      ...Object.fromEntries(executiveDomains),
      "DSM-style gates": { percent: gate },
    },
    notes: [
      `${inattentive.countOften}/9 inattentive items and ${hyper.countOften}/9 hyperactive-impulsive items were rated Often or Very often.`,
      `Childhood-onset support: ${gateLabel(context.adhdChildhood)}. Multiple settings: ${gateLabel(context.settings)}. Impairment: ${gateLabel(context.impairment)}.`,
      `ESQ-R-style executive profile is included for functional discussion, not as a standalone ADHD diagnosis score. Composite: ${Math.round(executiveComposite)}%.`,
    ],
  };
}

function scoreAsd(questions, answers, context) {
  const socialDomains = [
    ["Social-emotional reciprocity", "socialReciprocity"],
    ["Nonverbal communication", "nonverbalCommunication"],
    ["Relationships", "relationships"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);

  const rrbDomains = [
    ["Repetitive behavior/speech", "repetitiveBehavior"],
    ["Sameness and transitions", "sameness"],
    ["Focused interests", "focusedInterests"],
    ["Sensory profile", "sensory"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);
  const extendedDomains = [
    ["Pragmatic language", "pragmaticLanguage"],
    ["Attention to detail/systemizing", "attentionToDetail"],
    ["Imagination/abstraction", "imagination"],
    ["Camouflaging: compensation", "camouflageCompensation"],
    ["Camouflaging: masking", "camouflageMasking"],
    ["Camouflaging: assimilation", "camouflageAssimilation"],
    ["Cognitive empathy/mentalizing", "cognitiveEmpathy"],
    ["Empathic response expression", "empathicResponse"],
    ["Emotional reactivity", "emotionalReactivity"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);
  const pragmaticLanguage = extendedDomains.find(([label]) => label === "Pragmatic language")[1];
  const attentionToDetail = extendedDomains.find(([label]) => label === "Attention to detail/systemizing")[1];
  const imagination = extendedDomains.find(([label]) => label === "Imagination/abstraction")[1];
  const camouflageComposite = average(
    extendedDomains
      .filter(([label]) => label.startsWith("Camouflaging"))
      .map(([, stats]) => stats.percent),
  );
  const empathyComposite = average(
    extendedDomains
      .filter(([label]) => label.includes("empathy") || label.includes("Empathic") || label === "Emotional reactivity")
      .map(([, stats]) => stats.percent),
  );
  const supportSocial = domainStats("asd", "supportSocial", questions, answers);
  const supportRrb = domainStats("asd", "supportRrb", questions, answers);
  const adaptiveFunction = domainStats("asd", "adaptiveFunction", questions, answers);
  const supportComposite = average([context.supportNeed, supportSocial.percent, supportRrb.percent, adaptiveFunction.percent]);

  const socialAverage = average(socialDomains.map(([, stats]) => stats.percent));
  const rrbAverage = average(rrbDomains.map(([, stats]) => stats.percent));
  const extendedAverage = average([pragmaticLanguage.percent, attentionToDetail.percent, imagination.percent, camouflageComposite, empathyComposite]);
  const requiredSocial = socialDomains.filter(([, stats]) => stats.percent >= 50).length;
  const requiredRrb = rrbDomains.filter(([, stats]) => stats.percent >= 50).length;
  const gate = weightedAverage([
    [context.asdEarly * 100, 0.36],
    [context.impairment * 100, 0.34],
    [supportComposite, 0.3],
  ]);
  const coverageBonus = ((requiredSocial / 3) * 0.55 + (Math.min(requiredRrb, 2) / 2) * 0.45) * 100;
  const percent = clamp(Math.round(socialAverage * 0.27 + rrbAverage * 0.23 + gate * 0.17 + coverageBonus * 0.13 + supportComposite * 0.1 + extendedAverage * 0.1));
  const asperger = domainStats("asd", "aspergerProfile", questions, answers);
  const supportProfile = asdSupportProfile({
    percent,
    socialAverage,
    rrbAverage,
    supportSocial,
    supportRrb,
    adaptiveFunction,
    context,
  });

  return {
    key: "asd",
    label: "Autism Spectrum",
    percent,
    level: level(percent),
    summary: `${supportProfile.overall}; ${requiredSocial}/3 social-communication domains and ${requiredRrb}/4 restricted/repetitive domains are elevated.`,
    domains: Object.fromEntries([
      ...socialDomains,
      ...rrbDomains,
      ...extendedDomains,
      ["Camouflaging composite", { percent: camouflageComposite }],
      ["Empathy/mentalizing composite", { percent: empathyComposite }],
      ["Social support intensity", supportSocial],
      ["Routine/sensory support intensity", supportRrb],
      ["Adaptive daily-living support", adaptiveFunction],
      ["Support-level composite", { percent: supportProfile.composite }],
      ["Legacy Asperger's-style profile", asperger],
      ["DSM-style gates", { percent: gate }],
    ]),
    notes: [
      "Asperger's disorder is no longer a separate DSM diagnosis; a previous Asperger's-like profile is generally discussed as autism spectrum disorder, often with lower visible language support needs.",
      `Support-level discussion: social communication ${supportProfile.social}; restricted/repetitive and sensory patterns ${supportProfile.rrb}; adaptive daily living ${supportProfile.adaptive}.`,
      `Expanded ASD coverage includes RAADS/AQ/CAT-Q/EQ-style domains using original wording: pragmatic language ${Math.round(pragmaticLanguage.percent)}%, camouflaging ${Math.round(camouflageComposite)}%, empathy/mentalizing ${Math.round(empathyComposite)}%.`,
      `Legacy Asperger's-style profile score: ${Math.round(asperger.percent)}%. Early-development support: ${gateLabel(context.asdEarly)}. Masking score: ${Math.round(context.masking)}%.`,
    ],
  };
}

function scoreAudhd(adhd, asd) {
  const percent = clamp(Math.round(Math.min(adhd.percent, asd.percent) * 0.7 + average([adhd.percent, asd.percent]) * 0.3));
  let summary = "Low co-occurrence signal";
  if (adhd.percent >= 65 && asd.percent >= 65) {
    summary = "Strong co-occurring ADHD + autism spectrum signal";
  } else if (adhd.percent >= 55 && asd.percent >= 55) {
    summary = "Moderate co-occurring ADHD + autism spectrum signal";
  } else if (adhd.percent >= 65 || asd.percent >= 65) {
    summary = "One condition is elevated; review overlap and differential explanations";
  }

  return {
    key: "audhd",
    label: "AuDHD Co-occurrence",
    percent,
    level: level(percent),
    summary,
    domains: {
      ADHD: { percent: adhd.percent },
      "Autism Spectrum": { percent: asd.percent },
    },
    notes: [
      "AuDHD is an informal term for co-occurring ADHD and autism spectrum disorder, not a separate DSM diagnosis.",
      "A clinician should evaluate both conditions directly because ADHD and autism can mask, mimic, or amplify each other.",
    ],
  };
}

function scoreOcd(questions, answers, context) {
  const obsessions = domainStats("ocd", "obsessions", questions, answers);
  const compulsions = domainStats("ocd", "compulsions", questions, answers);
  const mentalCompulsions = domainStats("ocd", "mentalCompulsions", questions, answers);
  const avoidance = domainStats("ocd", "avoidance", questions, answers);
  const distressInterference = domainStats("ocd", "distressInterference", questions, answers);
  const controlResistance = domainStats("ocd", "controlResistance", questions, answers);
  const accommodation = domainStats("ocd", "accommodation", questions, answers);
  const timeBurden = choiceDomain("ocd", "timeBurden", questions, answers) * 100;
  const insight = choiceDomain("ocd", "insight", questions, answers) * 100;
  const tic = choiceDomain("ocd", "ticRelated", questions, answers);
  const core = average([obsessions.percent, compulsions.percent, mentalCompulsions.percent, avoidance.percent]);
  const severity = average([distressInterference.percent, controlResistance.percent, accommodation.percent]);
  const percent = clamp(Math.round(core * 0.52 + severity * 0.16 + timeBurden * 0.16 + context.impairment * 100 * 0.16));
  const themes = [
    ["Contamination/cleaning", "themeContamination"],
    ["Checking/responsibility/harm prevention", "themeChecking"],
    ["Symmetry/ordering/just-right", "themeSymmetry"],
    ["Taboo/intrusive thoughts", "themeIntrusive"],
    ["Health/somatic reassurance", "themeHealth"],
    ["Hoarding-like difficulty discarding", "themeHoarding"],
    ["Body-focused repetitive behaviors", "themeBfrb"],
  ]
    .map(([label, domain]) => [label, domainStats("ocd", domain, questions, answers)])
    .sort((a, b) => b[1].percent - a[1].percent);

  return {
    key: "ocd",
    label: "OCD",
    percent,
    level: level(percent),
    summary: ocdSummary(obsessions, compulsions, mentalCompulsions, timeBurden),
    domains: {
      Obsessions: obsessions,
      "Visible compulsions": compulsions,
      "Mental compulsions": mentalCompulsions,
      Avoidance: avoidance,
      "Distress/interference": distressInterference,
      "Control/resistance difficulty": controlResistance,
      "Family/partner accommodation": accommodation,
      "Time burden": { percent: timeBurden },
      Insight: { percent: insight },
      ...Object.fromEntries(themes),
    },
    notes: [
      `Insight while triggered: ${insightLabel(insight)}. Tic-related specifier discussion: ${tic >= 0.75 ? "yes/likely" : tic >= 0.4 ? "uncertain" : "not indicated"}.`,
      `Top themes: ${themes.slice(0, 3).map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`).join(", ")}.`,
    ],
  };
}

function scoreCds(questions, answers, context) {
  const fog = domainStats("cds", "cognitiveFog", questions, answers);
  const hypo = domainStats("cds", "hypoactivity", questions, answers);
  const withdrawal = domainStats("cds", "withdrawal", questions, answers);
  const percent = clamp(Math.round(fog.percent * 0.45 + hypo.percent * 0.38 + withdrawal.percent * 0.1 + context.impairment * 100 * 0.07));
  let summary = "Low or nonspecific CDS signal";
  if (percent >= 65 && fog.percent >= hypo.percent + 12) summary = "Cognitive fog/daydreaming dominant CDS signal";
  else if (percent >= 65 && hypo.percent >= fog.percent + 12) summary = "Hypoactive/low-energy dominant CDS signal";
  else if (percent >= 65) summary = "Mixed cognitive disengagement and hypoactivity signal";
  else if (percent >= 45) summary = "Moderate CDS traits; compare with ADHD, sleep, depression, and medical factors";

  return {
    key: "cds",
    label: "Cognitive Disengagement Syndrome",
    percent,
    level: level(percent),
    summary,
    domains: {
      "Cognitive fog/daydreaming": fog,
      "Hypoactivity/low energy": hypo,
      Withdrawal: withdrawal,
    },
    notes: [
      "CDS is not a DSM diagnosis. Current research describes it as mental fogginess, excessive mind-wandering/daydreaming, slowed behavior or thinking, and reduced alertness.",
      "A clinician should rule out sleep disorders, depression, medication effects, substance effects, and medical conditions when CDS traits are high.",
    ],
  };
}

function scoreAnxiety(questions, answers, context) {
  const worry = domainStats("anxiety", "gadWorry", questions, answers);
  const symptoms = domainStats("anxiety", "gadSymptoms", questions, answers);
  const social = domainStats("anxiety", "socialAnxiety", questions, answers);
  const panic = domainStats("anxiety", "panic", questions, answers);
  const duration = choiceDomain("anxiety", "duration", questions, answers) * 100;
  const gadLike = clamp(Math.round(worry.percent * 0.42 + symptoms.percent * 0.3 + duration * 0.14 + context.impairment * 100 * 0.14));
  const percent = Math.max(gadLike, Math.round(social.percent * 0.72 + context.impairment * 100 * 0.12 + duration * 0.16), Math.round(panic.percent * 0.72 + context.impairment * 100 * 0.12 + duration * 0.16));
  const dominant = [
    ["GAD-like worry", { percent: gadLike }],
    ["Social anxiety", social],
    ["Panic/agoraphobic avoidance", panic],
  ].sort((a, b) => b[1].percent - a[1].percent);

  return {
    key: "anxiety",
    label: "Anxiety",
    percent,
    level: level(percent),
    summary: `${dominant[0][0]} is the strongest anxiety pattern.`,
    domains: {
      "Generalized worry": worry,
      "GAD physical/cognitive symptoms": symptoms,
      "GAD-like composite": { percent: gadLike },
      "Social anxiety": social,
      "Panic/agoraphobic avoidance": panic,
      "6+ month duration": { percent: duration },
    },
    notes: [
      `Top anxiety dimensions: ${dominant.map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`).join(", ")}.`,
      "Anxiety, OCD, ADHD, autism, sleep problems, trauma, depression, substances, and medical conditions can overlap and should be reviewed together.",
    ],
  };
}

function scoreDifferential(questions, answers) {
  const domains = {
    Sleep: domainStats("differential", "sleep", questions, answers),
    "Mood/burnout": domainStats("differential", "mood", questions, answers),
    "Trauma/stress/dissociation": domainStats("differential", "trauma", questions, answers),
    "Substance/medication/medical": domainStats("differential", "substanceMedical", questions, answers),
    "Mania/hypomania screen": domainStats("differential", "mania", questions, answers),
    "Psychosis-like experiences": domainStats("differential", "psychosis", questions, answers),
    "Learning/language/coordination history": domainStats("differential", "learningLanguage", questions, answers),
    "Current safety risk": domainStats("differential", "risk", questions, answers),
  };
  const flags = Object.entries(domains)
    .filter(([, stats]) => stats.percent >= 50)
    .map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`);

  return { domains, flags };
}

function domainStats(condition, domain, questions, answers) {
  const matched = questions.filter((question) => question.condition === condition && question.domain === domain);
  if (!matched.length) return { percent: 0, average: 0, countOften: 0, answered: 0, total: 0 };
  const values = matched.map((question) => answers[question.id]?.value ?? 0);
  const answered = matched.filter((question) => answers[question.id]).length;
  const averageValue = average(values);
  return {
    percent: clamp(Math.round((averageValue / 4) * 100)),
    average: averageValue,
    countOften: values.filter((item) => item >= 3).length,
    answered,
    total: matched.length,
  };
}

function domainAverage(condition, domain, questions, answers) {
  return domainStats(condition, domain, questions, answers).percent;
}

function choiceDomain(condition, domain, questions, answers) {
  const matched = questions.filter((question) => question.condition === condition && question.domain === domain);
  if (!matched.length) return 0;
  return average(matched.map((question) => answers[question.id]?.value ?? 0));
}

function completionStats(questions, answers) {
  const total = questions.length;
  const answered = questions.filter((question) => answers[question.id]).length;
  const percent = total ? Math.round((answered / total) * 100) : 0;
  return { total, answered, percent };
}

function renderResults(report) {
  const container = byId("results");
  const { data, context, completion, conditions, differential } = report;
  const date = data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";

  const cards = Object.values(conditions)
    .map((condition) => resultCard(condition))
    .join("");

  const details = Object.values(conditions)
    .map((condition) => detailCard(condition))
    .join("");

  const recommendations = buildRecommendations(report)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  const differentialFlags = differential.flags.length
    ? differential.flags.map((flag) => `<span class="tag">${escapeHtml(flag)}</span>`).join("")
    : '<span class="tag">No major differential flag reached 50%</span>';

  container.innerHTML = `
    <div class="result-header">
      <h2 tabindex="-1">Screening Report</h2>
      <p><strong>${escapeHtml(name)}${escapeHtml(age)}</strong> · ${escapeHtml(date)} · ${completion.answered}/${completion.total} answered (${completion.percent}% complete)</p>
      <p>This report shows screening match percentages, not diagnostic probabilities. It is intended to support a formal clinical assessment.</p>
    </div>
    <div class="summary-grid">${cards}</div>
    <div class="detail-card">
      <h3>Context for Clinician</h3>
      <p>Childhood ADHD support: ${gateLabel(context.adhdChildhood)}. Early autism-spectrum support: ${gateLabel(context.asdEarly)}. Multiple settings: ${gateLabel(context.settings)}. Global impairment: ${gateLabel(context.impairment)}.</p>
      <p>Masking/compensation: ${Math.round(context.masking)}%. Literal questionnaire interpretation difficulty: ${Math.round(context.literalInterpretation)}%. Support/accommodation need: ${Math.round(context.supportNeed)}%.</p>
      ${data.profile.mainConcern ? `<p><strong>Main concern:</strong> ${escapeHtml(data.profile.mainConcern)}</p>` : ""}
    </div>
    <div class="detail-card">
      <h3>Differential and Safety Flags</h3>
      <div class="tag-list">${differentialFlags}</div>
      ${differential.domains["Current safety risk"].percent >= 50 ? '<p><strong>Safety note:</strong> Current self-harm or harm-related thoughts were endorsed at a clinically important level. Seek urgent support now if there is any immediate risk.</p>' : ""}
      ${differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50 ? '<p><strong>Priority differential note:</strong> Elevated mania/hypomania or psychosis-like experiences should be reviewed promptly with a qualified clinician, especially before starting stimulant or antidepressant medication.</p>' : ""}
    </div>
    <div class="detail-grid">${details}</div>
    <div class="detail-card">
      <h3>Suggested Clinical Discussion Points</h3>
      <ul class="recommendations">${recommendations}</ul>
    </div>
    <p class="print-only">Generated by a local screening web app. This report is not a diagnosis.</p>
  `;
}

function resultCard(condition) {
  const pct = Math.round(condition.percent);
  return `
    <article class="score-card ${condition.level}">
      <h3>${escapeHtml(condition.label)}</h3>
      <span class="score-value">${pct}%</span>
      <p>${escapeHtml(condition.summary)}</p>
      <div class="meter" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </article>
  `;
}

function detailCard(condition) {
  const domains = Object.entries(condition.domains)
    .map(([label, stats]) => `<span class="tag">${escapeHtml(label)} ${Math.round(stats.percent)}%</span>`)
    .join("");
  const notes = condition.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("");
  return `
    <article class="detail-card">
      <h3>${escapeHtml(condition.label)} Detail</h3>
      <p><strong>Screening match:</strong> ${Math.round(condition.percent)}% · ${labelLevel(condition.level)}</p>
      <p><strong>Interpretation:</strong> ${escapeHtml(condition.summary)}</p>
      <div class="tag-list">${domains}</div>
      ${notes}
    </article>
  `;
}

function buildRecommendations(report) {
  const { conditions, context, differential } = report;
  const recs = [];

  Object.values(conditions)
    .filter((condition) => condition.percent >= 60)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      recs.push(`Ask for formal assessment of ${conditionLabels[condition.key] || condition.label}; screening match is ${Math.round(condition.percent)}%.`);
    });

  if (conditions.adhd.percent >= 55 && conditions.asd.percent >= 55) {
    recs.push("Ask the clinician to evaluate ADHD and autism together, because either condition can change how the other appears in adults.");
  }

  if (context.literalInterpretation >= 50 || context.masking >= 50) {
    recs.push("Tell the clinician that literal interpretation, masking, rehearsing, or compensatory strategies may affect standard questionnaire answers.");
  }

  if (differential.flags.length) {
    recs.push(`Review differential factors: ${differential.flags.join("; ")}.`);
  }

  if (differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50) {
    recs.push("Prioritize clinical review of mania/hypomania or psychosis-like experiences before interpreting ADHD, anxiety, OCD, or autism screening scores.");
  }

  if (conditions.cds.percent >= 50) {
    recs.push("Discuss CDS traits as a non-DSM research construct and ask about sleep, fatigue, mood, medical, medication, and ADHD overlap.");
  }

  if (!recs.length) {
    recs.push("Scores are mostly low. If distress or impairment is still significant, bring examples of real-life problems to a clinician because screeners can miss context.");
  }

  return recs;
}

function exportReportPdf(report) {
  const blob = createReportPdf(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = report.data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = report.data.profile.clientName || "adult-screening";
  link.href = url;
  link.download = `${filenameSafe(name)}-${date}-screening-report.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createReportPdf(report) {
  const lines = buildPdfLines(report);
  const pages = paginatePdfLines(lines);
  return writePdf(pages);
}

function buildPdfLines(report) {
  const { data, context, completion, conditions, differential } = report;
  const date = data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";
  const lines = [];

  addPdfHeading(lines, "Adult Combined Screening Report", 18);
  addPdfText(lines, `${name}${age} | ${date} | ${completion.answered}/${completion.total} answered (${completion.percent}% complete)`);
  addPdfText(lines, "This report shows screening-match percentages, not diagnostic probabilities. It is intended to support a formal clinical assessment.");

  if (data.profile.mainConcern) {
    addPdfSubheading(lines, "Main Concern");
    addPdfText(lines, data.profile.mainConcern);
  }

  addPdfSubheading(lines, "Screening Summary");
  Object.values(conditions)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      addPdfText(lines, `${condition.label}: ${Math.round(condition.percent)}% (${labelLevel(condition.level)}). ${condition.summary}`);
    });

  addPdfSubheading(lines, "Context for Clinician");
  addPdfText(lines, `Childhood ADHD support: ${gateLabel(context.adhdChildhood)}. Early autism-spectrum support: ${gateLabel(context.asdEarly)}. Multiple settings: ${gateLabel(context.settings)}. Global impairment: ${gateLabel(context.impairment)}.`);
  addPdfText(lines, `Masking/compensation: ${Math.round(context.masking)}%. Literal questionnaire interpretation difficulty: ${Math.round(context.literalInterpretation)}%. Support/accommodation need: ${Math.round(context.supportNeed)}%.`);

  addPdfSubheading(lines, "Differential and Safety Flags");
  if (differential.flags.length) {
    differential.flags.forEach((flag) => addPdfBullet(lines, flag));
  } else {
    addPdfText(lines, "No major differential flag reached 50%.");
  }
  if (differential.domains["Current safety risk"].percent >= 50) {
    addPdfText(lines, "Safety note: Current self-harm or harm-related thoughts were endorsed at a clinically important level. Seek urgent support now if there is any immediate risk.");
  }
  if (differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50) {
    addPdfText(lines, "Priority differential note: Elevated mania/hypomania or psychosis-like experiences should be reviewed promptly with a qualified clinician, especially before starting stimulant or antidepressant medication.");
  }

  Object.values(conditions)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      addPdfSubheading(lines, `${condition.label} Detail`);
      addPdfText(lines, `Screening match: ${Math.round(condition.percent)}% (${labelLevel(condition.level)}).`);
      addPdfText(lines, `Interpretation: ${condition.summary}`);
      Object.entries(condition.domains).forEach(([label, stats]) => {
        addPdfBullet(lines, `${label}: ${Math.round(stats.percent)}%`);
      });
      condition.notes.forEach((note) => addPdfText(lines, note));
    });

  addPdfSubheading(lines, "Suggested Clinical Discussion Points");
  buildRecommendations(report).forEach((item) => addPdfBullet(lines, item));

  addPdfSubheading(lines, "Clinical Framing Sources");
  [
    "CDC: DSM-5 criteria for ADHD diagnosis",
    "CDC: ADHD in adults",
    "NIDA/WHO: ASRS-v1.1 adult ADHD screener overview",
    "JAMA Psychiatry: ASRS-5 DSM-5 adult ADHD screener",
    "ESQ-R executive skills domains",
    "CDC: DSM-5 diagnostic criteria for autism spectrum disorder",
    "American Psychiatric Association: ADHD and autism spectrum disorder DSM-5 fact sheets",
    "RAADS-R, RAADS-14, Autism-Spectrum Quotient, CAT-Q, and Empathy Quotient construct references",
    "International OCD Foundation: how OCD is diagnosed",
    "NIMH: generalized anxiety disorder",
    "PubMed: cognitive disengagement syndrome research",
  ].forEach((source) => addPdfBullet(lines, source));

  addPdfText(lines, "Generated by a local screening web app. This report is not a diagnosis.");
  return lines;
}

function addPdfHeading(lines, text, size = 16) {
  addWrappedPdfText(lines, text, { size, font: "F2", spacingBefore: 0, spacingAfter: 8 });
}

function addPdfSubheading(lines, text) {
  addWrappedPdfText(lines, text, { size: 13, font: "F2", spacingBefore: 10, spacingAfter: 3 });
}

function addPdfText(lines, text) {
  addWrappedPdfText(lines, text, { size: 10, font: "F1", spacingBefore: 2, spacingAfter: 2 });
}

function addPdfBullet(lines, text) {
  addWrappedPdfText(lines, `- ${text}`, { size: 10, font: "F1", spacingBefore: 1, spacingAfter: 1, indent: 10 });
}

function addWrappedPdfText(lines, text, options) {
  const clean = normalizePdfText(text);
  const maxChars = options.size >= 16 ? 52 : options.size >= 13 ? 68 : 88;
  wrapPdfText(clean, maxChars).forEach((line, index) => {
    lines.push({
      text: line,
      size: options.size,
      font: options.font,
      indent: options.indent || 0,
      spacingBefore: index === 0 ? options.spacingBefore || 0 : 0,
      spacingAfter: options.spacingAfter || 0,
    });
  });
}

function wrapPdfText(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function paginatePdfLines(lines) {
  const pageHeight = 792;
  const margin = 54;
  const pages = [];
  let page = [];
  let y = pageHeight - margin;

  lines.forEach((line) => {
    const lineHeight = line.size + 4;
    y -= line.spacingBefore || 0;
    if (y - lineHeight < margin) {
      pages.push(page);
      page = [];
      y = pageHeight - margin;
    }
    page.push({ ...line, y });
    y -= lineHeight + (line.spacingAfter || 0);
  });

  if (page.length) pages.push(page);
  return pages;
}

function writePdf(pages) {
  const encoder = new TextEncoder();
  const objects = new Map();
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const fontRegularId = 3;
  const fontBoldId = 4;
  let nextObjectId = 5;
  const pageObjectIds = [];

  objects.set(fontRegularId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.set(fontBoldId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageLines) => {
    const pageObjectId = nextObjectId++;
    const contentObjectId = nextObjectId++;
    pageObjectIds.push(pageObjectId);
    const stream = pageLines
      .map((line) => `BT /${line.font} ${line.size} Tf 1 0 0 1 ${margin + (line.indent || 0)} ${line.y} Tm (${escapePdfString(line.text)}) Tj ET`)
      .join("\n");
    objects.set(contentObjectId, `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
    objects.set(pageObjectId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
  });

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`);

  const chunks = [];
  const offsets = [0];
  let offset = 0;
  const add = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    offset += bytes.length;
  };

  add("%PDF-1.4\n");
  for (let id = 1; id < nextObjectId; id += 1) {
    offsets[id] = offset;
    add(`${id} 0 obj\n${objects.get(id)}\nendobj\n`);
  }

  const xrefOffset = offset;
  add(`xref\n0 ${nextObjectId}\n`);
  add("0000000000 65535 f \n");
  for (let id = 1; id < nextObjectId; id += 1) {
    add(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size ${nextObjectId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function normalizePdfText(value) {
  return String(value)
    .replaceAll("·", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replace(/[^\x20-\x7E]/g, " ");
}

function escapePdfString(value) {
  return normalizePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function filenameSafe(value) {
  return normalizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "adult-screening";
}

function ocdSummary(obsessions, compulsions, mentalCompulsions, timeBurden) {
  if (obsessions.percent >= 55 && Math.max(compulsions.percent, mentalCompulsions.percent) >= 55 && timeBurden >= 35) {
    return "Obsessions with compulsions/mental rituals and meaningful time burden";
  }
  if (obsessions.percent >= 55 && mentalCompulsions.percent >= compulsions.percent + 15) {
    return "Obsessions with primarily mental rituals/reassurance pattern";
  }
  if (compulsions.percent >= 55) {
    return "Compulsion/ritual-heavy pattern";
  }
  if (obsessions.percent >= 45) {
    return "Intrusive-thought traits; review anxiety, trauma, depression, and autism overlap";
  }
  return "Low or nonspecific OCD signal";
}

function asdSupportProfile({ percent, socialAverage, rrbAverage, supportSocial, supportRrb, adaptiveFunction, context }) {
  if (percent < 45) {
    return {
      overall: "Low or nonspecific autism-spectrum support-level signal",
      social: "not enough signal for a level discussion",
      rrb: "not enough signal for a level discussion",
      adaptive: "not enough signal for a level discussion",
      composite: 0,
    };
  }

  const socialNeed = weightedAverage([
    [socialAverage, 0.42],
    [supportSocial.percent, 0.42],
    [adaptiveFunction.percent, 0.16],
  ]);
  const rrbNeed = weightedAverage([
    [rrbAverage, 0.4],
    [supportRrb.percent, 0.45],
    [context.impairment * 100, 0.15],
  ]);
  const adaptiveNeed = weightedAverage([
    [adaptiveFunction.percent, 0.55],
    [context.supportNeed, 0.25],
    [context.impairment * 100, 0.2],
  ]);
  const composite = clamp(Math.round(weightedAverage([
    [socialNeed, 0.36],
    [rrbNeed, 0.36],
    [adaptiveNeed, 0.28],
  ])));

  return {
    overall: `${supportLevelLabel(composite)} support-needs discussion; DSM autism levels require clinician judgment`,
    social: supportLevelLabel(socialNeed),
    rrb: supportLevelLabel(rrbNeed),
    adaptive: supportLevelLabel(adaptiveNeed),
    composite,
  };
}

function supportLevelLabel(score) {
  if (score >= 82) return "Level 3-style / very substantial support";
  if (score >= 62) return "Level 2-style / substantial support";
  if (score >= 42) return "Level 1-style / support";
  return "below Level 1-style support threshold";
}

function level(percent) {
  if (percent >= 70) return "high";
  if (percent >= 45) return "moderate";
  return "low";
}

function labelLevel(value) {
  if (value === "high") return "high screening signal";
  if (value === "moderate") return "moderate screening signal";
  return "low screening signal";
}

function gateLabel(value) {
  if (value >= 0.8) return "yes/strong";
  if (value >= 0.45) return "partial/unsure";
  if (value > 0) return "limited";
  return "not endorsed";
}

function insightLabel(value) {
  if (value >= 75) return "absent insight or delusional-level conviction while triggered";
  if (value >= 50) return "poor insight while triggered";
  if (value >= 25) return "fair or variable insight";
  return "good/fair insight";
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weightedAverage(items) {
  const totalWeight = items.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return 0;
  return items.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateProgress() {
  const questions = allQuestions();
  const answered = questions.filter((question) => document.querySelector(`input[name="${question.id}"]:checked`)).length;
  const percent = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  byId("progressPercent").textContent = `${percent}%`;
  byId("progressBar").style.width = `${percent}%`;
  byId("progressTrack").setAttribute("aria-valuenow", String(percent));
  byId("progressTrack").setAttribute("aria-valuetext", `${percent}% complete`);
  syncMissingHighlights();
  if (percent === 100) {
    clearCompletionError();
  } else if (byId("completionError") && !byId("completionError").hidden) {
    showCompletionError(false);
  }
}

function getMissingQuestions() {
  return allQuestions().filter((question) => !document.querySelector(`input[name="${question.id}"]:checked`));
}

function requireCompleteReport() {
  return showCompletionError(true);
}

function showCompletionError(scrollToFirst) {
  const missing = getMissingQuestions();
  if (!missing.length) {
    clearCompletionError();
    return true;
  }

  const total = allQuestions().length;
  const firstMissing = missing[0];
  const firstRow = document.querySelector(`[data-question-id="${firstMissing.id}"]`);
  const firstLabel = firstRow?.querySelector(".question-code")?.textContent || "the first unanswered question";
  const plural = missing.length === 1 ? "question is" : "questions are";
  const error = byId("completionError");
  error.textContent = `Answer all ${total} questions before generating a report. ${missing.length} ${plural} still unanswered. First missing: ${firstLabel}.`;
  error.hidden = false;
  syncMissingHighlights(firstMissing.id);
  if (scrollToFirst) firstRow?.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

function clearCompletionError() {
  const error = byId("completionError");
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
  syncMissingHighlights();
}

function syncMissingHighlights(focusId = null) {
  document.querySelectorAll(".question-row.missing-question").forEach((row) => row.classList.remove("missing-question"));
  if (focusId) {
    document.querySelector(`[data-question-id="${focusId}"]`)?.classList.add("missing-question");
  }
}

function setDefaultDate() {
  const field = byId("reportDate");
  if (!field.value) field.value = new Date().toISOString().slice(0, 10);
}

function focusResultsHeading() {
  byId("results").querySelector("h2")?.focus({ preventScroll: true });
}

function init() {
  renderQuestionnaire();
  setDefaultDate();
  restoreAnswers();
  updateProgress();

  document.addEventListener("change", (event) => {
    if (event.target.matches("input, textarea")) saveAnswers();
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("input[type='text'], input[type='number'], input[type='date'], textarea")) saveAnswers();
  });

  byId("scoreButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    byId("results").scrollIntoView({ behavior: "smooth", block: "start" });
    focusResultsHeading();
  });

  byId("exportPdfButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    focusResultsHeading();
    exportReportPdf(report);
  });

  byId("printButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    renderResults(scoreAssessment());
    focusResultsHeading();
    window.print();
  });

  byId("resetButton").addEventListener("click", () => {
    const confirmed = window.confirm("Clear all saved answers and reset this form?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    byId("assessmentForm").reset();
    byId("results").innerHTML = `
      <div class="empty-state">
        <h2>Results</h2>
        <p>Answer every question to generate, export, or print a report.</p>
      </div>
    `;
    setDefaultDate();
    updateProgress();
    clearCompletionError();
    byId("saveState").textContent = "Answers cleared.";
  });
}

init();
