// Shared AI Generation Module
// This module contains the sophisticated ChatGPT prompt system
// and can be imported by any function that needs AI content generation

interface GenerateMotivationRequest {
  goalId?: string;
  goalTitle: string;
  goalDescription?: string;
  tone: string;
  streakCount: number;
  userId: string;
  isNudge?: boolean;
  targetDate?: string;
}

interface MotivationContent {
  message: string;
  microPlan: string[];
  challenge: string;
}

export class AIGenerator {
  private openAIApiKey: string;

  constructor(openAIApiKey: string) {
    this.openAIApiKey = openAIApiKey;
  }

  // Enhanced tone personalities for life-changing coaching
  private getTonePersonalities() {
    return {
      drill_sergeant: "You are a no-nonsense military drill instructor who demands excellence. You're tough but fair, direct but caring. You use military-style language, challenge excuses, and focus on discipline, commitment, and action. You don't coddle - you push. But everything comes from wanting to see this person WIN.",
      kind_encouraging: "You are a warm, empathetic coach who believes deeply in this person's potential. You're gentle but not soft, supportive but not enabling. You use nurturing language, acknowledge struggles with compassion, and focus on self-compassion, gradual progress, and inner strength. You celebrate every small win.",
      teammate: "You are their equal partner in this journey - not above them, but beside them. You use 'we' language, share in both struggles and victories, and focus on collaboration, mutual support, and collective problem-solving. You're the friend who shows up and does the hard work alongside them.",
      wise_mentor: "You are a sage advisor with deep life experience and wisdom. You use thoughtful, reflective language, share philosophical insights, and focus on the deeper meaning, life lessons, and long-term growth. You help them see the bigger picture and their goal as part of their life's journey."
    };
  }

  // Goal-specific expertise system
  private getGoalExpertise(goalTitle: string, goalDescription: string = '') {
    const goalText = `${goalTitle} ${goalDescription}`.toLowerCase();
    
    if (goalText.includes('quit smoking') || goalText.includes('stop smoking')) {
      return {
        expertise: 'You have deep expertise in smoking cessation, understanding nicotine addiction, withdrawal symptoms, triggers, and proven strategies.',
        challenges: ['nicotine cravings', 'habit triggers', 'social situations', 'stress management'],
        strategies: ['replacement behaviors', 'deep breathing', 'trigger avoidance', 'support systems']
      };
    }
    
    if (goalText.includes('lose weight') || goalText.includes('weight loss') || goalText.includes('diet')) {
      return {
        expertise: 'You understand the psychology of eating, sustainable habits, and the emotional aspects of weight management.',
        challenges: ['emotional eating', 'social food situations', 'plateau periods', 'motivation fluctuations'],
        strategies: ['meal planning', 'mindful eating', 'gradual changes', 'non-food rewards']
      };
    }
    
    if (goalText.includes('exercise') || goalText.includes('workout') || goalText.includes('fitness')) {
      return {
        expertise: 'You understand exercise physiology, habit formation, and overcoming fitness barriers.',
        challenges: ['time constraints', 'motivation dips', 'physical discomfort', 'consistency issues'],
        strategies: ['progressive overload', 'habit stacking', 'accountability systems', 'variety in routines']
      };
    }
    
    if (goalText.includes('business') || goalText.includes('startup') || goalText.includes('entrepreneur')) {
      return {
        expertise: 'You understand the entrepreneurial journey, market challenges, and building sustainable businesses.',
        challenges: ['market validation', 'funding concerns', 'time management', 'imposter syndrome'],
        strategies: ['MVP development', 'customer feedback loops', 'revenue focus', 'networking']
      };
    }
    
    if (goalText.includes('learn') || goalText.includes('study') || goalText.includes('skill')) {
      return {
        expertise: 'You understand learning science, skill acquisition, and overcoming learning barriers.',
        challenges: ['information overload', 'practice consistency', 'plateaus', 'application gaps'],
        strategies: ['spaced repetition', 'active practice', 'teaching others', 'real-world application']
      };
    }

    // Default expertise for any goal
    return {
      expertise: 'You understand goal psychology, habit formation, and the mental challenges of personal growth.',
      challenges: ['motivation fluctuations', 'consistency issues', 'setback recovery', 'progress tracking'],
      strategies: ['small wins', 'habit stacking', 'accountability systems', 'progress celebration']
    };
  }

  async generateMotivation(params: GenerateMotivationRequest): Promise<MotivationContent> {
    const { goalTitle, goalDescription = '', tone, streakCount, isNudge = false, targetDate } = params;

    console.log(`[AI-GENERATOR] Generating content for: ${goalTitle} (tone: ${tone}, streak: ${streakCount})`);

    const tonePersonalities = this.getTonePersonalities();
    const goalExpertise = this.getGoalExpertise(goalTitle, goalDescription);

    // Enhanced streak analysis
    const isNewGoal = streakCount <= 3;
    const isStrongStreak = streakCount >= 7;
    const isStrugglingStreak = streakCount === 0;

    const systemPrompt = `You are an AI-powered personal coach for GoalMine.ai, specifically helping someone achieve: "${goalTitle}"${goalDescription ? ` (${goalDescription})` : ''}.

COACHING PERSONALITY:
${tonePersonalities[tone] || tonePersonalities.kind_encouraging}

GOAL EXPERTISE:
${goalExpertise.expertise}
Common challenges for this goal: ${goalExpertise.challenges.join(', ')}
Proven strategies: ${goalExpertise.strategies.join(', ')}

CURRENT SITUATION:
- Goal: "${goalTitle}"
- Current streak: ${streakCount} days
- Status: ${isNewGoal ? 'Just getting started' : isStrongStreak ? 'Strong momentum' : isStrugglingStreak ? 'May be struggling' : 'Making progress'}
- Deadline: ${targetDate || 'No deadline set'}
- Request type: ${isNudge ? 'Urgent motivation nudge' : 'Daily motivation content'}

CREATE LIFE-CHANGING CONTENT:

${isNudge ? `
Generate URGENT NUDGE content - pure motivational fuel for immediate action:

Return JSON with:
{
  "message": "Write a powerful 20-30 word motivational message specifically for '${goalTitle}'. Use authentic ${tone} voice. Be direct about WHY this goal matters to their life. Create emotional urgency without being preachy. Reference their specific goal situation, not generic motivation. Make them WANT to take action right now.",
  "microPlan": [""],
  "challenge": ""
}` : `
Generate DAILY MOTIVATION content - this person needs meaningful, specific guidance:

Return JSON with:
{
  "message": "Write 2-3 sentences of deeply specific advice for TODAY's work on '${goalTitle}'. Address their current streak (${streakCount} days), use goal-specific expertise, and authentic ${tone} tone. Avoid generic motivation - be practical and insightful.",
  "microPlan": ["Give exactly 3 specific actions they can take today (each 5-30 minutes) to advance '${goalTitle}'. Be concrete, build on each other logically, and specific to this goal type."],
  "challenge": "Create a meaningful reflection or mini-challenge tied specifically to '${goalTitle}' that encourages deeper engagement. One impactful sentence."
}`}

CRITICAL REQUIREMENTS:
- Be SPECIFIC to "${goalTitle}" - not generic goal advice
- Use authentic ${tone} voice throughout
- Reference their ${streakCount}-day streak contextually
- Draw from proven strategies for this goal type
- Make every word count toward their success
- Be their advocate, guide, and source of practical wisdom

This person chose you as their coach because they want to achieve something meaningful. Help them WIN.`;

    // Bulletproof AI generation with retry logic and multiple models
    const models = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    
    for (const model of models) {
      try {
        console.log(`[AI-GENERATOR] Attempting with ${model}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate today's motivation for my goal: "${goalTitle}"` }
            ],
            temperature: 0.8,
            max_tokens: 500,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error (${model}): ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        console.log(`[AI-GENERATOR] ✅ Success with ${model}`);
        
        return {
          message: content.message,
          microPlan: Array.isArray(content.microPlan) ? content.microPlan : [content.microPlan].filter(Boolean),
          challenge: content.challenge
        };

      } catch (error: any) {
        console.error(`[AI-GENERATOR] ${model} failed:`, error.message);
        if (model === models[models.length - 1]) {
          console.error('[AI-GENERATOR] All models failed, throwing error');
          throw error;
        }
        console.log(`[AI-GENERATOR] Trying next model...`);
      }
    }

    throw new Error('All AI models failed to generate content');
  }
}