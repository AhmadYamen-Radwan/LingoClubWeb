package com.example.data.content

import com.example.data.model.WeeklyCurriculumWeek
import com.example.data.model.WeeklySessionPlan

object CuratedWeeklyCurriculum {
    val weeks: List<WeeklyCurriculumWeek> = listOf(
        WeeklyCurriculumWeek(
            weekNumber = 1,
            title = "Week 1: Café Mornings & Street Stories",
            subtitle = "200 dedicated words • 5 domains • 3 weekly teaching sessions",
            themeStory = "Follow Maya, Omar, and Tariq through one lively week of coffee mornings, market mysteries, teamwork, and everyday idioms.",
            sessions = listOf(
                WeeklySessionPlan(
                    sessionNumber = 1,
                    dayLabel = "Session 1 • Mon",
                    title = "Home & Café Sparks (Words 1–67)",
                    storyOpening = "Monday morning begins in Maya's cozy kitchen before she walks down to the sunny corner café.",
                    storyClosing = "Challenge your friends to invent 3 sentences connecting a kitchen item with a café order!",
                    teachingTip = "Teach tip: Act out the home & café words quickly before opening the Story Builder game."
                ),
                WeeklySessionPlan(
                    sessionNumber = 2,
                    dayLabel = "Session 2 • Wed",
                    title = "Market Trails & Teamwork (Words 68–134)",
                    storyOpening = "Midweek takes the group from bustling train platforms to a collaborative study project.",
                    storyClosing = "Ask each friend to pick 2 work/travel words and share a quick real-life memory.",
                    teachingTip = "Teach tip: Pair friends up for the Speed Match Sprint to lock in travel & tech verbs."
                ),
                WeeklySessionPlan(
                    sessionNumber = 3,
                    dayLabel = "Session 3 • Fri",
                    title = "Emotions, Twists & Idioms (Words 135–200)",
                    storyOpening = "Friday night wraps up the 200-word quest with dramatic story feelings and natural B2 idioms.",
                    storyClosing = "Celebrate hitting 200 words—generate an AI Kahoot Quiz using this week's focus words!",
                    teachingTip = "Teach tip: Let friends drop a dramatic voice when practicing 'twist' and 'break the ice'."
                )
            ),
            words = Week1Words.words
        ),
        WeeklyCurriculumWeek(
            weekNumber = 2,
            title = "Week 2: Neighborhood Voices & Journeys",
            subtitle = "200 dedicated words • 5 domains • 3 weekly teaching sessions",
            themeStory = "Expand from A1 essentials to B2 fluency as the study club launches a rooftop gathering, ferry trip, and live podcast.",
            sessions = listOf(
                WeeklySessionPlan(
                    sessionNumber = 1,
                    dayLabel = "Session 1 • Mon",
                    title = "Neighborhood & Kitchen Tales (Words 1–67)",
                    storyOpening = "Monday opens in a bright apartment overlooking the park as friends prepare homemade snacks.",
                    storyClosing = "Have each friend describe their favorite room or recipe using 3 new words.",
                    teachingTip = "Teach tip: Use TTS audio on unfamiliar words and compare Arabic meanings together."
                ),
                WeeklySessionPlan(
                    sessionNumber = 2,
                    dayLabel = "Session 2 • Wed",
                    title = "Harbor Ferries & Creative Studios (Words 68–134)",
                    storyOpening = "Wednesday sets sail on a morning ferry while the team brainstorms their first English podcast.",
                    storyClosing = "Run a 60-second Vocab Blitz round covering travel and studio teamwork terms.",
                    teachingTip = "Teach tip: Encourage A1/A2 learners to pair simple nouns with one new action verb."
                ),
                WeeklySessionPlan(
                    sessionNumber = 3,
                    dayLabel = "Session 3 • Fri",
                    title = "Protagonists & Native Phrasal Verbs (Words 135–200)",
                    storyOpening = "Friday night brings dramatic storytelling arcs and natural phrasal verbs like 'dive in' and 'play it by ear'.",
                    storyClosing = "Mark Session 3 complete to earn your Weekly Mastery XP and log your session history!",
                    teachingTip = "Teach tip: Use 'Story Chain' mode so every friend adds one sentence using a target idiom."
                )
            ),
            words = Week2Words.words
        )
    )
}
