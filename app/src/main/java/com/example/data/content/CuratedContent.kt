package com.example.data.content

import com.example.data.model.CefrLevel
import com.example.data.model.ClozePuzzle
import com.example.data.model.CollocationPair
import com.example.data.model.CuratedFlashcardDeck
import com.example.data.model.CuratedQuizPack
import com.example.data.model.FlashcardItem
import com.example.data.model.GuessingCard
import com.example.data.model.GuessingPack
import com.example.data.model.HighlightedPhrase
import com.example.data.model.MatchPuzzleSet
import com.example.data.model.QuizQuestionItem
import com.example.data.model.RoleplayLine
import com.example.data.model.RoleplayScenario
import com.example.data.model.SentencePuzzle

object CuratedContent {

    val quizPacks: List<CuratedQuizPack> = listOf(
        CuratedQuizPack(
            id = "quiz_a1_starters",
            title = "A1 Everyday Starters",
            topic = "Basics",
            cefrLevel = CefrLevel.A1,
            description = "Friendly beginner quiz on greetings, polite requests, and daily basics.",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "You meet someone for the first time. What is the friendliest reply to 'How are you?'",
                    options = listOf(
                        "I'm good, thanks! And you?",
                        "My house is big.",
                        "Yesterday morning.",
                        "Yes, please."
                    ),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: Always add 'And you?' to keep a simple A1 conversation going!"
                ),
                QuizQuestionItem(
                    prompt = "Choose the correct sentence:",
                    options = listOf(
                        "She work in a hospital.",
                        "She works in a hospital.",
                        "She working in a hospital.",
                        "She are work in a hospital."
                    ),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: With he/she/it in present simple, add -s to the verb!"
                ),
                QuizQuestionItem(
                    prompt = "You want to ask the price of a coffee. You say:",
                    options = listOf(
                        "How many is this coffee?",
                        "How much is this coffee?",
                        "Where time is this coffee?",
                        "What age is this coffee?"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: Use 'How much' for prices, 'How many' for counting items."
                ),
                QuizQuestionItem(
                    prompt = "Complete: 'Excuse me, ____ is the train station?'",
                    options = listOf("who", "when", "where", "why"),
                    correctIndex = 2,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Where' asks about places; 'When' asks about time."
                )
            )
        ),
        CuratedQuizPack(
            id = "quiz_a2_daily",
            title = "A2 Past & Daily Adventures",
            topic = "Grammar & Travel",
            cefrLevel = CefrLevel.A2,
            description = "Practice past tense verbs, comparisons, and shopping/travel English.",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "Yesterday, my friends and I ____ to a street food market.",
                    options = listOf("go", "went", "going", "gone"),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Go' is irregular in the past simple -> 'went'!"
                ),
                QuizQuestionItem(
                    prompt = "The blue backpack is £25 and the red one is £40. The blue one is ____.",
                    options = listOf("cheaper", "more cheap", "cheapest", "most cheap"),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: Short 1-syllable adjectives add -er ('cheaper than')."
                ),
                QuizQuestionItem(
                    prompt = "What do you ask a waiter when you finish eating?",
                    options = listOf(
                        "Can we have the bill, please?",
                        "Can we have the recipe, please?",
                        "Can we borrow the kitchen?",
                        "Where is the homework?"
                    ),
                    correctIndex = 0,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'The bill' (UK) or 'the check' (US) both mean the payment paper."
                ),
                QuizQuestionItem(
                    prompt = "We ____ TV when the doorbell rang.",
                    options = listOf("watch", "watched", "were watching", "are watching"),
                    correctIndex = 2,
                    timeLimitSec = 22,
                    tip = "Teach tip: Past continuous ('were watching') sets the background scene!"
                )
            )
        ),
        CuratedQuizPack(
            id = "quiz_b2_idioms",
            title = "B2 Idioms & Everyday Slang",
            topic = "Idioms",
            cefrLevel = CefrLevel.B2,
            description = "Fun idioms native speakers actually use in cafés, chats, and group hangouts.",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "Your friend looks awkward at a party. What does 'break the ice' mean?",
                    options = listOf(
                        "Start a friendly chat to ease tension",
                        "Leave the party without saying bye",
                        "Drop a glass on the floor",
                        "Tell a serious secret"
                    ),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: Ask your friends what their favorite icebreaker question is!"
                ),
                QuizQuestionItem(
                    prompt = "If someone 'hits the nail on the head', they...",
                    options = listOf(
                        "Hurt themselves fixing a shelf",
                        "Guess or explain something 100% accurately",
                        "Refuse to compromise",
                        "Arrive right before the deadline"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: Great reaction phrase when a friend makes a smart point: 'You hit the nail on the head!'"
                ),
                QuizQuestionItem(
                    prompt = "What does it mean to feel 'under the weather'?",
                    options = listOf(
                        "Caught in heavy rain",
                        "Slightly sick or low on energy",
                        "Excited about weekend plans",
                        "Confused by instructions"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: Natural B2 alternative to 'I am a little sick today'."
                ),
                QuizQuestionItem(
                    prompt = "Your friend whispers 'Don't spill the beans!' What are they asking?",
                    options = listOf(
                        "Don't waste any food",
                        "Don't reveal the surprise or secret",
                        "Don't rush the presentation",
                        "Don't forget your wallet"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: Pair it with 'let the cat out of the bag' so friends learn two secret idioms!"
                ),
                QuizQuestionItem(
                    prompt = "You finally decide to do a hard task you avoided. You 'bite the...'",
                    options = listOf("apple", "coin", "bullet", "pillow"),
                    correctIndex = 2,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Bite the bullet' means facing an unpleasant task bravely."
                ),
                QuizQuestionItem(
                    prompt = "If you see an old classmate 'once in a blue moon', how often is that?",
                    options = listOf(
                        "Every single weekend",
                        "Very rarely",
                        "Only during winter",
                        "Twice a month"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: Ask everyone to name something they only do once in a blue moon."
                )
            )
        ),
        CuratedQuizPack(
            id = "quiz_phrasal_battle",
            title = "Phrasal Verbs Battle",
            topic = "Phrasal Verbs",
            cefrLevel = CefrLevel.B1,
            description = "Master the most useful everyday phrasal verbs without boring textbook drills.",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "We had to ____ the picnic until Sunday because of the storm.",
                    options = listOf("put off", "put on", "put up", "put out"),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Put off' = postpone. Contrast with 'call off' = cancel completely!"
                ),
                QuizQuestionItem(
                    prompt = "Oh no! We've ____ milk—can you grab some on your way over?",
                    options = listOf("run into", "run out of", "run over", "run away"),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Run out of' works for time, patience, battery, and coffee!"
                ),
                QuizQuestionItem(
                    prompt = "Which sentence is grammatically natural?",
                    options = listOf(
                        "I look forward to see you!",
                        "I look forward to seeing you!",
                        "I look forward seeing you!",
                        "I look forward for seeing you!"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 22,
                    tip = "Teach tip: After 'look forward to', 'to' is a preposition, so always use verb-ing!"
                ),
                QuizQuestionItem(
                    prompt = "Maya ____ a brilliant idea for our English game night.",
                    options = listOf("came up with", "came across", "came down with", "came over"),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Come up with' = invent or think of an idea/plan."
                ),
                QuizQuestionItem(
                    prompt = "He was offered a job far away, so he politely ____ it ____.",
                    options = listOf("turned / up", "turned / down", "turned / out", "turned / off"),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Turn down' = reject an offer, OR lower the volume!"
                ),
                QuizQuestionItem(
                    prompt = "It took a few days to ____ the jet lag after flying to London.",
                    options = listOf("get along", "get over", "get by", "get into"),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Get over' = recover from an illness, shock, or disappointment."
                )
            )
        ),
        CuratedQuizPack(
            id = "quiz_confusing_pairs",
            title = "Tricky Pairs & False Friends",
            topic = "Vocabulary",
            cefrLevel = CefrLevel.A2,
            description = "Fix the classic mix-ups friends make—from borrow/lend to fun/funny!",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "My phone died! Can I ____ your charger for ten minutes?",
                    options = listOf("lend", "borrow", "loan", "rent"),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: You BORROW *from* someone; you LEND *to* someone."
                ),
                QuizQuestionItem(
                    prompt = "Please ____ me to buy snacks before the movie starts!",
                    options = listOf("remember", "remind", "recall", "memorize"),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Remind' needs a person (remind ME); 'remember' doesn't!"
                ),
                QuizQuestionItem(
                    prompt = "Which collocation uses 'MAKE' instead of 'DO'?",
                    options = listOf(
                        "____ the dishes",
                        "____ homework",
                        "____ a quick decision",
                        "____ the laundry"
                    ),
                    correctIndex = 2,
                    timeLimitSec = 20,
                    tip = "Teach tip: Usually DO = chores/tasks, MAKE = creating something or choices."
                ),
                QuizQuestionItem(
                    prompt = "Bringing an umbrella when dark clouds appear is very ____.",
                    options = listOf("sensitive", "sensible", "sensory", "sentimental"),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'Sensible' = practical/smart; 'sensitive' = easily affected or emotional."
                ),
                QuizQuestionItem(
                    prompt = "Our board game night was so ____! Nobody stopped laughing.",
                    options = listOf("fun", "funny", "humor", "joyful"),
                    correctIndex = 0,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Fun' = enjoyable experience; 'funny' = makes you laugh like a joke."
                )
            )
        ),
        CuratedQuizPack(
            id = "quiz_real_talk",
            title = "Natural Small Talk & Replies",
            topic = "Speaking",
            cefrLevel = CefrLevel.B2,
            description = "Sound warm, fluent, and confident in real conversations with friends.",
            questions = listOf(
                QuizQuestionItem(
                    prompt = "A friend says: 'Shall we grab tacos after class?' Best natural reply:",
                    options = listOf(
                        "Yes, it is acceptable to me.",
                        "Sounds like a plan!",
                        "I am agreeing to tacos.",
                        "Very good proposal."
                    ),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: 'Sounds like a plan!' or 'I'm down!' are super natural replies."
                ),
                QuizQuestionItem(
                    prompt = "You forgot what you were saying mid-sentence. What fits best?",
                    options = listOf(
                        "I lost my train of thought.",
                        "My brain is out of service.",
                        "I dropped my thinking line.",
                        "Excuse my memory pause."
                    ),
                    correctIndex = 0,
                    timeLimitSec = 20,
                    tip = "Teach tip: Native speakers say 'Sorry, I lost my train of thought!' all the time."
                ),
                QuizQuestionItem(
                    prompt = "What does 'No worries, take your time' communicate?",
                    options = listOf(
                        "Hurry up please",
                        "Friendly patience—no rush at all",
                        "The meeting is cancelled",
                        "You forgot to pay"
                    ),
                    correctIndex = 1,
                    timeLimitSec = 18,
                    tip = "Teach tip: Way warmer than just saying 'Wait'."
                ),
                QuizQuestionItem(
                    prompt = "To politely disagree in a B2 discussion, which opener sounds best?",
                    options = listOf(
                        "You are totally wrong.",
                        "I see where you're coming from, though...",
                        "That makes zero sense.",
                        "Stop talking about that."
                    ),
                    correctIndex = 1,
                    timeLimitSec = 20,
                    tip = "Teach tip: 'I see where you're coming from' validates your friend before sharing your view."
                )
            )
        )
    )

    val flashcardDecks: List<CuratedFlashcardDeck> = listOf(
        CuratedFlashcardDeck(
            id = "deck_a1_essentials",
            title = "A1 Starter Survival Kit",
            subtitle = "6 must-know beginner phrases for day one",
            cefrLevel = CefrLevel.A1,
            cards = listOf(
                FlashcardItem(
                    term = "I would like...",
                    phonetic = "/aɪ wʊd laɪk/",
                    partOfSpeech = "Phrase",
                    meaning = "Polite way to order food, drinks, or ask for something.",
                    example = "I would like a cup of tea, please.",
                    teachingTip = "Much friendlier than saying 'Give me tea'!"
                ),
                FlashcardItem(
                    term = "Excuse me",
                    phonetic = "/ɪkˈskjuːz miː/",
                    partOfSpeech = "Phrase",
                    meaning = "Polite opener to get attention or pass by someone.",
                    example = "Excuse me, is this seat free?",
                    teachingTip = "Contrast with 'I'm sorry' (used when you made a mistake)."
                ),
                FlashcardItem(
                    term = "How much is this?",
                    phonetic = "/haʊ mʌtʃ ɪz ðɪs/",
                    partOfSpeech = "Question",
                    meaning = "Ask the price of an item in a shop or market.",
                    example = "Excuse me, how much is this blue mug?",
                    teachingTip = "Practice with numbers 10 to 100 together!"
                ),
                FlashcardItem(
                    term = "Could you repeat that?",
                    phonetic = "/kʊd juː rɪˈpiːt ðæt/",
                    partOfSpeech = "Question",
                    meaning = "Polite way to ask someone to say something again.",
                    example = "Sorry, I didn't catch that—could you repeat that slowly?",
                    teachingTip = "The #1 confidence phrase for A1 friends!"
                ),
                FlashcardItem(
                    term = "Where is the...?",
                    phonetic = "/wɛər ɪz ðə/",
                    partOfSpeech = "Question",
                    meaning = "Ask for the location of a place.",
                    example = "Where is the nearest metro station?",
                    teachingTip = "Pair with 'turn left', 'turn right', and 'straight ahead'."
                ),
                FlashcardItem(
                    term = "Nice to meet you",
                    phonetic = "/naɪs tuː miːt juː/",
                    partOfSpeech = "Greeting",
                    meaning = "Warm phrase when meeting someone for the first time.",
                    example = "Hi, I'm Sami. Nice to meet you!",
                    teachingTip = "Reply with 'Nice to meet you too!'"
                )
            )
        ),
        CuratedFlashcardDeck(
            id = "deck_a2_daily",
            title = "A2 Daily Life & Feelings",
            subtitle = "6 practical words for telling stories & making plans",
            cefrLevel = CefrLevel.A2,
            cards = listOf(
                FlashcardItem(
                    term = "Appointment",
                    phonetic = "/əˈpɔɪntmənt/",
                    partOfSpeech = "Noun",
                    meaning = "A planned meeting at a set time (doctor, hairdresser, etc.).",
                    example = "I need to make an appointment for Friday morning.",
                    teachingTip = "Explain 'make an appointment' vs 'meet a friend' (casual)."
                ),
                FlashcardItem(
                    term = "Crowded",
                    phonetic = "/ˈkraʊdɪd/",
                    partOfSpeech = "Adjective",
                    meaning = "Full of many people with very little space.",
                    example = "The bus was so crowded this morning!",
                    teachingTip = "Opposite is 'empty' or 'quiet'."
                ),
                FlashcardItem(
                    term = "Delicious",
                    phonetic = "/dɪˈlɪʃəs/",
                    partOfSpeech = "Adjective",
                    meaning = "Having a very pleasant taste.",
                    example = "These homemade pancakes are delicious!",
                    teachingTip = "Great A2 upgrade from always saying 'good food'!"
                ),
                FlashcardItem(
                    term = "Improve",
                    phonetic = "/ɪmˈpruːv/",
                    partOfSpeech = "Verb",
                    meaning = "Make something better or become better at a skill.",
                    example = "Playing word games helps me improve my English.",
                    teachingTip = "Ask friends one thing they want to improve this month."
                ),
                FlashcardItem(
                    term = "Borrow vs. Lend",
                    phonetic = "/ˈbɒroʊ/ vs /lɛnd/",
                    partOfSpeech = "Verbs",
                    meaning = "Borrow = take temporarily; Lend = give temporarily.",
                    example = "Can I borrow your pen? Sure, I'll lend it to you.",
                    teachingTip = "Memory trick: Borrow FROM, Lend TO!"
                ),
                FlashcardItem(
                    term = "Looking for",
                    phonetic = "/ˈlʊkɪŋ fɔːr/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Trying to find someone or something.",
                    example = "I'm looking for my keys—have you seen them?",
                    teachingTip = "Also super useful in shops: 'I'm just looking, thanks!'"
                )
            )
        ),
        CuratedFlashcardDeck(
            id = "deck_phrasal_b2",
            title = "Everyday Phrasal Verbs",
            subtitle = "8 high-frequency expressions for casual English",
            cefrLevel = CefrLevel.B2,
            cards = listOf(
                FlashcardItem(
                    term = "Catch up (with)",
                    phonetic = "/kætʃ ʌp/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Talk with someone you haven't seen recently to share news.",
                    example = "Let's grab coffee this Friday and catch up!",
                    teachingTip = "Ask a friend: 'Who do you want to catch up with this week?'"
                ),
                FlashcardItem(
                    term = "Figure out",
                    phonetic = "/ˈfɪɡjər aʊt/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Understand or solve something after thinking about it.",
                    example = "Give me a second—I'll figure out how this puzzle works.",
                    teachingTip = "Great substitute for 'solve' or 'understand' in everyday speech."
                ),
                FlashcardItem(
                    term = "End up",
                    phonetic = "/ɛnd ʌp/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Finally arrive at a place or result you didn't originally plan.",
                    example = "We wanted pizza, but we ended up cooking pasta at home.",
                    teachingTip = "Always followed by verb-ing or a place/adjective!"
                ),
                FlashcardItem(
                    term = "Bring up",
                    phonetic = "/brɪŋ ʌp/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Start talking about a particular topic.",
                    example = "I didn't want to bring up work during dinner.",
                    teachingTip = "Mention both meanings: raise a topic OR raise a child."
                ),
                FlashcardItem(
                    term = "Put off",
                    phonetic = "/pʊt ɔːf/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Postpone something to a later time.",
                    example = "Stop putting off your English practice—let's play a round!",
                    teachingTip = "Link this to the word 'procrastinate' for B2 learners."
                ),
                FlashcardItem(
                    term = "Look forward to",
                    phonetic = "/lʊk ˈfɔːrwərd tuː/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Feel excited about something happening in the future.",
                    example = "I'm really looking forward to our weekend trip.",
                    teachingTip = "Remind friends: always verb-ing or a noun after 'to'!"
                ),
                FlashcardItem(
                    term = "Turn out",
                    phonetic = "/tɜːrn aʊt/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Have a particular, often surprising, final result.",
                    example = "The rain stopped, so the picnic turned out great!",
                    teachingTip = "Perfect for storytelling!"
                ),
                FlashcardItem(
                    term = "Run out of",
                    phonetic = "/rʌn aʊt ʌv/",
                    partOfSpeech = "Phrasal Verb",
                    meaning = "Use all of something so none is left.",
                    example = "We ran out of time on the last question.",
                    teachingTip = "Works with physical things (milk) and abstract things (ideas, patience)."
                )
            )
        ),
        CuratedFlashcardDeck(
            id = "deck_idioms_b2",
            title = "Expressive B2 Idioms",
            subtitle = "Colorful phrases that make stories memorable",
            cefrLevel = CefrLevel.B2,
            cards = listOf(
                FlashcardItem(
                    term = "Get the hang of",
                    phonetic = "/ɡɛt ðə hæŋ ʌv/",
                    partOfSpeech = "Idiom",
                    meaning = "Learn how to do something skillfully after a little practice.",
                    example = "Roleplays feel shy at first, then you get the hang of them.",
                    teachingTip = "Use this to encourage friends right after their first round!"
                ),
                FlashcardItem(
                    term = "On the same page",
                    phonetic = "/ɒn ðə seɪm peɪdʒ/",
                    partOfSpeech = "Idiom",
                    meaning = "Agreeing or understanding a plan in the same way.",
                    example = "Before we start the game, let's make sure we're on the same page.",
                    teachingTip = "Essential for teamwork and group travel planning."
                ),
                FlashcardItem(
                    term = "A piece of cake",
                    phonetic = "/ə piːs ʌv keɪk/",
                    partOfSpeech = "Idiom",
                    meaning = "Something very easy to do.",
                    example = "Wait until level 3—that first puzzle was a piece of cake!",
                    teachingTip = "Fun warm-up card to teach beginners alongside B1/B2 friends."
                ),
                FlashcardItem(
                    term = "Sleep on it",
                    phonetic = "/sliːp ɒn ɪt/",
                    partOfSpeech = "Idiom",
                    meaning = "Wait overnight before making a big decision.",
                    example = "Don't decide right now—sleep on it and tell me tomorrow.",
                    teachingTip = "Literal image makes it unforgettable for friends."
                ),
                FlashcardItem(
                    term = "Cost an arm and a leg",
                    phonetic = "/kɒst ən ɑːrm ænd ə lɛɡ/",
                    partOfSpeech = "Idiom",
                    meaning = "Be extremely expensive.",
                    example = "Concert tickets downtown cost an arm and a leg nowadays.",
                    teachingTip = "Ask friends to name one thing that costs an arm and a leg in their city."
                ),
                FlashcardItem(
                    term = "Out of the blue",
                    phonetic = "/aʊt ʌv ðə bluː/",
                    partOfSpeech = "Idiom",
                    meaning = "Happening suddenly and completely unexpectedly.",
                    example = "An old friend texted me completely out of the blue.",
                    teachingTip = "Shortens 'unexpectedly' into vivid conversational English."
                )
            )
        ),
        CuratedFlashcardDeck(
            id = "deck_connectors",
            title = "Fluent Connectors & Fillers",
            subtitle = "Bridge ideas smoothly when speaking",
            cefrLevel = CefrLevel.B1,
            cards = listOf(
                FlashcardItem(
                    term = "By the way",
                    phonetic = "/baɪ ðə weɪ/",
                    partOfSpeech = "Discourse Marker",
                    meaning = "Used to smoothly introduce a new or related topic.",
                    example = "By the way, did you watch the new episode last night?",
                    teachingTip = "Practice pivoting from one topic to another in 10 seconds."
                ),
                FlashcardItem(
                    term = "To be honest",
                    phonetic = "/tuː biː ˈɒnɪst/",
                    partOfSpeech = "Phrase",
                    meaning = "Used to share a candid or personal opinion politely.",
                    example = "To be honest, I prefer tea over espresso.",
                    teachingTip = "Softens opinions so debates stay friendly."
                ),
                FlashcardItem(
                    term = "On the other hand",
                    phonetic = "/ɒn ði ˈʌðər hænd/",
                    partOfSpeech = "Connector",
                    meaning = "Introduces a contrasting point or downside.",
                    example = "City life is exciting; on the other hand, it can be noisy.",
                    teachingTip = "Classic B2 speaking exam & debate connector!"
                ),
                FlashcardItem(
                    term = "As a matter of fact",
                    phonetic = "/æz ə ˈmætər ʌv fækt/",
                    partOfSpeech = "Connector",
                    meaning = "Actually; adds surprising or extra true detail.",
                    example = "I've been there—as a matter of fact, I lived nearby!",
                    teachingTip = "Great for making stories sound confident and natural."
                ),
                FlashcardItem(
                    term = "Long story short",
                    phonetic = "/lɔːŋ ˈstɔːri ʃɔːrt/",
                    partOfSpeech = "Phrase",
                    meaning = "Used to skip details and jump to the ending of a story.",
                    example = "Long story short, we missed the train and took a taxi!",
                    teachingTip = "Lifesaver when telling funny stories with friends."
                )
            )
        )
    )

    val sentencePuzzles: List<SentencePuzzle> = listOf(
        SentencePuzzle(
            id = "sp_a1_1",
            cefrLevel = CefrLevel.A1,
            promptHint = "A1 Polite request at a café",
            tokens = listOf("I", "would", "like", "a", "cup", "of", "tea,", "please."),
            explanation = "'I would like...' is the cleanest polite way to order at A1."
        ),
        SentencePuzzle(
            id = "sp_a1_2",
            cefrLevel = CefrLevel.A1,
            promptHint = "A1 Asking for directions politely",
            tokens = listOf("Excuse", "me,", "where", "is", "the", "train", "station?"),
            explanation = "Start with 'Excuse me,' before asking a stranger for help."
        ),
        SentencePuzzle(
            id = "sp_a2_1",
            cefrLevel = CefrLevel.A2,
            promptHint = "A2 Past simple story about yesterday",
            tokens = listOf("We", "went", "to", "the", "market", "yesterday", "morning."),
            explanation = "Remember: 'went' is the irregular past tense of 'go'."
        ),
        SentencePuzzle(
            id = "sp_a2_2",
            cefrLevel = CefrLevel.A2,
            promptHint = "A2 Comparing two items while shopping",
            tokens = listOf("This", "jacket", "is", "cheaper", "than", "the", "blue", "one."),
            explanation = "Use 'adjective + -er + than' to compare two things."
        ),
        SentencePuzzle(
            id = "sp_1",
            cefrLevel = CefrLevel.B2,
            promptHint = "Idiom: Start a friendly conversation at a party",
            tokens = listOf("Let's", "play", "a", "quick", "game", "to", "break", "the", "ice."),
            explanation = "'Break the ice' means helping people feel relaxed when they first meet."
        ),
        SentencePuzzle(
            id = "sp_2",
            cefrLevel = CefrLevel.B2,
            promptHint = "Polite disagreement in a group discussion",
            tokens = listOf("I", "see", "where", "you're", "coming", "from,", "though", "I", "disagree."),
            explanation = "'I see where you're coming from' acknowledges the other person's viewpoint respectfully."
        ),
        SentencePuzzle(
            id = "sp_3",
            cefrLevel = CefrLevel.B1,
            promptHint = "Phrasal verb: Excited about future plans",
            tokens = listOf("I'm", "really", "looking", "forward", "to", "meeting", "your", "friends."),
            explanation = "Remember: 'look forward to' takes the -ing form ('meeting'), not the base verb."
        ),
        SentencePuzzle(
            id = "sp_4",
            cefrLevel = CefrLevel.B2,
            promptHint = "Unexpected result after a changed plan",
            tokens = listOf("We", "missed", "the", "bus,", "but", "we", "ended", "up", "having", "fun."),
            explanation = "'End up + -ing' expresses an unplanned final outcome."
        ),
        SentencePuzzle(
            id = "sp_5",
            cefrLevel = CefrLevel.B1,
            promptHint = "Asking a friend for a small favor politely",
            tokens = listOf("Would", "you", "mind", "lending", "me", "your", "pen", "please?"),
            explanation = "'Would you mind + -ing' is a polite B1/B2 way to ask a favor, and we 'lend' TO someone."
        ),
        SentencePuzzle(
            id = "sp_6",
            cefrLevel = CefrLevel.B2,
            promptHint = "Encouraging someone learning a new skill",
            tokens = listOf("Once", "you", "practice", "more,", "you'll", "get", "the", "hang", "of", "it."),
            explanation = "'Get the hang of something' means mastering the technique with practice."
        )
    )

    val matchPuzzleSets: List<MatchPuzzleSet> = listOf(
        MatchPuzzleSet(
            id = "match_a1_opposites",
            title = "A1 Essential Opposites",
            cefrLevel = CefrLevel.A1,
            pairs = listOf(
                CollocationPair("a1_1", "Hot", "Cold"),
                CollocationPair("a1_2", "Early", "Late"),
                CollocationPair("a1_3", "Open", "Closed"),
                CollocationPair("a1_4", "Big", "Small"),
                CollocationPair("a1_5", "Happy", "Sad")
            ),
            teachingTip = "Have beginners act out each pair with gestures as you match them!"
        ),
        MatchPuzzleSet(
            id = "match_a2_past",
            title = "A2 Irregular Past Verbs",
            cefrLevel = CefrLevel.A2,
            pairs = listOf(
                CollocationPair("a2_1", "Go", "Went"),
                CollocationPair("a2_2", "Buy", "Bought"),
                CollocationPair("a2_3", "See", "Saw"),
                CollocationPair("a2_4", "Eat", "Ate"),
                CollocationPair("a2_5", "Make", "Made")
            ),
            teachingTip = "Ask friends to say one sentence about last weekend using each past verb."
        ),
        MatchPuzzleSet(
            id = "match_idioms",
            title = "Idiom Meanings",
            cefrLevel = CefrLevel.B2,
            pairs = listOf(
                CollocationPair("p1", "Spill the beans", "Reveal a secret"),
                CollocationPair("p2", "Under the weather", "Feeling slightly sick"),
                CollocationPair("p3", "Sleep on it", "Think overnight first"),
                CollocationPair("p4", "Out of the blue", "Completely unexpected"),
                CollocationPair("p5", "Piece of cake", "Very easy task")
            ),
            teachingTip = "Challenge your friends to invent one funny sentence using their favorite matched idiom!"
        ),
        MatchPuzzleSet(
            id = "match_collocations",
            title = "Make vs. Do & Collocations",
            cefrLevel = CefrLevel.B1,
            pairs = listOf(
                CollocationPair("c1", "Make", "a big decision"),
                CollocationPair("c2", "Do", "a huge favor"),
                CollocationPair("c3", "Pay", "close attention"),
                CollocationPair("c4", "Keep", "a promise"),
                CollocationPair("c5", "Catch", "a cold")
            ),
            teachingTip = "In English, verbs partner with specific nouns ('collocations'). Learning pairs sounds 2x more fluent!"
        ),
        MatchPuzzleSet(
            id = "match_phrasals",
            title = "Phrasal Verb Synonyms",
            cefrLevel = CefrLevel.B2,
            pairs = listOf(
                CollocationPair("v1", "Put off", "Postpone"),
                CollocationPair("v2", "Call off", "Cancel"),
                CollocationPair("v3", "Turn down", "Reject"),
                CollocationPair("v4", "Figure out", "Solve"),
                CollocationPair("v5", "Bring up", "Mention")
            ),
            teachingTip = "Formal writing often uses Latin verbs (postpone), while friendly speech loves phrasal verbs (put off)."
        )
    )

    val clozePuzzles: List<ClozePuzzle> = listOf(
        ClozePuzzle(
            id = "clz_a1_1",
            cefrLevel = CefrLevel.A1,
            beforeBlank = "Excuse me, where",
            afterBlank = "you from?",
            correctWord = "are",
            options = listOf("are", "is", "am", "do"),
            explanation = "Always pair 'you' with 'are' ('Where are you from?')."
        ),
        ClozePuzzle(
            id = "clz_a2_1",
            cefrLevel = CefrLevel.A2,
            beforeBlank = "I",
            afterBlank = "a great movie with my friends last night.",
            correctWord = "watched",
            options = listOf("watched", "watch", "watching", "watches"),
            explanation = "'Last night' signals past simple, so add -ed -> 'watched'."
        ),
        ClozePuzzle(
            id = "clz_1",
            cefrLevel = CefrLevel.B2,
            beforeBlank = "I ran",
            afterBlank = "my old teacher at the supermarket!",
            correctWord = "into",
            options = listOf("into", "out", "over", "off"),
            explanation = "'Run into' someone means meeting them unexpectedly by chance."
        ),
        ClozePuzzle(
            id = "clz_2",
            cefrLevel = CefrLevel.B1,
            beforeBlank = "Don't forget to",
            afterBlank = "me about tomorrow's meetup.",
            correctWord = "remind",
            options = listOf("remind", "remember", "recall", "think"),
            explanation = "Someone REMINDS you; you REMEMBER something yourself."
        ),
        ClozePuzzle(
            id = "clz_3",
            cefrLevel = CefrLevel.B2,
            beforeBlank = "We couldn't come",
            afterBlank = "with a better excuse!",
            correctWord = "up",
            options = listOf("up", "out", "over", "down"),
            explanation = "'Come up with' means invent or produce an idea or plan."
        ),
        ClozePuzzle(
            id = "clz_4",
            cefrLevel = CefrLevel.B2,
            beforeBlank = "Even though it rained, the street festival turned",
            afterBlank = "amazing.",
            correctWord = "out",
            options = listOf("out", "up", "in", "on"),
            explanation = "'Turn out' describes how an event ended up happening."
        ),
        ClozePuzzle(
            id = "clz_5",
            cefrLevel = CefrLevel.B1,
            beforeBlank = "Could you turn",
            afterBlank = "the music? I'm trying to explain the rules!",
            correctWord = "down",
            options = listOf("down", "across", "into", "after"),
            explanation = "'Turn down' lowers volume (or rejects an offer!)."
        )
    )

    val guessingPacks: List<GuessingPack> = listOf(
        GuessingPack(
            id = "guess_a1_easy",
            title = "A1 Everyday Words",
            modeLabel = "Easy clues—great for beginners!",
            cefrLevel = CefrLevel.A1,
            description = "Simple everyday nouns and actions without tricky vocabulary.",
            cards = listOf(
                GuessingCard("UMBRELLA", "Weather", listOf("Rain", "Wet", "Open"), "You hold it over your head when water falls from the sky."),
                GuessingCard("BICYCLE", "Transport", listOf("Two", "Wheels", "Ride"), "It has pedals and no engine."),
                GuessingCard("KITCHEN", "Home", listOf("Cook", "Food", "Room"), "The room with a fridge, oven, and sink."),
                GuessingCard("DOCTOR", "Jobs", listOf("Hospital", "Sick", "Medicine"), "A person who helps you feel healthy again."),
                GuessingCard("BREAKFAST", "Food", listOf("Morning", "Eat", "Eggs"), "The first meal of your day."),
                GuessingCard("AIRPORT", "Travel", listOf("Plane", "Fly", "Ticket"), "A huge building where flights take off and land."),
                GuessingCard("LAUGHING", "Action", listOf("Funny", "Smile", "Ha ha"), "What you do when someone tells a great joke."),
                GuessingCard("BIRTHDAY", "Celebration", listOf("Cake", "Candles", "Age"), "The special day every year when you turn one year older.")
            )
        ),
        GuessingPack(
            id = "guess_taboo_b2",
            title = "Taboo: B2 Vocabulary",
            modeLabel = "Describe without forbidden words!",
            cefrLevel = CefrLevel.B2,
            description = "Explain the word in English to your friends—never say the 3 red Taboo words!",
            cards = listOf(
                GuessingCard("PROCRASTINATE", "Habit", listOf("Delay", "Later", "Lazy"), "Waiting until the very last minute to start work."),
                GuessingCard("COINCIDENCE", "Event", listOf("Chance", "Same", "Luck"), "Two surprising things happening together without planning."),
                GuessingCard("SOUVENIR", "Travel", listOf("Gift", "Trip", "Buy"), "A small item you bring home to remember a vacation."),
                GuessingCard("NEGOTIATE", "Speaking", listOf("Price", "Deal", "Agree"), "Discussing terms until both people are happy."),
                GuessingCard("EMBARRASSED", "Feeling", listOf("Shy", "Red", "Mistake"), "How you feel if you wave at someone waving at someone behind you."),
                GuessingCard("EXAGGERATE", "Speaking", listOf("Bigger", "Truth", "Over"), "Saying a tiny fish you caught was the size of a shark."),
                GuessingCard("DEADLINE", "Work", listOf("Time", "Finish", "Late"), "The final hour or date when a task must be ready."),
                GuessingCard("IMPROVISE", "Creativity", listOf("Plan", "Act", "Ready"), "Creating something on the spot with no script."),
                GuessingCard("OVERWHELMED", "Feeling", listOf("Stress", "Too", "Busy"), "Having way more tasks or emotions than you can handle."),
                GuessingCard("RELIABLE", "Personality", listOf("Trust", "Always", "Friend"), "Someone who keeps promises and shows up on time.")
            )
        ),
        GuessingPack(
            id = "guess_charades",
            title = "Act It Out: Charades",
            modeLabel = "Silent acting—friends guess in English!",
            cefrLevel = CefrLevel.A2,
            description = "No speaking! Act out the English phrase while friends shout their guesses.",
            cards = listOf(
                GuessingCard("Ordering a huge coffee", "Action", listOf("Talk", "Sound", "Pointing"), "Mime holding a menu and sipping."),
                GuessingCard("Missing the morning bus", "Action", listOf("Words", "Run noise", "Beep"), "Look at watch, sprint, wave hopelessly!"),
                GuessingCard("Assembling flat-pack furniture", "Action", listOf("Screw", "Manual", "Words"), "Flip instructions upside down and scratch head."),
                GuessingCard("Burning dinner in the pan", "Action", listOf("Fire", "Cough words", "Ouch"), "Wave smoke away and fan the alarm."),
                GuessingCard("Taking a group selfie", "Action", listOf("Cheese", "Click", "Smile words"), "Hold imaginary phone high and squeeze friends in."),
                GuessingCard("Walking against strong wind", "Action", listOf("Blowing", "Cold", "Words"), "Lean forward and hold an umbrella flipping inside out!"),
                GuessingCard("Losing your house keys", "Action", listOf("Pocket", "Door", "Where"), "Pat every pocket in panic outside a door."),
                GuessingCard("Bargaining at a market", "Action", listOf("Money", "Numbers", "Talk"), "Hold up fingers, shake head, pretend to walk away.")
            )
        ),
        GuessingPack(
            id = "guess_idioms",
            title = "Explain the Idiom",
            modeLabel = "Give clues or act—make them say the idiom!",
            cefrLevel = CefrLevel.B2,
            description = "Help your friends guess the exact English idiom using real-life examples.",
            cards = listOf(
                GuessingCard("Piece of cake", "Idiom", listOf("Sweet", "Dessert", "Easy"), "Describe taking a test for 1st graders."),
                GuessingCard("Raining cats and dogs", "Idiom", listOf("Animals", "Pets", "Storm"), "Weather so heavy you need a boat!"),
                GuessingCard("Cold feet", "Idiom", listOf("Ice", "Toes", "Scared"), "Getting nervous right before a wedding or speech."),
                GuessingCard("On cloud nine", "Idiom", listOf("Sky", "Number", "Happy"), "Floating with joy after great news."),
                GuessingCard("Spill the beans", "Idiom", listOf("Coffee", "Food", "Secret"), "Accidentally ruining a surprise party."),
                GuessingCard("Break a leg", "Idiom", listOf("Bone", "Hospital", "Luck"), "What theatre actors say right before going on stage!"),
                GuessingCard("Under the weather", "Idiom", listOf("Rain", "Sun", "Sick"), "Sneezing and needing hot tea in bed."),
                GuessingCard("Cut corners", "Idiom", listOf("Scissors", "Square", "Fast"), "Doing a sloppy job just to save time or money.")
            )
        )
    )

    val roleplayScenarios: List<RoleplayScenario> = listOf(
        RoleplayScenario(
            id = "rp_a1_neighbor",
            title = "A1 Meeting a New Neighbor",
            setting = "Front hallway of your apartment building on a sunny afternoon.",
            cefrLevel = CefrLevel.A1,
            roleAName = "New Neighbor",
            roleBName = "Friendly Local",
            goal = "Introduce yourself, ask where someone is from, and invite them for tea.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "B",
                    text = "Hello! Welcome to the building. My name is Maya.",
                    keyHint = "Say hello & share your name",
                    highlights = listOf(
                        HighlightedPhrase("Welcome to", "Warm greeting for someone arriving at a new place", "Welcome to our neighborhood!")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Hi Maya! I'm Omar. Nice to meet you!",
                    keyHint = "Reply with your name & 'Nice to meet you'",
                    highlights = listOf(
                        HighlightedPhrase("Nice to meet you", "Polite phrase for first introductions", "Hi, I'm Sam—nice to meet you!")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Nice to meet you too! Where are you from, Omar?",
                    keyHint = "Ask where your new neighbor is from"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "I'm from Amman, and I work at a bakery near the park.",
                    keyHint = "Say your city and job simply"
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Oh, wonderful! Would you like a cup of tea later?",
                    keyHint = "Offer tea or coffee warmly"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Yes, I would love that! Thank you very much.",
                    keyHint = "Accept politely & say thank you"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: You both discover you have the exact same favorite dessert!",
                "Plot Twist: Your friendly cat walks into the hallway and sits on Omar's shoe!"
            )
        ),
        RoleplayScenario(
            id = "rp_a2_directions",
            title = "A2 Asking Directions in Town",
            setting = "Outside a sunny town square while holding a tourist map.",
            cefrLevel = CefrLevel.A2,
            roleAName = "Visitor",
            roleBName = "Helpful Local",
            goal = "Ask how to reach the museum, check how long it takes, and say thanks.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "A",
                    text = "Excuse me! Could you tell me how to get to the City Museum?",
                    keyHint = "Get attention politely & ask for the museum",
                    highlights = listOf(
                        HighlightedPhrase("how to get to", "Simple way to ask for directions to a place", "Do you know how to get to the station?")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Sure! Go straight ahead for two blocks, then turn left at the traffic lights.",
                    keyHint = "Give clear step-by-step directions",
                    highlights = listOf(
                        HighlightedPhrase("straight ahead", "Continue forward without turning", "Walk straight ahead for 100 meters.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Thank you! Is it far from here on foot?",
                    keyHint = "Ask about walking distance"
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Not at all—it takes about five minutes. It's right across from the big park.",
                    keyHint = "Give walking time + landmark",
                    highlights = listOf(
                        HighlightedPhrase("across from", "On the opposite side of the street", "The bakery is across from the bank.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "That's easy to find. Thanks so much for your help!",
                    keyHint = "Thank them warmly"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: The museum closes in 15 minutes—ask the local for a shortcut!",
                "Plot Twist: It starts raining—recommend a cozy café next door instead!"
            )
        ),
        RoleplayScenario(
            id = "rp_cafe",
            title = "The Busy London Café",
            setting = "Morning rush at a cozy indie coffee shop near Covent Garden.",
            cefrLevel = CefrLevel.B1,
            roleAName = "Customer",
            roleBName = "Friendly Barista",
            goal = "Order a custom drink politely, ask about pastries, and handle a surprise twist.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "B",
                    text = "Morning! What can I get started for you today?",
                    keyHint = "Greet warmly & ask for their order",
                    highlights = listOf(
                        HighlightedPhrase("What can I get started for you", "Friendly café way to say 'What would you like?'", "Hi! What can I get started for you this morning?")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Hi! Could I grab an iced oat latte, and by any chance do you still have almond croissants?",
                    keyHint = "Order drink politely + ask about pastries",
                    highlights = listOf(
                        HighlightedPhrase("Could I grab", "Casual, polite way to order food or drinks", "Could I grab a bottle of sparkling water?"),
                        HighlightedPhrase("by any chance", "Polite softener when asking if something is available", "Do you by any chance have a charger?")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "You're in luck—there's one left! Would you like it warmed up, or are you good as it is?",
                    keyHint = "Confirm last pastry + offer heating",
                    highlights = listOf(
                        HighlightedPhrase("You're in luck", "Means good fortune—just in time!", "You're in luck, the last seat is free.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Warmed up sounds amazing, thanks. Also, is there Wi-Fi here if I hang out for an hour?",
                    keyHint = "Accept heating + ask about Wi-Fi",
                    highlights = listOf(
                        HighlightedPhrase("hang out", "Spend relaxed time in a place", "Let's hang out at the café after class.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "For sure! The password is printed right at the bottom of your receipt. That'll be £6.40 altogether.",
                    keyHint = "Give Wi-Fi info + total price"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Awesome, I'll pay by card. Keep the change on the tip jar—have a lovely day!",
                    keyHint = "Pay & wrap up cheerfully"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: The espresso machine just stopped working—recommend a creative alternative drink!",
                "Plot Twist: Your card was declined! Laugh it off and figure out a polite solution.",
                "Plot Twist: A famous actor walks into the café right behind you—whisper about it naturally!"
            )
        ),
        RoleplayScenario(
            id = "rp_airport",
            title = "Lost Suitcase at Heathrow",
            setting = "Baggage claim desk after an overnight international flight.",
            cefrLevel = CefrLevel.B2,
            roleAName = "Tired Traveler",
            roleBName = "Airline Agent",
            goal = "Describe the missing suitcase clearly, stay calm, and arrange delivery compensation.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "A",
                    text = "Excuse me—I've been waiting at carousel 4 for forty minutes, and it looks like my bag didn't make the connection.",
                    keyHint = "Explain the missing bag & flight connection",
                    highlights = listOf(
                        HighlightedPhrase("didn't make the connection", "Missed transferring onto the second flight", "My suitcase didn't make the connection in Paris.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "I'm really sorry about the hassle! Let me pull up your booking. Could you describe what the suitcase looks like?",
                    keyHint = "Apologize empathetically + ask for details",
                    highlights = listOf(
                        HighlightedPhrase("the hassle", "An annoying inconvenience or trouble", "Sorry for all the hassle today!")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "It's a medium navy hardshell case with a bright yellow luggage tag and a small sticker on the corner.",
                    keyHint = "Describe color, material, and unique marks"
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Got it. Good news—it's safe in Amsterdam and will arrive on the next flight tonight. Where can we drop it off?",
                    keyHint = "Give update + ask for hotel address",
                    highlights = listOf(
                        HighlightedPhrase("drop it off", "Deliver something to a specific place", "We'll drop your bag off at your hotel.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "That's a huge relief! I'm staying near Hyde Park—could you reimburse basic toiletries in the meantime?",
                    keyHint = "Express relief + ask about essentials",
                    highlights = listOf(
                        HighlightedPhrase("in the meantime", "During the waiting period before something happens", "Wait here—in the meantime I'll print your voucher.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Absolutely. Here's a £75 emergency kit voucher, and we'll text you the moment the courier heads out.",
                    keyHint = "Offer voucher & promise updates"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: The traveler has a wedding to attend in 3 hours and their suit is in that bag!",
                "Plot Twist: Someone else took your navy suitcase by mistake—and left theirs behind!",
                "Plot Twist: The airline offers a free business-class upgrade on the return flight if you accept tomorrow's delivery."
            )
        ),
        RoleplayScenario(
            id = "rp_interview",
            title = "The Creative Startup Interview",
            setting = "Video call or sunny office table for a dream team role.",
            cefrLevel = CefrLevel.B2,
            roleAName = "Candidate",
            roleBName = "Hiring Manager",
            goal = "Answer a tricky B2 strength/mistake question naturally using fluent connectors.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "B",
                    text = "Thanks for coming in! To kick things off, tell me about a time you had to figure out a problem under pressure.",
                    keyHint = "Open warmly + ask behavioral question",
                    highlights = listOf(
                        HighlightedPhrase("kick things off", "Start a meeting, event, or conversation", "Let's kick things off with a quick warm-up.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Sure! Last summer our team ran out of time before a client demo, so I stepped up to reorganize our slides.",
                    keyHint = "Set the scene + action you took",
                    highlights = listOf(
                        HighlightedPhrase("stepped up", "Took responsibility when help was needed", "She really stepped up when the leader got sick.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Nice! How did your teammates react when you changed the plan at the last minute?",
                    keyHint = "Probe on teamwork & communication"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "To be honest, they were hesitant at first; however, once we got on the same page, the demo turned out great!",
                    keyHint = "Use honest reflection + B2 connectors"
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Love that honesty. Before we wrap up, do you have any questions for us about the culture here?",
                    keyHint = "Invite candidate questions"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Yes—what skill helps someone really get the hang of this role during their first month?",
                    keyHint = "Ask an insightful closing question"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: The hiring manager asks: 'Explain your favorite hobby as if I'm 8 years old!'",
                "Plot Twist: Your phone alarm starts ringing mid-answer—stay professional and turn it into a joke!",
                "Plot Twist: The interviewer says you got the role, but you start by organizing tomorrow's team lunch!"
            )
        ),
        RoleplayScenario(
            id = "rp_market",
            title = "Bargaining at Camden Market",
            setting = "Colorful weekend vintage jacket & vinyl stall.",
            cefrLevel = CefrLevel.B1,
            roleAName = "Shopper",
            roleBName = "Vintage Seller",
            goal = "Ask about an item, negotiate politely with humor, and agree on a fair bundle price.",
            lines = listOf(
                RoleplayLine(
                    speakerRole = "A",
                    text = "Hey! This denim jacket caught my eye—how much are you asking for it?",
                    keyHint = "Show interest + ask price casually",
                    highlights = listOf(
                        HighlightedPhrase("caught my eye", "Attracted my attention immediately", "That bright poster caught my eye across the street.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Great taste! That's genuine 90s vintage, so I normally let it go for £55.",
                    keyHint = "Hype the item + state price"
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "Oof, £55 is a little steep for my budget! Would you meet me halfway at £40 if I grab these sunglasses too?",
                    keyHint = "Counter-offer politely + bundle",
                    highlights = listOf(
                        HighlightedPhrase("a little steep", "Slightly too expensive", "The ticket price felt a little steep."),
                        HighlightedPhrase("meet me halfway", "Compromise between two prices", "If you ask 50 and I offer 30, meet me halfway at 40!")
                    )
                ),
                RoleplayLine(
                    speakerRole = "B",
                    text = "Tell you what—make it £45 for both and I'll throw in a canvas tote bag. Deal?",
                    keyHint = "Counter with bonus item",
                    highlights = listOf(
                        HighlightedPhrase("throw in", "Include something extra for free", "Buy the guitar and I'll throw in extra strings.")
                    )
                ),
                RoleplayLine(
                    speakerRole = "A",
                    text = "You drive a hard bargain, but that's fair—deal!",
                    keyHint = "Accept playfully with an idiom!"
                )
            ),
            plotTwists = listOf(
                "Plot Twist: Another shopper walks up offering £60—persuade the seller to keep your bundle deal!",
                "Plot Twist: You discover a funny old concert ticket inside the jacket pocket!",
                "Plot Twist: It suddenly starts pouring rain—negotiate an umbrella into the bundle!"
            )
        )
    )
}
