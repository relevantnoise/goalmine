import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { circleName, personalDefinition, hoursPerWeek, currentChallenges, specificGoal } = await req.json()

    console.log('🎯 Generating goal suggestions for:', { circleName, hoursPerWeek })

    // Construct a sophisticated prompt for goal suggestions
    const prompt = `As an expert life coach specializing in the 5 Circle Framework™, generate 3 personalized goal suggestions for someone's ${circleName} circle.

CONTEXT:
- Circle: ${circleName}
- Personal Definition: "${personalDefinition}"
- Time Allocated: ${hoursPerWeek} hours per week
- Current Challenges: "${currentChallenges || 'None mentioned'}"
- Specific Goal Mentioned: "${specificGoal || 'None mentioned'}"

REQUIREMENTS:
1. Goals must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Goals should respect the ${hoursPerWeek} hours/week time allocation
3. Address the personal definition and current challenges
4. Be inspiring yet realistic
5. Consider the specific goal if mentioned

For each goal suggestion, provide:
- title: Clear, action-oriented goal title (max 50 characters)
- description: Detailed description of what success looks like (max 150 characters)
- reasoning: Why this goal fits their situation and definition (max 100 characters)
- timeCommitment: Realistic time requirement that fits within ${hoursPerWeek} hours/week

Respond in JSON format with a "suggestions" array containing exactly 3 goal objects.

Example format:
{
  "suggestions": [
    {
      "title": "Daily 20-minute meditation practice",
      "description": "Establish consistent mindfulness routine to deepen spiritual connection and reduce stress",
      "reasoning": "Builds on your definition of spirituality while addressing stress challenges",
      "timeCommitment": "2.5 hours weekly"
    }
  ]
}`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert life coach specializing in the proprietary 5 Circle Framework™ for life complexity management. You help ambitious professionals create meaningful, achievable goals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const openAIData = await openAIResponse.json()
    
    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('No content received from OpenAI')
    }

    const content = openAIData.choices[0].message.content
    console.log('🤖 AI Response:', content)

    try {
      const suggestions = JSON.parse(content)
      console.log('✅ Parsed suggestions:', suggestions)

      // Validate the response structure
      if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
        throw new Error('Invalid response structure from AI')
      }

      // Ensure we have exactly 3 suggestions with required fields
      const validSuggestions = suggestions.suggestions.slice(0, 3).map((suggestion: any) => ({
        title: suggestion.title?.substring(0, 50) || 'Goal Title',
        description: suggestion.description?.substring(0, 150) || 'Goal description',
        reasoning: suggestion.reasoning?.substring(0, 100) || 'Fits your circle focus',
        timeCommitment: suggestion.timeCommitment || `${Math.ceil(hoursPerWeek / 3)} hours weekly`
      }))

      return new Response(JSON.stringify({
        suggestions: validSuggestions,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.log('Raw content:', content)
      
      // Return fallback suggestions if AI response can't be parsed
      const fallbackSuggestions = getFallbackSuggestions(circleName, hoursPerWeek)
      
      return new Response(JSON.stringify({
        suggestions: fallbackSuggestions,
        success: true,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    console.error('❌ Error generating goal suggestions:', error)
    
    // Return fallback suggestions on any error
    const fallbackSuggestions = getFallbackSuggestions('General', 5)
    
    return new Response(JSON.stringify({
      suggestions: fallbackSuggestions,
      success: false,
      error: error.message,
      fallback: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 with fallback instead of error
    })
  }
})

function getFallbackSuggestions(circleName: string, hoursPerWeek: number) {
  const fallbacks: Record<string, any[]> = {
    'Spiritual': [
      {
        title: 'Daily Meditation Practice',
        description: 'Establish 10-15 minutes of daily mindfulness meditation to center yourself',
        reasoning: 'Builds consistent spiritual foundation with minimal time commitment',
        timeCommitment: '2 hours weekly'
      },
      {
        title: 'Weekly Reflection Journal',
        description: 'Write weekly reflections on gratitude, growth, and life purpose',
        reasoning: 'Deepens self-awareness and spiritual connection through writing',
        timeCommitment: '1 hour weekly'
      },
      {
        title: 'Nature Connection Ritual',
        description: 'Spend time in nature weekly for spiritual renewal and grounding',
        reasoning: 'Connects you with larger purpose through natural world',
        timeCommitment: '2 hours weekly'
      }
    ],
    'Friends & Family': [
      {
        title: 'Weekly One-on-One Time',
        description: 'Schedule individual quality time with each important family member',
        reasoning: 'Strengthens relationships through intentional connection',
        timeCommitment: '3 hours weekly'
      },
      {
        title: 'Monthly Social Gathering',
        description: 'Host or organize monthly gatherings to maintain friend connections',
        reasoning: 'Maintains social network through consistent group interaction',
        timeCommitment: '4 hours monthly'
      },
      {
        title: 'Daily Check-in Ritual',
        description: 'Brief daily check-ins with spouse/partner and key family members',
        reasoning: 'Maintains daily connection without major time investment',
        timeCommitment: '2 hours weekly'
      }
    ],
    'Work': [
      {
        title: 'Skill Development Plan',
        description: 'Master one new professional skill relevant to career advancement',
        reasoning: 'Enhances value and opens new opportunities',
        timeCommitment: `${Math.ceil(hoursPerWeek * 0.6)} hours weekly`
      },
      {
        title: 'Strategic Project Leadership',
        description: 'Lead a high-impact project that showcases your capabilities',
        reasoning: 'Demonstrates leadership and drives career progression',
        timeCommitment: `${Math.ceil(hoursPerWeek * 0.8)} hours weekly`
      },
      {
        title: 'Professional Network Expansion',
        description: 'Build strategic relationships within and outside your organization',
        reasoning: 'Creates opportunities through expanded professional network',
        timeCommitment: '2 hours weekly'
      }
    ],
    'Personal Development': [
      {
        title: 'Learning Challenge',
        description: 'Complete a challenging course or certification in an area of interest',
        reasoning: 'Expands knowledge and capabilities for personal growth',
        timeCommitment: `${Math.ceil(hoursPerWeek * 0.7)} hours weekly`
      },
      {
        title: 'Creative Skill Building',
        description: 'Develop a creative skill that brings joy and self-expression',
        reasoning: 'Enhances life satisfaction through creative fulfillment',
        timeCommitment: '3 hours weekly'
      },
      {
        title: 'Reading & Knowledge Goal',
        description: 'Read specific books or content to expand perspective and wisdom',
        reasoning: 'Builds knowledge foundation for continued growth',
        timeCommitment: '4 hours weekly'
      }
    ],
    'Health & Fitness': [
      {
        title: 'Consistent Exercise Routine',
        description: 'Establish sustainable workout routine you genuinely enjoy',
        reasoning: 'Physical health supports all other life areas effectively',
        timeCommitment: `${Math.ceil(hoursPerWeek * 0.8)} hours weekly`
      },
      {
        title: 'Nutrition Optimization',
        description: 'Improve eating habits through meal planning and mindful choices',
        reasoning: 'Better nutrition enhances energy for all life circles',
        timeCommitment: '2 hours weekly'
      },
      {
        title: 'Sleep Quality Improvement',
        description: 'Optimize sleep schedule and environment for better rest',
        reasoning: 'Quality sleep is foundation for peak performance',
        timeCommitment: '1 hour weekly setup'
      }
    ]
  }

  return fallbacks[circleName] || fallbacks['Personal Development']
}