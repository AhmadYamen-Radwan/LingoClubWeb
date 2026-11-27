package com.example.data.content

data class WordGlossaryMatch(
    val word: String,
    val arabic: String,
    val phonetic: String = "",
    val partOfSpeech: String = "",
    val meaning: String = "",
    val exampleAr: String = ""
)

object ArabicWordGlossary {

    private val stopWords = setOf(
        "a", "an", "the", "is", "are", "was", "were", "am", "be", "been", "being",
        "in", "on", "at", "to", "of", "and", "or", "for", "it", "its", "he", "she",
        "we", "you", "they", "them", "i", "my", "your", "his", "her", "our", "their",
        "this", "that", "these", "those", "with", "from", "by", "as", "if", "so",
        "but", "not", "no", "yes", "do", "does", "did", "has", "have", "had",
        "can", "could", "will", "would", "may", "might", "must", "shall", "should",
        "up", "down", "out", "off", "over", "under", "into", "onto", "about",
        "than", "then", "there", "here", "when", "where", "who", "what", "which",
        "why", "how", "all", "any", "some", "one", "two", "three", "very", "just",
        "more", "most", "also", "only", "back", "still", "even", "now", "well"
    )

    private val extraVocabulary: List<WordGlossaryMatch> = listOf(
        WordGlossaryMatch("manuscript", "مخطوطة", "/ˈmænjʊskrɪpt/", "Noun", "Handwritten historic book or document"),
        WordGlossaryMatch("alibi", "عذر غياب / ذريعة", "/ˈælɪbaɪ/", "Noun", "Proof a suspect was elsewhere during a crime"),
        WordGlossaryMatch("archivist", "أمين محفوظات", "/ˈɑːrkɪvɪst/", "Noun", "Person who manages historical records"),
        WordGlossaryMatch("curator", "أمين متحف", "/kjʊəˈreɪtər/", "Noun", "Keeper or custodian of a museum collection"),
        WordGlossaryMatch("suspect", "مشتبه به", "/ˈsʌspekt/", "Noun", "Person thought to be guilty of a crime"),
        WordGlossaryMatch("detective", "محقق", "/dɪˈtektɪv/", "Noun", "Investigator who solves crimes"),
        WordGlossaryMatch("evidence", "دليل جنائي", "/ˈevɪdəns/", "Noun", "Facts or objects proving who did a crime"),
        WordGlossaryMatch("clue", "خيط / دليل", "/kluː/", "Noun", "Hint helping solve a mystery"),
        WordGlossaryMatch("culprit", "الجاني / المذنب", "/ˈkʌlprɪt/", "Noun", "Person responsible for a crime"),
        WordGlossaryMatch("motive", "دافع الجريمة", "/ˈmoʊtɪv/", "Noun", "Reason for committing an act"),
        WordGlossaryMatch("poison", "سم", "/ˈpɔɪzən/", "Noun", "Deadly toxic substance"),
        WordGlossaryMatch("cyanide", "سيانيد (سم سريع)", "/ˈsaɪənaɪd/", "Noun", "Highly lethal fast-acting poison"),
        WordGlossaryMatch("theft", "سرقة", "/θeft/", "Noun", "Act of stealing property"),
        WordGlossaryMatch("thief", "لص", "/θiːf/", "Noun", "Person who steals"),
        WordGlossaryMatch("burglary", "سطو / اقتحام", "/ˈbɜːrɡləri/", "Noun", "Breaking into a building to steal"),
        WordGlossaryMatch("robbery", "سرقة بالإكراه", "/ˈrɒbəri/", "Noun", "Taking property unlawfully by force"),
        WordGlossaryMatch("heist", "عملية سطو كبرى", "/haɪst/", "Noun", "Carefully planned major theft"),
        WordGlossaryMatch("murder", "جريمة قتل", "/ˈmɜːrdər/", "Noun", "Unlawful premeditated killing"),
        WordGlossaryMatch("forgery", "تزوير / تزييف", "/ˈfɔːrdʒəri/", "Noun", "Fake copy made to deceive"),
        WordGlossaryMatch("forged", "مزوّر", "/fɔːrdʒd/", "Adjective", "Falsely copied or faked"),
        WordGlossaryMatch("counterfeit", "مزيف / مقلّد", "/ˈkaʊntərfɪt/", "Adjective", "Made in exact imitation to defraud"),
        WordGlossaryMatch("embezzlement", "اختلاس مالي", "/ɪmˈbezəlmənt/", "Noun", "Theft of money entrusted to one's care"),
        WordGlossaryMatch("larceny", "سرقة كبرى", "/ˈlɑːrsəni/", "Noun", "Theft of personal property"),
        WordGlossaryMatch("infiltration", "تسلل", "/ˌɪnfɪlˈtreɪʃən/", "Noun", "Secretly entering a restricted place"),
        WordGlossaryMatch("disguised", "متنكر / مموّه", "/dɪsˈɡaɪzd/", "Adjective", "Hidden by changing appearance"),
        WordGlossaryMatch("unauthorized", "غير مصرّح به", "/ʌnˈɔːθəraɪzd/", "Adjective", "Without official permission"),
        WordGlossaryMatch("witness", "شاهد", "/ˈwɪtnəs/", "Noun", "Person who saw an event happen"),
        WordGlossaryMatch("fingerprint", "بصمة إصبع", "/ˈfɪŋɡərprɪnt/", "Noun", "Unique pattern left by a finger"),
        WordGlossaryMatch("footprint", "أثر قدم", "/ˈfʊtprɪnt/", "Noun", "Mark left by a foot or shoe"),
        WordGlossaryMatch("vault", "خزينة محصنة", "/vɔːlt/", "Noun", "Secure armored room for valuables"),
        WordGlossaryMatch("diamond", "ألماس", "/ˈdaɪəmənd/", "Noun", "Precious transparent gemstone"),
        WordGlossaryMatch("necklace", "عقد / قلادة", "/ˈnekləs/", "Noun", "Jewelry worn around the neck"),
        WordGlossaryMatch("goblet", "كأس معدني / عتيق", "/ˈɡɒblət/", "Noun", "Drinking cup with a stem and base"),
        WordGlossaryMatch("custodian", "حارس / مشرف مبنى", "/kʌˈstoʊdiən/", "Noun", "Person responsible for looking after a building"),
        WordGlossaryMatch("butler", "رئيس الخدم", "/ˈbʌtlər/", "Noun", "Chief household servant"),
        WordGlossaryMatch("physician", "طبيب", "/fɪˈzɪʃən/", "Noun", "Medical doctor"),
        WordGlossaryMatch("nephew", "ابن الأخ / ابن الأخت", "/ˈnefjuː/", "Noun", "Son of one's brother or sister"),
        WordGlossaryMatch("estranged", "منفصل / متباعد", "/ɪˈstreɪndʒd/", "Adjective", "No longer close or affectionate"),
        WordGlossaryMatch("toxicologist", "عالم سموم", "/ˌtɒksɪˈkɒlədʒɪst/", "Noun", "Scientist who studies poisons"),
        WordGlossaryMatch("aconite", "نبات خانق الذئب السام", "/ˈækənaɪt/", "Noun", "Poisonous plant extract"),
        WordGlossaryMatch("villain", "شرير / مجرم", "/ˈvɪlən/", "Noun", "Main evil character"),
        WordGlossaryMatch("mastermind", "العقل المدبّر", "/ˈmæstərmaɪnd/", "Noun", "Person who plans a complex scheme"),
        WordGlossaryMatch("conspiracy", "مؤامرة", "/kənˈspɪrəsi/", "Noun", "Secret plan by a group"),
        WordGlossaryMatch("interrogation", "استجواب", "/ɪnˌterəˈɡeɪʃən/", "Noun", "Formal questioning of a suspect"),
        WordGlossaryMatch("accuse", "يتهم", "/əˈkjuːz/", "Verb", "Claim someone did something wrong"),
        WordGlossaryMatch("verdict", "حكم / قرار نهائي", "/ˈvɜːrdɪkt/", "Noun", "Final decision in a case"),
        WordGlossaryMatch("guilty", "مذنب", "/ˈɡɪlti/", "Adjective", "Responsible for a wrongdoing"),
        WordGlossaryMatch("innocent", "بريء", "/ˈɪnəsənt/", "Adjective", "Not guilty of a crime"),
        WordGlossaryMatch("showcase", "خزانة عرض زجاجية", "/ˈʃoʊkeɪs/", "Noun", "Glass case displaying valuable items"),
        WordGlossaryMatch("vanished", "اختفى", "/ˈvænɪʃt/", "Verb", "Disappeared suddenly"),
        WordGlossaryMatch("priceless", "لا يُقدّر بثمن", "/ˈpraɪsləs/", "Adjective", "Too valuable to have a price"),
        WordGlossaryMatch("magnifying", "مكبّر", "/ˈmæɡnɪfaɪɪŋ/", "Adjective", "Making small objects appear larger"),
        WordGlossaryMatch("wire", "سلك", "/waɪər/", "Noun", "Thin flexible metal thread"),
        WordGlossaryMatch("cutters", "قاطعة أسلاك", "/ˈkʌtərz/", "Noun", "Tool used to cut metal or wires"),
        WordGlossaryMatch("pigment", "صبغة لونية", "/ˈpɪɡmənt/", "Noun", "Coloring matter in paint"),
        WordGlossaryMatch("residue", "بقايا / أثر", "/ˈrezɪduː/", "Noun", "Small amount left behind"),
        WordGlossaryMatch("thermal", "حراري", "/ˈθɜːrməl/", "Adjective", "Relating to heat"),
        WordGlossaryMatch("bullion", "سبائك ذهب أو فضة", "/ˈbʊliən/", "Noun", "Gold or silver in bulk bars"),
        WordGlossaryMatch("subterranean", "تحت الأرض", "/ˌsʌbtəˈreɪniən/", "Adjective", "Existing beneath the earth's surface"),
        WordGlossaryMatch("acoustic", "صوتي", "/əˈkuːstɪk/", "Adjective", "Relating to sound waves"),
        WordGlossaryMatch("alarm", "جهاز إنذار", "/əˈlɑːrm/", "Noun", "Warning signal device"),
        WordGlossaryMatch("parapet", "حاجز السطح", "/ˈpærəpɪt/", "Noun", "Low protective wall along a roof edge"),
        WordGlossaryMatch("canister", "عبوة أسطوانية", "/ˈkænɪstər/", "Noun", "Metal or plastic cylinder container"),
        WordGlossaryMatch("encrypted", "مشفّر", "/ɪnˈkrɪptɪd/", "Adjective", "Encoded to prevent unauthorized reading"),
        WordGlossaryMatch("watermark", "علامة مائية", "/ˈwɔːtərmɑːrk/", "Noun", "Security design embedded in paper"),
        WordGlossaryMatch("severed", "مقطوع", "/ˈsevərd/", "Adjective", "Cut cleanly apart"),
        WordGlossaryMatch("lethal", "قاتل / مميت", "/ˈliːθəl/", "Adjective", "Sufficient to cause death"),
        WordGlossaryMatch("gambling", "قمار / مقامرة", "/ˈɡæmblɪŋ/", "Noun", "Betting money on uncertain outcomes"),
        WordGlossaryMatch("debts", "ديون", "/dets/", "Noun", "Money owed to others"),
        WordGlossaryMatch("pocket", "جيب", "/ˈpɒkɪt/", "Noun", "Small pouch sewn into clothing"),
        WordGlossaryMatch("boots", "حذاء طويل", "/buːts/", "Noun", "Sturdy footwear covering the ankle"),
        WordGlossaryMatch("mud", "طين / وحل", "/mʌd/", "Noun", "Wet soft earth"),
        WordGlossaryMatch("thunderstorm", "عاصفة رعدية", "/ˈθʌndərstɔːrm/", "Noun", "Storm with lightning and thunder"),
        WordGlossaryMatch("midnight", "منتصف الليل", "/ˈmɪdnaɪt/", "Noun", "Twelve o'clock at night"),
        WordGlossaryMatch("express", "قطار سريع / عاجل", "/ɪkˈspres/", "Adjective", "Fast and direct transport"),
        WordGlossaryMatch("carriage", "عربة قطار", "/ˈkærɪdʒ/", "Noun", "Passenger section of a train"),
        WordGlossaryMatch("dining", "تناول الطعام", "/ˈdaɪnɪŋ/", "Noun", "Eating a meal"),
        WordGlossaryMatch("luggage", "أمتعة السفر", "/ˈlʌɡɪdʒ/", "Noun", "Suitcases and bags for travel"),
        WordGlossaryMatch("conductor", "محصّل التذاكر / قائد القطار", "/kənˈdʌktər/", "Noun", "Person managing passengers on a train"),
        WordGlossaryMatch("museum", "متحف", "/mjuːˈziːəm/", "Noun", "Building displaying art or history"),
        WordGlossaryMatch("gallery", "معرض فني", "/ˈɡæləri/", "Noun", "Room or building for art exhibitions"),
        WordGlossaryMatch("painting", "لوحة فنية", "/ˈpeɪntɪŋ/", "Noun", "Picture made with paint"),
        WordGlossaryMatch("gala", "حفل احتفالي فاخر", "/ˈɡɑːlə/", "Noun", "Special festive celebration"),
        WordGlossaryMatch("velvet", "مخمل", "/ˈvelvɪt/", "Noun", "Soft woven fabric"),
        WordGlossaryMatch("handbag", "حقيبة يد", "/ˈhændbæɡ/", "Noun", "Small bag carried by hand"),
        WordGlossaryMatch("gloves", "قفازات", "/ɡlʌvz/", "Noun", "Coverings for the hands"),
        WordGlossaryMatch("flashlight", "مصباح يدوي", "/ˈflæʃlaɪt/", "Noun", "Portable battery-powered lamp"),
        WordGlossaryMatch("corridor", "ممر", "/ˈkɒrɪdɔːr/", "Noun", "Long hallway in a building"),
        WordGlossaryMatch("locked", "مغلق بالمفتاح", "/lɒkt/", "Adjective", "Fastened securely with a lock"),
        WordGlossaryMatch("shadow", "ظل", "/ˈʃædoʊ/", "Noun", "Dark shape blocked from light"),
        WordGlossaryMatch("secret", "سر / سري", "/ˈsiːkrət/", "Noun", "Something kept hidden"),
        WordGlossaryMatch("whisper", "همس", "/ˈwɪspər/", "Verb", "Speak very softly"),
        WordGlossaryMatch("stranger", "شخص غريب", "/ˈstreɪndʒər/", "Noun", "Someone you do not know"),
        WordGlossaryMatch("harbor", "ميناء", "/ˈhɑːrbər/", "Noun", "Sheltered port for ships"),
        WordGlossaryMatch("lantern", "فانوس", "/ˈlæntərn/", "Noun", "Portable lamp with protective glass"),
        WordGlossaryMatch("treasure", "كنز", "/ˈtreʒər/", "Noun", "Hidden valuable wealth"),
        WordGlossaryMatch("adventure", "مغامرة", "/ədˈventʃər/", "Noun", "Exciting and daring experience"),
        WordGlossaryMatch("journey", "رحلة", "/ˈdʒɜːrni/", "Noun", "Act of traveling from one place to another"),
        WordGlossaryMatch("discovery", "اكتشاف", "/dɪˈskʌvəri/", "Noun", "Finding something for the first time"),
        WordGlossaryMatch("courage", "شجاعة", "/ˈkɜːrɪdʒ/", "Noun", "Bravery in facing difficulty"),
        WordGlossaryMatch("promise", "وعد", "/ˈprɒmɪs/", "Noun", "Commitment to do something"),
        WordGlossaryMatch("trust", "ثقة", "/trʌst/", "Noun", "Firm belief in honesty"),
        WordGlossaryMatch("bridge", "جسر", "/brɪdʒ/", "Noun", "Structure crossing over water or road"),
        WordGlossaryMatch("ticket", "تذكرة", "/ˈtɪkɪt/", "Noun", "Pass allowing entry or travel"),
        WordGlossaryMatch("passport", "جواز سفر", "/ˈpæspɔːrt/", "Noun", "Official travel identity booklet"),
        WordGlossaryMatch("airport", "مطار", "/ˈeərpɔːrt/", "Noun", "Place where airplanes take off and land"),
        WordGlossaryMatch("luggage", "حقائب سفر", "/ˈlʌɡɪdʒ/", "Noun", "Bags packed for a trip"),
        WordGlossaryMatch("boarding", "صعود الطائرة", "/ˈbɔːrdɪŋ/", "Noun", "Getting onto an airplane or ship"),
        WordGlossaryMatch("reservation", "حجز مسبق", "/ˌrezərˈveɪʃən/", "Noun", "Arrangement to keep a seat or room"),
        WordGlossaryMatch("order", "طلب / يطلب", "/ˈɔːrdər/", "Verb", "Request food or items"),
        WordGlossaryMatch("menu", "قائمة الطعام", "/ˈmenjuː/", "Noun", "List of dishes available"),
        WordGlossaryMatch("receipt", "إيصال / فاتورة", "/rɪˈsiːt/", "Noun", "Written proof of payment"),
        WordGlossaryMatch("customer", "زبون / عميل", "/ˈkʌstəmər/", "Noun", "Person buying goods or services"),
        WordGlossaryMatch("manager", "مدير", "/ˈmænɪdʒər/", "Noun", "Person in charge of staff or business"),
        WordGlossaryMatch("schedule", "جدول مواعيد", "/ˈskedʒuːl/", "Noun", "Plan of times and events"),
        WordGlossaryMatch("interview", "مقابلة", "/ˈɪntərvjuː/", "Noun", "Formal meeting to evaluate someone"),
        WordGlossaryMatch("confident", "واثق من نفسه", "/ˈkɒnfɪdənt/", "Adjective", "Sure of one's abilities"),
        WordGlossaryMatch("polite", "مهذب", "/pəˈlaɪt/", "Adjective", "Showing good manners"),
        WordGlossaryMatch("helpful", "متعاون / مفيد", "/ˈhelpfəl/", "Adjective", "Ready to give assistance"),
        WordGlossaryMatch("explain", "يشرح", "/ɪkˈspleɪn/", "Verb", "Make something clear in detail"),
        WordGlossaryMatch("describe", "يصف", "/dɪˈskraɪb/", "Verb", "Give an account in words"),
        WordGlossaryMatch("compare", "يقارن", "/kəmˈpeər/", "Verb", "Note similarities and differences"),
        WordGlossaryMatch("solution", "حل", "/səˈluːʃən/", "Noun", "Answer to a problem"),
        WordGlossaryMatch("mistake", "خطأ", "/mɪˈsteɪk/", "Noun", "Unintentional error"),
        WordGlossaryMatch("challenge", "تحدٍ", "/ˈtʃælɪndʒ/", "Noun", "Task that tests ability"),
        WordGlossaryMatch("victory", "انتصار / فوز", "/ˈvɪktəri/", "Noun", "Winning a game or contest"),
        WordGlossaryMatch("practice", "ممارسة / تدريب", "/ˈpræktɪs/", "Noun", "Repeated exercise to improve skill"),
        WordGlossaryMatch("pronounce", "ينطق", "/prəˈnaʊns/", "Verb", "Say a word aloud clearly"),
        WordGlossaryMatch("vocabulary", "مفردات لغوية", "/vəˈkæbjʊleri/", "Noun", "Set of words used in a language"),
        WordGlossaryMatch("sentence", "جملة", "/ˈsentəns/", "Noun", "Complete thought expressed in words"),
        WordGlossaryMatch("idiom", "تعبير اصطلاحي", "/ˈɪdiəm/", "Noun", "Phrase with figurative meaning"),
        WordGlossaryMatch("fluency", "طلاقة لغوية", "/ˈfluːənsi/", "Noun", "Ability to speak smoothly and accurately"),
        WordGlossaryMatch("reflection", "تأمّل / مراجعة", "/rɪˈflekʃən/", "Noun", "Serious thought or consideration"),
        WordGlossaryMatch("narrative", "سرد قصصي", "/ˈnærətɪv/", "Noun", "Spoken or written connected story"),
        WordGlossaryMatch("twist", "تطور مفاجئ", "/twɪst/", "Noun", "Unexpected turn in a story"),
        WordGlossaryMatch("collocation", "تلازم لفظي", "/ˌkɒləˈkeɪʃən/", "Noun", "Words that naturally go together"),
        WordGlossaryMatch("negotiate", "يتفاوض", "/nɪˈɡoʊʃieɪt/", "Verb", "Discuss terms to reach agreement"),
        WordGlossaryMatch("recommend", "يوصي بـ / يقترح", "/ˌrekəˈmend/", "Verb", "Suggest something as good"),
        WordGlossaryMatch("urgent", "عاجل / طارئ", "/ˈɜːrdʒənt/", "Adjective", "Requiring immediate action"),
        WordGlossaryMatch("confirm", "يؤكّد", "/kənˈfɜːrm/", "Verb", "Verify that something is true or set"),
        WordGlossaryMatch("apologize", "يعتذر", "/əˈpɒlədʒaɪz/", "Verb", "Express regret for a mistake"),
        WordGlossaryMatch("arrive", "يصل", "/əˈraɪv/", "Verb", "Reach a destination"),
        WordGlossaryMatch("depart", "يغادر", "/dɪˈpɑːrt/", "Verb", "Leave to begin a journey"),
        WordGlossaryMatch("explore", "يستكشف", "/ɪkˈsplɔːr/", "Verb", "Travel through to learn about"),
        WordGlossaryMatch("listen", "يستمع", "/ˈlɪsən/", "Verb", "Pay attention to sound"),
        WordGlossaryMatch("remember", "يتذكر", "/rɪˈmembər/", "Verb", "Bring back to mind"),
        WordGlossaryMatch("forget", "ينسى", "/fərˈɡet/", "Verb", "Fail to remember"),
        WordGlossaryMatch("believe", "يؤمن / يصدّق", "/bɪˈliːv/", "Verb", "Accept as true"),
        WordGlossaryMatch("notice", "يلاحظ", "/ˈnoʊtɪs/", "Verb", "Become aware of"),
        WordGlossaryMatch("protect", "يحمي", "/prəˈtekt/", "Verb", "Keep safe from harm"),
        WordGlossaryMatch("escape", "يهرب", "/ɪˈskeɪp/", "Verb", "Break free from confinement"),
        WordGlossaryMatch("capture", "يقبض على / يأسر", "/ˈkæptʃər/", "Verb", "Catch a person or suspect"),
        WordGlossaryMatch("solve", "يحلّ", "/sɒlv/", "Verb", "Find an answer or explanation"),
        WordGlossaryMatch("search", "يبحث", "/sɜːrtʃ/", "Verb", "Look carefully to find something"),
        WordGlossaryMatch("verify", "يتحقّق من", "/ˈverɪfaɪ/", "Verb", "Check that information is accurate"),
        WordGlossaryMatch("investigate", "يحقق في", "/ɪnˈvestɪɡeɪt/", "Verb", "Carry out a systematic inquiry"),
        WordGlossaryMatch("concealed", "مخفي / مستور", "/kənˈsiːld/", "Adjective", "Kept out of sight"),
        WordGlossaryMatch("discarded", "مرمي / مهمل", "/dɪsˈkɑːrdɪd/", "Adjective", "Thrown away as no longer useful"),
        WordGlossaryMatch("subdued", "خافت / هادئ", "/səbˈdjuːd/", "Adjective", "Quiet and under control"),
        WordGlossaryMatch("valuable", "قيّم / ثمين", "/ˈvæljuəbl/", "Adjective", "Worth a great deal of money"),
        WordGlossaryMatch("dangerous", "خطير", "/ˈdeɪndʒərəs/", "Adjective", "Likely to cause harm"),
        WordGlossaryMatch("calm", "هادئ", "/kɑːm/", "Adjective", "Peaceful and free from agitation"),
        WordGlossaryMatch("nervous", "متوتر", "/ˈnɜːrvəs/", "Adjective", "Anxious or uneasy"),
        WordGlossaryMatch("curious", "فضولي", "/ˈkjʊəriəs/", "Adjective", "Eager to know or learn"),
        WordGlossaryMatch("clever", "ذكي / بارع", "/ˈklevər/", "Adjective", "Quick to understand and devise"),
        WordGlossaryMatch("sudden", "مفاجئ", "/ˈsʌdən/", "Adjective", "Happening quickly without warning"),
        WordGlossaryMatch("recent", "حديث", "/ˈriːsənt/", "Adjective", "Having happened not long ago"),
        WordGlossaryMatch("ancient", "قديم جداً / أثري", "/ˈeɪnʃənt/", "Adjective", "Belonging to the distant past"),
        WordGlossaryMatch("famous", "مشهور", "/ˈfeɪməs/", "Adjective", "Known about by many people"),
        WordGlossaryMatch("quietly", "بهدوء", "/ˈkwaɪətli/", "Adverb", "With little or no noise"),
        WordGlossaryMatch("carefully", "بحذر / بعناية", "/ˈkeərfəli/", "Adverb", "In a way that avoids mistakes"),
        WordGlossaryMatch("suddenly", "فجأة", "/ˈsʌdənli/", "Adverb", "Quickly and unexpectedly"),
        WordGlossaryMatch("finally", "أخيراً", "/ˈfaɪnəli/", "Adverb", "After a long time or sequence"),
        WordGlossaryMatch("alone", "بمفرده / وحيداً", "/əˈloʊn/", "Adverb", "Without anyone else present"),
        WordGlossaryMatch("instead", "بدلاً من ذلك", "/ɪnˈsted/", "Adverb", "As an alternative or substitute"),
        WordGlossaryMatch("against", "ضد", "/əˈɡenst/", "Preposition", "In opposition to"),
        WordGlossaryMatch("through", "عبر / من خلال", "/θruː/", "Preposition", "Moving in one side and out the other"),
        WordGlossaryMatch("between", "بين", "/bɪˈtwiːn/", "Preposition", "In the space separating two things"),
        WordGlossaryMatch("behind", "خلف / وراء", "/bɪˈhaɪnd/", "Preposition", "At the back of"),
        WordGlossaryMatch("outside", "بالخارج", "/ˌaʊtˈsaɪd/", "Preposition", "On the exterior of"),
        WordGlossaryMatch("inside", "بالداخل", "/ˌɪnˈsaɪd/", "Preposition", "Within the inner part")
    )

    private val dictionaryIndex: Map<String, WordGlossaryMatch> by lazy {
        val map = LinkedHashMap<String, WordGlossaryMatch>(512)

        fun putIfAbsent(key: String, match: WordGlossaryMatch) {
            val normalized = key.trim().lowercase()
            if (normalized.length >= 3 && normalized !in stopWords && !map.containsKey(normalized)) {
                map[normalized] = match
            }
        }

        // Priority 1: Extra curated crime, story, & general high-utility words
        extraVocabulary.forEach { item ->
            putIfAbsent(item.word, item)
        }

        // Priority 2: 200-Word Club Week 1 & Week 2 words
        (Week1Words.words + Week2Words.words).forEach { item ->
            putIfAbsent(
                item.word,
                WordGlossaryMatch(
                    word = item.word,
                    arabic = item.arabic,
                    partOfSpeech = item.domain.label,
                    meaning = item.meaning
                )
            )
        }

        // Priority 3: Curated Dictionary entries (only single words or base tokens for token underlining)
        CuratedDictionary.entries.forEach { entry ->
            val match = WordGlossaryMatch(
                word = entry.english,
                arabic = entry.arabic,
                phonetic = entry.phonetic,
                partOfSpeech = entry.partOfSpeech,
                meaning = entry.exampleEn,
                exampleAr = entry.exampleAr
            )
            val clean = entry.english.trim().lowercase()
            putIfAbsent(clean, match)
            if (' ' in clean) {
                // Also allow first meaningful word if not yet mapped
                val first = clean.substringBefore(' ')
                if (first.length >= 4 && first !in stopWords) {
                    putIfAbsent(first, match)
                }
            }
        }

        map
    }

    fun lookup(rawToken: String): WordGlossaryMatch? {
        val cleaned = rawToken
            .trim()
            .lowercase()
            .removeSuffix("'s")
            .removeSuffix("’s")
            .trim { !it.isLetter() }
        if (cleaned.length < 3 || cleaned in stopWords) return null

        dictionaryIndex[cleaned]?.let { return it }

        // Morphological suffix candidates
        val candidates = buildList {
            if (cleaned.endsWith("ies") && cleaned.length > 4) add(cleaned.dropLast(3) + "y")
            if (cleaned.endsWith("ied") && cleaned.length > 4) add(cleaned.dropLast(3) + "y")
            if (cleaned.endsWith("es") && cleaned.length > 4) add(cleaned.dropLast(2))
            if (cleaned.endsWith("s") && cleaned.length > 3) add(cleaned.dropLast(1))
            if (cleaned.endsWith("ed") && cleaned.length > 4) {
                add(cleaned.dropLast(2))
                add(cleaned.dropLast(1))
            }
            if (cleaned.endsWith("ing") && cleaned.length > 5) {
                add(cleaned.dropLast(3))
                add(cleaned.dropLast(3) + "e")
            }
            if (cleaned.endsWith("ly") && cleaned.length > 4) add(cleaned.dropLast(2))
            if (cleaned.endsWith("er") && cleaned.length > 4) {
                add(cleaned.dropLast(2))
                add(cleaned.dropLast(1))
            }
        }
        for (candidate in candidates) {
            dictionaryIndex[candidate]?.let { base ->
                return base.copy(word = cleaned.replaceFirstChar { it.uppercase() })
            }
        }
        return null
    }

    fun isKnownWord(rawToken: String): Boolean = lookup(rawToken) != null
}
