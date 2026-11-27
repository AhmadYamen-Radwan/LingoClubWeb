package com.example.data.content

import android.content.Context
import com.example.data.model.CefrLevel
import com.example.data.model.DictionaryEntry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object CuratedDictionary {

    val entries: List<DictionaryEntry> = listOf(
        // --- A1 BEGINNER ---
        DictionaryEntry(
            id = "dict_a1_1",
            english = "Hello",
            arabic = "مرحباً",
            transliteration = "Marhaban",
            phonetic = "/həˈloʊ/",
            partOfSpeech = "Greeting",
            cefrLevel = CefrLevel.A1,
            topic = "Greetings",
            exampleEn = "Hello! Nice to meet you.",
            exampleAr = "مرحباً! سعيد بلقائك."
        ),
        DictionaryEntry(
            id = "dict_a1_2",
            english = "Thank you",
            arabic = "شكراً لك",
            transliteration = "Shukran lak",
            phonetic = "/θæŋk juː/",
            partOfSpeech = "Phrase",
            cefrLevel = CefrLevel.A1,
            topic = "Politeness",
            exampleEn = "Thank you for helping me today.",
            exampleAr = "شكراً لك على مساعدتي اليوم."
        ),
        DictionaryEntry(
            id = "dict_a1_3",
            english = "Excuse me",
            arabic = "عفواً / لو سمحت",
            transliteration = "Afwan / Law samaht",
            phonetic = "/ɪkˈskjuːz miː/",
            partOfSpeech = "Phrase",
            cefrLevel = CefrLevel.A1,
            topic = "Politeness",
            exampleEn = "Excuse me, where is the bus stop?",
            exampleAr = "لو سمحت، أين موقف الحافلة؟"
        ),
        DictionaryEntry(
            id = "dict_a1_4",
            english = "Water",
            arabic = "ماء",
            transliteration = "Maa'",
            phonetic = "/ˈwɔːtər/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A1,
            topic = "Food & Drink",
            exampleEn = "Could I have a glass of water, please?",
            exampleAr = "هل يمكنني الحصول على كوب ماء من فضلك؟"
        ),
        DictionaryEntry(
            id = "dict_a1_5",
            english = "Friend",
            arabic = "صديق",
            transliteration = "Sadeeq",
            phonetic = "/frɛnd/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A1,
            topic = "People",
            exampleEn = "She is my best friend from school.",
            exampleAr = "هي أفضل صديقة لي من المدرسة."
        ),
        DictionaryEntry(
            id = "dict_a1_6",
            english = "House",
            arabic = "منزل / بيت",
            transliteration = "Manzil / Bayt",
            phonetic = "/haʊs/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A1,
            topic = "Home",
            exampleEn = "Our house is near the park.",
            exampleAr = "منزلنا قريب من الحديقة."
        ),
        DictionaryEntry(
            id = "dict_a1_7",
            english = "Morning",
            arabic = "صباح",
            transliteration = "Sabah",
            phonetic = "/ˈmɔːrnɪŋ/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A1,
            topic = "Time",
            exampleEn = "Good morning! Did you sleep well?",
            exampleAr = "صباح الخير! هل نمت جيداً؟"
        ),
        DictionaryEntry(
            id = "dict_a1_8",
            english = "Happy",
            arabic = "سعيد",
            transliteration = "Sa'eed",
            phonetic = "/ˈhæpi/",
            partOfSpeech = "Adjective",
            cefrLevel = CefrLevel.A1,
            topic = "Feelings",
            exampleEn = "I am very happy to see you!",
            exampleAr = "أنا سعيد جداً برؤيتك!"
        ),
        DictionaryEntry(
            id = "dict_a1_9",
            english = "Understand",
            arabic = "يفهم",
            transliteration = "Yafham",
            phonetic = "/ˌʌndərˈstænd/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.A1,
            topic = "Communication",
            exampleEn = "Sorry, I don't understand this word.",
            exampleAr = "آسف، لا أفهم هذه الكلمة."
        ),
        DictionaryEntry(
            id = "dict_a1_10",
            english = "How much?",
            arabic = "كم السعر؟",
            transliteration = "Kam al-si'r?",
            phonetic = "/haʊ mʌtʃ/",
            partOfSpeech = "Phrase",
            cefrLevel = CefrLevel.A1,
            topic = "Shopping",
            exampleEn = "How much is this blue notebook?",
            exampleAr = "كم سعر هذا الدفتر الأزرق؟"
        ),
        DictionaryEntry(
            id = "dict_a1_11",
            english = "Train station",
            arabic = "محطة القطار",
            transliteration = "Mahattat al-qitar",
            phonetic = "/treɪn ˈsteɪʃən/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A1,
            topic = "Travel",
            exampleEn = "The train station is ten minutes away.",
            exampleAr = "محطة القطار تبعد عشر دقائق."
        ),
        DictionaryEntry(
            id = "dict_a1_12",
            english = "Today",
            arabic = "اليوم",
            transliteration = "Al-yawm",
            phonetic = "/təˈdeɪ/",
            partOfSpeech = "Adverb",
            cefrLevel = CefrLevel.A1,
            topic = "Time",
            exampleEn = "What are we studying today?",
            exampleAr = "ماذا ندرس اليوم؟"
        ),

        // --- A2 ELEMENTARY ---
        DictionaryEntry(
            id = "dict_a2_1",
            english = "Appointment",
            arabic = "موعد",
            transliteration = "Maw'id",
            phonetic = "/əˈpɔɪntmənt/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A2,
            topic = "Daily Life",
            exampleEn = "I have a dentist appointment at 4 PM.",
            exampleAr = "لدي موعد عند طبيب الأسنان الساعة الرابعة مساءً."
        ),
        DictionaryEntry(
            id = "dict_a2_2",
            english = "Borrow",
            arabic = "يستعير",
            transliteration = "Yasta'eer",
            phonetic = "/ˈbɒroʊ/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.A2,
            topic = "Everyday Verbs",
            exampleEn = "Can I borrow your pen for a minute?",
            exampleAr = "هل يمكنني استعارة قلمك لدقيقة؟"
        ),
        DictionaryEntry(
            id = "dict_a2_3",
            english = "Lend",
            arabic = "يُقرض / يُعير",
            transliteration = "Yuqrid / Yu'eer",
            phonetic = "/lɛnd/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.A2,
            topic = "Everyday Verbs",
            exampleEn = "I can lend you my jacket if you're cold.",
            exampleAr = "يمكنني أن أعيرك سترتي إذا كنت تشعر بالبرد."
        ),
        DictionaryEntry(
            id = "dict_a2_4",
            english = "Delicious",
            arabic = "لذيذ",
            transliteration = "Ladheedh",
            phonetic = "/dɪˈlɪʃəs/",
            partOfSpeech = "Adjective",
            cefrLevel = CefrLevel.A2,
            topic = "Food & Drink",
            exampleEn = "This homemade soup is delicious!",
            exampleAr = "هذا الحساء المنزلي لذيذ جداً!"
        ),
        DictionaryEntry(
            id = "dict_a2_5",
            english = "Crowded",
            arabic = "مزدحم",
            transliteration = "Muzdahim",
            phonetic = "/ˈkraʊdɪd/",
            partOfSpeech = "Adjective",
            cefrLevel = CefrLevel.A2,
            topic = "Places",
            exampleEn = "The café is usually crowded on Saturday mornings.",
            exampleAr = "المقهى يكون مزدحماً عادةً صباح السبت."
        ),
        DictionaryEntry(
            id = "dict_a2_6",
            english = "Directions",
            arabic = "الاتجاهات",
            transliteration = "Al-ittijahat",
            phonetic = "/dəˈrɛkʃənz/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A2,
            topic = "Travel",
            exampleEn = "Let's ask a local for directions.",
            exampleAr = "لنسأل أحد السكان عن الاتجاهات."
        ),
        DictionaryEntry(
            id = "dict_a2_7",
            english = "Neighbor",
            arabic = "جار",
            transliteration = "Jaar",
            phonetic = "/ˈneɪbər/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A2,
            topic = "People",
            exampleEn = "Our new neighbor baked us cookies.",
            exampleAr = "جارنا الجديد خبز لنا البسكويت."
        ),
        DictionaryEntry(
            id = "dict_a2_8",
            english = "Receipt",
            arabic = "إيصال / فاتورة",
            transliteration = "Eesaal / Fatoorah",
            phonetic = "/rɪˈsiːt/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A2,
            topic = "Shopping",
            exampleEn = "Would you like your receipt in the bag?",
            exampleAr = "هل تريد الإيصال داخل الكيس؟"
        ),
        DictionaryEntry(
            id = "dict_a2_9",
            english = "Weather",
            arabic = "الطقس",
            transliteration = "Al-taqs",
            phonetic = "/ˈwɛðər/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.A2,
            topic = "Nature",
            exampleEn = "The weather looks sunny and warm today.",
            exampleAr = "يبدو الطقس مشمساً ودافئاً اليوم."
        ),
        DictionaryEntry(
            id = "dict_a2_10",
            english = "Improve",
            arabic = "يتحسن / يطوّر",
            transliteration = "Yatahassan / Yutawwir",
            phonetic = "/ɪmˈpruːv/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.A2,
            topic = "Learning",
            exampleEn = "Speaking with friends helps improve your fluency.",
            exampleAr = "التحدث مع الأصدقاء يساعد في تحسين طلاقتك."
        ),

        // --- B1 INTERMEDIATE ---
        DictionaryEntry(
            id = "dict_b1_1",
            english = "Remind",
            arabic = "يُذكّر",
            transliteration = "Yudhakkir",
            phonetic = "/rɪˈmaɪnd/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.B1,
            topic = "Everyday Verbs",
            exampleEn = "Please remind me to bring the flashcards.",
            exampleAr = "من فضلك ذكّرني بإحضار البطاقات التعليمية."
        ),
        DictionaryEntry(
            id = "dict_b1_2",
            english = "Look forward to",
            arabic = "يتطلع بشوق إلى",
            transliteration = "Yatatalla' bi-shawq ila",
            phonetic = "/lʊk ˈfɔːrwərd tuː/",
            partOfSpeech = "Phrasal Verb",
            cefrLevel = CefrLevel.B1,
            topic = "Phrasal Verbs",
            exampleEn = "I'm looking forward to our quiz night!",
            exampleAr = "أتطلع بشوق إلى ليلة المسابقات!"
        ),
        DictionaryEntry(
            id = "dict_b1_3",
            english = "Put off",
            arabic = "يؤجّل",
            transliteration = "Yu'ajjil",
            phonetic = "/pʊt ɔːf/",
            partOfSpeech = "Phrasal Verb",
            cefrLevel = CefrLevel.B1,
            topic = "Phrasal Verbs",
            exampleEn = "Don't put off studying until midnight.",
            exampleAr = "لا تؤجل الدراسة حتى منتصف الليل."
        ),
        DictionaryEntry(
            id = "dict_b1_4",
            english = "Sensible",
            arabic = "عاقل / منطقي",
            transliteration = "Aaqil / Mantiqi",
            phonetic = "/ˈsɛnsəbəl/",
            partOfSpeech = "Adjective",
            cefrLevel = CefrLevel.B1,
            topic = "Personality",
            exampleEn = "Taking an umbrella was a sensible decision.",
            exampleAr = "أخذ مظلة كان قراراً منطقياً."
        ),
        DictionaryEntry(
            id = "dict_b1_5",
            english = "Run out of",
            arabic = "ينفد من",
            transliteration = "Yanfad min",
            phonetic = "/rʌn aʊt ʌv/",
            partOfSpeech = "Phrasal Verb",
            cefrLevel = CefrLevel.B1,
            topic = "Phrasal Verbs",
            exampleEn = "We ran out of coffee beans this morning.",
            exampleAr = "نفدت لدينا حبوب القهوة هذا الصباح."
        ),
        DictionaryEntry(
            id = "dict_b1_6",
            english = "By the way",
            arabic = "بالمناسبة",
            transliteration = "Bil-munasabah",
            phonetic = "/baɪ ðə weɪ/",
            partOfSpeech = "Phrase",
            cefrLevel = CefrLevel.B1,
            topic = "Conversation",
            exampleEn = "By the way, did you finish the puzzle?",
            exampleAr = "بالمناسبة، هل أنهيت اللغز؟"
        ),
        DictionaryEntry(
            id = "dict_b1_7",
            english = "Confidence",
            arabic = "الثقة بالنفس",
            transliteration = "Al-thiqah bil-nafs",
            phonetic = "/ˈkɒnfɪdəns/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.B1,
            topic = "Mindset",
            exampleEn = "Roleplay games build speaking confidence.",
            exampleAr = "ألعاب تقمص الأدوار تبني الثقة في التحدث."
        ),
        DictionaryEntry(
            id = "dict_b1_8",
            english = "Bargain",
            arabic = "صفقة رابحة / يساوم",
            transliteration = "Safqah / Yusawim",
            phonetic = "/ˈbɑːrɡɪn/",
            partOfSpeech = "Noun / Verb",
            cefrLevel = CefrLevel.B1,
            topic = "Shopping",
            exampleEn = "Finding this jacket for £20 was a real bargain!",
            exampleAr = "العثور على هذه السترة بـ ٢٠ جنيهاً كان صفقة رائعة!"
        ),

        // --- B2 UPPER-INTERMEDIATE ---
        DictionaryEntry(
            id = "dict_b2_1",
            english = "Break the ice",
            arabic = "يكسر الجليد / يبدأ الحديث بود",
            transliteration = "Yaksir al-jaleed",
            phonetic = "/breɪk ði aɪs/",
            partOfSpeech = "Idiom",
            cefrLevel = CefrLevel.B2,
            topic = "Idioms",
            exampleEn = "A quick guessing game helped break the ice.",
            exampleAr = "ساعدت لعبة تخمين سريعة في كسر الجليد بيننا."
        ),
        DictionaryEntry(
            id = "dict_b2_2",
            english = "Procrastinate",
            arabic = "يماطل / يسوّف",
            transliteration = "Yumaatil / Yusawwif",
            phonetic = "/prəˈkræstɪneɪt/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.B2,
            topic = "Habits",
            exampleEn = "I always procrastinate before writing long essays.",
            exampleAr = "دائماً ما أسوّف قبل كتابة المقالات الطويلة."
        ),
        DictionaryEntry(
            id = "dict_b2_3",
            english = "Get the hang of",
            arabic = "يتقن / يعتاد على",
            transliteration = "Yutqin / Ya'tad ala",
            phonetic = "/ɡɛt ðə hæŋ ʌv/",
            partOfSpeech = "Idiom",
            cefrLevel = CefrLevel.B2,
            topic = "Idioms",
            exampleEn = "You'll get the hang of phrasal verbs soon!",
            exampleAr = "ستتقن الأفعال المركبة قريباً!"
        ),
        DictionaryEntry(
            id = "dict_b2_4",
            english = "Overwhelmed",
            arabic = "مُثقَل / غارق في المهام",
            transliteration = "Muthqal / Ghaariq",
            phonetic = "/ˌoʊvərˈwɛlmd/",
            partOfSpeech = "Adjective",
            cefrLevel = CefrLevel.B2,
            topic = "Feelings",
            exampleEn = "Don't feel overwhelmed—learn five words a day.",
            exampleAr = "لا تشعر بالإرهاق—تعلّم خمس كلمات فقط يومياً."
        ),
        DictionaryEntry(
            id = "dict_b2_5",
            english = "Out of the blue",
            arabic = "فجأة وبشكل غير متوقع",
            transliteration = "Faj'atan",
            phonetic = "/aʊt ʌv ðə bluː/",
            partOfSpeech = "Idiom",
            cefrLevel = CefrLevel.B2,
            topic = "Idioms",
            exampleEn = "My cousin called me out of the blue yesterday.",
            exampleAr = "اتصل بي ابن عمي فجأة ودون سابق إنذار أمس."
        ),
        DictionaryEntry(
            id = "dict_b2_6",
            english = "Negotiate",
            arabic = "يتفاوض",
            transliteration = "Yatafawad",
            phonetic = "/nɪˈɡoʊʃieɪt/",
            partOfSpeech = "Verb",
            cefrLevel = CefrLevel.B2,
            topic = "Communication",
            exampleEn = "Let's negotiate a fair price at the market.",
            exampleAr = "لنتفاوض على سعر عادل في السوق."
        ),
        DictionaryEntry(
            id = "dict_b2_7",
            english = "Coincidence",
            arabic = "مصادفة",
            transliteration = "Musadafah",
            phonetic = "/koʊˈɪnsɪdəns/",
            partOfSpeech = "Noun",
            cefrLevel = CefrLevel.B2,
            topic = "Events",
            exampleEn = "Meeting on the same train was a crazy coincidence!",
            exampleAr = "لقاؤنا في نفس القطار كان مصادفة عجيبة!"
        ),
        DictionaryEntry(
            id = "dict_b2_8",
            english = "On the same page",
            arabic = "متفقون في الفهم والرأي",
            transliteration = "Muttafiqoon fil-ra'y",
            phonetic = "/ɒn ðə seɪm peɪdʒ/",
            partOfSpeech = "Idiom",
            cefrLevel = CefrLevel.B2,
            topic = "Teamwork",
            exampleEn = "Let's check the rules so everyone is on the same page.",
            exampleAr = "لنراجع القواعد حتى يكون الجميع متفقين على نفس الفهم."
        )
    )

    @Volatile
    private var cachedFullDictionary: List<DictionaryEntry>? = null

    suspend fun loadFullDictionary(context: Context): List<DictionaryEntry> {
        cachedFullDictionary?.let { return it }
        return withContext(Dispatchers.IO) {
            cachedFullDictionary?.let { return@withContext it }
            val existingKeys = entries.mapTo(HashSet()) { it.english.trim().lowercase() }
            val imported = ArrayList<DictionaryEntry>(18600)
            runCatching {
                context.assets.open("lingoclub_dictionary.tsv").bufferedReader(Charsets.UTF_8).use { reader ->
                    var idx = 0
                    reader.forEachLine { line ->
                        if (line.isBlank()) return@forEachLine
                        val parts = line.split('\t')
                        if (parts.size < 4) return@forEachLine
                        val rawLevel = parts[0].trim().uppercase()
                        val rawCategory = parts[1].trim()
                        val word = parts[2].trim()
                        val arabic = parts[3].trim()
                        val ipa = parts.getOrNull(4)?.trim().orEmpty()
                        if (word.isEmpty() || arabic.isEmpty()) return@forEachLine
                        val key = word.lowercase()
                        if (!existingKeys.add(key)) return@forEachLine
                        val mappedCefr = when (rawLevel) {
                            "A1" -> CefrLevel.A1
                            "A2" -> CefrLevel.A2
                            "B1" -> CefrLevel.B1
                            else -> CefrLevel.B2
                        }
                        imported.add(
                            DictionaryEntry(
                                id = "pdf_${rawLevel.lowercase()}_$idx",
                                english = word,
                                arabic = arabic,
                                transliteration = "",
                                phonetic = ipa,
                                partOfSpeech = formatCategoryLabel(rawCategory),
                                cefrLevel = mappedCefr,
                                topic = formatCategoryLabel(rawCategory),
                                exampleEn = "",
                                exampleAr = "",
                                levelLabel = rawLevel
                            )
                        )
                        idx++
                    }
                }
            }
            val combined = entries + imported
            cachedFullDictionary = combined
            combined
        }
    }

    private fun formatCategoryLabel(raw: String): String {
        val primary = raw.substringBefore('/').trim().lowercase()
        return when (primary) {
            "daily-life", "general" -> "Daily Life"
            "academic" -> "Academic"
            "science", "scientific", "chemical", "chemistry" -> "Science"
            "technology", "tech", "technical" -> "Technology"
            "medical", "psychology" -> "Medical"
            "business" -> "Business"
            "legal" -> "Legal"
            "art", "music" -> "Arts"
            "agriculture" -> "Nature"
            "military", "political", "religious" -> "Society"
            else -> "General"
        }
    }
}
