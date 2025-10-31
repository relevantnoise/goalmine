import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      currentData, 
      userResponse, 
      conversationHistory = [],
      mode = 'analyze' // 'analyze' or 'ask_followup'
    } = await req.json()

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are Dan Lynn, a top management consultant with 30 years of experience helping high-achievers manage complex lives. You've developed the proprietary "5 Circle Framework™" while juggling an AT&T strategy role, MBA at Rutgers, wife, and two kids under 3.

Your expertise: Breaking down overwhelming life's complexities into manageable, interconnected circles.

The 5 Circles:
1. Spiritual - Core values, purpose, meaning, faith/philosophy
2. Friends & Family - Relationships, social connections, family time
3. Work - Career, professional development, income
4. Personal Development - Learning, skills, hobbies, growth
5. Health & Fitness - Physical health, exercise, nutrition, energy

CONSULTANT PERSONA:
- Warm but direct, like talking to a trusted advisor
- Ask probing questions that reveal deeper insights
- Use "you" language and speak conversationally
- Reference your 30-year track record when appropriate
- Help them see connections between circles
- Focus on practical, actionable insights

CURRENT TASK: ${mode === 'analyze' ? 'Analyze what information is missing and determine next steps' : 'Ask intelligent follow-up questions to gather missing information'}`

    if (mode === 'analyze') {
      // Analyze current data and determine what's missing
      const analysisPrompt = `Based on the current data, analyze what's missing and determine the best next step:

Current Data: ${JSON.stringify(currentData, null, 2)}

Determine:
1. What critical information is missing?
2. What would be the most insightful next question to ask?
3. Should we proceed to create the framework or gather more info?

Respond with JSON:
{
  "canProceed": boolean,
  "missingAreas": ["area1", "area2"],
  "nextQuestion": "specific question to ask",
  "reasoning": "why this question matters"
}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      const result = await response.json()
      let analysis

      try {
        analysis = JSON.parse(result.choices[0].message.content)
      } catch (e) {
        // Fallback if JSON parsing fails
        analysis = {
          canProceed: false,
          missingAreas: ['unknown'],
          nextQuestion: "Let me ask you about your biggest life challenge right now - what's keeping you up at night?",
          reasoning: "Starting with challenges helps identify priorities"
        }
      }

      return new Response(JSON.stringify({
        success: true,
        analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      // Generate conversational follow-up based on user response
      const conversationPrompt = `Previous conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User just responded: "${userResponse}"

Current framework data: ${JSON.stringify(currentData, null, 2)}

As Dan Lynn, respond conversationally. Either:
1. Ask another insightful follow-up question, OR
2. If you have enough info, say "Great! I think we have what we need to build your framework."

Keep responses to 1-2 sentences max. Be warm and consultant-like.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationPrompt }
          ],
          temperature: 0.8,
          max_tokens: 200
        })
      })

      const result = await response.json()
      const consultantResponse = result.choices[0].message.content

      return new Response(JSON.stringify({
        success: true,
        consultantResponse,
        shouldContinue: !consultantResponse.includes("we have what we need")
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    console.error('Error in five-circle-consultant:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})