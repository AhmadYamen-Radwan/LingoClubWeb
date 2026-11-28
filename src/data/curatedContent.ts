import {
  ClozePuzzle,
  CrimeCase,
  EvidenceCardItem,
  FlashcardDeck,
  GuessingPack,
  MatchPuzzleSet,
  QuizPack,
  RoleplayScenario,
  SentencePuzzle,
} from '../types';

export interface WheelSliceItem {
  shortLabel: string;
  title: string;
  challengePrompt: string;
  bonusXp: number;
  color: string;
  actionTarget: string;
}

export interface CipherWordItem {
  word: string;
  arabic: string;
  clue: string;
  level: string;
}

export interface OddClueRoundItem {
  scenarioPrompt: string;
  options: string[];
  oddIndex: number;
  explanation: string;
  level: string;
}

export interface ArabicArcadeWordItem {
  word: string;
  synonym: string;
  antonym: string;
  clue: string;
  cefrLevel: string;
}

export interface ArabicVaultWordItem {
  word: string;
  arabicClue: string;
  cefrLevel: string;
}

export const QUIZ_PACKS: QuizPack[] = [
  {
    "id": "quiz_a1_starters",
    "title": "A1 Everyday Starters",
    "topic": "Basics",
    "cefrLevel": "A1",
    "description": "Friendly beginner quiz on greetings, polite requests, and daily basics.",
    "questions": [
      {
        "prompt": "You meet someone for the first time. What is the friendliest reply to 'How are you?'",
        "options": [
          "I'm good, thanks! And you?",
          "My house is big.",
          "Yesterday morning.",
          "Yes, please."
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: Always add 'And you?' to keep a simple A1 conversation going!"
      },
      {
        "prompt": "Choose the correct sentence:",
        "options": [
          "She work in a hospital.",
          "She works in a hospital.",
          "She working in a hospital.",
          "She are work in a hospital."
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: With he/she/it in present simple, add -s to the verb!"
      },
      {
        "prompt": "You want to ask the price of a coffee. You say:",
        "options": [
          "How many is this coffee?",
          "How much is this coffee?",
          "Where time is this coffee?",
          "What age is this coffee?"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: Use 'How much' for prices, 'How many' for counting items."
      },
      {
        "prompt": "Complete: 'Excuse me, ____ is the train station?'",
        "options": [
          "who",
          "when",
          "where",
          "why"
        ],
        "correctIndex": 2,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Where' asks about places; 'When' asks about time."
      }
    ]
  },
  {
    "id": "quiz_a2_daily",
    "title": "A2 Past & Daily Adventures",
    "topic": "Grammar & Travel",
    "cefrLevel": "A2",
    "description": "Practice past tense verbs, comparisons, and shopping/travel English.",
    "questions": [
      {
        "prompt": "Yesterday, my friends and I ____ to a street food market.",
        "options": [
          "go",
          "went",
          "going",
          "gone"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Go' is irregular in the past simple -> 'went'!"
      },
      {
        "prompt": "The blue backpack is £25 and the red one is £40. The blue one is ____.",
        "options": [
          "cheaper",
          "more cheap",
          "cheapest",
          "most cheap"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: Short 1-syllable adjectives add -er ('cheaper than')."
      },
      {
        "prompt": "What do you ask a waiter when you finish eating?",
        "options": [
          "Can we have the bill, please?",
          "Can we have the recipe, please?",
          "Can we borrow the kitchen?",
          "Where is the homework?"
        ],
        "correctIndex": 0,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'The bill' (UK) or 'the check' (US) both mean the payment paper."
      },
      {
        "prompt": "We ____ TV when the doorbell rang.",
        "options": [
          "watch",
          "watched",
          "were watching",
          "are watching"
        ],
        "correctIndex": 2,
        "timeLimitSec": 22,
        "tip": "Teach tip: Past continuous ('were watching') sets the background scene!"
      }
    ]
  },
  {
    "id": "quiz_b2_idioms",
    "title": "B2 Idioms & Everyday Slang",
    "topic": "Idioms",
    "cefrLevel": "B2",
    "description": "Fun idioms native speakers actually use in cafés, chats, and group hangouts.",
    "questions": [
      {
        "prompt": "Your friend looks awkward at a party. What does 'break the ice' mean?",
        "options": [
          "Start a friendly chat to ease tension",
          "Leave the party without saying bye",
          "Drop a glass on the floor",
          "Tell a serious secret"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: Ask your friends what their favorite icebreaker question is!"
      },
      {
        "prompt": "If someone 'hits the nail on the head', they...",
        "options": [
          "Hurt themselves fixing a shelf",
          "Guess or explain something 100% accurately",
          "Refuse to compromise",
          "Arrive right before the deadline"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: Great reaction phrase when a friend makes a smart point: 'You hit the nail on the head!'"
      },
      {
        "prompt": "What does it mean to feel 'under the weather'?",
        "options": [
          "Caught in heavy rain",
          "Slightly sick or low on energy",
          "Excited about weekend plans",
          "Confused by instructions"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: Natural B2 alternative to 'I am a little sick today'."
      },
      {
        "prompt": "Your friend whispers 'Don't spill the beans!' What are they asking?",
        "options": [
          "Don't waste any food",
          "Don't reveal the surprise or secret",
          "Don't rush the presentation",
          "Don't forget your wallet"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: Pair it with 'let the cat out of the bag' so friends learn two secret idioms!"
      },
      {
        "prompt": "You finally decide to do a hard task you avoided. You 'bite the...'",
        "options": [
          "apple",
          "coin",
          "bullet",
          "pillow"
        ],
        "correctIndex": 2,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Bite the bullet' means facing an unpleasant task bravely."
      },
      {
        "prompt": "If you see an old classmate 'once in a blue moon', how often is that?",
        "options": [
          "Every single weekend",
          "Very rarely",
          "Only during winter",
          "Twice a month"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: Ask everyone to name something they only do once in a blue moon."
      }
    ]
  },
  {
    "id": "quiz_phrasal_battle",
    "title": "Phrasal Verbs Battle",
    "topic": "Phrasal Verbs",
    "cefrLevel": "B1",
    "description": "Master the most useful everyday phrasal verbs without boring textbook drills.",
    "questions": [
      {
        "prompt": "We had to ____ the picnic until Sunday because of the storm.",
        "options": [
          "put off",
          "put on",
          "put up",
          "put out"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Put off' = postpone. Contrast with 'call off' = cancel completely!"
      },
      {
        "prompt": "Oh no! We've ____ milk—can you grab some on your way over?",
        "options": [
          "run into",
          "run out of",
          "run over",
          "run away"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Run out of' works for time, patience, battery, and coffee!"
      },
      {
        "prompt": "Which sentence is grammatically natural?",
        "options": [
          "I look forward to see you!",
          "I look forward to seeing you!",
          "I look forward seeing you!",
          "I look forward for seeing you!"
        ],
        "correctIndex": 1,
        "timeLimitSec": 22,
        "tip": "Teach tip: After 'look forward to', 'to' is a preposition, so always use verb-ing!"
      },
      {
        "prompt": "Maya ____ a brilliant idea for our English game night.",
        "options": [
          "came up with",
          "came across",
          "came down with",
          "came over"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Come up with' = invent or think of an idea/plan."
      },
      {
        "prompt": "He was offered a job far away, so he politely ____ it ____.",
        "options": [
          "turned / up",
          "turned / down",
          "turned / out",
          "turned / off"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Turn down' = reject an offer, OR lower the volume!"
      },
      {
        "prompt": "It took a few days to ____ the jet lag after flying to London.",
        "options": [
          "get along",
          "get over",
          "get by",
          "get into"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Get over' = recover from an illness, shock, or disappointment."
      }
    ]
  },
  {
    "id": "quiz_confusing_pairs",
    "title": "Tricky Pairs & False Friends",
    "topic": "Vocabulary",
    "cefrLevel": "A2",
    "description": "Fix the classic mix-ups friends make—from borrow/lend to fun/funny!",
    "questions": [
      {
        "prompt": "My phone died! Can I ____ your charger for ten minutes?",
        "options": [
          "lend",
          "borrow",
          "loan",
          "rent"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: You BORROW *from* someone; you LEND *to* someone."
      },
      {
        "prompt": "Please ____ me to buy snacks before the movie starts!",
        "options": [
          "remember",
          "remind",
          "recall",
          "memorize"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Remind' needs a person (remind ME); 'remember' doesn't!"
      },
      {
        "prompt": "Which collocation uses 'MAKE' instead of 'DO'?",
        "options": [
          "____ the dishes",
          "____ homework",
          "____ a quick decision",
          "____ the laundry"
        ],
        "correctIndex": 2,
        "timeLimitSec": 20,
        "tip": "Teach tip: Usually DO = chores/tasks, MAKE = creating something or choices."
      },
      {
        "prompt": "Bringing an umbrella when dark clouds appear is very ____.",
        "options": [
          "sensitive",
          "sensible",
          "sensory",
          "sentimental"
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'Sensible' = practical/smart; 'sensitive' = easily affected or emotional."
      },
      {
        "prompt": "Our board game night was so ____! Nobody stopped laughing.",
        "options": [
          "fun",
          "funny",
          "humor",
          "joyful"
        ],
        "correctIndex": 0,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Fun' = enjoyable experience; 'funny' = makes you laugh like a joke."
      }
    ]
  },
  {
    "id": "quiz_real_talk",
    "title": "Natural Small Talk & Replies",
    "topic": "Speaking",
    "cefrLevel": "B2",
    "description": "Sound warm, fluent, and confident in real conversations with friends.",
    "questions": [
      {
        "prompt": "A friend says: 'Shall we grab tacos after class?' Best natural reply:",
        "options": [
          "Yes, it is acceptable to me.",
          "Sounds like a plan!",
          "I am agreeing to tacos.",
          "Very good proposal."
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: 'Sounds like a plan!' or 'I'm down!' are super natural replies."
      },
      {
        "prompt": "You forgot what you were saying mid-sentence. What fits best?",
        "options": [
          "I lost my train of thought.",
          "My brain is out of service.",
          "I dropped my thinking line.",
          "Excuse my memory pause."
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "Teach tip: Native speakers say 'Sorry, I lost my train of thought!' all the time."
      },
      {
        "prompt": "What does 'No worries, take your time' communicate?",
        "options": [
          "Hurry up please",
          "Friendly patience—no rush at all",
          "The meeting is cancelled",
          "You forgot to pay"
        ],
        "correctIndex": 1,
        "timeLimitSec": 18,
        "tip": "Teach tip: Way warmer than just saying 'Wait'."
      },
      {
        "prompt": "To politely disagree in a B2 discussion, which opener sounds best?",
        "options": [
          "You are totally wrong.",
          "I see where you're coming from, though...",
          "That makes zero sense.",
          "Stop talking about that."
        ],
        "correctIndex": 1,
        "timeLimitSec": 20,
        "tip": "Teach tip: 'I see where you're coming from' validates your friend before sharing your view."
      }
    ]
  }
];
export const FLASHCARD_DECKS: FlashcardDeck[] = [
  {
    "id": "deck_a1_essentials",
    "title": "A1 Starter Survival Kit",
    "subtitle": "6 must-know beginner phrases for day one",
    "cefrLevel": "A1",
    "cards": [
      {
        "term": "I would like...",
        "phonetic": "/aɪ wʊd laɪk/",
        "partOfSpeech": "Phrase",
        "meaning": "Polite way to order food, drinks, or ask for something.",
        "example": "I would like a cup of tea, please.",
        "teachingTip": "Much friendlier than saying 'Give me tea'!"
      },
      {
        "term": "Excuse me",
        "phonetic": "/ɪkˈskjuːz miː/",
        "partOfSpeech": "Phrase",
        "meaning": "Polite opener to get attention or pass by someone.",
        "example": "Excuse me, is this seat free?",
        "teachingTip": "Contrast with 'I'm sorry' (used when you made a mistake)."
      },
      {
        "term": "How much is this?",
        "phonetic": "/haʊ mʌtʃ ɪz ðɪs/",
        "partOfSpeech": "Question",
        "meaning": "Ask the price of an item in a shop or market.",
        "example": "Excuse me, how much is this blue mug?",
        "teachingTip": "Practice with numbers 10 to 100 together!"
      },
      {
        "term": "Could you repeat that?",
        "phonetic": "/kʊd juː rɪˈpiːt ðæt/",
        "partOfSpeech": "Question",
        "meaning": "Polite way to ask someone to say something again.",
        "example": "Sorry, I didn't catch that—could you repeat that slowly?",
        "teachingTip": "The #1 confidence phrase for A1 friends!"
      },
      {
        "term": "Where is the...?",
        "phonetic": "/wɛər ɪz ðə/",
        "partOfSpeech": "Question",
        "meaning": "Ask for the location of a place.",
        "example": "Where is the nearest metro station?",
        "teachingTip": "Pair with 'turn left', 'turn right', and 'straight ahead'."
      },
      {
        "term": "Nice to meet you",
        "phonetic": "/naɪs tuː miːt juː/",
        "partOfSpeech": "Greeting",
        "meaning": "Warm phrase when meeting someone for the first time.",
        "example": "Hi, I'm Sami. Nice to meet you!",
        "teachingTip": "Reply with 'Nice to meet you too!'"
      }
    ]
  },
  {
    "id": "deck_a2_daily",
    "title": "A2 Daily Life & Feelings",
    "subtitle": "6 practical words for telling stories & making plans",
    "cefrLevel": "A2",
    "cards": [
      {
        "term": "Appointment",
        "phonetic": "/əˈpɔɪntmənt/",
        "partOfSpeech": "Noun",
        "meaning": "A planned meeting at a set time (doctor, hairdresser, etc.).",
        "example": "I need to make an appointment for Friday morning.",
        "teachingTip": "Explain 'make an appointment' vs 'meet a friend' (casual)."
      },
      {
        "term": "Crowded",
        "phonetic": "/ˈkraʊdɪd/",
        "partOfSpeech": "Adjective",
        "meaning": "Full of many people with very little space.",
        "example": "The bus was so crowded this morning!",
        "teachingTip": "Opposite is 'empty' or 'quiet'."
      },
      {
        "term": "Delicious",
        "phonetic": "/dɪˈlɪʃəs/",
        "partOfSpeech": "Adjective",
        "meaning": "Having a very pleasant taste.",
        "example": "These homemade pancakes are delicious!",
        "teachingTip": "Great A2 upgrade from always saying 'good food'!"
      },
      {
        "term": "Improve",
        "phonetic": "/ɪmˈpruːv/",
        "partOfSpeech": "Verb",
        "meaning": "Make something better or become better at a skill.",
        "example": "Playing word games helps me improve my English.",
        "teachingTip": "Ask friends one thing they want to improve this month."
      },
      {
        "term": "Borrow vs. Lend",
        "phonetic": "/ˈbɒroʊ/ vs /lɛnd/",
        "partOfSpeech": "Verbs",
        "meaning": "Borrow = take temporarily; Lend = give temporarily.",
        "example": "Can I borrow your pen? Sure, I'll lend it to you.",
        "teachingTip": "Memory trick: Borrow FROM, Lend TO!"
      },
      {
        "term": "Looking for",
        "phonetic": "/ˈlʊkɪŋ fɔːr/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Trying to find someone or something.",
        "example": "I'm looking for my keys—have you seen them?",
        "teachingTip": "Also super useful in shops: 'I'm just looking, thanks!'"
      }
    ]
  },
  {
    "id": "deck_phrasal_b2",
    "title": "Everyday Phrasal Verbs",
    "subtitle": "8 high-frequency expressions for casual English",
    "cefrLevel": "B2",
    "cards": [
      {
        "term": "Catch up (with)",
        "phonetic": "/kætʃ ʌp/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Talk with someone you haven't seen recently to share news.",
        "example": "Let's grab coffee this Friday and catch up!",
        "teachingTip": "Ask a friend: 'Who do you want to catch up with this week?'"
      },
      {
        "term": "Figure out",
        "phonetic": "/ˈfɪɡjər aʊt/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Understand or solve something after thinking about it.",
        "example": "Give me a second—I'll figure out how this puzzle works.",
        "teachingTip": "Great substitute for 'solve' or 'understand' in everyday speech."
      },
      {
        "term": "End up",
        "phonetic": "/ɛnd ʌp/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Finally arrive at a place or result you didn't originally plan.",
        "example": "We wanted pizza, but we ended up cooking pasta at home.",
        "teachingTip": "Always followed by verb-ing or a place/adjective!"
      },
      {
        "term": "Bring up",
        "phonetic": "/brɪŋ ʌp/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Start talking about a particular topic.",
        "example": "I didn't want to bring up work during dinner.",
        "teachingTip": "Mention both meanings: raise a topic OR raise a child."
      },
      {
        "term": "Put off",
        "phonetic": "/pʊt ɔːf/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Postpone something to a later time.",
        "example": "Stop putting off your English practice—let's play a round!",
        "teachingTip": "Link this to the word 'procrastinate' for B2 learners."
      },
      {
        "term": "Look forward to",
        "phonetic": "/lʊk ˈfɔːrwərd tuː/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Feel excited about something happening in the future.",
        "example": "I'm really looking forward to our weekend trip.",
        "teachingTip": "Remind friends: always verb-ing or a noun after 'to'!"
      },
      {
        "term": "Turn out",
        "phonetic": "/tɜːrn aʊt/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Have a particular, often surprising, final result.",
        "example": "The rain stopped, so the picnic turned out great!",
        "teachingTip": "Perfect for storytelling!"
      },
      {
        "term": "Run out of",
        "phonetic": "/rʌn aʊt ʌv/",
        "partOfSpeech": "Phrasal Verb",
        "meaning": "Use all of something so none is left.",
        "example": "We ran out of time on the last question.",
        "teachingTip": "Works with physical things (milk) and abstract things (ideas, patience)."
      }
    ]
  },
  {
    "id": "deck_idioms_b2",
    "title": "Expressive B2 Idioms",
    "subtitle": "Colorful phrases that make stories memorable",
    "cefrLevel": "B2",
    "cards": [
      {
        "term": "Get the hang of",
        "phonetic": "/ɡɛt ðə hæŋ ʌv/",
        "partOfSpeech": "Idiom",
        "meaning": "Learn how to do something skillfully after a little practice.",
        "example": "Roleplays feel shy at first, then you get the hang of them.",
        "teachingTip": "Use this to encourage friends right after their first round!"
      },
      {
        "term": "On the same page",
        "phonetic": "/ɒn ðə seɪm peɪdʒ/",
        "partOfSpeech": "Idiom",
        "meaning": "Agreeing or understanding a plan in the same way.",
        "example": "Before we start the game, let's make sure we're on the same page.",
        "teachingTip": "Essential for teamwork and group travel planning."
      },
      {
        "term": "A piece of cake",
        "phonetic": "/ə piːs ʌv keɪk/",
        "partOfSpeech": "Idiom",
        "meaning": "Something very easy to do.",
        "example": "Wait until level 3—that first puzzle was a piece of cake!",
        "teachingTip": "Fun warm-up card to teach beginners alongside B1/B2 friends."
      },
      {
        "term": "Sleep on it",
        "phonetic": "/sliːp ɒn ɪt/",
        "partOfSpeech": "Idiom",
        "meaning": "Wait overnight before making a big decision.",
        "example": "Don't decide right now—sleep on it and tell me tomorrow.",
        "teachingTip": "Literal image makes it unforgettable for friends."
      },
      {
        "term": "Cost an arm and a leg",
        "phonetic": "/kɒst ən ɑːrm ænd ə lɛɡ/",
        "partOfSpeech": "Idiom",
        "meaning": "Be extremely expensive.",
        "example": "Concert tickets downtown cost an arm and a leg nowadays.",
        "teachingTip": "Ask friends to name one thing that costs an arm and a leg in their city."
      },
      {
        "term": "Out of the blue",
        "phonetic": "/aʊt ʌv ðə bluː/",
        "partOfSpeech": "Idiom",
        "meaning": "Happening suddenly and completely unexpectedly.",
        "example": "An old friend texted me completely out of the blue.",
        "teachingTip": "Shortens 'unexpectedly' into vivid conversational English."
      }
    ]
  },
  {
    "id": "deck_connectors",
    "title": "Fluent Connectors & Fillers",
    "subtitle": "Bridge ideas smoothly when speaking",
    "cefrLevel": "B1",
    "cards": [
      {
        "term": "By the way",
        "phonetic": "/baɪ ðə weɪ/",
        "partOfSpeech": "Discourse Marker",
        "meaning": "Used to smoothly introduce a new or related topic.",
        "example": "By the way, did you watch the new episode last night?",
        "teachingTip": "Practice pivoting from one topic to another in 10 seconds."
      },
      {
        "term": "To be honest",
        "phonetic": "/tuː biː ˈɒnɪst/",
        "partOfSpeech": "Phrase",
        "meaning": "Used to share a candid or personal opinion politely.",
        "example": "To be honest, I prefer tea over espresso.",
        "teachingTip": "Softens opinions so debates stay friendly."
      },
      {
        "term": "On the other hand",
        "phonetic": "/ɒn ði ˈʌðər hænd/",
        "partOfSpeech": "Connector",
        "meaning": "Introduces a contrasting point or downside.",
        "example": "City life is exciting; on the other hand, it can be noisy.",
        "teachingTip": "Classic B2 speaking exam & debate connector!"
      },
      {
        "term": "As a matter of fact",
        "phonetic": "/æz ə ˈmætər ʌv fækt/",
        "partOfSpeech": "Connector",
        "meaning": "Actually; adds surprising or extra true detail.",
        "example": "I've been there—as a matter of fact, I lived nearby!",
        "teachingTip": "Great for making stories sound confident and natural."
      },
      {
        "term": "Long story short",
        "phonetic": "/lɔːŋ ˈstɔːri ʃɔːrt/",
        "partOfSpeech": "Phrase",
        "meaning": "Used to skip details and jump to the ending of a story.",
        "example": "Long story short, we missed the train and took a taxi!",
        "teachingTip": "Lifesaver when telling funny stories with friends."
      }
    ]
  }
];
export const SENTENCE_PUZZLES: SentencePuzzle[] = [
  {
    "id": "sp_a1_1",
    "cefrLevel": "A1",
    "promptHint": "A1 Polite request at a café",
    "tokens": [
      "I",
      "would",
      "like",
      "a",
      "cup",
      "of",
      "tea,",
      "please."
    ],
    "explanation": "'I would like...' is the cleanest polite way to order at A1."
  },
  {
    "id": "sp_a1_2",
    "cefrLevel": "A1",
    "promptHint": "A1 Asking for directions politely",
    "tokens": [
      "Excuse",
      "me,",
      "where",
      "is",
      "the",
      "train",
      "station?"
    ],
    "explanation": "Start with 'Excuse me,' before asking a stranger for help."
  },
  {
    "id": "sp_a2_1",
    "cefrLevel": "A2",
    "promptHint": "A2 Past simple story about yesterday",
    "tokens": [
      "We",
      "went",
      "to",
      "the",
      "market",
      "yesterday",
      "morning."
    ],
    "explanation": "Remember: 'went' is the irregular past tense of 'go'."
  },
  {
    "id": "sp_a2_2",
    "cefrLevel": "A2",
    "promptHint": "A2 Comparing two items while shopping",
    "tokens": [
      "This",
      "jacket",
      "is",
      "cheaper",
      "than",
      "the",
      "blue",
      "one."
    ],
    "explanation": "Use 'adjective + -er + than' to compare two things."
  },
  {
    "id": "sp_1",
    "cefrLevel": "B2",
    "promptHint": "Idiom: Start a friendly conversation at a party",
    "tokens": [
      "Let's",
      "play",
      "a",
      "quick",
      "game",
      "to",
      "break",
      "the",
      "ice."
    ],
    "explanation": "'Break the ice' means helping people feel relaxed when they first meet."
  },
  {
    "id": "sp_2",
    "cefrLevel": "B2",
    "promptHint": "Polite disagreement in a group discussion",
    "tokens": [
      "I",
      "see",
      "where",
      "you're",
      "coming",
      "from,",
      "though",
      "I",
      "disagree."
    ],
    "explanation": "'I see where you're coming from' acknowledges the other person's viewpoint respectfully."
  },
  {
    "id": "sp_3",
    "cefrLevel": "B1",
    "promptHint": "Phrasal verb: Excited about future plans",
    "tokens": [
      "I'm",
      "really",
      "looking",
      "forward",
      "to",
      "meeting",
      "your",
      "friends."
    ],
    "explanation": "Remember: 'look forward to' takes the -ing form ('meeting'), not the base verb."
  },
  {
    "id": "sp_4",
    "cefrLevel": "B2",
    "promptHint": "Unexpected result after a changed plan",
    "tokens": [
      "We",
      "missed",
      "the",
      "bus,",
      "but",
      "we",
      "ended",
      "up",
      "having",
      "fun."
    ],
    "explanation": "'End up + -ing' expresses an unplanned final outcome."
  },
  {
    "id": "sp_5",
    "cefrLevel": "B1",
    "promptHint": "Asking a friend for a small favor politely",
    "tokens": [
      "Would",
      "you",
      "mind",
      "lending",
      "me",
      "your",
      "pen",
      "please?"
    ],
    "explanation": "'Would you mind + -ing' is a polite B1/B2 way to ask a favor, and we 'lend' TO someone."
  },
  {
    "id": "sp_6",
    "cefrLevel": "B2",
    "promptHint": "Encouraging someone learning a new skill",
    "tokens": [
      "Once",
      "you",
      "practice",
      "more,",
      "you'll",
      "get",
      "the",
      "hang",
      "of",
      "it."
    ],
    "explanation": "'Get the hang of something' means mastering the technique with practice."
  }
];
export const MATCH_PUZZLE_SETS: MatchPuzzleSet[] = [
  {
    "id": "match_a1_opposites",
    "title": "A1 Essential Opposites",
    "cefrLevel": "A1",
    "pairs": [
      {
        "id": "a1_1",
        "left": "Hot",
        "right": "Cold"
      },
      {
        "id": "a1_2",
        "left": "Early",
        "right": "Late"
      },
      {
        "id": "a1_3",
        "left": "Open",
        "right": "Closed"
      },
      {
        "id": "a1_4",
        "left": "Big",
        "right": "Small"
      },
      {
        "id": "a1_5",
        "left": "Happy",
        "right": "Sad"
      }
    ],
    "teachingTip": "Have beginners act out each pair with gestures as you match them!"
  },
  {
    "id": "match_a2_past",
    "title": "A2 Irregular Past Verbs",
    "cefrLevel": "A2",
    "pairs": [
      {
        "id": "a2_1",
        "left": "Go",
        "right": "Went"
      },
      {
        "id": "a2_2",
        "left": "Buy",
        "right": "Bought"
      },
      {
        "id": "a2_3",
        "left": "See",
        "right": "Saw"
      },
      {
        "id": "a2_4",
        "left": "Eat",
        "right": "Ate"
      },
      {
        "id": "a2_5",
        "left": "Make",
        "right": "Made"
      }
    ],
    "teachingTip": "Ask friends to say one sentence about last weekend using each past verb."
  },
  {
    "id": "match_idioms",
    "title": "Idiom Meanings",
    "cefrLevel": "B2",
    "pairs": [
      {
        "id": "p1",
        "left": "Spill the beans",
        "right": "Reveal a secret"
      },
      {
        "id": "p2",
        "left": "Under the weather",
        "right": "Feeling slightly sick"
      },
      {
        "id": "p3",
        "left": "Sleep on it",
        "right": "Think overnight first"
      },
      {
        "id": "p4",
        "left": "Out of the blue",
        "right": "Completely unexpected"
      },
      {
        "id": "p5",
        "left": "Piece of cake",
        "right": "Very easy task"
      }
    ],
    "teachingTip": "Challenge your friends to invent one funny sentence using their favorite matched idiom!"
  },
  {
    "id": "match_collocations",
    "title": "Make vs. Do & Collocations",
    "cefrLevel": "B1",
    "pairs": [
      {
        "id": "c1",
        "left": "Make",
        "right": "a big decision"
      },
      {
        "id": "c2",
        "left": "Do",
        "right": "a huge favor"
      },
      {
        "id": "c3",
        "left": "Pay",
        "right": "close attention"
      },
      {
        "id": "c4",
        "left": "Keep",
        "right": "a promise"
      },
      {
        "id": "c5",
        "left": "Catch",
        "right": "a cold"
      }
    ],
    "teachingTip": "In English, verbs partner with specific nouns ('collocations'). Learning pairs sounds 2x more fluent!"
  },
  {
    "id": "match_phrasals",
    "title": "Phrasal Verb Synonyms",
    "cefrLevel": "B2",
    "pairs": [
      {
        "id": "v1",
        "left": "Put off",
        "right": "Postpone"
      },
      {
        "id": "v2",
        "left": "Call off",
        "right": "Cancel"
      },
      {
        "id": "v3",
        "left": "Turn down",
        "right": "Reject"
      },
      {
        "id": "v4",
        "left": "Figure out",
        "right": "Solve"
      },
      {
        "id": "v5",
        "left": "Bring up",
        "right": "Mention"
      }
    ],
    "teachingTip": "Formal writing often uses Latin verbs (postpone), while friendly speech loves phrasal verbs (put off)."
  }
];
export const CLOZE_PUZZLES: ClozePuzzle[] = [
  {
    "id": "clz_a1_1",
    "cefrLevel": "A1",
    "beforeBlank": "Excuse me, where",
    "afterBlank": "you from?",
    "correctWord": "are",
    "options": [
      "are",
      "is",
      "am",
      "do"
    ],
    "explanation": "Always pair 'you' with 'are' ('Where are you from?')."
  },
  {
    "id": "clz_a2_1",
    "cefrLevel": "A2",
    "beforeBlank": "I",
    "afterBlank": "a great movie with my friends last night.",
    "correctWord": "watched",
    "options": [
      "watched",
      "watch",
      "watching",
      "watches"
    ],
    "explanation": "'Last night' signals past simple, so add -ed -> 'watched'."
  },
  {
    "id": "clz_1",
    "cefrLevel": "B2",
    "beforeBlank": "I ran",
    "afterBlank": "my old teacher at the supermarket!",
    "correctWord": "into",
    "options": [
      "into",
      "out",
      "over",
      "off"
    ],
    "explanation": "'Run into' someone means meeting them unexpectedly by chance."
  },
  {
    "id": "clz_2",
    "cefrLevel": "B1",
    "beforeBlank": "Don't forget to",
    "afterBlank": "me about tomorrow's meetup.",
    "correctWord": "remind",
    "options": [
      "remind",
      "remember",
      "recall",
      "think"
    ],
    "explanation": "Someone REMINDS you; you REMEMBER something yourself."
  },
  {
    "id": "clz_3",
    "cefrLevel": "B2",
    "beforeBlank": "We couldn't come",
    "afterBlank": "with a better excuse!",
    "correctWord": "up",
    "options": [
      "up",
      "out",
      "over",
      "down"
    ],
    "explanation": "'Come up with' means invent or produce an idea or plan."
  },
  {
    "id": "clz_4",
    "cefrLevel": "B2",
    "beforeBlank": "Even though it rained, the street festival turned",
    "afterBlank": "amazing.",
    "correctWord": "out",
    "options": [
      "out",
      "up",
      "in",
      "on"
    ],
    "explanation": "'Turn out' describes how an event ended up happening."
  },
  {
    "id": "clz_5",
    "cefrLevel": "B1",
    "beforeBlank": "Could you turn",
    "afterBlank": "the music? I'm trying to explain the rules!",
    "correctWord": "down",
    "options": [
      "down",
      "across",
      "into",
      "after"
    ],
    "explanation": "'Turn down' lowers volume (or rejects an offer!)."
  }
];
export const GUESSING_PACKS: GuessingPack[] = [
  {
    "id": "guess_a1_easy",
    "title": "A1 Everyday Words",
    "modeLabel": "Easy clues—great for beginners!",
    "cefrLevel": "A1",
    "description": "Simple everyday nouns and actions without tricky vocabulary.",
    "cards": [
      {
        "word": "UMBRELLA",
        "category": "Weather",
        "tabooWords": [
          "Rain",
          "Wet",
          "Open"
        ],
        "clueHint": "You hold it over your head when water falls from the sky."
      },
      {
        "word": "BICYCLE",
        "category": "Transport",
        "tabooWords": [
          "Two",
          "Wheels",
          "Ride"
        ],
        "clueHint": "It has pedals and no engine."
      },
      {
        "word": "KITCHEN",
        "category": "Home",
        "tabooWords": [
          "Cook",
          "Food",
          "Room"
        ],
        "clueHint": "The room with a fridge, oven, and sink."
      },
      {
        "word": "DOCTOR",
        "category": "Jobs",
        "tabooWords": [
          "Hospital",
          "Sick",
          "Medicine"
        ],
        "clueHint": "A person who helps you feel healthy again."
      },
      {
        "word": "BREAKFAST",
        "category": "Food",
        "tabooWords": [
          "Morning",
          "Eat",
          "Eggs"
        ],
        "clueHint": "The first meal of your day."
      },
      {
        "word": "AIRPORT",
        "category": "Travel",
        "tabooWords": [
          "Plane",
          "Fly",
          "Ticket"
        ],
        "clueHint": "A huge building where flights take off and land."
      },
      {
        "word": "LAUGHING",
        "category": "Action",
        "tabooWords": [
          "Funny",
          "Smile",
          "Ha ha"
        ],
        "clueHint": "What you do when someone tells a great joke."
      },
      {
        "word": "BIRTHDAY",
        "category": "Celebration",
        "tabooWords": [
          "Cake",
          "Candles",
          "Age"
        ],
        "clueHint": "The special day every year when you turn one year older."
      }
    ]
  },
  {
    "id": "guess_taboo_b2",
    "title": "Taboo: B2 Vocabulary",
    "modeLabel": "Describe without forbidden words!",
    "cefrLevel": "B2",
    "description": "Explain the word in English to your friends—never say the 3 red Taboo words!",
    "cards": [
      {
        "word": "PROCRASTINATE",
        "category": "Habit",
        "tabooWords": [
          "Delay",
          "Later",
          "Lazy"
        ],
        "clueHint": "Waiting until the very last minute to start work."
      },
      {
        "word": "COINCIDENCE",
        "category": "Event",
        "tabooWords": [
          "Chance",
          "Same",
          "Luck"
        ],
        "clueHint": "Two surprising things happening together without planning."
      },
      {
        "word": "SOUVENIR",
        "category": "Travel",
        "tabooWords": [
          "Gift",
          "Trip",
          "Buy"
        ],
        "clueHint": "A small item you bring home to remember a vacation."
      },
      {
        "word": "NEGOTIATE",
        "category": "Speaking",
        "tabooWords": [
          "Price",
          "Deal",
          "Agree"
        ],
        "clueHint": "Discussing terms until both people are happy."
      },
      {
        "word": "EMBARRASSED",
        "category": "Feeling",
        "tabooWords": [
          "Shy",
          "Red",
          "Mistake"
        ],
        "clueHint": "How you feel if you wave at someone waving at someone behind you."
      },
      {
        "word": "EXAGGERATE",
        "category": "Speaking",
        "tabooWords": [
          "Bigger",
          "Truth",
          "Over"
        ],
        "clueHint": "Saying a tiny fish you caught was the size of a shark."
      },
      {
        "word": "DEADLINE",
        "category": "Work",
        "tabooWords": [
          "Time",
          "Finish",
          "Late"
        ],
        "clueHint": "The final hour or date when a task must be ready."
      },
      {
        "word": "IMPROVISE",
        "category": "Creativity",
        "tabooWords": [
          "Plan",
          "Act",
          "Ready"
        ],
        "clueHint": "Creating something on the spot with no script."
      },
      {
        "word": "OVERWHELMED",
        "category": "Feeling",
        "tabooWords": [
          "Stress",
          "Too",
          "Busy"
        ],
        "clueHint": "Having way more tasks or emotions than you can handle."
      },
      {
        "word": "RELIABLE",
        "category": "Personality",
        "tabooWords": [
          "Trust",
          "Always",
          "Friend"
        ],
        "clueHint": "Someone who keeps promises and shows up on time."
      }
    ]
  },
  {
    "id": "guess_charades",
    "title": "Act It Out: Charades",
    "modeLabel": "Silent acting—friends guess in English!",
    "cefrLevel": "A2",
    "description": "No speaking! Act out the English phrase while friends shout their guesses.",
    "cards": [
      {
        "word": "Ordering a huge coffee",
        "category": "Action",
        "tabooWords": [
          "Talk",
          "Sound",
          "Pointing"
        ],
        "clueHint": "Mime holding a menu and sipping."
      },
      {
        "word": "Missing the morning bus",
        "category": "Action",
        "tabooWords": [
          "Words",
          "Run noise",
          "Beep"
        ],
        "clueHint": "Look at watch, sprint, wave hopelessly!"
      },
      {
        "word": "Assembling flat-pack furniture",
        "category": "Action",
        "tabooWords": [
          "Screw",
          "Manual",
          "Words"
        ],
        "clueHint": "Flip instructions upside down and scratch head."
      },
      {
        "word": "Burning dinner in the pan",
        "category": "Action",
        "tabooWords": [
          "Fire",
          "Cough words",
          "Ouch"
        ],
        "clueHint": "Wave smoke away and fan the alarm."
      },
      {
        "word": "Taking a group selfie",
        "category": "Action",
        "tabooWords": [
          "Cheese",
          "Click",
          "Smile words"
        ],
        "clueHint": "Hold imaginary phone high and squeeze friends in."
      },
      {
        "word": "Walking against strong wind",
        "category": "Action",
        "tabooWords": [
          "Blowing",
          "Cold",
          "Words"
        ],
        "clueHint": "Lean forward and hold an umbrella flipping inside out!"
      },
      {
        "word": "Losing your house keys",
        "category": "Action",
        "tabooWords": [
          "Pocket",
          "Door",
          "Where"
        ],
        "clueHint": "Pat every pocket in panic outside a door."
      },
      {
        "word": "Bargaining at a market",
        "category": "Action",
        "tabooWords": [
          "Money",
          "Numbers",
          "Talk"
        ],
        "clueHint": "Hold up fingers, shake head, pretend to walk away."
      }
    ]
  },
  {
    "id": "guess_idioms",
    "title": "Explain the Idiom",
    "modeLabel": "Give clues or act—make them say the idiom!",
    "cefrLevel": "B2",
    "description": "Help your friends guess the exact English idiom using real-life examples.",
    "cards": [
      {
        "word": "Piece of cake",
        "category": "Idiom",
        "tabooWords": [
          "Sweet",
          "Dessert",
          "Easy"
        ],
        "clueHint": "Describe taking a test for 1st graders."
      },
      {
        "word": "Raining cats and dogs",
        "category": "Idiom",
        "tabooWords": [
          "Animals",
          "Pets",
          "Storm"
        ],
        "clueHint": "Weather so heavy you need a boat!"
      },
      {
        "word": "Cold feet",
        "category": "Idiom",
        "tabooWords": [
          "Ice",
          "Toes",
          "Scared"
        ],
        "clueHint": "Getting nervous right before a wedding or speech."
      },
      {
        "word": "On cloud nine",
        "category": "Idiom",
        "tabooWords": [
          "Sky",
          "Number",
          "Happy"
        ],
        "clueHint": "Floating with joy after great news."
      },
      {
        "word": "Spill the beans",
        "category": "Idiom",
        "tabooWords": [
          "Coffee",
          "Food",
          "Secret"
        ],
        "clueHint": "Accidentally ruining a surprise party."
      },
      {
        "word": "Break a leg",
        "category": "Idiom",
        "tabooWords": [
          "Bone",
          "Hospital",
          "Luck"
        ],
        "clueHint": "What theatre actors say right before going on stage!"
      },
      {
        "word": "Under the weather",
        "category": "Idiom",
        "tabooWords": [
          "Rain",
          "Sun",
          "Sick"
        ],
        "clueHint": "Sneezing and needing hot tea in bed."
      },
      {
        "word": "Cut corners",
        "category": "Idiom",
        "tabooWords": [
          "Scissors",
          "Square",
          "Fast"
        ],
        "clueHint": "Doing a sloppy job just to save time or money."
      }
    ]
  }
];
export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    "id": "rp_a1_neighbor",
    "title": "A1 Meeting a New Neighbor",
    "setting": "Front hallway of your apartment building on a sunny afternoon.",
    "cefrLevel": "A1",
    "roleAName": "New Neighbor",
    "roleBName": "Friendly Local",
    "goal": "Introduce yourself, ask where someone is from, and invite them for tea.",
    "lines": [
      {
        "speakerRole": "B",
        "text": "Hello! Welcome to the building. My name is Maya.",
        "keyHint": "Say hello & share your name",
        "highlights": [
          {
            "phrase": "Welcome to",
            "meaning": "Warm greeting for someone arriving at a new place",
            "example": "Welcome to our neighborhood!"
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "Hi Maya! I'm Omar. Nice to meet you!",
        "keyHint": "Reply with your name & 'Nice to meet you'",
        "highlights": [
          {
            "phrase": "Nice to meet you",
            "meaning": "Polite phrase for first introductions",
            "example": "Hi, I'm Sam—nice to meet you!"
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Nice to meet you too! Where are you from, Omar?",
        "keyHint": "Ask where your new neighbor is from",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "I'm from Amman, and I work at a bakery near the park.",
        "keyHint": "Say your city and job simply",
        "highlights": []
      },
      {
        "speakerRole": "B",
        "text": "Oh, wonderful! Would you like a cup of tea later?",
        "keyHint": "Offer tea or coffee warmly",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "Yes, I would love that! Thank you very much.",
        "keyHint": "Accept politely & say thank you",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: You both discover you have the exact same favorite dessert!",
      "Plot Twist: Your friendly cat walks into the hallway and sits on Omar's shoe!"
    ]
  },
  {
    "id": "rp_a2_directions",
    "title": "A2 Asking Directions in Town",
    "setting": "Outside a sunny town square while holding a tourist map.",
    "cefrLevel": "A2",
    "roleAName": "Visitor",
    "roleBName": "Helpful Local",
    "goal": "Ask how to reach the museum, check how long it takes, and say thanks.",
    "lines": [
      {
        "speakerRole": "A",
        "text": "Excuse me! Could you tell me how to get to the City Museum?",
        "keyHint": "Get attention politely & ask for the museum",
        "highlights": [
          {
            "phrase": "how to get to",
            "meaning": "Simple way to ask for directions to a place",
            "example": "Do you know how to get to the station?"
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Sure! Go straight ahead for two blocks, then turn left at the traffic lights.",
        "keyHint": "Give clear step-by-step directions",
        "highlights": [
          {
            "phrase": "straight ahead",
            "meaning": "Continue forward without turning",
            "example": "Walk straight ahead for 100 meters."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "Thank you! Is it far from here on foot?",
        "keyHint": "Ask about walking distance",
        "highlights": []
      },
      {
        "speakerRole": "B",
        "text": "Not at all—it takes about five minutes. It's right across from the big park.",
        "keyHint": "Give walking time + landmark",
        "highlights": [
          {
            "phrase": "across from",
            "meaning": "On the opposite side of the street",
            "example": "The bakery is across from the bank."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "That's easy to find. Thanks so much for your help!",
        "keyHint": "Thank them warmly",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: The museum closes in 15 minutes—ask the local for a shortcut!",
      "Plot Twist: It starts raining—recommend a cozy café next door instead!"
    ]
  },
  {
    "id": "rp_cafe",
    "title": "The Busy London Café",
    "setting": "Morning rush at a cozy indie coffee shop near Covent Garden.",
    "cefrLevel": "B1",
    "roleAName": "Customer",
    "roleBName": "Friendly Barista",
    "goal": "Order a custom drink politely, ask about pastries, and handle a surprise twist.",
    "lines": [
      {
        "speakerRole": "B",
        "text": "Morning! What can I get started for you today?",
        "keyHint": "Greet warmly & ask for their order",
        "highlights": [
          {
            "phrase": "What can I get started for you",
            "meaning": "Friendly café way to say 'What would you like?'",
            "example": "Hi! What can I get started for you this morning?"
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "Hi! Could I grab an iced oat latte, and by any chance do you still have almond croissants?",
        "keyHint": "Order drink politely + ask about pastries",
        "highlights": [
          {
            "phrase": "Could I grab",
            "meaning": "Casual, polite way to order food or drinks",
            "example": "Could I grab a bottle of sparkling water?"
          },
          {
            "phrase": "by any chance",
            "meaning": "Polite softener when asking if something is available",
            "example": "Do you by any chance have a charger?"
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "You're in luck—there's one left! Would you like it warmed up, or are you good as it is?",
        "keyHint": "Confirm last pastry + offer heating",
        "highlights": [
          {
            "phrase": "You're in luck",
            "meaning": "Means good fortune—just in time!",
            "example": "You're in luck, the last seat is free."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "Warmed up sounds amazing, thanks. Also, is there Wi-Fi here if I hang out for an hour?",
        "keyHint": "Accept heating + ask about Wi-Fi",
        "highlights": [
          {
            "phrase": "hang out",
            "meaning": "Spend relaxed time in a place",
            "example": "Let's hang out at the café after class."
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "For sure! The password is printed right at the bottom of your receipt. That'll be £6.40 altogether.",
        "keyHint": "Give Wi-Fi info + total price",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "Awesome, I'll pay by card. Keep the change on the tip jar—have a lovely day!",
        "keyHint": "Pay & wrap up cheerfully",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: The espresso machine just stopped working—recommend a creative alternative drink!",
      "Plot Twist: Your card was declined! Laugh it off and figure out a polite solution.",
      "Plot Twist: A famous actor walks into the café right behind you—whisper about it naturally!"
    ]
  },
  {
    "id": "rp_airport",
    "title": "Lost Suitcase at Heathrow",
    "setting": "Baggage claim desk after an overnight international flight.",
    "cefrLevel": "B2",
    "roleAName": "Tired Traveler",
    "roleBName": "Airline Agent",
    "goal": "Describe the missing suitcase clearly, stay calm, and arrange delivery compensation.",
    "lines": [
      {
        "speakerRole": "A",
        "text": "Excuse me—I've been waiting at carousel 4 for forty minutes, and it looks like my bag didn't make the connection.",
        "keyHint": "Explain the missing bag & flight connection",
        "highlights": [
          {
            "phrase": "didn't make the connection",
            "meaning": "Missed transferring onto the second flight",
            "example": "My suitcase didn't make the connection in Paris."
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "I'm really sorry about the hassle! Let me pull up your booking. Could you describe what the suitcase looks like?",
        "keyHint": "Apologize empathetically + ask for details",
        "highlights": [
          {
            "phrase": "the hassle",
            "meaning": "An annoying inconvenience or trouble",
            "example": "Sorry for all the hassle today!"
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "It's a medium navy hardshell case with a bright yellow luggage tag and a small sticker on the corner.",
        "keyHint": "Describe color, material, and unique marks",
        "highlights": []
      },
      {
        "speakerRole": "B",
        "text": "Got it. Good news—it's safe in Amsterdam and will arrive on the next flight tonight. Where can we drop it off?",
        "keyHint": "Give update + ask for hotel address",
        "highlights": [
          {
            "phrase": "drop it off",
            "meaning": "Deliver something to a specific place",
            "example": "We'll drop your bag off at your hotel."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "That's a huge relief! I'm staying near Hyde Park—could you reimburse basic toiletries in the meantime?",
        "keyHint": "Express relief + ask about essentials",
        "highlights": [
          {
            "phrase": "in the meantime",
            "meaning": "During the waiting period before something happens",
            "example": "Wait here—in the meantime I'll print your voucher."
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Absolutely. Here's a £75 emergency kit voucher, and we'll text you the moment the courier heads out.",
        "keyHint": "Offer voucher & promise updates",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: The traveler has a wedding to attend in 3 hours and their suit is in that bag!",
      "Plot Twist: Someone else took your navy suitcase by mistake—and left theirs behind!",
      "Plot Twist: The airline offers a free business-class upgrade on the return flight if you accept tomorrow's delivery."
    ]
  },
  {
    "id": "rp_interview",
    "title": "The Creative Startup Interview",
    "setting": "Video call or sunny office table for a dream team role.",
    "cefrLevel": "B2",
    "roleAName": "Candidate",
    "roleBName": "Hiring Manager",
    "goal": "Answer a tricky B2 strength/mistake question naturally using fluent connectors.",
    "lines": [
      {
        "speakerRole": "B",
        "text": "Thanks for coming in! To kick things off, tell me about a time you had to figure out a problem under pressure.",
        "keyHint": "Open warmly + ask behavioral question",
        "highlights": [
          {
            "phrase": "kick things off",
            "meaning": "Start a meeting, event, or conversation",
            "example": "Let's kick things off with a quick warm-up."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "Sure! Last summer our team ran out of time before a client demo, so I stepped up to reorganize our slides.",
        "keyHint": "Set the scene + action you took",
        "highlights": [
          {
            "phrase": "stepped up",
            "meaning": "Took responsibility when help was needed",
            "example": "She really stepped up when the leader got sick."
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Nice! How did your teammates react when you changed the plan at the last minute?",
        "keyHint": "Probe on teamwork & communication",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "To be honest, they were hesitant at first; however, once we got on the same page, the demo turned out great!",
        "keyHint": "Use honest reflection + B2 connectors",
        "highlights": []
      },
      {
        "speakerRole": "B",
        "text": "Love that honesty. Before we wrap up, do you have any questions for us about the culture here?",
        "keyHint": "Invite candidate questions",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "Yes—what skill helps someone really get the hang of this role during their first month?",
        "keyHint": "Ask an insightful closing question",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: The hiring manager asks: 'Explain your favorite hobby as if I'm 8 years old!'",
      "Plot Twist: Your phone alarm starts ringing mid-answer—stay professional and turn it into a joke!",
      "Plot Twist: The interviewer says you got the role, but you start by organizing tomorrow's team lunch!"
    ]
  },
  {
    "id": "rp_market",
    "title": "Bargaining at Camden Market",
    "setting": "Colorful weekend vintage jacket & vinyl stall.",
    "cefrLevel": "B1",
    "roleAName": "Shopper",
    "roleBName": "Vintage Seller",
    "goal": "Ask about an item, negotiate politely with humor, and agree on a fair bundle price.",
    "lines": [
      {
        "speakerRole": "A",
        "text": "Hey! This denim jacket caught my eye—how much are you asking for it?",
        "keyHint": "Show interest + ask price casually",
        "highlights": [
          {
            "phrase": "caught my eye",
            "meaning": "Attracted my attention immediately",
            "example": "That bright poster caught my eye across the street."
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Great taste! That's genuine 90s vintage, so I normally let it go for £55.",
        "keyHint": "Hype the item + state price",
        "highlights": []
      },
      {
        "speakerRole": "A",
        "text": "Oof, £55 is a little steep for my budget! Would you meet me halfway at £40 if I grab these sunglasses too?",
        "keyHint": "Counter-offer politely + bundle",
        "highlights": [
          {
            "phrase": "a little steep",
            "meaning": "Slightly too expensive",
            "example": "The ticket price felt a little steep."
          },
          {
            "phrase": "meet me halfway",
            "meaning": "Compromise between two prices",
            "example": "If you ask 50 and I offer 30, meet me halfway at 40!"
          }
        ]
      },
      {
        "speakerRole": "B",
        "text": "Tell you what—make it £45 for both and I'll throw in a canvas tote bag. Deal?",
        "keyHint": "Counter with bonus item",
        "highlights": [
          {
            "phrase": "throw in",
            "meaning": "Include something extra for free",
            "example": "Buy the guitar and I'll throw in extra strings."
          }
        ]
      },
      {
        "speakerRole": "A",
        "text": "You drive a hard bargain, but that's fair—deal!",
        "keyHint": "Accept playfully with an idiom!",
        "highlights": []
      }
    ],
    "plotTwists": [
      "Plot Twist: Another shopper walks up offering £60—persuade the seller to keep your bundle deal!",
      "Plot Twist: You discover a funny old concert ticket inside the jacket pocket!",
      "Plot Twist: It suddenly starts pouring rain—negotiate an umbrella into the bundle!"
    ]
  }
];
export const CRIME_MYSTERY_CASES: CrimeCase[] = [
  {
    "id": "case_manuscript",
    "title": "The Missing Ancient Manuscript",
    "cefrLevel": "B1",
    "crimeType": "Theft & Burglary",
    "crimeSceneSummary": "A rare 15th-century English manuscript vanished from the locked Oxford library showcase at midnight during a heavy thunderstorm.",
    "suspects": [
      {
        "id": "s1",
        "name": "Professor Arthur Vance",
        "role": "Chief Archivist",
        "alibi": "Was grading student midterms in his office alone.",
        "suspiciousDetail": "Had mud on his boots and a forged library key in his coat pocket.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Clara Sterling",
        "role": "Night Custodian",
        "alibi": "Was polishing brass floor fixtures in the west corridor.",
        "suspiciousDetail": "Her flashlight battery was dead, but she had a master key.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Julian Thorne",
        "role": "Rare Book Dealer",
        "alibi": "Claims he was asleep at home three miles away.",
        "suspiciousDetail": "Received a suspicious cash deposit on his phone at 11:45 PM.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Look for conflicting alibis and physical evidence linked to the locked showcase.",
    "vocabularyTip": "Key English terms: 'manuscript' (مخطوطة), 'alibi' (عذر غياب), 'archivist' (أمين محفوظات)."
  },
  {
    "id": "case_train_heist",
    "title": "The London Express Diamond Heist",
    "cefrLevel": "B2",
    "crimeType": "Train Robbery",
    "crimeSceneSummary": "A priceless blue diamond necklace disappeared from carriage B of the midnight London-to-Edinburgh express train.",
    "suspects": [
      {
        "id": "s1",
        "name": "Lady Evelyn Vance",
        "role": "Wealthy Socialite",
        "alibi": "Was sipping herbal tea in the dining car with the conductor.",
        "suspiciousDetail": "Her velvet handbag contained a jeweler's magnifying glass and wire cutters.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Marcus Brody",
        "role": "Train Conductor",
        "alibi": "Was checking tickets in carriages C through F.",
        "suspiciousDetail": "Forgot which tickets he punched in carriage B.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Dr. Silas Finch",
        "role": "Botanist",
        "alibi": "Was sleeping in compartment 4.",
        "suspiciousDetail": "Dropped a leather glove near the robbed display case.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Examine the tools found in personal luggage and verify the dining car timestamps.",
    "vocabularyTip": "Key English terms: 'heist' (سرقة مسلحة), 'priceless' (لا يقدر بثمن), 'evidence' (دليل)."
  },
  {
    "id": "case_manor_murder",
    "title": "The Midnight Manor Murder",
    "cefrLevel": "B2",
    "crimeType": "Murder Mystery",
    "crimeSceneSummary": "Lord Harrington was found dead in his private library behind locked double doors. An antique crystal goblet on his desk contained traces of bitter almond poison.",
    "suspects": [
      {
        "id": "s1",
        "name": "Richard Harrington",
        "role": "Lord's Estranged Nephew",
        "alibi": "Claims he was walking in the rose garden smoking a cigar.",
        "suspiciousDetail": "His bank statements reveal overwhelming gambling debts, and a crushed cyanide seed was found in his coat.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Beatrice Sterling",
        "role": "Personal Butler",
        "alibi": "Was serving midnight tea to guests in the drawing room.",
        "suspiciousDetail": "Her fingerprints were on the silver tray, but she had no motive.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Dr. Alistair Montgomery",
        "role": "Family Physician",
        "alibi": "Claims he was in the village pharmacy preparing sleeping drops.",
        "suspiciousDetail": "Carried his medical bag, but arrived 15 minutes after the alarm sounded.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Identify who had both the financial motive and physical access to deadly chemical substances.",
    "vocabularyTip": "Key English terms: 'poison' (سم), 'estranged' (منفصل/متباعد), 'motive' (دافع الجريمة)."
  },
  {
    "id": "case_gallery_forgery",
    "title": "The Art Gallery Forgery",
    "cefrLevel": "A2",
    "crimeType": "Counterfeit & Swap",
    "crimeSceneSummary": "A master oil painting was swapped with a clever fake right before the museum's grand opening gala.",
    "suspects": [
      {
        "id": "s1",
        "name": "Leo Ramirez",
        "role": "Museum Guard",
        "alibi": "Was patrolling the sculpture garden until 9 PM.",
        "suspiciousDetail": "Left the gallery side door propped open with a wooden wedge.",
        "isGuilty": false
      },
      {
        "id": "s2",
        "name": "Sophie Laurent",
        "role": "Assistant Curator",
        "alibi": "Was arranging flowers in the lobby reception.",
        "suspiciousDetail": "Had fresh blue oil paint stains under her fingernails.",
        "isGuilty": true
      },
      {
        "id": "s3",
        "name": "Oliver Grant",
        "role": "Art Collector",
        "alibi": "Was talking on the phone outside.",
        "suspiciousDetail": "Offered to buy the painting for double price yesterday.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s2",
    "detectiveClue": "Trace the physical traces left behind by the artist's materials.",
    "vocabularyTip": "Key English terms: 'forgery' (تزييف/لوحة مزيفة), 'curator' (أمين متحف), 'swap' (يستبدل)."
  },
  {
    "id": "case_bank_vault",
    "title": "The Bank Vault Safe Cracker",
    "cefrLevel": "B1",
    "crimeType": "Bank Vault Breach",
    "crimeSceneSummary": "Over three million pounds in gold bullion vanished from the subterranean vault of the Royal Midland Bank without triggering the acoustic alarms.",
    "suspects": [
      {
        "id": "s1",
        "name": "Victor 'Shadow' Novak",
        "role": "Security Alarm Specialist",
        "alibi": "Claims he was at home monitoring server logs remotely.",
        "suspiciousDetail": "A thermal lance nozzle and industrial earplugs were recovered from his locker.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Hannah Wells",
        "role": "Head Bank Teller",
        "alibi": "Was balancing receipts in the teller cages upstairs.",
        "suspiciousDetail": "Misplaced her master badge 20 minutes before closing.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Garrison Cole",
        "role": "Night Security Guard",
        "alibi": "Was doing security rounds along the perimeter fence.",
        "suspiciousDetail": "He heard no noise because he was wearing headphones.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Look for specialized engineering tools capable of disabling acoustic vault sensors.",
    "vocabularyTip": "Key English terms: 'bullion' (سبائك ذهبية), 'vault' (خزينة بنك), 'alarm' (إنذار)."
  },
  {
    "id": "case_crown_jewels",
    "title": "The Tower Crown Jewels Infiltration",
    "cefrLevel": "B2",
    "crimeType": "Grand Larceny",
    "crimeSceneSummary": "A jewel-encrusted coronation orb was snatched from the Tower vault during a sudden false fire alarm and smoke screen.",
    "suspects": [
      {
        "id": "s1",
        "name": "Gwendolyn Frost",
        "role": "Acrobatic Theater Performer",
        "alibi": "Claims she was having dinner at a bistro across the bridge.",
        "suspiciousDetail": "A grappling hook and silk smoke bomb canister were found in her rental vehicle.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Captain Arthur Price",
        "role": "Tower Guard Captain",
        "alibi": "Was directing tourists out of the historic armory.",
        "suspiciousDetail": "Had accidentally dropped his radio during the stampede.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Edward Higgins",
        "role": "Exhibit Electrician",
        "alibi": "Was fixing emergency floodlights on the south parapet.",
        "suspiciousDetail": "Smelled of diesel fuel from the backup generator.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Analyze how the thief entered from the rooftop without tripping perimeter laser sensors.",
    "vocabularyTip": "Key English terms: 'larceny' (سرقة كبرى), 'canister' (علبة اسطوانية), 'infiltration' (تسلل)."
  },
  {
    "id": "case_cyber_heist",
    "title": "The Cyber Crypto Embezzlement",
    "cefrLevel": "B1",
    "crimeType": "Cyber Crime & Theft",
    "crimeSceneSummary": "A fintech startup's cold storage cryptocurrency wallet holding 10,000 Ethereum coins was drained via an unauthorized physical key insertion.",
    "suspects": [
      {
        "id": "s1",
        "name": "Zack Turner",
        "role": "Senior Backend Engineer",
        "alibi": "Claims he was off duty playing video games in his apartment.",
        "suspiciousDetail": "His terminal history showed SSH private key transfers at 3:14 AM and an encrypted hardware wallet.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Rachel Chen",
        "role": "Product Manager",
        "alibi": "Was preparing presentation slides for investors.",
        "suspiciousDetail": "Left her company laptop unlocked in the conference room.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Derrick Ross",
        "role": "IT Support Specialist",
        "alibi": "Was rebooting the central office network switches.",
        "suspiciousDetail": "Lost his keycard access badge in the cafeteria.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Inspect digital network logs and cryptographic hardware keys.",
    "vocabularyTip": "Key English terms: 'embezzlement' (اختلاس), 'unauthorized' (غير مصرح به), 'terminal' (طرفية برمجية)."
  },
  {
    "id": "case_cruise_murder",
    "title": "The Orient Luxury Cruise Poisoning",
    "cefrLevel": "B2",
    "crimeType": "Murder on High Seas",
    "crimeSceneSummary": "Billionaire investor Simon Cross collapsed during the Captain's Gala dinner aboard the luxury Mediterranean yacht. Toxicologists detected aconite in his champagne.",
    "suspects": [
      {
        "id": "s1",
        "name": "Daphne Dubois",
        "role": "Casino Hostess",
        "alibi": "Claims she was dealing blackjack cards on deck 3 all evening.",
        "suspiciousDetail": "She had an empty aconite tincture bottle disguised as perfume in her cabin drawer.",
        "isGuilty": true
      },
      {
        "id": "s2",
        "name": "Captain Henri Moreau",
        "role": "Yacht Captain",
        "alibi": "Was greeting VIP passengers at the dining entrance.",
        "suspiciousDetail": "Had argued with the victim over maritime navigation routes.",
        "isGuilty": false
      },
      {
        "id": "s3",
        "name": "Lucas Vance",
        "role": "Venture Partner",
        "alibi": "Was chatting with diplomats on the promenade deck.",
        "suspiciousDetail": "Lost a 500,000 dollar contract with the victim yesterday.",
        "isGuilty": false
      }
    ],
    "correctSuspectId": "s1",
    "detectiveClue": "Search for concealed chemical containers and examine card dealer rotation schedules.",
    "vocabularyTip": "Key English terms: 'toxicologist' (عالم سموم), 'disguised' (متنكر/مموه), 'contract' (عقد)."
  }
];
export const CURATED_EVIDENCE_CARDS: EvidenceCardItem[] = [
  {
    "id": "ev_library_catalog",
    "title": "Torn Catalog Card",
    "category": "Documents",
    "description": "15th-century index card with a forged archival seal found near the unlocked display case.",
    "englishClue": "The date stamp is missing an official watermark.",
    "arabicMeaning": "بطاقة فهرسة ممزقة بخاتم مزيف",
    "cefrLevel": "B1"
  },
  {
    "id": "ev_wirecutters",
    "title": "Velvet Handbag with Cutters",
    "category": "Tools",
    "description": "Jeweler's wire cutters with blue diamond dust traces found under passenger seat 4B.",
    "englishClue": "The steel blades match the severed security wire.",
    "arabicMeaning": "حقيبة مخملية بداخلها قواطع أسلاك مجوهرات",
    "cefrLevel": "B2"
  },
  {
    "id": "ev_oil_smudge",
    "title": "Cobalt Blue Pigment Smudge",
    "category": "Forensics",
    "description": "Freshly mixed oil paint residue on an assistant curator's rubber gloves.",
    "englishClue": "The pigment was synthesized only two days ago.",
    "arabicMeaning": "بقعة طلاء زيتي أزرق كوبالت حديث التحضير",
    "cefrLevel": "A2"
  },
  {
    "id": "ev_poison_goblet",
    "title": "Antique Goblet Cyanide Trace",
    "category": "Tox-Screen",
    "description": "Crystalline residue smelling of bitter almonds inside the lord's locked library.",
    "englishClue": "A lethal dose of cyanide dissolved in vintage port.",
    "arabicMeaning": "بقايا سم السيانيد داخل كأس نبيذ عتيق",
    "cefrLevel": "B2"
  },
  {
    "id": "ev_thermal_lance",
    "title": "Thermal Lance Cutting Tip",
    "category": "Burglary Tools",
    "description": "An ultra-high temperature gas torch nozzle found discarded in the bank ventilation shaft.",
    "englishClue": "Used to melt the six-inch vault hinges silently.",
    "arabicMeaning": "فوهة شعلة حرارية لصهر مفصلات الخزينة",
    "cefrLevel": "B1"
  },
  {
    "id": "ev_grappling_hook",
    "title": "Titanium Grappling Hook",
    "category": "Infiltration",
    "description": "Silenced rope climber equipment found coiled on the Tower parapet.",
    "englishClue": "Allowed the cat burglar to rappel from the roof.",
    "arabicMeaning": "خطاف تسلق تيتانيوم صامت للهبوط من السطح",
    "cefrLevel": "B2"
  },
  {
    "id": "ev_crypto_ledger",
    "title": "Encrypted Cold Storage Token",
    "category": "Cyber",
    "description": "USB hardware security key loaded with an unauthorized transaction script at 3:14 AM.",
    "englishClue": "The cryptographic signature traces to the engineer's laptop.",
    "arabicMeaning": "مفتاح أمان مشفر يحتوي على أمر تحويل رقمي",
    "cefrLevel": "B1"
  },
  {
    "id": "ev_tincture_bottle",
    "title": "Disguised Perfume Vial",
    "category": "Smuggling",
    "description": "Vintage atomizer containing concentrated cardiac neurotoxin rather than lavender.",
    "englishClue": "Concealed in a locked dresser compartment on Deck 3.",
    "arabicMeaning": "قارورة عطر مموهة تحوي مادة سامة للقلب",
    "cefrLevel": "B2"
  }
];
export const WHEEL_SLICES: WheelSliceItem[] = [
  {
    "shortLabel": "+25 XP",
    "title": "Say 3 Daily Sentences",
    "challengePrompt": "Speak or type 3 sentences about your day in Squad Chat for +25 XP!",
    "bonusXp": 25,
    "color": "#563AE4",
    "actionTarget": "NONE"
  },
  {
    "shortLabel": "Quiz!",
    "title": "Lightning Quiz Bonus",
    "challengePrompt": "Launch Quiz Clash and try a 5-question round in English!",
    "bonusXp": 30,
    "color": "#FF5A5F",
    "actionTarget": "QUIZ"
  },
  {
    "shortLabel": "Idiom",
    "title": "Arabic ↔ English Swap",
    "challengePrompt": "Share your favorite English idiom and its Arabic meaning with your squad!",
    "bonusXp": 20,
    "color": "#0E9F6E",
    "actionTarget": "NONE"
  },
  {
    "shortLabel": "Stage!",
    "title": "Roleplay Twist Challenge",
    "challengePrompt": "Act out a 2-minute café or airport scene with a plot twist!",
    "bonusXp": 35,
    "color": "#F59E0B",
    "actionTarget": "ROLEPLAY"
  },
  {
    "shortLabel": "+45 XP",
    "title": "Jackpot Vocab Sprint",
    "challengePrompt": "Awesome spin! You unlocked +45 bonus XP — keep your combo streak alive!",
    "bonusXp": 45,
    "color": "#7C3AED",
    "actionTarget": "NONE"
  },
  {
    "shortLabel": "Forge!",
    "title": "Sentence Scramble Run",
    "challengePrompt": "Solve two sentence scrambles or collocation matches in Word Forge!",
    "bonusXp": 25,
    "color": "#0284C7",
    "actionTarget": "PUZZLE"
  },
  {
    "shortLabel": "Voice",
    "title": "Pronunciation Spotlight",
    "challengePrompt": "Pick 3 words from your level and read them aloud using TTS!",
    "bonusXp": 20,
    "color": "#059669",
    "actionTarget": "NONE"
  },
  {
    "shortLabel": "+35 XP",
    "title": "Team Cheer Boost",
    "challengePrompt": "Drop an encouraging English message in Squad Chat to rally your team!",
    "bonusXp": 35,
    "color": "#DB2777",
    "actionTarget": "NONE"
  }
];
export const CURATED_HEIST_CIPHERS: CipherWordItem[] = [
  {
    "word": "ALIBI",
    "arabic": "ذريعة / حجة غياب",
    "clue": "Proof that a suspect was somewhere else.",
    "level": "B1"
  },
  {
    "word": "THIEF",
    "arabic": "لص",
    "clue": "Someone who secretly steals treasure or art.",
    "level": "A2"
  },
  {
    "word": "VAULT",
    "arabic": "خزينة",
    "clue": "Heavy steel room protecting gold and jewels.",
    "level": "B1"
  },
  {
    "word": "CLUE",
    "arabic": "دليل",
    "clue": "A small hint that helps solve a mystery.",
    "level": "A2"
  },
  {
    "word": "FORGE",
    "arabic": "يزور",
    "clue": "To illegally copy a painting or signature.",
    "level": "B2"
  },
  {
    "word": "GUARD",
    "arabic": "حارس",
    "clue": "Officer watching the museum halls at night.",
    "level": "A1"
  },
  {
    "word": "HEIST",
    "arabic": "سرقة كبرى",
    "clue": "A carefully planned robbery of a bank or gallery.",
    "level": "B2"
  },
  {
    "word": "TRACE",
    "arabic": "أثر",
    "clue": "Tiny evidence left behind at a crime scene.",
    "level": "B1"
  },
  {
    "word": "LOCK",
    "arabic": "قفل",
    "clue": "Security device opened with a key or cipher.",
    "level": "A1"
  },
  {
    "word": "CASE",
    "arabic": "قضية",
    "clue": "An investigation opened by a detective.",
    "level": "A2"
  }
];
export const CURATED_ODD_CLUE_ROUNDS: OddClueRoundItem[] = [
  {
    "scenarioPrompt": "Three items belong to a jewel heist; tap the one that contradicts the suspect's alibi!",
    "options": [
      "Muddy hiking boots",
      "Library receipt",
      "Museum glass cutter",
      "Blue diamond dust"
    ],
    "oddIndex": 1,
    "explanation": "The library receipt is the only innocent daytime paper — the other three trace to the gallery break-in!",
    "level": "B1"
  },
  {
    "scenarioPrompt": "Three words describe legal detective work; pick the thief action that does not belong.",
    "options": [
      "Investigate",
      "Interrogate",
      "Counterfeit",
      "Verify"
    ],
    "oddIndex": 2,
    "explanation": "'Counterfeit' (يزور / يقلد) means creating fake currency or art — detectives investigate and verify.",
    "level": "B2"
  },
  {
    "scenarioPrompt": "Spot the word that is NOT a crime-scene clue!",
    "options": [
      "Fingerprint",
      "Footprint",
      "Breakfast menu",
      "Witness statement"
    ],
    "oddIndex": 2,
    "explanation": "A breakfast menu is unrelated here, while fingerprints, footprints, and witness statements solve cases.",
    "level": "A2"
  },
  {
    "scenarioPrompt": "Identify which suspect statement breaks the midnight timeline.",
    "options": [
      "Arrived at 11:45 PM",
      "Heard glass at 12:02 AM",
      "Saw fog at noon",
      "Locked gate at 11:55 PM"
    ],
    "oddIndex": 2,
    "explanation": "'At noon' is 12 hours away from midnight — it does not match the midnight burglary window.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "Three tools silence or bypass alarms; choose the ordinary museum piece.",
    "options": [
      "Thermal lance",
      "Grappling hook",
      "Porcelain vase",
      "Lockpick kit"
    ],
    "oddIndex": 2,
    "explanation": "The porcelain vase is the stolen artifact, whereas the others are burglary tools.",
    "level": "B2"
  },
  {
    "scenarioPrompt": "Find the English word that does NOT mean honesty or truth.",
    "options": [
      "Evidence",
      "Proof",
      "Deception",
      "Fact"
    ],
    "oddIndex": 2,
    "explanation": "'Deception' (خداع) means misleading others with lies.",
    "level": "B1"
  }
];
export const ARABIC_QUIZ_PACKS: QuizPack[] = [
  {
    "id": "ar_pack_crime",
    "title": "ألغاز الجرائم والتحقيق الجنائي",
    "topic": "ألغاز الجرائم والأدلة الجنائية",
    "cefrLevel": "B1",
    "language": "AR",
    "questions": [
      {
        "prompt": "في جريمة سرقة متحف منتصف الليل، لماذا شكّ المحقق في الحارس الذي قال إنه رأى اللص يخرج عند الساعة 12:15 بينما الكاميرات تعطلت الساعة 11:50؟",
        "options": [
          "لأن الكاميرات لم تعمل بعد 11:50 فكيف عرف الوقت بدقة؟",
          "لأن المتحف يغلق يوم الثلاثاء فقط",
          "لأن الحارس لم يكن يرتدي ساعة يد",
          "لأن الباب الخلفي كان مفتوحاً بالصدفة"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "التناقض الزمني في شهادة المشتبه به يكشف تلفيق الرواية."
      },
      {
        "prompt": "ما التقنية الجنائية التي تعتمد على فحص الخطوط الدائرية الفريدة في أطراف أصابع الإنسان لتحديد هوية الجاني؟",
        "options": [
          "مضاهاة البصمات",
          "تحليل التربة",
          "قياس الصوت",
          "فحص بصمة الحذاء"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "لكل إنسان بصمة إصبع فريدة لا تتطابق مع أي شخص آخر في العالم."
      },
      {
        "prompt": "أبلغ رجل الشرطة أن خزنته سُرقت، لكن المحقق لاحظ وجود زجاج النافذة المكسور متناثراً خارج المنزل وليس داخله. ماذا يدل ذلك؟",
        "options": [
          "النافذة كُسرَت من الداخل لتمويه الجريمة",
          "اللص قفز من السطح العلوي",
          "الرياح القوية كسرت الزجاج",
          "السرقة حدثت قبل أسبوع كامل"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "تطاير الزجاج نحو الخارج يثبت أن الضربة وُجّهت من داخل الغرفة."
      },
      {
        "prompt": "ما المادة التي يستخدمها خبراء الأدلة الجنائية في الظلام لتتبع آثار الدم غير المرئية بالعين المجردة؟",
        "options": [
          "مادة اللومينول المضيئة",
          "ماء الأكسجين العادي",
          "كحول التعقيم الطبي",
          "محلول الملح المركز"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يتفاعل اللومينول مع الحديد الموجود في الهيموغلوبين ليصدر توهجاً أزرق في الظلام."
      },
      {
        "prompt": "تلقى التحري رسالة تهديد مكتوبة على ورق مبلل، وقال المشتبه به إنه كتبها قبل شهر في صحراء جافة. ما الدليل الذي يدحض كلامه؟",
        "options": [
          "انتشار الحبر الطازج في الورق الرطب",
          "نوع الخط المستخدم في الورقة",
          "حجم المظروف الورقي",
          "لون الطابع البريدي"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "حبر الرسالة يتمدد ويتلطخ فوراً عندما يكون حديثاً على ورق رطب."
      },
      {
        "prompt": "ما الفحص المخبري الأدق للتحقق من هوية شخص من خلال خصلة شعر أو قطرة لعاب في مسرح الجريمة؟",
        "options": [
          "تحليل الحمض النووي",
          "فحص فصيلة الدم فقط",
          "قياس الطول والوزن",
          "فحص لون العينين"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "البصمة الوراثية (الحمض النووي) تمنح تطابقاً شبه مؤكد لهوية الشخص."
      },
      {
        "prompt": "اختفت لوحة أثرية من قصر مغلق ولم يكن هناك أثر لاقتحام، لكن فنجان القهوة على الطاولة كان لا يزال دافئاً. ماذا استنتج المحقق؟",
        "options": [
          "الجاني ما زال قريباً أو غادر منذ دقائق معدودة",
          "الجريمة وقعت في العام الماضي",
          "اللوحة سقطت خلف الجدار",
          "الطقس كان بارداً جداً"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "حرارة المشروب تساعد المحققين على تقدير التوقيت الدقيق لوجود المشتبه به."
      },
      {
        "prompt": "ما الاسم الذي يُطلق على الدليل الذي يثبت أن المشتبه به كان في مكان آخر وقت وقوع الجريمة؟",
        "options": [
          "حجة الغياب",
          "بصمة الصوت",
          "تقرير التشريح",
          "مذكرة التفتيش"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "حجة الغياب القوية والمدعومة بالشهود أو الكاميرات تبرئ المشتبه به."
      }
    ]
  },
  {
    "id": "ar_pack_science",
    "title": "حقائق العلوم والفضاء المذهلة",
    "topic": "العلوم والفضاء والاكتشافات",
    "cefrLevel": "A2",
    "language": "AR",
    "questions": [
      {
        "prompt": "ما هو الكوكب الأكبر حجماً في مجموعتنا الشمسية والذي يشتهر ببقعته الحمراء العظيمة؟",
        "options": [
          "المشتري",
          "زحل",
          "نبتون",
          "المريخ"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "كوكب المشتري عملاق غازي يفوق حجمه مجموع بقية كواكب المجموعة الشمسية."
      },
      {
        "prompt": "ما المعدن الوحيد الذي يكون في الحالة السائلة عند درجة حرارة الغرفة العادية؟",
        "options": [
          "الزئبق",
          "الحديد",
          "الألمنيوم",
          "النحاس"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "الزئبق ينصهر عند درجة حرارة منخفضة جداً تبلغ قرابة 39 درجة تحت الصفر."
      },
      {
        "prompt": "كم قلباً يمتلك الأخطبوط في جسمه البحري المذهل؟",
        "options": [
          "ثلاثة قلوب",
          "قلب واحد",
          "قلبان اثنان",
          "خمسة قلوب"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يمتلك الأخطبوط قلبين لضخ الدم إلى الخياشيم وقلباً ثالثاً لبقية الجسم."
      },
      {
        "prompt": "ما هو الغاز الأكثر وفرة في الغلاف الجوي لكوكب الأرض بنسبة تقارب 78%؟",
        "options": [
          "النيتروجين",
          "الأكسجين",
          "ثاني أكسيد الكربون",
          "الهيليوم"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يشكل النيتروجين نحو 78% من الهواء، بينما يشكل الأكسجين نحو 21%."
      },
      {
        "prompt": "كم يستغرق ضوء الشمس تقريباً للوصول إلى كوكب الأرض؟",
        "options": [
          "ثماني دقائق وعشرون ثانية",
          "ثانية واحدة",
          "ساعة كاملة",
          "يومان كاملان"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "تبعد الشمس حوالي 150 مليون كيلومتر عن الأرض، فيقطع الضوء المسافة في نحو 8 دقائق."
      },
      {
        "prompt": "ما الكوكب الذي يدور حول محوره باتجاه معاكس لمعظم كواكب المجموعة الشمسية وتشرق الشمس فيه من الغرب؟",
        "options": [
          "الزهرة",
          "الأرض",
          "عطارد",
          "المريخ"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يدور كوكب الزهرة دوراناً تراجعياً بطيئاً جداً عكس اتجاه بقية الكواكب تقريباً."
      },
      {
        "prompt": "ما العضو البشري الذي يستهلك قرابة 20% من طاقة الجسم والأكسجين رغم صغر حجمه النسبي؟",
        "options": [
          "الدماغ",
          "المعدة",
          "الكلى",
          "الطحال"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "الدماغ يعمل بلا توقف لتنظيم الوظائف الحيوية والتفكير والذاكرة."
      },
      {
        "prompt": "ما هي المجرة الكبرى الأقرب إلى مجرة درب التبانة؟",
        "options": [
          "مجرة المرأة المسلسلة (أندروميدا)",
          "مجرة المثلث",
          "سحابة ماجلان",
          "مجرة السديم"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "تقع مجرة أندروميدا على بعد نحو 2.5 مليون سنة ضوئية منا."
      }
    ]
  },
  {
    "id": "ar_pack_history",
    "title": "تاريخ وحضارات وعجائب العالم",
    "topic": "التاريخ والحضارات والمعالم",
    "cefrLevel": "B2",
    "language": "AR",
    "questions": [
      {
        "prompt": "أين تقع مدينة البتراء الأثرية المنحوتة في الصخر الوردي؟",
        "options": [
          "الأردن",
          "عُمان",
          "تونس",
          "المغرب"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "بنى الأنباط مدينة البتراء في جنوب الأردن، وهي من عجائب الدنيا السبع الجديدة."
      },
      {
        "prompt": "ما هي أقدم جامعة ما زالت تعمل وتمنح شهادات علمية في العالم حسب اليونسكو وموسوعة غينيس؟",
        "options": [
          "جامعة القرويين في فاس",
          "جامعة أكسفورد",
          "جامعة بولونيا",
          "جامعة هارفارد"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "أسست فاطمة الفهرية جامعة القرويين في مدينة فاس المغربية عام 859م."
      },
      {
        "prompt": "أي حضارة قديمة ابتكرت نظام الكتابة المسمارية على ألواح الطين في بلاد الرافدين؟",
        "options": [
          "السومريون",
          "الرومان",
          "الإغريق",
          "الفينيقيون"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "ابتكر السومريون الكتابة المسمارية قبل أكثر من خمسة آلاف عام."
      },
      {
        "prompt": "ما اسم العالم المسلم الذي وضع أسس علم البصريات وشرح كيفية عمل الكاميرا المظلمة؟",
        "options": [
          "الحسن بن الهيثم",
          "ابن سيناء",
          "الخوارزمي",
          "الإدريسي"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "ألف الحسن بن الهيثم كتاب المناظر وأثبت أن الرؤية تحدث بانعكاس الضوء إلى العين."
      },
      {
        "prompt": "في أي عام هبط أول إنسان على سطح القمر ضمن رحلة أبولو 11؟",
        "options": [
          "عام 1969 ميلادية",
          "عام 1957 ميلادية",
          "عام 1979 ميلادية",
          "عام 1986 ميلادية"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "خطا نيل أرمسترونغ على سطح القمر في يوليو 1969."
      },
      {
        "prompt": "ما اسم المضيق الذي يربط بين البحر الأبيض المتوسط والمحيط الأطلسي؟",
        "options": [
          "مضيق جبل طارق",
          "مضيق هرمز",
          "مضيق البوسفور",
          "باب المندب"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يفصل مضيق جبل طارق بين المغرب وإسبانيا ويصل المتوسط بالأطلسي."
      }
    ]
  },
  {
    "id": "ar_pack_facts",
    "title": "معلومات عامة وغرائب العالم",
    "topic": "معلومات عامة وحقائق شيقة",
    "cefrLevel": "A2",
    "language": "AR",
    "questions": [
      {
        "prompt": "ما هو أسرع حيوان بري على وجه الأرض ويمكنه بلوغ سرعة تتجاوز 110 كيلومترات في الساعة؟",
        "options": [
          "الفهد الصياد",
          "الأسد",
          "النمر البنغالي",
          "الغزال"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يتميز الفهد بجسم رشيق وعمود فقري مرن يمنحه تسارعاً هائلاً."
      },
      {
        "prompt": "ما هو أعمق محيط على سطح الكرة الأرضية ويضم خندق ماريانا الشهير؟",
        "options": [
          "المحيط الهادئ",
          "المحيط الأطلسي",
          "المحيط الهندي",
          "المحيط المتجمد الشمالي"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "المحيط الهادئ هو أكبر وأعمق محيطات الأرض، ويصل عمق خندق ماريانا فيه إلى نحو 11 كيلومتراً."
      },
      {
        "prompt": "أي دولة تُعرف تاريخياً باسم «بلاد الشمس المشرقة»؟",
        "options": [
          "اليابان",
          "الصين",
          "كوريا الجنوبية",
          "تايلاند"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "تقع اليابان في أقصى شرق آسيا، ومعنى اسمها باليابانية أصل الشمس."
      },
      {
        "prompt": "ما اسم الحجر الكريم الأكثر صلابة في الطبيعة ويُستخدم في قص الزجاج وحفر الصخور؟",
        "options": [
          "الألماس",
          "الزمرد",
          "المرجان",
          "الفيروز"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "يسجل الألماس الدرجة القصوى 10 على مقياس موس للصلابة."
      },
      {
        "prompt": "أي طائر يستطيع الطيران إلى الخلف بمهارة بفضل حركة أجنحته السريعة الفريدة؟",
        "options": [
          "طائر الطنان",
          "الصقر",
          "النسر",
          "النعامة"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "طائر الطنان هو الطائر الوحيد القادر على التحليق في مكانه والطيران للخلف."
      },
      {
        "prompt": "كم عدد القارات الرئيسية في الكرة الأرضية؟",
        "options": [
          "سبع قارات",
          "خمس قارات",
          "ست قارات",
          "ثماني قارات"
        ],
        "correctIndex": 0,
        "timeLimitSec": 20,
        "tip": "القارات السبع هي: آسيا وإفريقيا وأوروبا وأمريكا الشمالية والجنوبية وأستراليا والقارة القطبية الجنوبية."
      }
    ]
  }
];
export const ARABIC_ARCADE_WORDS: ArabicArcadeWordItem[] = [
  {
    "word": "تحقيق",
    "synonym": "تقصٍّ وبحث",
    "antonym": "تجاهل",
    "clue": "جمع الأدلة لكشف ملابسات قضية غامضة",
    "cefrLevel": "B1"
  },
  {
    "word": "بصمة",
    "synonym": "أثر فريد",
    "antonym": "مجهولية",
    "clue": "علامة دقيقة يتركها الإصبع على الزجاج أو الورق",
    "cefrLevel": "A2"
  },
  {
    "word": "مجرة",
    "synonym": "تجمع نجوم",
    "antonym": "فراغ مظلم",
    "clue": "منظومة هائلة تضم مليارات النجوم والكواكب في الفضاء",
    "cefrLevel": "B1"
  },
  {
    "word": "مشتبه",
    "synonym": "متهم محتمل",
    "antonym": "بريء مؤكد",
    "clue": "شخص تدور حوله الشكوك في مسرح الجريمة",
    "cefrLevel": "B1"
  },
  {
    "word": "شجاع",
    "synonym": "مقدام",
    "antonym": "جبان",
    "clue": "صفة الشخص الذي لا يخاف عند الخطر",
    "cefrLevel": "A2"
  },
  {
    "word": "ابتكار",
    "synonym": "إبداع",
    "antonym": "تقليد",
    "clue": "اختراع فكرة أو طريقة علمية جديدة لم تُسبق",
    "cefrLevel": "B1"
  },
  {
    "word": "نيزك",
    "synonym": "شهاب صخري",
    "antonym": "كوكب ثابت",
    "clue": "صخرة فضائية تخترق الغلاف الجوي بسرعة هائلة",
    "cefrLevel": "B2"
  },
  {
    "word": "كنز",
    "synonym": "ثروة مدفونة",
    "antonym": "فقر",
    "clue": "ذهب أو آثار ثمينة مخبأة تحت الأرض منذ قرون",
    "cefrLevel": "A1"
  },
  {
    "word": "خزنة",
    "synonym": "صندوق محصن",
    "antonym": "مخزن مكشوف",
    "clue": "صندوق حديدي بقفل سري لحفظ الأسرار والجواهر",
    "cefrLevel": "A2"
  },
  {
    "word": "بوصلة",
    "synonym": "مؤشر الاتجاه",
    "antonym": "تيه",
    "clue": "أداة ملاحية تشير دائماً نحو الشمال الجغرافي",
    "cefrLevel": "A2"
  },
  {
    "word": "حاسوب",
    "synonym": "جهاز رقمي",
    "antonym": "آلة يدوية",
    "clue": "جهاز ذكي لتحليل البيانات وكشف الشيفرات",
    "cefrLevel": "A2"
  },
  {
    "word": "بركان",
    "synonym": "جبل ثائر",
    "antonym": "نبع بارد",
    "clue": "فوهة جبلية تقذف الحمم المنصهرة من باطن الأرض",
    "cefrLevel": "B1"
  },
  {
    "word": "تلسكوب",
    "synonym": "منظار فلكي",
    "antonym": "عتمة",
    "clue": "جهاز بصري لرصد الكواكب والمجرات البعيدة",
    "cefrLevel": "B1"
  },
  {
    "word": "شاهد",
    "synonym": "راصد الحدث",
    "antonym": "غائب",
    "clue": "شخص حضر الواقعة وأدلى بمعلوماته للمحقق",
    "cefrLevel": "A2"
  },
  {
    "word": "تعاون",
    "synonym": "تكاتف",
    "antonym": "تنافر",
    "clue": "العمل معاً بروح الفريق لكشف اللغز والفوز",
    "cefrLevel": "A2"
  },
  {
    "word": "مختبر",
    "synonym": "معمل تجارب",
    "antonym": "صحراء",
    "clue": "مكان مجهز لفحص العينات الجنائية وإجراء التجارب",
    "cefrLevel": "A2"
  }
];
export const ARABIC_VAULT_WORDS: ArabicVaultWordItem[] = [
  {
    "word": "بصمة",
    "arabicClue": "دليل فريد يتركه الإصبع في مسرح الجريمة",
    "cefrLevel": "A2"
  },
  {
    "word": "مجرة",
    "arabicClue": "عائلة كونية عملاقة تضم مليارات النجوم",
    "cefrLevel": "B1"
  },
  {
    "word": "شاهد",
    "arabicClue": "من رأى الواقعة بعينه وأخبر المحقق بالحقيقة",
    "cefrLevel": "A2"
  },
  {
    "word": "فلكي",
    "arabicClue": "عالم يدرس النجوم والكواكب والمذنبات",
    "cefrLevel": "B1"
  },
  {
    "word": "خزنة",
    "arabicClue": "صندوق فولاذي محكم الإغلاق يحوي الألماس",
    "cefrLevel": "A2"
  },
  {
    "word": "قرصان",
    "arabicClue": "متسلل يخترق الأنظمة الرقمية أو يبحر بحثاً عن الكنوز",
    "cefrLevel": "B1"
  },
  {
    "word": "مختبر",
    "arabicClue": "معمل فحص الأدلة والعينات العلمية",
    "cefrLevel": "A2"
  },
  {
    "word": "نيزك",
    "arabicClue": "صخرة تسقط من الفضاء الخارجي نحو الأرض",
    "cefrLevel": "B1"
  },
  {
    "word": "سفينة",
    "arabicClue": "مركب عملاق أبحر به المستكشفون عبر المحيطات",
    "cefrLevel": "A2"
  },
  {
    "word": "تاريخ",
    "arabicClue": "سجل أحداث الحضارات القديمة والأزمنة الغابرة",
    "cefrLevel": "A2"
  },
  {
    "word": "قمر",
    "arabicClue": "جرم سماوي يدور حول الأرض ويعكس نور الشمس",
    "cefrLevel": "A1"
  },
  {
    "word": "مفتاح",
    "arabicClue": "أداة تفتح الأبواب المغلقة أو تفك الشيفرة السرية",
    "cefrLevel": "A1"
  }
];
export const ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS: OddClueRoundItem[] = [
  {
    "scenarioPrompt": "في مسرح جريمة غامض بمتحف اللوفر، وُجدت بصمة إصبع على زجاج الألماس المسروق. من هو السارق المحترف بحسب التحليل الجنائي؟",
    "options": [
      "خبير الخزنات المتخفي",
      "حارس البوابة الخارجية",
      "عابر سبيل صدفة",
      "سائح جديد تماماً"
    ],
    "oddIndex": 0,
    "explanation": "بصمة الإصبع وُجدت على خزانة الزجاج الداخلية بدقة محترف.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "ما هو الكوكب الأكثر سخونة في المجموعة الشمسية بسبب غلافه الجوي الكثيف المكون من ثاني أكسيد الكربون؟",
    "options": [
      "الزهرة",
      "عطارد",
      "المريخ",
      "المشتري"
    ],
    "oddIndex": 0,
    "explanation": "كوكب الزهرة يحتفظ بالحرارة بشدة بسبب ظاهرة الاحتباس الحراري.",
    "level": "A2"
  },
  {
    "scenarioPrompt": "في أي عام هبط أول إنسان على سطح القمر في مهمة أبولو 11 التاريخية؟",
    "options": [
      "1969م",
      "1955م",
      "1975م",
      "1981م"
    ],
    "oddIndex": 0,
    "explanation": "هبط نيل أرمسترونغ على القمر في عام 1969م.",
    "level": "B2"
  },
  {
    "scenarioPrompt": "ما المادة البيولوجية الأساسية التي تُستخدم في مختبرات الأدلة الجنائية لمطابقة الحمض النووي للمشتبه بهم؟",
    "options": [
      "الشعر أو الدم أو اللعاب",
      "خيوط القطن الأبيض",
      "بقع الحبر العادي",
      "غبار السجاد القديم"
    ],
    "oddIndex": 0,
    "explanation": "الحمض النووي يُستخرج بدقة من الخلايا الحية للشعر والدم واللعاب.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "ما هي سرعة الضوء التقريبية في الفراغ والتي تُعد أقصى سرعة في الكون؟",
    "options": [
      "300 ألف كيلومتر في الثانية",
      "3 آلاف كيلومتر في الثانية",
      "300 كيلومتر في الثانية",
      "30 مليون كيلومتر في الثانية"
    ],
    "oddIndex": 0,
    "explanation": "يقطع الضوء حوالي 300,000 كم في الثانية الواحدة.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "أين تقع مدينة البتراء الأثرية المنحوتة في الصخر والتي تعتبر إحدى عجائب الدنيا السبع الجديدة؟",
    "options": [
      "الأردن",
      "مصر",
      "اليونان",
      "إيطاليا"
    ],
    "oddIndex": 0,
    "explanation": "البتراء هي العاصمة التاريخية للأنباط في جنوب الأردن.",
    "level": "A2"
  },
  {
    "scenarioPrompt": "كيف استدل المحقق الجنائي على اتجاه هروب الجاني في ليلة ممطرة مظلمة؟",
    "options": [
      "آثار أقدام عميقة في الطين",
      "رائحة العطر الخفيفة في الهواء",
      "أصوات الموسيقى البعيدة في الشارع",
      "لون جدران المبنى المجاور"
    ],
    "oddIndex": 0,
    "explanation": "آثار الأقدام في الطين تكشف مسار الهروب وحجم الحذاء واتجاهه.",
    "level": "A2"
  },
  {
    "scenarioPrompt": "ما هي المجرة الكبرى الأقرب لمجرتنا درب التبانة؟",
    "options": [
      "أندروميدا (المرأة المسلسلة)",
      "سحابة ماجلان الصغرى",
      "مجرة الدوامة الحلزونية",
      "مجرة السديم الدائري"
    ],
    "oddIndex": 0,
    "explanation": "أندروميدا هي أقرب مجرة حلزونية ضخمة لدرب التبانة.",
    "level": "B2"
  },
  {
    "scenarioPrompt": "في قضية سرقة مكتبة نادرة، ادعى المشتبه به أنه كان يقرأ في الظلام الدامس دون مصباح. كيف كشفه المحقق؟",
    "options": [
      "لا يمكن لأحد القراءة في ظلام دامس دون مصدر ضوء",
      "لأن الكتب كانت بلغة قديمة",
      "لأن المكتبة كانت تحتوي كراسي خشبية",
      "لأن الوقت كان ظهراً"
    ],
    "oddIndex": 0,
    "explanation": "تناقض الرواية مع أبسط قوانين الفيزياء كشف كذب المشتبه به فوراً.",
    "level": "A2"
  },
  {
    "scenarioPrompt": "ما اسم الكائن البحري الذكي الذي يمتلك ثلاثة قلوب ودماً أزرق اللون؟",
    "options": [
      "الأخطبوط",
      "القرش الأبيض",
      "الدلفين",
      "سلطعون البحر"
    ],
    "oddIndex": 0,
    "explanation": "الأخطبوط يمتلك 3 قلوب ويعتمد دمه على النحاس مما يمنحه اللون الأزرق.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "أي عالم وضع قوانين الحركة والجاذبية الشهيرة بعد تأمله في سقوط الأجسام وحركة الكواكب؟",
    "options": [
      "إسحاق نيوتن",
      "توماس إديسون",
      "غراهام بيل",
      "الأخوان رايت"
    ],
    "oddIndex": 0,
    "explanation": "إسحاق نيوتن صاغ قوانين الحركة الثلاثة وقانون الجذب العام.",
    "level": "B1"
  },
  {
    "scenarioPrompt": "ما المعدن الثمين الذي استُخدم في صناعة قناع الملك توت عنخ آمون الشهير في مصر القديمة؟",
    "options": [
      "الذهب الخالص",
      "الفضة البيضاء",
      "الحديد المطاوع",
      "القصدير"
    ],
    "oddIndex": 0,
    "explanation": "صُنع القناع الجنائزي لتوت عنخ آمون من الذهب الخالص المطعم بالأحجار الكريمة.",
    "level": "A2"
  }
];

export const OfflineRoleplayGenerator = {
  presetTopics: [
  "Café & Bakery Order",
  "Airport Boarding Gate",
  "Doctor & Pharmacy Visit",
  "Market Bargain & Shopping",
  "Job Interview Prep",
  "Hosting a Friend in Town"
],
  presetTones: [
  "Friendly",
  "Funny",
  "Urgent",
  "Mysterious"
],
  generate(topicInput: string, cefrLevel = 'B1', tone = 'Friendly'): RoleplayScenario {
    const cleanTopic = (topicInput || '').trim().slice(0, 80) || 'Café & Bakery Order';
    const key = cleanTopic.toLowerCase();
    const tLow = (tone || '').toLowerCase();
    const twist =
      tLow === 'funny'
        ? 'Plot Twist: Someone accidentally swaps your order with a giant birthday cake!'
        : tLow === 'urgent'
        ? 'Plot Twist: Your train leaves in 7 minutes—finish the conversation fast!'
        : tLow === 'mysterious'
        ? 'Plot Twist: A folded envelope with your name on it appears on the counter!'
        : 'Plot Twist: An old friend walks in and joins the conversation!';

    const id = `offline_${Date.now()}`;
    const isBeginner = cefrLevel === 'A1' || cefrLevel === 'A2';

    if (key.includes('airport') || key.includes('flight') || key.includes('travel')) {
      return {
        id,
        title: cleanTopic,
        setting: 'International Departure Gate • Offline Scene',
        cefrLevel,
        roleAName: 'Passenger',
        roleBName: 'Gate Agent',
        goal: 'Check boarding status, ask about seat changes, and stay calm under pressure.',
        lines: [
          { speakerRole: 'A', text: isBeginner ? 'Excuse me, is this the gate for flight 204 to London?' : 'Excuse me, could you confirm whether Flight 204 is still departing on schedule?', keyHint: 'Check flight gate/status', highlights: [{ phrase: 'on schedule', meaning: 'Happening at the planned time', example: 'Despite the rain, the train arrived right on schedule.' }] },
          { speakerRole: 'B', text: isBeginner ? 'Yes, it is! Boarding starts in twenty minutes. Can I see your passport?' : "Yes, we're right on track. Boarding begins shortly—may I scan your boarding pass?", keyHint: 'Confirm gate and check document', highlights: [] },
          { speakerRole: 'A', text: isBeginner ? 'Here is my ticket. Is there a window seat free?' : 'Here you go. By any chance, are there any window seats left?', keyHint: 'Ask politely for a window seat', highlights: [{ phrase: 'By any chance', meaning: 'Polite way to ask if something is possible', example: 'Do you have a pen by any chance?' }] },
          { speakerRole: 'B', text: "Let me take a quick look... You're in luck! Seat 14A just opened up.", keyHint: 'Check system and offer seat 14A', highlights: [{ phrase: "You're in luck", meaning: 'Good news—things worked out well', example: "You're in luck, the bakery has one loaf left!" }] },
          { speakerRole: 'A', text: 'Awesome, thank you so much! Where do I put my carry-on bag?', keyHint: 'Thank and ask about luggage', highlights: [] },
          { speakerRole: 'B', text: 'It fits right in the overhead bin above your row. Have a wonderful flight!', keyHint: 'Explain overhead storage and wish a nice trip', highlights: [] }
        ],
        plotTwists: [twist, 'Plot Twist: An announcement offers free business-class upgrades to anyone who speaks two languages!']
      };
    }

    if (key.includes('doctor') || key.includes('pharmacy') || key.includes('clinic')) {
      return {
        id,
        title: cleanTopic,
        setting: 'Neighborhood Clinic & Pharmacy • Offline Scene',
        cefrLevel,
        roleAName: 'Patient',
        roleBName: 'Pharmacist',
        goal: 'Describe symptoms clearly and understand dosage instructions.',
        lines: [
          { speakerRole: 'B', text: 'Hello there! How can I help you feel better today?', keyHint: "Welcome and ask what's wrong", highlights: [] },
          { speakerRole: 'A', text: isBeginner ? 'I have a sore throat and a mild fever since yesterday.' : "I've been under the weather since Tuesday with a scratchy throat and fatigue.", keyHint: 'Describe symptoms clearly', highlights: [{ phrase: 'under the weather', meaning: 'Feeling slightly sick or unwell', example: "I'm staying home today because I feel a bit under the weather." }] },
          { speakerRole: 'B', text: 'Got it. Do you have any allergies to medicine?', keyHint: 'Check allergies', highlights: [] },
          { speakerRole: 'A', text: 'No allergies. What do you suggest I take?', keyHint: 'Confirm no allergies and ask advice', highlights: [] },
          { speakerRole: 'B', text: 'Take one tablet after meals twice a day, and drink plenty of warm fluids.', keyHint: 'Give clear dosage directions', highlights: [{ phrase: 'twice a day', meaning: 'Two times each day', example: 'Water the plants twice a day in summer.' }] },
          { speakerRole: 'A', text: "Thank you! I'll rest up and follow those instructions.", keyHint: 'Acknowledge and thank', highlights: [] }
        ],
        plotTwists: [twist]
      };
    }

    if (key.includes('market') || key.includes('shop') || key.includes('bargain')) {
      return {
        id,
        title: cleanTopic,
        setting: 'Weekend Craft & Spice Market • Offline Scene',
        cefrLevel,
        roleAName: 'Shopper',
        roleBName: 'Vendor',
        goal: 'Compare items, negotiate a friendly bundle price, and seal the deal.',
        lines: [
          { speakerRole: 'B', text: 'Step right up! Everything here is handmade—what catches your eye?', keyHint: 'Greet shopper warmly', highlights: [{ phrase: 'catches your eye', meaning: 'Attracts your attention', example: 'Tell me if any jacket catches your eye.' }] },
          { speakerRole: 'A', text: 'That ceramic mug looks great! How much are you asking for it?', keyHint: 'Ask the price', highlights: [] },
          { speakerRole: 'B', text: "Usually twenty dollars, because it's hand-painted.", keyHint: 'Give price and value', highlights: [] },
          { speakerRole: 'A', text: isBeginner ? 'If I buy two mugs, can you give me a discount?' : 'If I take two as gifts, could you cut me a deal?', keyHint: 'Negotiate a bundle price', highlights: [{ phrase: 'cut me a deal', meaning: 'Offer a friendly lower price', example: 'Since we buy here every week, could you cut us a deal?' }] },
          { speakerRole: 'B', text: "Tell you what—take two for thirty-four dollars and I'll wrap them up nicely.", keyHint: 'Offer bundle compromise', highlights: [{ phrase: 'Tell you what', meaning: 'Used to propose a friendly compromise', example: "Tell you what—you drive and I'll pay for snacks." }] },
          { speakerRole: 'A', text: "Deal! You've got a happy customer.", keyHint: 'Accept cheerfully', highlights: [] }
        ],
        plotTwists: [twist]
      };
    }

    if (key.includes('job') || key.includes('interview') || key.includes('work')) {
      return {
        id,
        title: cleanTopic,
        setting: 'Creative Studio Interview • Offline Scene',
        cefrLevel,
        roleAName: 'Candidate',
        roleBName: 'Team Lead',
        goal: 'Share strengths, give a quick example of teamwork, and ask a smart question.',
        lines: [
          { speakerRole: 'B', text: 'Thanks for coming in! To kick things off, tell me a bit about yourself.', keyHint: 'Start interview warmly', highlights: [{ phrase: 'kick things off', meaning: 'Start an event or meeting', example: "Let's kick things off with a quick warm-up quiz." }] },
          { speakerRole: 'A', text: 'Sure! I love solving practical problems and helping teammates learn new tools quickly.', keyHint: 'Present key strengths', highlights: [] },
          { speakerRole: 'B', text: 'Great! How do you handle tight deadlines when two tasks clash?', keyHint: 'Ask behavioral question', highlights: [] },
          { speakerRole: 'A', text: 'I break tasks into clear steps, communicate early, and tackle high-impact items first.', keyHint: 'Explain prioritization calmly', highlights: [{ phrase: 'break tasks into steps', meaning: 'Divide big work into smaller parts', example: "Let's break this project into three easy steps." }] },
          { speakerRole: 'B', text: 'Smart approach. Do you have any questions for us before we wrap up?', keyHint: "Invite candidate's question", highlights: [{ phrase: 'wrap up', meaning: 'Finish or conclude', example: "Let's wrap up the session with five fast words." }] },
          { speakerRole: 'A', text: 'Yes—what would success look like in the first three months on your team?', keyHint: 'Ask thoughtful closing question', highlights: [] }
        ],
        plotTwists: [twist]
      };
    }

    if (key.includes('café') || key.includes('cafe') || key.includes('coffee') || key.includes('bakery')) {
      if (isBeginner) {
        return {
          id,
          title: cleanTopic,
          setting: 'Cozy Corner Café • Offline Scene',
          cefrLevel,
          roleAName: 'Customer',
          roleBName: 'Barista',
          goal: 'Order a drink, ask about ingredients, and pay politely.',
          lines: [
            { speakerRole: 'B', text: 'Good morning! Welcome to Sunshine Café. What would you like today?', keyHint: 'Greet and ask for order', highlights: [{ phrase: 'What would you like?', meaning: 'Polite offer at a café or shop', example: 'What would you like to drink with your breakfast?' }] },
            { speakerRole: 'A', text: 'Hi! Can I have a medium latte and a cheese croissant, please?', keyHint: 'Order a drink and snack politely', highlights: [{ phrase: 'Can I have... please?', meaning: 'Everyday polite request', example: 'Can I have a glass of water, please?' }] },
            { speakerRole: 'B', text: 'Sure! Would you like that for here or to take away?', keyHint: 'Ask dine-in or takeaway', highlights: [{ phrase: 'to take away', meaning: 'Take food out instead of eating inside', example: 'Two teas to take away, please.' }] },
            { speakerRole: 'A', text: 'For here, thanks. Does the croissant have any nuts?', keyHint: 'Choose dine-in and ask about allergies', highlights: [{ phrase: 'For here', meaning: 'Eat inside the café', example: "We'll have our coffee for here." }] },
            { speakerRole: 'B', text: 'No nuts at all! Your total is six dollars and fifty cents.', keyHint: 'Confirm ingredients and give total', highlights: [] },
            { speakerRole: 'A', text: 'Great, here you go. Keep the change!', keyHint: 'Pay and thank the barista', highlights: [{ phrase: 'Keep the change', meaning: 'Let the staff keep extra coins as a tip', example: "It's $9.50—here's $10, keep the change." }] }
          ],
          plotTwists: [twist, 'Plot Twist: The espresso machine makes a loud whistle and everyone laughs!']
        };
      }
      return {
        id,
        title: cleanTopic,
        setting: 'Artisan Roastery • Offline Scene',
        cefrLevel,
        roleAName: 'Regular Guest',
        roleBName: 'Head Barista',
        goal: 'Ask for a custom recommendation and resolve a mix-up smoothly.',
        lines: [
          { speakerRole: 'B', text: 'Morning! Feel like your usual flat white, or are you in the mood to switch things up?', keyHint: 'Offer usual order or something new', highlights: [{ phrase: 'switch things up', meaning: 'Try something different for a change', example: "Let's switch things up and walk by the river." }] },
          { speakerRole: 'A', text: "Honestly, I'm wiped out today. What do you recommend that packs a punch without being overly sweet?", keyHint: 'Ask for a strong, not-too-sweet drink', highlights: [{ phrase: 'wiped out', meaning: 'Very tired or exhausted', example: "After three hours of study, I'm completely wiped out." }] },
          { speakerRole: 'B', text: "You can't go wrong with our double cortado—smooth espresso with just a splash of oat milk.", keyHint: 'Recommend a bold drink', highlights: [{ phrase: "You can't go wrong with...", meaning: 'Safe, reliable recommendation', example: "You can't go wrong with the homemade soup." }] },
          { speakerRole: 'A', text: 'Sounds spot on. By the way, could we swap out the dairy milk for almond?', keyHint: 'Request a substitution politely', highlights: [{ phrase: 'spot on', meaning: 'Exactly right / ideal', example: 'Your guess about the ending was spot on!' }] },
          { speakerRole: 'B', text: "Consider it done. Hang tight for two minutes and I'll bring it straight to your table.", keyHint: 'Confirm and ask guest to wait briefly', highlights: [{ phrase: 'Hang tight', meaning: 'Wait patiently for a short moment', example: "Hang tight—I'll grab my coat and join you." }] },
          { speakerRole: 'A', text: "Much appreciated! Take your time—I'm catching up on messages anyway.", keyHint: 'Thank warmly', highlights: [] }
        ],
        plotTwists: [twist, "Plot Twist: Today is the café's anniversary so every pastry is on the house!"]
      };
    }

    const greeting =
      cefrLevel === 'A1'
        ? `Hi! Nice to meet you here at ${cleanTopic}.`
        : cefrLevel === 'A2'
        ? `Hey! I'm glad we met here to talk about ${cleanTopic}.`
        : cefrLevel === 'B1'
        ? `Hey there! Ready to dive into ${cleanTopic} with a ${tone} vibe?`
        : `Good to see you! Shall we get straight to the point on ${cleanTopic}?`;

    return {
      id,
      title: cleanTopic,
      setting: `${cleanTopic} (${tone} Mode • Offline)`,
      cefrLevel,
      roleAName: 'Host',
      roleBName: 'Partner',
      goal: `Practice natural turn-taking, follow-up questions, and clear explanations around ${cleanTopic}.`,
      lines: [
        { speakerRole: 'A', text: greeting, keyHint: 'Open the scene naturally', highlights: [{ phrase: 'get straight to the point', meaning: 'Start discussing the main topic right away', example: "We only have ten minutes, so let's get straight to the point." }] },
        { speakerRole: 'B', text: 'Absolutely! Could you walk me through what we need to decide first?', keyHint: 'Ask for the first priority', highlights: [{ phrase: 'walk me through', meaning: 'Explain something step by step', example: 'Can you walk me through how this game works?' }] },
        { speakerRole: 'A', text: "First, let's agree on our main goal so nobody gets confused halfway through.", keyHint: 'Propose clear alignment', highlights: [] },
        { speakerRole: 'B', text: 'Makes total sense. What if something unexpected slows us down?', keyHint: 'Ask a backup question', highlights: [{ phrase: 'Makes total sense', meaning: 'I completely agree / understand', example: 'Your plan makes total sense to all of us.' }] },
        { speakerRole: 'A', text: 'Then we stay flexible, help each other out, and turn it into a win!', keyHint: 'Stay positive and adaptable', highlights: [] },
        { speakerRole: 'B', text: "Count me in—let's make it happen!", keyHint: 'Confirm enthusiasm', highlights: [{ phrase: 'Count me in', meaning: 'Include me, I want to participate', example: 'Are we playing trivia tonight? Count me in!' }] }
      ],
      plotTwists: [twist, 'Plot Twist: You must suddenly explain your last point using only simple A1 words!']
    };
  }
};
