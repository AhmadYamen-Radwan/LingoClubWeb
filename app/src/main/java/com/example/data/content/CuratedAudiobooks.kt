package com.example.data.content

import com.example.data.model.Audiobook
import com.example.data.model.AudiobookChapter
import com.example.data.model.AudiobookParagraph
import com.example.data.model.CefrLevel

object CuratedAudiobooks {
    val books: List<Audiobook> = listOf(
        Audiobook(
            id = "ab_a1_cafe",
            title = "The Sunny Café Morning",
            subtitle = "A gentle starter story about friendship, coffee, and a lost key.",
            narrator = "Maya & Sam",
            cefrLevel = CefrLevel.A1,
            genre = "Everyday Story",
            chapters = listOf(
                AudiobookChapter(
                    id = "ab_a1_c1",
                    chapterNumber = 1,
                    title = "Table by the Window",
                    durationMin = 3,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_a1_c1_p1",
                            english = "Every Friday morning, Sara walks to a small café near her house. The street is quiet, and the warm sun shines through the big glass window.",
                            arabic = "كل صباح جمعة، تمشي سارة إلى مقهى صغير بالقرب من منزلها. الشارع هادئ، والشمس الدافئة تشرق عبر النافذة الزجاجية الكبيرة.",
                            keyVocabulary = listOf("quiet", "warm sun", "near")
                        ),
                        AudiobookParagraph(
                            id = "ab_a1_c1_p2",
                            english = "She orders one mint tea and a fresh cheese sandwich. Today, a friendly neighbor named Omar sits at the next table with a bright red notebook.",
                            arabic = "تطلب شاياً بالنعناع وشطيرة جبن طازجة. اليوم، يجلس جار ودود اسمه عمر على الطاولة المجاورة ومعه دفتر ملاحظات أحمر لامع.",
                            keyVocabulary = listOf("orders", "neighbor", "notebook")
                        ),
                        AudiobookParagraph(
                            id = "ab_a1_c1_p3",
                            english = "'Excuse me,' Omar says with a smile. 'Do you have a spare pen? I want to write five new English words before work.'",
                            arabic = "يقول عمر بابتسامة: «عفواً، هل لديكِ قلم إضافي؟ أريد أن أكتب خمس كلمات إنجليزية جديدة قبل العمل».",
                            keyVocabulary = listOf("spare pen", "before work")
                        )
                    ),
                    reflectionPrompt = "Ask a friend: What do you usually order at a café, and how do you politely ask to borrow a pen?"
                ),
                AudiobookChapter(
                    id = "ab_a1_c2",
                    chapterNumber = 2,
                    title = "The Green Keychain",
                    durationMin = 3,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_a1_c2_p1",
                            english = "Ten minutes later, Omar stands up to leave, but he forgets his house keys next to the sugar bowl. Sara notices the green keychain right away.",
                            arabic = "بعد عشر دقائق، يقف عمر للمغادرة، لكنه ينسى مفاتيح منزله بجانب وعاء السكر. تلاحظ سارة سلسلة المفاتيح الخضراء فوراً.",
                            keyVocabulary = listOf("forgets", "right away")
                        ),
                        AudiobookParagraph(
                            id = "ab_a1_c2_p2",
                            english = "She runs to the door and calls his name. Omar laughs and says, 'Thank you so much! Next Friday, your tea is on me!'",
                            arabic = "تركض نحو الباب وتنادي اسمه. يضحك عمر ويقول: «شكراً جزيلاً لكِ! الجمعة القادمة، الشاي على حسابي!».",
                            keyVocabulary = listOf("calls his name", "on me")
                        )
                    ),
                    reflectionPrompt = "Roleplay the ending with a friend—one plays Sara returning the keys, and one plays Omar!"
                )
            )
        ),
        Audiobook(
            id = "ab_a2_backpack",
            title = "The Missing Blue Backpack",
            subtitle = "Two friends retrace their steps across the city market to solve a travel puzzle.",
            narrator = "Tariq & Lina",
            cefrLevel = CefrLevel.A2,
            genre = "City Adventure",
            chapters = listOf(
                AudiobookChapter(
                    id = "ab_a2_c1",
                    chapterNumber = 1,
                    title = "Last Stop at Central Market",
                    durationMin = 4,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_a2_c1_p1",
                            english = "Last Saturday afternoon, Lina and her cousin Tariq took the underground train to Central Market. They wanted to buy spices, fresh fruit, and a birthday gift.",
                            arabic = "بعد ظهر السبت الماضي، استقلت لينا وابن عمها طارق قطار الأنفاق إلى السوق المركزي. أرادا شراء التوابل والفاكهة الطازجة وهدية عيد ميلاد.",
                            keyVocabulary = listOf("underground", "spices", "gift")
                        ),
                        AudiobookParagraph(
                            id = "ab_a2_c1_p2",
                            english = "When they stopped for lemon juice, Lina reached for her blue backpack—and froze. Inside were her camera, her train pass, and a handmade scarf.",
                            arabic = "عندما توقفا لشرب عصير الليمون، مدّت لينا يدها نحو حقيبتها الزرقاء فتجمدت في مكانها. كانت بداخلها كاميرتها وتذكرة القطار ووشاح مصنوع يدوياً.",
                            keyVocabulary = listOf("reached for", "froze", "handmade")
                        ),
                        AudiobookParagraph(
                            id = "ab_a2_c1_p3",
                            english = "'Don't panic,' Tariq told her calmly. 'Let's retrace every shop we visited in the last twenty minutes.'",
                            arabic = "قال لها طارق بهدوء: «لا تقلقي، دعينا نتتبع خطواتنا في كل متجر زرناه خلال العشرين دقيقة الماضية».",
                            keyVocabulary = listOf("Don't panic", "retrace")
                        )
                    ),
                    reflectionPrompt = "Retell what happened in past tense ('took', 'stopped', 'froze') without looking at the screen!"
                ),
                AudiobookChapter(
                    id = "ab_a2_c2",
                    chapterNumber = 2,
                    title = "The Spice Stall Clue",
                    durationMin = 4,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_a2_c2_p1",
                            english = "At the spice stall, the shopkeeper pointed toward the bakery across the alley. 'I saw a girl in a yellow jacket pick up a blue bag by mistake!'",
                            arabic = "في كشك التوابل، أشار البائع نحو المخبز عبر الزقاق قائلاً: «رأيت فتاة ترتدي سترة صفراء تلتقط حقيبة زرقاء عن طريق الخطأ!».",
                            keyVocabulary = listOf("pointed toward", "by mistake")
                        ),
                        AudiobookParagraph(
                            id = "ab_a2_c2_p2",
                            english = "Minutes later, both girls laughed when they swapped their identical backpacks back. Lina promised to tie a bright ribbon on hers before the next trip.",
                            arabic = "بعد دقائق، ضحكت الفتاتان عندما تبادلتا الحقيبتين المتطابقتين. ووعدت لينا بربط شريط ملون على حقيبتها قبل الرحلة القادمة.",
                            keyVocabulary = listOf("identical", "swapped")
                        )
                    ),
                    reflectionPrompt = "Have you ever lost something and found it in a surprising place? Tell your group in 3 past-tense sentences."
                )
            )
        ),
        Audiobook(
            id = "ab_b1_train",
            title = "Midnight Train to Alexandria",
            subtitle = "A conversation with a stranger turns a delayed train ride into a turning point.",
            narrator = "Nadia",
            cefrLevel = CefrLevel.B1,
            genre = "Drama & Travel",
            chapters = listOf(
                AudiobookChapter(
                    id = "ab_b1_c1",
                    chapterNumber = 1,
                    title = "Platform Four Delay",
                    durationMin = 5,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_b1_c1_p1",
                            english = "Rain tapped steadily against the station roof as the loudspeaker announced a forty-minute delay. Most passengers sighed, yet Nadia opened her sketchbook instead of checking her phone.",
                            arabic = "طرق المطر بثبات على سقف المحطة بينما أعلن مكبر الصوت عن تأخير أربعين دقيقة. تنهد معظم المسافرين، لكن نادية فتحت دفتر رسمها بدلاً من تفقد هاتفها.",
                            keyVocabulary = listOf("steadily", "announced", "sketchbook")
                        ),
                        AudiobookParagraph(
                            id = "ab_b1_c1_p2",
                            english = "An elderly architect sitting across from her noticed the bridge she was drawing. 'You captured the perspective remarkably well,' he remarked, offering her a cup of hot ginger tea.",
                            arabic = "لاحظ مهندس معماري مسن يجلس مقابلها الجسر الذي كانت ترسمه، وقال: «لقد التقطتِ المنظور ببراعة لافتة»، ثم قدم لها كوباً من شاي الزنجبيل الساخن.",
                            keyVocabulary = listOf("perspective", "remarkably", "remarked")
                        )
                    ),
                    reflectionPrompt = "Discuss: When a plan gets delayed, how do you turn wasted time into something creative?"
                )
            )
        ),
        Audiobook(
            id = "ab_b2_studio",
            title = "The Pop-Up Studio Bet",
            subtitle = "Can four friends turn an empty bookstore into a thriving weekend English club in 48 hours?",
            narrator = "Zaid & Friends",
            cefrLevel = CefrLevel.B2,
            genre = "Entrepreneurial Story",
            chapters = listOf(
                AudiobookChapter(
                    id = "ab_b2_c1",
                    chapterNumber = 1,
                    title = "Forty-Eight Hours on the Clock",
                    durationMin = 5,
                    paragraphs = listOf(
                        AudiobookParagraph(
                            id = "ab_b2_c1_p1",
                            english = "When the old corner bookstore closed for renovations, its owner made Zaid a bold offer: if his study group could host a lively cultural evening by Saturday, they could use the space rent-free all summer.",
                            arabic = "عندما أغلقت مكتبة الزاوية القديمة للتجديد، قدم مالكها لزيد عرضاً جريئاً: إذا استطاعت مجموعته استضافة أمسية ثقافية حيوية بحلول السبت، فيمكنهم استخدام المكان مجاناً طوال الصيف.",
                            keyVocabulary = listOf("renovations", "bold offer", "rent-free")
                        ),
                        AudiobookParagraph(
                            id = "ab_b2_c1_p2",
                            english = "At first, pulling it off seemed like a long shot. They had zero budget, mismatched chairs, and barely two days to spread the word across campus.",
                            arabic = "في البداية، بدا إنجاز ذلك أمراً بعيد المنال؛ فلم تكن لديهم ميزانية، وكانت الكراسي غير متناسقة، ولم يكن أمامهم سوى يومين تقريباً لنشر الخبر.",
                            keyVocabulary = listOf("pulling it off", "a long shot", "spread the word")
                        ),
                        AudiobookParagraph(
                            id = "ab_b2_c1_p3",
                            english = "Instead of panicking, each friend leaned into their strengths—one designed quirky quiz cards, another brewed spiced coffee, and by 7 p.m. Saturday, thirty strangers were laughing in English like old friends.",
                            arabic = "وبدلاً من الذعر، استثمر كل صديق نقاط قوته؛ فصمم أحدهم بطاقات أسئلة طريفة، وأعدّ آخر القهوة المتبلة، وبحلول السابعة مساءً كان ثلاثون غريباً يضحكون بالإنجليزية كأنهم أصدقاء قدامى.",
                            keyVocabulary = listOf("leaned into", "brewed", "like old friends")
                        )
                    ),
                    reflectionPrompt = "Explain the B2 idioms 'pull something off' and 'a long shot' to a friend and invent a new example!"
                )
            )
        )
    )
}
