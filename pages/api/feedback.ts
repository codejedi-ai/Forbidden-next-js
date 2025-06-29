import { NextApiRequest, NextApiResponse } from 'next'

interface FeedbackRequest {
  question: string
  transcript: string
  duration: number
  jobContext: {
    jobTitle: string
    jobDescription: string
    company: string
  }
}

interface ResponseFeedback {
  content_score: number
  communication_score: number
  confidence_score: number
  detailed_feedback: string
  strengths: string[]
  improvements: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, transcript, duration, jobContext }: FeedbackRequest = req.body

    if (!question || !transcript || !jobContext) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Use Deepseek API for feedback generation
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach providing detailed feedback on interview responses. 

Analyze the candidate's response and provide feedback in this EXACT JSON format:
{
  "content_score": number (1-10),
  "communication_score": number (1-10),
  "confidence_score": number (1-10),
  "detailed_feedback": "detailed analysis string",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Scoring criteria:
- Content Score: Relevance, completeness, accuracy of the answer
- Communication Score: Clarity, structure, articulation
- Confidence Score: Poise, conviction, professional demeanor

Provide constructive, specific feedback that helps the candidate improve.`
          },
          {
            role: 'user',
            content: `Job Context:
Title: ${jobContext.jobTitle}
Company: ${jobContext.company}
Description: ${jobContext.jobDescription}

Interview Question: ${question}

Candidate's Response: ${transcript}

Response Duration: ${duration} seconds

Please analyze this response and provide detailed feedback with scores and actionable insights.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!deepseekResponse.ok) {
      throw new Error(`Deepseek API error: ${deepseekResponse.statusText}`)
    }

    const deepseekData = await deepseekResponse.json()
    const content = deepseekData.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from Deepseek API')
    }

    // Parse the JSON response
    let feedback: ResponseFeedback
    try {
      feedback = JSON.parse(content)
    } catch (parseError) {
      // Fallback to mock feedback if parsing fails
      console.error('Failed to parse Deepseek response:', parseError)
      feedback = generateMockFeedback(transcript, duration)
    }

    // Validate and ensure proper format
    const validatedFeedback: ResponseFeedback = {
      content_score: Math.max(1, Math.min(10, feedback.content_score || 7)),
      communication_score: Math.max(1, Math.min(10, feedback.communication_score || 7)),
      confidence_score: Math.max(1, Math.min(10, feedback.confidence_score || 7)),
      detailed_feedback: feedback.detailed_feedback || 'Good response overall. Keep practicing to improve further.',
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths.slice(0, 5) : ['Clear communication', 'Relevant examples', 'Professional demeanor'],
      improvements: Array.isArray(feedback.improvements) ? feedback.improvements.slice(0, 5) : ['Add more specific details', 'Structure your response better', 'Show more enthusiasm'],
    }

    res.status(200).json(validatedFeedback)
  } catch (error) {
    console.error('Error generating feedback:', error)
    
    // Fallback to mock feedback
    const mockFeedback = generateMockFeedback(
      req.body.transcript || 'Sample response',
      req.body.duration || 60
    )
    
    res.status(200).json(mockFeedback)
  }
}

function generateMockFeedback(transcript: string, duration: number): ResponseFeedback {
  const wordCount = transcript.split(' ').length
  const wordsPerMinute = (wordCount / duration) * 60

  // Generate scores based on response characteristics
  const contentScore = Math.min(10, Math.max(4, Math.floor(wordCount / 10) + Math.random() * 3))
  const communicationScore = Math.min(10, Math.max(4, wordsPerMinute > 120 ? 8 : 6 + Math.random() * 2))
  const confidenceScore = Math.min(10, Math.max(4, duration > 30 ? 7 : 5 + Math.random() * 3))

  return {
    content_score: Math.round(contentScore),
    communication_score: Math.round(communicationScore),
    confidence_score: Math.round(confidenceScore),
    detailed_feedback: `Your response demonstrated good understanding of the question. You provided relevant information and maintained a professional tone throughout. The response length of ${duration} seconds was appropriate, and your speaking pace of approximately ${Math.round(wordsPerMinute)} words per minute was clear and easy to follow. Consider adding more specific examples to strengthen your answer and show more concrete evidence of your experience.`,
    strengths: [
      'Clear and articulate communication',
      'Relevant content that addresses the question',
      'Professional and confident delivery',
      'Good use of examples and experiences',
      'Appropriate response length'
    ].slice(0, 3),
    improvements: [
      'Add more specific metrics and quantifiable results',
      'Structure your response with a clearer beginning, middle, and end',
      'Include more concrete examples from your experience',
      'Show more enthusiasm and passion for the role',
      'Practice maintaining eye contact and confident body language'
    ].slice(0, 3),
  }
}