package com.example.data.content

import com.example.data.model.CefrLevel
import com.example.data.model.HighlightedPhrase
import com.example.data.model.RoleplayLine
import com.example.data.model.RoleplayScenario

object OfflineRoleplayGenerator {

    val presetTopics = listOf(
        "Café & Bakery Order",
        "Airport Boarding Gate",
        "Doctor & Pharmacy Visit",
        "Market Bargain & Shopping",
        "Job Interview Prep",
        "Hosting a Friend in Town"
    )

    val presetTones = listOf("Friendly", "Funny", "Urgent", "Mysterious")

    fun generate(
        topicInput: String,
        cefrLevel: CefrLevel,
        tone: String
    ): RoleplayScenario {
        val cleanTopic = topicInput.trim().ifBlank { "Café & Bakery Order" }.take(80)
        val key = cleanTopic.lowercase()
        val toneTwist = when (tone.lowercase()) {
            "funny" -> "Plot Twist: Someone accidentally swaps your order with a giant birthday cake!"
            "urgent" -> "Plot Twist: Your train leaves in 7 minutes—finish the conversation fast!"
            "mysterious" -> "Plot Twist: A folded envelope with your name on it appears on the counter!"
            else -> "Plot Twist: An old friend walks in and joins the conversation!"
        }

        return when {
            key.contains("airport") || key.contains("flight") || key.contains("travel") -> buildAirport(cleanTopic, cefrLevel, toneTwist)
            key.contains("doctor") || key.contains("pharmacy") || key.contains("clinic") -> buildClinic(cleanTopic, cefrLevel, toneTwist)
            key.contains("market") || key.contains("shop") || key.contains("bargain") -> buildMarket(cleanTopic, cefrLevel, toneTwist)
            key.contains("job") || key.contains("interview") || key.contains("work") -> buildInterview(cleanTopic, cefrLevel, toneTwist)
            key.contains("café") || key.contains("cafe") || key.contains("coffee") || key.contains("bakery") -> buildCafe(cleanTopic, cefrLevel, toneTwist)
            else -> buildCustomTopic(cleanTopic, cefrLevel, tone, toneTwist)
        }
    }

    private fun buildCafe(topic: String, level: CefrLevel, twist: String): RoleplayScenario = when (level) {
        CefrLevel.A1, CefrLevel.A2 -> RoleplayScenario(
            id = "offline_${System.currentTimeMillis()}",
            title = topic,
            setting = "Cozy Corner Café • Offline Scene",
            cefrLevel = level,
            roleAName = "Customer",
            roleBName = "Barista",
            goal = "Order a drink, ask about ingredients, and pay politely.",
            lines = listOf(
                RoleplayLine("B", "Good morning! Welcome to Sunshine Café. What would you like today?", "Greet and ask for order", listOf(
                    HighlightedPhrase("What would you like?", "Polite offer at a café or shop", "What would you like to drink with your breakfast?")
                )),
                RoleplayLine("A", "Hi! Can I have a medium latte and a cheese croissant, please?", "Order a drink and snack politely", listOf(
                    HighlightedPhrase("Can I have... please?", "Everyday polite request", "Can I have a glass of water, please?")
                )),
                RoleplayLine("B", "Sure! Would you like that for here or to take away?", "Ask dine-in or takeaway", listOf(
                    HighlightedPhrase("to take away", "Take food out instead of eating inside", "Two teas to take away, please.")
                )),
                RoleplayLine("A", "For here, thanks. Does the croissant have any nuts?", "Choose dine-in and ask about allergies", listOf(
                    HighlightedPhrase("For here", "Eat inside the café", "We'll have our coffee for here.")
                )),
                RoleplayLine("B", "No nuts at all! Your total is six dollars and fifty cents.", "Confirm ingredients and give total"),
                RoleplayLine("A", "Great, here you go. Keep the change!", "Pay and thank the barista", listOf(
                    HighlightedPhrase("Keep the change", "Let the staff keep extra coins as a tip", "It's $9.50—here's $10, keep the change.")
                ))
            ),
            plotTwists = listOf(twist, "Plot Twist: The espresso machine makes a loud whistle and everyone laughs!")
        )
        CefrLevel.B1, CefrLevel.B2 -> RoleplayScenario(
            id = "offline_${System.currentTimeMillis()}",
            title = topic,
            setting = "Artisan Roastery • Offline Scene",
            cefrLevel = level,
            roleAName = "Regular Guest",
            roleBName = "Head Barista",
            goal = "Ask for a custom recommendation and resolve a mix-up smoothly.",
            lines = listOf(
                RoleplayLine("B", "Morning! Feel like your usual flat white, or are you in the mood to switch things up?", "Offer usual order or something new", listOf(
                    HighlightedPhrase("switch things up", "Try something different for a change", "Let's switch things up and walk by the river.")
                )),
                RoleplayLine("A", "Honestly, I'm wiped out today. What do you recommend that packs a punch without being overly sweet?", "Ask for a strong, not-too-sweet drink", listOf(
                    HighlightedPhrase("wiped out", "Very tired or exhausted", "After three hours of study, I'm completely wiped out.")
                )),
                RoleplayLine("B", "You can't go wrong with our double cortado—smooth espresso with just a splash of oat milk.", "Recommend a bold drink", listOf(
                    HighlightedPhrase("You can't go wrong with...", "Safe, reliable recommendation", "You can't go wrong with the homemade soup.")
                )),
                RoleplayLine("A", "Sounds spot on. By the way, could we swap out the dairy milk for almond?", "Request a substitution politely", listOf(
                    HighlightedPhrase("spot on", "Exactly right / ideal", "Your guess about the ending was spot on!")
                )),
                RoleplayLine("B", "Consider it done. Hang tight for two minutes and I'll bring it straight to your table.", "Confirm and ask guest to wait briefly", listOf(
                    HighlightedPhrase("Hang tight", "Wait patiently for a short moment", "Hang tight—I'll grab my coat and join you.")
                )),
                RoleplayLine("A", "Much appreciated! Take your time—I'm catching up on messages anyway.", "Thank warmly")
            ),
            plotTwists = listOf(twist, "Plot Twist: Today is the café's anniversary so every pastry is on the house!")
        )
    }

    private fun buildAirport(topic: String, level: CefrLevel, twist: String): RoleplayScenario = RoleplayScenario(
        id = "offline_${System.currentTimeMillis()}",
        title = topic,
        setting = "International Departure Gate • Offline Scene",
        cefrLevel = level,
        roleAName = "Passenger",
        roleBName = "Gate Agent",
        goal = "Check boarding status, ask about seat changes, and stay calm under pressure.",
        lines = listOf(
            RoleplayLine("A", if (level == CefrLevel.A1 || level == CefrLevel.A2) "Excuse me, is this the gate for flight 204 to London?" else "Excuse me, could you confirm whether Flight 204 is still departing on schedule?", "Check flight gate/status", listOf(
                HighlightedPhrase("on schedule", "Happening at the planned time", "Despite the rain, the train arrived right on schedule.")
            )),
            RoleplayLine("B", if (level == CefrLevel.A1 || level == CefrLevel.A2) "Yes, it is! Boarding starts in twenty minutes. Can I see your passport?" else "Yes, we're right on track. Boarding begins shortly—may I scan your boarding pass?", "Confirm gate and check document"),
            RoleplayLine("A", if (level == CefrLevel.A1 || level == CefrLevel.A2) "Here is my ticket. Is there a window seat free?" else "Here you go. By any chance, are there any window seats left?", "Ask politely for a window seat", listOf(
                HighlightedPhrase("By any chance", "Polite way to ask if something is possible", "Do you have a pen by any chance?")
            )),
            RoleplayLine("B", "Let me take a quick look... You're in luck! Seat 14A just opened up.", "Check system and offer seat 14A", listOf(
                HighlightedPhrase("You're in luck", "Good news—things worked out well", "You're in luck, the bakery has one loaf left!")
            )),
            RoleplayLine("A", "Awesome, thank you so much! Where do I put my carry-on bag?", "Thank and ask about luggage"),
            RoleplayLine("B", "It fits right in the overhead bin above your row. Have a wonderful flight!", "Explain overhead storage and wish a nice trip")
        ),
        plotTwists = listOf(twist, "Plot Twist: An announcement offers free business-class upgrades to anyone who speaks two languages!")
    )

    private fun buildClinic(topic: String, level: CefrLevel, twist: String): RoleplayScenario = RoleplayScenario(
        id = "offline_${System.currentTimeMillis()}",
        title = topic,
        setting = "Neighborhood Clinic & Pharmacy • Offline Scene",
        cefrLevel = level,
        roleAName = "Patient",
        roleBName = "Pharmacist",
        goal = "Describe symptoms clearly and understand dosage instructions.",
        lines = listOf(
            RoleplayLine("B", "Hello there! How can I help you feel better today?", "Welcome and ask what's wrong"),
            RoleplayLine("A", if (level == CefrLevel.A1 || level == CefrLevel.A2) "I have a sore throat and a mild fever since yesterday." else "I've been under the weather since Tuesday with a scratchy throat and fatigue.", "Describe symptoms clearly", listOf(
                HighlightedPhrase("under the weather", "Feeling slightly sick or unwell", "I'm staying home today because I feel a bit under the weather.")
            )),
            RoleplayLine("B", "Got it. Do you have any allergies to medicine?", "Check allergies"),
            RoleplayLine("A", "No allergies. What do you suggest I take?", "Confirm no allergies and ask advice"),
            RoleplayLine("B", "Take one tablet after meals twice a day, and drink plenty of warm fluids.", "Give clear dosage directions", listOf(
                HighlightedPhrase("twice a day", "Two times each day", "Water the plants twice a day in summer.")
            )),
            RoleplayLine("A", "Thank you! I'll rest up and follow those instructions.", "Acknowledge and thank")
        ),
        plotTwists = listOf(twist)
    )

    private fun buildMarket(topic: String, level: CefrLevel, twist: String): RoleplayScenario = RoleplayScenario(
        id = "offline_${System.currentTimeMillis()}",
        title = topic,
        setting = "Weekend Craft & Spice Market • Offline Scene",
        cefrLevel = level,
        roleAName = "Shopper",
        roleBName = "Vendor",
        goal = "Compare items, negotiate a friendly bundle price, and seal the deal.",
        lines = listOf(
            RoleplayLine("B", "Step right up! Everything here is handmade—what catches your eye?", "Greet shopper warmly", listOf(
                HighlightedPhrase("catches your eye", "Attracts your attention", "Tell me if any jacket catches your eye.")
            )),
            RoleplayLine("A", "That ceramic mug looks great! How much are you asking for it?", "Ask the price"),
            RoleplayLine("B", "Usually twenty dollars, because it's hand-painted.", "Give price and value"),
            RoleplayLine("A", if (level == CefrLevel.A1 || level == CefrLevel.A2) "If I buy two mugs, can you give me a discount?" else "If I take two as gifts, could you cut me a deal?", "Negotiate a bundle price", listOf(
                HighlightedPhrase("cut me a deal", "Offer a friendly lower price", "Since we buy here every week, could you cut us a deal?")
            )),
            RoleplayLine("B", "Tell you what—take two for thirty-four dollars and I'll wrap them up nicely.", "Offer bundle compromise", listOf(
                HighlightedPhrase("Tell you what", "Used to propose a friendly compromise", "Tell you what—you drive and I'll pay for snacks.")
            )),
            RoleplayLine("A", "Deal! You've got a happy customer.", "Accept cheerfully")
        ),
        plotTwists = listOf(twist)
    )

    private fun buildInterview(topic: String, level: CefrLevel, twist: String): RoleplayScenario = RoleplayScenario(
        id = "offline_${System.currentTimeMillis()}",
        title = topic,
        setting = "Creative Studio Interview • Offline Scene",
        cefrLevel = level,
        roleAName = "Candidate",
        roleBName = "Team Lead",
        goal = "Share strengths, give a quick example of teamwork, and ask a smart question.",
        lines = listOf(
            RoleplayLine("B", "Thanks for coming in! To kick things off, tell me a bit about yourself.", "Start interview warmly", listOf(
                HighlightedPhrase("kick things off", "Start an event or meeting", "Let's kick things off with a quick warm-up quiz.")
            )),
            RoleplayLine("A", "Sure! I love solving practical problems and helping teammates learn new tools quickly.", "Present key strengths"),
            RoleplayLine("B", "Great! How do you handle tight deadlines when two tasks clash?", "Ask behavioral question"),
            RoleplayLine("A", "I break tasks into clear steps, communicate early, and tackle high-impact items first.", "Explain prioritization calmly", listOf(
                HighlightedPhrase("break tasks into steps", "Divide big work into smaller parts", "Let's break this project into three easy steps.")
            )),
            RoleplayLine("B", "Smart approach. Do you have any questions for us before we wrap up?", "Invite candidate's question", listOf(
                HighlightedPhrase("wrap up", "Finish or conclude", "Let's wrap up the session with five fast words.")
            )),
            RoleplayLine("A", "Yes—what would success look like in the first three months on your team?", "Ask thoughtful closing question")
        ),
        plotTwists = listOf(twist)
    )

    private fun buildCustomTopic(topic: String, level: CefrLevel, tone: String, twist: String): RoleplayScenario {
        val greeting = when (level) {
            CefrLevel.A1 -> "Hi! Nice to meet you here at $topic."
            CefrLevel.A2 -> "Hey! I'm glad we met here to talk about $topic."
            CefrLevel.B1 -> "Hey there! Ready to dive into $topic with a $tone vibe?"
            CefrLevel.B2 -> "Good to see you! Shall we get straight to the point on $topic?"
        }
        return RoleplayScenario(
            id = "offline_${System.currentTimeMillis()}",
            title = topic,
            setting = "$topic ($tone Mode • Offline)",
            cefrLevel = level,
            roleAName = "Host",
            roleBName = "Partner",
            goal = "Practice natural turn-taking, follow-up questions, and clear explanations around $topic.",
            lines = listOf(
                RoleplayLine("A", greeting, "Open the scene naturally", listOf(
                    HighlightedPhrase("get straight to the point", "Start discussing the main topic right away", "We only have ten minutes, so let's get straight to the point.")
                )),
                RoleplayLine("B", "Absolutely! Could you walk me through what we need to decide first?", "Ask for the first priority", listOf(
                    HighlightedPhrase("walk me through", "Explain something step by step", "Can you walk me through how this game works?")
                )),
                RoleplayLine("A", "First, let's agree on our main goal so nobody gets confused halfway through.", "Propose clear alignment"),
                RoleplayLine("B", "Makes total sense. What if something unexpected slows us down?", "Ask a backup question", listOf(
                    HighlightedPhrase("Makes total sense", "I completely agree / understand", "Your plan makes total sense to all of us.")
                )),
                RoleplayLine("A", "Then we stay flexible, help each other out, and turn it into a win!", "Stay positive and adaptable"),
                RoleplayLine("B", "Count me in—let's make it happen!", "Confirm enthusiasm", listOf(
                    HighlightedPhrase("Count me in", "Include me, I want to participate", "Are we playing trivia tonight? Count me in!")
                ))
            ),
            plotTwists = listOf(twist, "Plot Twist: You must suddenly explain your last point using only simple A1 words!")
        )
    }
}
