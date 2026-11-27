// Complete CuratedDictionary (38 entries), ArabicWordGlossary (180+ entries + suffix stemming),
// and IndexedDB-backed async TSV loader for 18,600+ EN-AR words

import { WEEKLY_CURRICULUM } from './weekly-curriculum.js';

export const CURATED_DICTIONARY = [
  { id: 'dict_a1_1', english: 'Hello', arabic: 'مرحباً', transliteration: 'Marhaban', phonetic: '/həˈloʊ/', partOfSpeech: 'Greeting', cefrLevel: 'A1', topic: 'Greetings', exampleEn: 'Hello! Nice to meet you.', exampleAr: 'مرحباً! سعيد بلقائك.', levelLabel: 'A1' },
  { id: 'dict_a1_2', english: 'Thank you', arabic: 'شكراً لك', transliteration: 'Shukran lak', phonetic: '/θæŋk juː/', partOfSpeech: 'Phrase', cefrLevel: 'A1', topic: 'Politeness', exampleEn: 'Thank you for helping me today.', exampleAr: 'شكراً لك على مساعدتي اليوم.', levelLabel: 'A1' },
  { id: 'dict_a1_3', english: 'Excuse me', arabic: 'عفواً / لو سمحت', transliteration: 'Afwan / Law samaht', phonetic: '/ɪkˈskjuːz miː/', partOfSpeech: 'Phrase', cefrLevel: 'A1', topic: 'Politeness', exampleEn: 'Excuse me, where is the bus stop?', exampleAr: 'لو سمحت، أين موقف الحافلة؟', levelLabel: 'A1' },
  { id: 'dict_a1_4', english: 'Water', arabic: 'ماء', transliteration: "Maa'", phonetic: '/ˈwɔːtər/', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Food & Drink', exampleEn: 'Could I have a glass of water, please?', exampleAr: 'هل يمكنني الحصول على كوب ماء من فضلك؟', levelLabel: 'A1' },
  { id: 'dict_a1_5', english: 'Friend', arabic: 'صديق', transliteration: 'Sadeeq', phonetic: '/frɛnd/', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'People', exampleEn: 'She is my best friend from school.', exampleAr: 'هي أفضل صديقة لي من المدرسة.', levelLabel: 'A1' },
  { id: 'dict_a1_6', english: 'House', arabic: 'منزل / بيت', transliteration: 'Manzil / Bayt', phonetic: '/haʊs/', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Home', exampleEn: 'Our house is near the park.', exampleAr: 'منزلنا قريب من الحديقة.', levelLabel: 'A1' },
  { id: 'dict_a1_7', english: 'Morning', arabic: 'صباح', transliteration: 'Sabah', phonetic: '/ˈmɔːrnɪŋ/', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Time', exampleEn: 'Good morning! Did you sleep well?', exampleAr: 'صباح الخير! هل نمت جيداً؟', levelLabel: 'A1' },
  { id: 'dict_a1_8', english: 'Happy', arabic: 'سعيد', transliteration: "Sa'eed", phonetic: '/ˈhæpi/', partOfSpeech: 'Adjective', cefrLevel: 'A1', topic: 'Feelings', exampleEn: 'I am very happy to see you!', exampleAr: 'أنا سعيد جداً برؤيتك!', levelLabel: 'A1' },
  { id: 'dict_a1_9', english: 'Understand', arabic: 'يفهم', transliteration: 'Yafham', phonetic: '/ˌʌndərˈstænd/', partOfSpeech: 'Verb', cefrLevel: 'A1', topic: 'Communication', exampleEn: "Sorry, I don't understand this word.", exampleAr: 'آسف، لا أفهم هذه الكلمة.', levelLabel: 'A1' },
  { id: 'dict_a1_10', english: 'How much?', arabic: 'كم السعر؟', transliteration: "Kam al-si'r?", phonetic: '/haʊ mʌtʃ/', partOfSpeech: 'Phrase', cefrLevel: 'A1', topic: 'Shopping', exampleEn: 'How much is this blue notebook?', exampleAr: 'كم سعر هذا الدفتر الأزرق؟', levelLabel: 'A1' },
  { id: 'dict_a1_11', english: 'Train station', arabic: 'محطة القطار', transliteration: 'Mahattat al-qitar', phonetic: '/treɪn ˈsteɪʃən/', partOfSpeech: 'Noun', cefrLevel: 'A1', topic: 'Travel', exampleEn: 'The train station is ten minutes away.', exampleAr: 'محطة القطار تبعد عشر دقائق.', levelLabel: 'A1' },
  { id: 'dict_a1_12', english: 'Today', arabic: 'اليوم', transliteration: 'Al-yawm', phonetic: '/təˈdeɪ/', partOfSpeech: 'Adverb', cefrLevel: 'A1', topic: 'Time', exampleEn: 'What are we studying today?', exampleAr: 'ماذا ندرس اليوم؟', levelLabel: 'A1' },

  { id: 'dict_a2_1', english: 'Appointment', arabic: 'موعد', transliteration: "Maw'id", phonetic: '/əˈpɔɪntmənt/', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Daily Life', exampleEn: 'I have a dentist appointment at 4 PM.', exampleAr: 'لدي موعد عند طبيب الأسنان الساعة الرابعة مساءً.', levelLabel: 'A2' },
  { id: 'dict_a2_2', english: 'Borrow', arabic: 'يستعير', transliteration: "Yasta'eer", phonetic: '/ˈbɒroʊ/', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Everyday Verbs', exampleEn: 'Can I borrow your pen for a minute?', exampleAr: 'هل يمكنني استعارة قلمك لدقيقة؟', levelLabel: 'A2' },
  { id: 'dict_a2_3', english: 'Lend', arabic: 'يُقرض / يُعير', transliteration: "Yuqrid / Yu'eer", phonetic: '/lɛnd/', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Everyday Verbs', exampleEn: "I can lend you my jacket if you're cold.", exampleAr: 'يمكنني أن أعيرك سترتي إذا كنت تشعر بالبرد.', levelLabel: 'A2' },
  { id: 'dict_a2_4', english: 'Delicious', arabic: 'لذيذ', transliteration: 'Ladheedh', phonetic: '/dɪˈlɪʃəs/', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Food & Drink', exampleEn: 'This homemade soup is delicious!', exampleAr: 'هذا الحساء المنزلي لذيذ جداً!', levelLabel: 'A2' },
  { id: 'dict_a2_5', english: 'Crowded', arabic: 'مزدحم', transliteration: 'Muzdahim', phonetic: '/ˈkraʊdɪd/', partOfSpeech: 'Adjective', cefrLevel: 'A2', topic: 'Places', exampleEn: 'The café is usually crowded on Saturday mornings.', exampleAr: 'المقهى يكون مزدحماً عادةً صباح السبت.', levelLabel: 'A2' },
  { id: 'dict_a2_6', english: 'Directions', arabic: 'الاتجاهات', transliteration: 'Al-ittijahat', phonetic: '/dəˈrɛkʃənz/', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Travel', exampleEn: "Let's ask a local for directions.", exampleAr: 'لنسأل أحد السكان عن الاتجاهات.', levelLabel: 'A2' },
  { id: 'dict_a2_7', english: 'Neighbor', arabic: 'جار', transliteration: 'Jaar', phonetic: '/ˈneɪbər/', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'People', exampleEn: 'Our new neighbor baked us cookies.', exampleAr: 'جارنا الجديد خبز لنا البسكويت.', levelLabel: 'A2' },
  { id: 'dict_a2_8', english: 'Receipt', arabic: 'إيصال / فاتورة', transliteration: 'Eesaal / Fatoorah', phonetic: '/rɪˈsiːt/', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Shopping', exampleEn: 'Would you like your receipt in the bag?', exampleAr: 'هل تريد الإيصال داخل الكيس؟', levelLabel: 'A2' },
  { id: 'dict_a2_9', english: 'Weather', arabic: 'الطقس', transliteration: 'Al-taqs', phonetic: '/ˈwɛðər/', partOfSpeech: 'Noun', cefrLevel: 'A2', topic: 'Nature', exampleEn: 'The weather looks sunny and warm today.', exampleAr: 'يبدو الطقس مشمساً ودافئاً اليوم.', levelLabel: 'A2' },
  { id: 'dict_a2_10', english: 'Improve', arabic: 'يتحسن / يطوّر', transliteration: 'Yatahassan / Yutawwir', phonetic: '/ɪmˈpruːv/', partOfSpeech: 'Verb', cefrLevel: 'A2', topic: 'Learning', exampleEn: 'Speaking with friends helps improve your fluency.', exampleAr: 'التحدث مع الأصدقاء يساعد في تحسين طلاقتك.', levelLabel: 'A2' },

  { id: 'dict_b1_1', english: 'Remind', arabic: 'يُذكّر', transliteration: 'Yudhakkir', phonetic: '/rɪˈmaɪnd/', partOfSpeech: 'Verb', cefrLevel: 'B1', topic: 'Everyday Verbs', exampleEn: 'Please remind me to bring the flashcards.', exampleAr: 'من فضلك ذكّرني بإحضار البطاقات التعليمية.', levelLabel: 'B1' },
  { id: 'dict_b1_2', english: 'Look forward to', arabic: 'يتطلع بشوق إلى', transliteration: "Yatatalla' bi-shawq ila", phonetic: '/lʊk ˈfɔːrwərd tuː/', partOfSpeech: 'Phrasal Verb', cefrLevel: 'B1', topic: 'Phrasal Verbs', exampleEn: "I'm looking forward to our quiz night!", exampleAr: 'أتطلع بشوق إلى ليلة المسابقات!', levelLabel: 'B1' },
  { id: 'dict_b1_3', english: 'Put off', arabic: 'يؤجّل', transliteration: "Yu'ajjil", phonetic: '/pʊt ɔːf/', partOfSpeech: 'Phrasal Verb', cefrLevel: 'B1', topic: 'Phrasal Verbs', exampleEn: "Don't put off studying until midnight.", exampleAr: 'لا تؤجل الدراسة حتى منتصف الليل.', levelLabel: 'B1' },
  { id: 'dict_b1_4', english: 'Sensible', arabic: 'عاقل / منطقي', transliteration: 'Aaqil / Mantiqi', phonetic: '/ˈsɛnsəbəl/', partOfSpeech: 'Adjective', cefrLevel: 'B1', topic: 'Personality', exampleEn: 'Taking an umbrella was a sensible decision.', exampleAr: 'أخذ مظلة كان قراراً منطقياً.', levelLabel: 'B1' },
  { id: 'dict_b1_5', english: 'Run out of', arabic: 'ينفد من', transliteration: 'Yanfad min', phonetic: '/rʌn aʊt ʌv/', partOfSpeech: 'Phrasal Verb', cefrLevel: 'B1', topic: 'Phrasal Verbs', exampleEn: 'We ran out of coffee beans this morning.', exampleAr: 'نفدت لدينا حبوب القهوة هذا الصباح.', levelLabel: 'B1' },
  { id: 'dict_b1_6', english: 'By the way', arabic: 'بالمناسبة', transliteration: 'Bil-munasabah', phonetic: '/baɪ ðə weɪ/', partOfSpeech: 'Phrase', cefrLevel: 'B1', topic: 'Conversation', exampleEn: 'By the way, did you finish the puzzle?', exampleAr: 'بالمناسبة، هل أنهيت اللغز؟', levelLabel: 'B1' },
  { id: 'dict_b1_7', english: 'Confidence', arabic: 'الثقة بالنفس', transliteration: 'Al-thiqah bil-nafs', phonetic: '/ˈkɒnfɪdəns/', partOfSpeech: 'Noun', cefrLevel: 'B1', topic: 'Mindset', exampleEn: 'Roleplay games build speaking confidence.', exampleAr: 'ألعاب تقمص الأدوار تبني الثقة في التحدث.', levelLabel: 'B1' },
  { id: 'dict_b1_8', english: 'Bargain', arabic: 'صفقة رابحة / يساوم', transliteration: 'Safqah / Yusawim', phonetic: '/ˈbɑːrɡɪn/', partOfSpeech: 'Noun / Verb', cefrLevel: 'B1', topic: 'Shopping', exampleEn: 'Finding this jacket for £20 was a real bargain!', exampleAr: 'العثور على هذه السترة بـ ٢٠ جنيهاً كان صفقة رائعة!', levelLabel: 'B1' },

  { id: 'dict_b2_1', english: 'Break the ice', arabic: 'يكسر الجليد / يبدأ الحديث بود', transliteration: 'Yaksir al-jaleed', phonetic: '/breɪk ði aɪs/', partOfSpeech: 'Idiom', cefrLevel: 'B2', topic: 'Idioms', exampleEn: 'A quick guessing game helped break the ice.', exampleAr: 'ساعدت لعبة تخمين سريعة في كسر الجليد بيننا.', levelLabel: 'B2' },
  { id: 'dict_b2_2', english: 'Procrastinate', arabic: 'يماطل / يسوّف', transliteration: 'Yumaatil / Yusawwif', phonetic: '/prəˈkræstɪneɪt/', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Habits', exampleEn: 'I always procrastinate before writing long essays.', exampleAr: 'دائماً ما أسوّف قبل كتابة المقالات الطويلة.', levelLabel: 'B2' },
  { id: 'dict_b2_3', english: 'Get the hang of', arabic: 'يتقن / يعتاد على', transliteration: "Yutqin / Ya'tad ala", phonetic: '/ɡɛt ðə hæŋ ʌv/', partOfSpeech: 'Idiom', cefrLevel: 'B2', topic: 'Idioms', exampleEn: "You'll get the hang of phrasal verbs soon!", exampleAr: 'ستتقن الأفعال المركبة قريباً!', levelLabel: 'B2' },
  { id: 'dict_b2_4', english: 'Overwhelmed', arabic: 'مُثقَل / غارق في المهام', transliteration: 'Muthqal / Ghaariq', phonetic: '/ˌoʊvərˈwɛlmd/', partOfSpeech: 'Adjective', cefrLevel: 'B2', topic: 'Feelings', exampleEn: "Don't feel overwhelmed—learn five words a day.", exampleAr: 'لا تشعر بالإرهاق—تعلّم خمس كلمات فقط يومياً.', levelLabel: 'B2' },
  { id: 'dict_b2_5', english: 'Out of the blue', arabic: 'فجأة وبشكل غير متوقع', transliteration: "Faj'atan", phonetic: '/aʊt ʌv ðə bluː/', partOfSpeech: 'Idiom', cefrLevel: 'B2', topic: 'Idioms', exampleEn: 'My cousin called me out of the blue yesterday.', exampleAr: 'اتصل بي ابن عمي فجأة ودون سابق إنذار أمس.', levelLabel: 'B2' },
  { id: 'dict_b2_6', english: 'Negotiate', arabic: 'يتفاوض', transliteration: 'Yatafawad', phonetic: '/nɪˈɡoʊʃieɪt/', partOfSpeech: 'Verb', cefrLevel: 'B2', topic: 'Communication', exampleEn: "Let's negotiate a fair price at the market.", exampleAr: 'لنتفاوض على سعر عادل في السوق.', levelLabel: 'B2' },
  { id: 'dict_b2_7', english: 'Coincidence', arabic: 'مصادفة', transliteration: 'Musadafah', phonetic: '/koʊˈɪnsɪdəns/', partOfSpeech: 'Noun', cefrLevel: 'B2', topic: 'Events', exampleEn: 'Meeting on the same train was a crazy coincidence!', exampleAr: 'لقاؤنا في نفس القطار كان مصادفة عجيبة!', levelLabel: 'B2' },
  { id: 'dict_b2_8', english: 'On the same page', arabic: 'متفقون في الفهم والرأي', transliteration: "Muttafiqoon fil-ra'y", phonetic: '/ɒn ðə seɪm peɪdʒ/', partOfSpeech: 'Idiom', cefrLevel: 'B2', topic: 'Teamwork', exampleEn: "Let's check the rules so everyone is on the same page.", exampleAr: 'لنراجع القواعد حتى يكون الجميع متفقين على نفس الفهم.', levelLabel: 'B2' }
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'of', 'and', 'or', 'for', 'it', 'its', 'he', 'she',
  'we', 'you', 'they', 'them', 'i', 'my', 'your', 'his', 'her', 'our', 'their',
  'this', 'that', 'these', 'those', 'with', 'from', 'by', 'as', 'if', 'so',
  'but', 'not', 'no', 'yes', 'do', 'does', 'did', 'has', 'have', 'had',
  'can', 'could', 'will', 'would', 'may', 'might', 'must', 'shall', 'should',
  'up', 'down', 'out', 'off', 'over', 'under', 'into', 'onto', 'about',
  'than', 'then', 'there', 'here', 'when', 'where', 'who', 'what', 'which',
  'why', 'how', 'all', 'any', 'some', 'one', 'two', 'three', 'very', 'just',
  'more', 'most', 'also', 'only', 'back', 'still', 'even', 'now', 'well'
]);

const EXTRA_VOCABULARY = [
  ['manuscript', 'مخطوطة', '/ˈmænjʊskrɪpt/', 'Noun', 'Handwritten historic book or document'],
  ['alibi', 'عذر غياب / ذريعة', '/ˈælɪbaɪ/', 'Noun', 'Proof a suspect was elsewhere during a crime'],
  ['archivist', 'أمين محفوظات', '/ˈɑːrkɪvɪst/', 'Noun', 'Person who manages historical records'],
  ['curator', 'أمين متحف', '/kjʊəˈreɪtər/', 'Noun', 'Keeper or custodian of a museum collection'],
  ['suspect', 'مشتبه به', '/ˈsʌspekt/', 'Noun', 'Person thought to be guilty of a crime'],
  ['detective', 'محقق', '/dɪˈtektɪv/', 'Noun', 'Investigator who solves crimes'],
  ['evidence', 'دليل جنائي', '/ˈevɪdəns/', 'Noun', 'Facts or objects proving who did a crime'],
  ['clue', 'خيط / دليل', '/kluː/', 'Noun', 'Hint helping solve a mystery'],
  ['culprit', 'الجاني / المذنب', '/ˈkʌlprɪt/', 'Noun', 'Person responsible for a crime'],
  ['motive', 'دافع الجريمة', '/ˈmoʊtɪv/', 'Noun', 'Reason for committing an act'],
  ['poison', 'سم', '/ˈpɔɪzən/', 'Noun', 'Deadly toxic substance'],
  ['cyanide', 'سيانيد (سم سريع)', '/ˈsaɪənaɪd/', 'Noun', 'Highly lethal fast-acting poison'],
  ['theft', 'سرقة', '/θeft/', 'Noun', 'Act of stealing property'],
  ['thief', 'لص', '/θiːf/', 'Noun', 'Person who steals'],
  ['burglary', 'سطو / اقتحام', '/ˈbɜːrɡləri/', 'Noun', 'Breaking into a building to steal'],
  ['robbery', 'سرقة بالإكراه', '/ˈrɒbəri/', 'Noun', 'Taking property unlawfully by force'],
  ['heist', 'عملية سطو كبرى', '/haɪst/', 'Noun', 'Carefully planned major theft'],
  ['murder', 'جريمة قتل', '/ˈmɜːrdər/', 'Noun', 'Unlawful premeditated killing'],
  ['forgery', 'تزوير / تزييف', '/ˈfɔːrdʒəri/', 'Noun', 'Fake copy made to deceive'],
  ['forged', 'مزوّر', '/fɔːrdʒd/', 'Adjective', 'Falsely copied or faked'],
  ['counterfeit', 'مزيف / مقلّد', '/ˈkaʊntərfɪt/', 'Adjective', 'Made in exact imitation to defraud'],
  ['embezzlement', 'اختلاس مالي', '/ɪmˈbezəlmənt/', 'Noun', "Theft of money entrusted to one's care"],
  ['larceny', 'سرقة كبرى', '/ˈlɑːrsəni/', 'Noun', 'Theft of personal property'],
  ['infiltration', 'تسلل', '/ˌɪnfɪlˈtreɪʃən/', 'Noun', 'Secretly entering a restricted place'],
  ['disguised', 'متنكر / مموّه', '/dɪsˈɡaɪzd/', 'Adjective', 'Hidden by changing appearance'],
  ['unauthorized', 'غير مصرّح به', '/ʌnˈɔːθəraɪzd/', 'Adjective', 'Without official permission'],
  ['witness', 'شاهد', '/ˈwɪtnəs/', 'Noun', 'Person who saw an event happen'],
  ['fingerprint', 'بصمة إصبع', '/ˈfɪŋɡərprɪnt/', 'Noun', 'Unique pattern left by a finger'],
  ['footprint', 'أثر قدم', '/ˈfʊtprɪnt/', 'Noun', 'Mark left by a foot or shoe'],
  ['vault', 'خزينة محصنة', '/vɔːlt/', 'Noun', 'Secure armored room for valuables'],
  ['diamond', 'ألماس', '/ˈdaɪəmənd/', 'Noun', 'Precious transparent gemstone'],
  ['necklace', 'عقد / قلادة', '/ˈnekləs/', 'Noun', 'Jewelry worn around the neck'],
  ['goblet', 'كأس معدني / عتيق', '/ˈɡɒblət/', 'Noun', 'Drinking cup with a stem and base'],
  ['custodian', 'حارس / مشرف مبنى', '/kʌˈstoʊdiən/', 'Noun', 'Person responsible for looking after a building'],
  ['butler', 'رئيس الخدم', '/ˈbʌtlər/', 'Noun', 'Chief household servant'],
  ['physician', 'طبيب', '/fɪˈzɪʃən/', 'Noun', 'Medical doctor'],
  ['nephew', 'ابن الأخ / ابن الأخت', '/ˈnefjuː/', 'Noun', "Son of one's brother or sister"],
  ['estranged', 'منفصل / متباعد', '/ɪˈstreɪndʒd/', 'Adjective', 'No longer close or affectionate'],
  ['toxicologist', 'عالم سموم', '/ˌtɒksɪˈkɒlədʒɪst/', 'Noun', 'Scientist who studies poisons'],
  ['aconite', 'نبات خانق الذئب السام', '/ˈækənaɪt/', 'Noun', 'Poisonous plant extract'],
  ['villain', 'شرير / مجرم', '/ˈvɪlən/', 'Noun', 'Main evil character'],
  ['mastermind', 'العقل المدبّر', '/ˈmæstərmaɪnd/', 'Noun', 'Person who plans a complex scheme'],
  ['conspiracy', 'مؤامرة', '/kənˈspɪrəsi/', 'Noun', 'Secret plan by a group'],
  ['interrogation', 'استجواب', '/ɪnˌterəˈɡeɪʃən/', 'Noun', 'Formal questioning of a suspect'],
  ['accuse', 'يتهم', '/əˈkjuːz/', 'Verb', 'Claim someone did something wrong'],
  ['verdict', 'حكم / قرار نهائي', '/ˈvɜːrdɪkt/', 'Noun', 'Final decision in a case'],
  ['guilty', 'مذنب', '/ˈɡɪlti/', 'Adjective', 'Responsible for a wrongdoing'],
  ['innocent', 'بريء', '/ˈɪnəsənt/', 'Adjective', 'Not guilty of a crime'],
  ['showcase', 'خزانة عرض زجاجية', '/ˈʃoʊkeɪs/', 'Noun', 'Glass case displaying valuable items'],
  ['vanished', 'اختفى', '/ˈvænɪʃt/', 'Verb', 'Disappeared suddenly'],
  ['priceless', 'لا يُقدّر بثمن', '/ˈpraɪsləs/', 'Adjective', 'Too valuable to have a price'],
  ['magnifying', 'مكبّر', '/ˈmæɡnɪfaɪɪŋ/', 'Adjective', 'Making small objects appear larger'],
  ['wire', 'سلك', '/waɪər/', 'Noun', 'Thin flexible metal thread'],
  ['cutters', 'قاطعة أسلاك', '/ˈkʌtərz/', 'Noun', 'Tool used to cut metal or wires'],
  ['pigment', 'صبغة لونية', '/ˈpɪɡmənt/', 'Noun', 'Coloring matter in paint'],
  ['residue', 'بقايا / أثر', '/ˈrezɪduː/', 'Noun', 'Small amount left behind'],
  ['thermal', 'حراري', '/ˈθɜːrməl/', 'Adjective', 'Relating to heat'],
  ['bullion', 'سبائك ذهب أو فضة', '/ˈbʊliən/', 'Noun', 'Gold or silver in bulk bars'],
  ['subterranean', 'تحت الأرض', '/ˌsʌbtəˈreɪniən/', 'Adjective', "Existing beneath the earth's surface"],
  ['acoustic', 'صوتي', '/əˈkuːstɪk/', 'Adjective', 'Relating to sound waves'],
  ['alarm', 'جهاز إنذار', '/əˈlɑːrm/', 'Noun', 'Warning signal device'],
  ['parapet', 'حاجز السطح', '/ˈpærəpɪt/', 'Noun', 'Low protective wall along a roof edge'],
  ['canister', 'عبوة أسطوانية', '/ˈkænɪstər/', 'Noun', 'Metal or plastic cylinder container'],
  ['encrypted', 'مشفّر', '/ɪnˈkrɪptɪd/', 'Adjective', 'Encoded to prevent unauthorized reading'],
  ['watermark', 'علامة مائية', '/ˈwɔːtərmɑːrk/', 'Noun', 'Security design embedded in paper'],
  ['severed', 'مقطوع', '/ˈsevərd/', 'Adjective', 'Cut cleanly apart'],
  ['lethal', 'قاتل / مميت', '/ˈliːθəl/', 'Adjective', 'Sufficient to cause death'],
  ['gambling', 'قمار / مقامرة', '/ˈɡæmblɪŋ/', 'Noun', 'Betting money on uncertain outcomes'],
  ['debts', 'ديون', '/dets/', 'Noun', 'Money owed to others'],
  ['pocket', 'جيب', '/ˈpɒkɪt/', 'Noun', 'Small pouch sewn into clothing'],
  ['boots', 'حذاء طويل', '/buːts/', 'Noun', 'Sturdy footwear covering the ankle'],
  ['mud', 'طين / وحل', '/mʌd/', 'Noun', 'Wet soft earth'],
  ['thunderstorm', 'عاصفة رعدية', '/ˈθʌndərstɔːrm/', 'Noun', 'Storm with lightning and thunder'],
  ['midnight', 'منتصف الليل', '/ˈmɪdnaɪt/', 'Noun', "Twelve o'clock at night"],
  ['express', 'قطار سريع / عاجل', '/ɪkˈspres/', 'Adjective', 'Fast and direct transport'],
  ['carriage', 'عربة قطار', '/ˈkærɪdʒ/', 'Noun', 'Passenger section of a train'],
  ['dining', 'تناول الطعام', '/ˈdaɪnɪŋ/', 'Noun', 'Eating a meal'],
  ['luggage', 'أمتعة السفر', '/ˈlʌɡɪdʒ/', 'Noun', 'Suitcases and bags for travel'],
  ['conductor', 'محصّل التذاكر / قائد القطار', '/kənˈdʌktər/', 'Noun', 'Person managing passengers on a train'],
  ['museum', 'متحف', '/mjuːˈziːəm/', 'Noun', 'Building displaying art or history'],
  ['gallery', 'معرض فني', '/ˈɡæləri/', 'Noun', 'Room or building for art exhibitions'],
  ['painting', 'لوحة فنية', '/ˈpeɪntɪŋ/', 'Noun', 'Picture made with paint'],
  ['gala', 'حفل احتفالي فاخر', '/ˈɡɑːlə/', 'Noun', 'Special festive celebration'],
  ['velvet', 'مخمل', '/ˈvelvɪt/', 'Noun', 'Soft woven fabric'],
  ['handbag', 'حقيبة يد', '/ˈhændbæɡ/', 'Noun', 'Small bag carried by hand'],
  ['gloves', 'قفازات', '/ɡlʌvz/', 'Noun', 'Coverings for the hands'],
  ['flashlight', 'مصباح يدوي', '/ˈflæʃlaɪt/', 'Noun', 'Portable battery-powered lamp'],
  ['corridor', 'ممر', '/ˈkɒrɪdɔːr/', 'Noun', 'Long hallway in a building'],
  ['locked', 'مغلق بالمفتاح', '/lɒkt/', 'Adjective', 'Fastened securely with a lock'],
  ['shadow', 'ظل', '/ˈʃædoʊ/', 'Noun', 'Dark shape blocked from light'],
  ['secret', 'سر / سري', '/ˈsiːkrət/', 'Noun', 'Something kept hidden'],
  ['whisper', 'همس', '/ˈwɪspər/', 'Verb', 'Speak very softly'],
  ['stranger', 'شخص غريب', '/ˈstreɪndʒər/', 'Noun', 'Someone you do not know'],
  ['harbor', 'ميناء', '/ˈhɑːrbər/', 'Noun', 'Sheltered port for ships'],
  ['lantern', 'فانوس', '/ˈlæntərn/', 'Noun', 'Portable lamp with protective glass'],
  ['treasure', 'كنز', '/ˈtreʒər/', 'Noun', 'Hidden valuable wealth'],
  ['adventure', 'مغامرة', '/ədˈventʃər/', 'Noun', 'Exciting and daring experience'],
  ['journey', 'رحلة', '/ˈdʒɜːrni/', 'Noun', 'Act of traveling from one place to another'],
  ['discovery', 'اكتشاف', '/dɪˈskʌvəri/', 'Noun', 'Finding something for the first time'],
  ['courage', 'شجاعة', '/ˈkɜːrɪdʒ/', 'Noun', 'Bravery in facing difficulty'],
  ['promise', 'وعد', '/ˈprɒmɪs/', 'Noun', 'Commitment to do something'],
  ['trust', 'ثقة', '/trʌst/', 'Noun', 'Firm belief in honesty'],
  ['bridge', 'جسر', '/brɪdʒ/', 'Noun', 'Structure crossing over water or road'],
  ['ticket', 'تذكرة', '/ˈtɪkɪt/', 'Noun', 'Pass allowing entry or travel'],
  ['passport', 'جواز سفر', '/ˈpæspɔːrt/', 'Noun', 'Official travel identity booklet'],
  ['airport', 'مطار', '/ˈeərpɔːrt/', 'Noun', 'Place where airplanes take off and land'],
  ['boarding', 'صعود الطائرة', '/ˈbɔːrdɪŋ/', 'Noun', 'Getting onto an airplane or ship'],
  ['reservation', 'حجز مسبق', '/ˌrezərˈveɪʃən/', 'Noun', 'Arrangement to keep a seat or room'],
  ['order', 'طلب / يطلب', '/ˈɔːrdər/', 'Verb', 'Request food or items'],
  ['menu', 'قائمة الطعام', '/ˈmenjuː/', 'Noun', 'List of dishes available'],
  ['receipt', 'إيصال / فاتورة', '/rɪˈsiːt/', 'Noun', 'Written proof of payment'],
  ['customer', 'زبون / عميل', '/ˈkʌstəmər/', 'Noun', 'Person buying goods or services'],
  ['manager', 'مدير', '/ˈmænɪdʒər/', 'Noun', 'Person in charge of staff or business'],
  ['schedule', 'جدول مواعيد', '/ˈskedʒuːl/', 'Noun', 'Plan of times and events'],
  ['interview', 'مقابلة', '/ˈɪntərvjuː/', 'Noun', 'Formal meeting to evaluate someone'],
  ['confident', 'واثق من نفسه', '/ˈkɒnfɪdənt/', 'Adjective', "Sure of one's abilities"],
  ['polite', 'مهذب', '/pəˈlaɪt/', 'Adjective', 'Showing good manners'],
  ['helpful', 'متعاون / مفيد', '/ˈhelpfəl/', 'Adjective', 'Ready to give assistance'],
  ['explain', 'يشرح', '/ɪkˈspleɪn/', 'Verb', 'Make something clear in detail'],
  ['describe', 'يصف', '/dɪˈskraɪb/', 'Verb', 'Give an account in words'],
  ['compare', 'يقارن', '/kəmˈpeər/', 'Verb', 'Note similarities and differences'],
  ['solution', 'حل', '/səˈluːʃən/', 'Noun', 'Answer to a problem'],
  ['mistake', 'خطأ', '/mɪˈsteɪk/', 'Noun', 'Unintentional error'],
  ['challenge', 'تحدٍ', '/ˈtʃælɪndʒ/', 'Noun', 'Task that tests ability'],
  ['victory', 'انتصار / فوز', '/ˈvɪktəri/', 'Noun', 'Winning a game or contest'],
  ['practice', 'ممارسة / تدريب', '/ˈpræktɪs/', 'Noun', 'Repeated exercise to improve skill'],
  ['pronounce', 'ينطق', '/prəˈnaʊns/', 'Verb', 'Say a word aloud clearly'],
  ['vocabulary', 'مفردات لغوية', '/vəˈkæbjʊleri/', 'Noun', 'Set of words used in a language'],
  ['sentence', 'جملة', '/ˈsentəns/', 'Noun', 'Complete thought expressed in words'],
  ['idiom', 'تعبير اصطلاحي', '/ˈɪdiəm/', 'Noun', 'Phrase with figurative meaning'],
  ['fluency', 'طلاقة لغوية', '/ˈfluːənsi/', 'Noun', 'Ability to speak smoothly and accurately'],
  ['reflection', 'تأمّل / مراجعة', '/rɪˈflekʃən/', 'Noun', 'Serious thought or consideration'],
  ['narrative', 'سرد قصصي', '/ˈnærətɪv/', 'Noun', 'Spoken or written connected story'],
  ['twist', 'تطور مفاجئ', '/twɪst/', 'Noun', 'Unexpected turn in a story'],
  ['collocation', 'تلازم لفظي', '/ˌkɒləˈkeɪʃən/', 'Noun', 'Words that naturally go together'],
  ['negotiate', 'يتفاوض', '/nɪˈɡoʊʃieɪt/', 'Verb', 'Discuss terms to reach agreement'],
  ['recommend', 'يوصي بـ / يقترح', '/ˌrekəˈmend/', 'Verb', 'Suggest something as good'],
  ['urgent', 'عاجل / طارئ', '/ˈɜːrdʒənt/', 'Adjective', 'Requiring immediate action'],
  ['confirm', 'يؤكّد', '/kənˈfɜːrm/', 'Verb', 'Verify that something is true or set'],
  ['apologize', 'يعتذر', '/əˈpɒlədʒaɪz/', 'Verb', 'Express regret for a mistake'],
  ['arrive', 'يصل', '/əˈraɪv/', 'Verb', 'Reach a destination'],
  ['depart', 'يغادر', '/dɪˈpɑːrt/', 'Verb', 'Leave to begin a journey'],
  ['explore', 'يستكشف', '/ɪkˈsplɔːr/', 'Verb', 'Travel through to learn about'],
  ['listen', 'يستمع', '/ˈlɪsən/', 'Verb', 'Pay attention to sound'],
  ['remember', 'يتذكر', '/rɪˈmembər/', 'Verb', 'Bring back to mind'],
  ['forget', 'ينسى', '/fərˈɡet/', 'Verb', 'Fail to remember'],
  ['believe', 'يؤمن / يصدّق', '/bɪˈliːv/', 'Verb', 'Accept as true'],
  ['notice', 'يلاحظ', '/ˈnoʊtɪs/', 'Verb', 'Become aware of'],
  ['protect', 'يحمي', '/prəˈtekt/', 'Verb', 'Keep safe from harm'],
  ['escape', 'يهرب', '/ɪˈskeɪp/', 'Verb', 'Break free from confinement'],
  ['capture', 'يقبض على / يأسر', '/ˈkæptʃər/', 'Verb', 'Catch a person or suspect'],
  ['solve', 'يحلّ', '/sɒlv/', 'Verb', 'Find an answer or explanation'],
  ['search', 'يبحث', '/sɜːrtʃ/', 'Verb', 'Look carefully to find something'],
  ['verify', 'يتحقّق من', '/ˈverɪfaɪ/', 'Verb', 'Check that information is accurate'],
  ['investigate', 'يحقق في', '/ɪnˈvestɪɡeɪt/', 'Verb', 'Carry out a systematic inquiry'],
  ['concealed', 'مخفي / مستور', '/kənˈsiːld/', 'Adjective', 'Kept out of sight'],
  ['discarded', 'مرمي / مهمل', '/dɪsˈkɑːrdɪd/', 'Adjective', 'Thrown away as no longer useful'],
  ['subdued', 'خافت / هادئ', '/səbˈdjuːd/', 'Adjective', 'Quiet and under control'],
  ['valuable', 'قيّم / ثمين', '/ˈvæljuəbl/', 'Adjective', 'Worth a great deal of money'],
  ['dangerous', 'خطير', '/ˈdeɪndʒərəs/', 'Adjective', 'Likely to cause harm'],
  ['calm', 'هادئ', '/kɑːm/', 'Adjective', 'Peaceful and free from agitation'],
  ['nervous', 'متوتر', '/ˈnɜːrvəs/', 'Adjective', 'Anxious or uneasy'],
  ['curious', 'فضولي', '/ˈkjʊəriəs/', 'Adjective', 'Eager to know or learn'],
  ['clever', 'ذكي / بارع', '/ˈklevər/', 'Adjective', 'Quick to understand and devise'],
  ['sudden', 'مفاجئ', '/ˈsʌdən/', 'Adjective', 'Happening quickly without warning'],
  ['recent', 'حديث', '/ˈriːsənt/', 'Adjective', 'Having happened not long ago'],
  ['ancient', 'قديم جداً / أثري', '/ˈeɪnʃənt/', 'Adjective', 'Belonging to the distant past'],
  ['famous', 'مشهور', '/ˈfeɪməs/', 'Adjective', 'Known about by many people'],
  ['quietly', 'بهدوء', '/ˈkwaɪətli/', 'Adverb', 'With little or no noise'],
  ['carefully', 'بحذر / بعناية', '/ˈkeərfəli/', 'Adverb', 'In a way that avoids mistakes'],
  ['suddenly', 'فجأة', '/ˈsʌdənli/', 'Adverb', 'Quickly and unexpectedly'],
  ['finally', 'أخيراً', '/ˈfaɪnəli/', 'Adverb', 'After a long time or sequence'],
  ['alone', 'بمفرده / وحيداً', '/əˈloʊn/', 'Adverb', 'Without anyone else present'],
  ['instead', 'بدلاً من ذلك', '/ɪnˈsted/', 'Adverb', 'As an alternative or substitute'],
  ['against', 'ضد', '/əˈɡenst/', 'Preposition', 'In opposition to'],
  ['through', 'عبر / من خلال', '/θruː/', 'Preposition', 'Moving in one side and out the other'],
  ['between', 'بين', '/bɪˈtwiːn/', 'Preposition', 'In the space separating two things'],
  ['behind', 'خلف / وراء', '/bɪˈhaɪnd/', 'Preposition', 'At the back of'],
  ['outside', 'بالخارج', '/ˌaʊtˈsaɪd/', 'Preposition', 'On the exterior of'],
  ['inside', 'بالداخل', '/ˌɪnˈsaɪd/', 'Preposition', 'Within the inner part']
].map(([word, arabic, phonetic, partOfSpeech, meaning]) => ({
  word,
  arabic,
  phonetic,
  partOfSpeech,
  meaning,
  exampleAr: ''
}));

let glossaryIndex = null;
let fullDictionaryCache = null;

function buildGlossaryIndex() {
  if (glossaryIndex) return glossaryIndex;
  const map = new Map();
  const putIfAbsent = (key, match) => {
    const norm = String(key || '').trim().toLowerCase();
    if (norm.length >= 3 && !STOP_WORDS.has(norm) && !map.has(norm)) {
      map.set(norm, match);
    }
  };

  for (const item of EXTRA_VOCABULARY) {
    putIfAbsent(item.word, item);
  }
  for (const week of WEEKLY_CURRICULUM) {
    for (const w of week.words) {
      putIfAbsent(w.word, {
        word: w.word,
        arabic: w.arabic,
        phonetic: '',
        partOfSpeech: w.domain,
        meaning: w.meaning,
        exampleAr: ''
      });
    }
  }
  for (const entry of CURATED_DICTIONARY) {
    const match = {
      word: entry.english,
      arabic: entry.arabic,
      phonetic: entry.phonetic,
      partOfSpeech: entry.partOfSpeech,
      meaning: entry.exampleEn,
      exampleAr: entry.exampleAr
    };
    const clean = entry.english.trim().toLowerCase();
    putIfAbsent(clean, match);
    if (clean.includes(' ')) {
      const first = clean.split(' ')[0];
      if (first.length >= 4 && !STOP_WORDS.has(first)) {
        putIfAbsent(first, match);
      }
    }
  }
  // If full dictionary is loaded, also enrich lookup with TSV entries lazily
  if (fullDictionaryCache) {
    for (const entry of fullDictionaryCache) {
      if (!entry.english.includes(' ')) {
        putIfAbsent(entry.english, {
          word: entry.english,
          arabic: entry.arabic,
          phonetic: entry.phonetic,
          partOfSpeech: entry.partOfSpeech,
          meaning: `${entry.topic} (${entry.levelLabel || entry.cefrLevel})`,
          exampleAr: ''
        });
      }
    }
  }
  glossaryIndex = map;
  return map;
}

export function lookupGlossaryWord(rawToken) {
  const cleaned = String(rawToken || '')
    .trim()
    .toLowerCase()
    .replace(/(?:'s|’s)$/i, '')
    .replace(/^[^a-z]+|[^a-z]+$/g, '');
  if (cleaned.length < 3 || STOP_WORDS.has(cleaned)) return null;

  const idx = buildGlossaryIndex();
  if (idx.has(cleaned)) return idx.get(cleaned);

  const candidates = [];
  if (cleaned.endsWith('ies') && cleaned.length > 4) candidates.push(cleaned.slice(0, -3) + 'y');
  if (cleaned.endsWith('ied') && cleaned.length > 4) candidates.push(cleaned.slice(0, -3) + 'y');
  if (cleaned.endsWith('es') && cleaned.length > 4) candidates.push(cleaned.slice(0, -2));
  if (cleaned.endsWith('s') && cleaned.length > 3) candidates.push(cleaned.slice(0, -1));
  if (cleaned.endsWith('ed') && cleaned.length > 4) {
    candidates.push(cleaned.slice(0, -2));
    candidates.push(cleaned.slice(0, -1));
  }
  if (cleaned.endsWith('ing') && cleaned.length > 5) {
    candidates.push(cleaned.slice(0, -3));
    candidates.push(cleaned.slice(0, -3) + 'e');
  }
  if (cleaned.endsWith('ly') && cleaned.length > 4) candidates.push(cleaned.slice(0, -2));
  if (cleaned.endsWith('er') && cleaned.length > 4) {
    candidates.push(cleaned.slice(0, -2));
    candidates.push(cleaned.slice(0, -1));
  }

  for (const cand of candidates) {
    if (idx.has(cand)) {
      const base = idx.get(cand);
      return {
        ...base,
        word: cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      };
    }
  }
  return null;
}

function formatCategoryLabel(raw) {
  const primary = String(raw || '').split('/')[0].trim().toLowerCase();
  switch (primary) {
    case 'daily-life':
    case 'general':
      return 'Daily Life';
    case 'academic':
      return 'Academic';
    case 'science':
    case 'scientific':
    case 'chemical':
    case 'chemistry':
      return 'Science';
    case 'technology':
    case 'tech':
    case 'technical':
      return 'Technology';
    case 'medical':
    case 'psychology':
      return 'Medical';
    case 'business':
      return 'Business';
    case 'legal':
      return 'Legal';
    case 'art':
    case 'music':
      return 'Arts';
    case 'agriculture':
      return 'Nature';
    case 'military':
    case 'political':
    case 'religious':
      return 'Society';
    default:
      return 'General';
  }
}

function parseTsvText(tsv) {
  const existingKeys = new Set(CURATED_DICTIONARY.map((e) => e.english.trim().toLowerCase()));
  const imported = [];
  const lines = tsv.split(/\r?\n/);
  let idx = 0;
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const rawLevel = parts[0].trim().toUpperCase();
    const rawCategory = parts[1].trim();
    const word = parts[2].trim();
    const arabic = parts[3].trim();
    const ipa = (parts[4] || '').trim();
    if (!word || !arabic) continue;
    const key = word.toLowerCase();
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);

    const mappedCefr = rawLevel === 'A1' || rawLevel === 'A2' || rawLevel === 'B1' ? rawLevel : 'B2';
    const label = formatCategoryLabel(rawCategory);
    imported.push({
      id: `pdf_${rawLevel.toLowerCase()}_${idx}`,
      english: word,
      arabic,
      transliteration: '',
      phonetic: ipa,
      partOfSpeech: label,
      cefrLevel: mappedCefr,
      topic: label,
      exampleEn: '',
      exampleAr: '',
      levelLabel: rawLevel
    });
    idx++;
  }
  return [...CURATED_DICTIONARY, ...imported];
}

// IndexedDB helper for caching parsed TSV dictionary on repeat loads
function openDictDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open('lingoclub_dict_db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('tsv_cache')) {
        db.createObjectStore('tsv_cache');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readTsvFromIdb() {
  try {
    const db = await openDictDb();
    return await new Promise((resolve) => {
      const tx = db.transaction('tsv_cache', 'readonly');
      const req = tx.objectStore('tsv_cache').get('tsv_v1');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function writeTsvToIdb(text) {
  try {
    const db = await openDictDb();
    await new Promise((resolve) => {
      const tx = db.transaction('tsv_cache', 'readwrite');
      tx.objectStore('tsv_cache').put(text, 'tsv_v1');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore IDB quota/privacy mode errors
  }
}

let loadingPromise = null;

export async function loadFullDictionary() {
  if (fullDictionaryCache) return fullDictionaryCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      let tsvText = await readTsvFromIdb();
      if (!tsvText && typeof fetch === 'function') {
        const res = await fetch('./assets/lingoclub_dictionary.tsv');
        if (res.ok) {
          tsvText = await res.text();
          writeTsvToIdb(tsvText);
        }
      }
      if (tsvText) {
        fullDictionaryCache = parseTsvText(tsvText);
      } else {
        fullDictionaryCache = [...CURATED_DICTIONARY];
      }
    } catch {
      fullDictionaryCache = [...CURATED_DICTIONARY];
    }
    // Reset glossary index so tap-to-translate also benefits from full 18.6K dictionary
    glossaryIndex = null;
    return fullDictionaryCache;
  })();

  return loadingPromise;
}

export function getLoadedDictionarySync() {
  return fullDictionaryCache || CURATED_DICTIONARY;
}
