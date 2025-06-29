import { NextApiRequest, NextApiResponse } from 'next'

interface QuestionRequest {
  jobDescription: string
  resumeContent: string
  jobTitle: string
  company: string
}

interface InterviewQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  suggested_answer_length: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { jobDescription, resumeContent, jobTitle, company }: QuestionRequest = req.body

    if (!jobDescription || !resumeContent || !jobTitle || !company) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Use Deepseek API for question generation
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
            content: `You are an expert interview coach. Generate 5 relevant interview questions based on the job description and candidate's resume. 

Return ONLY a JSON array of questions in this exact format:
[
  {
    "id": "unique_id",
    "question": "question text",
    "category": "category name",
    "difficulty": "easy|medium|hard",
    "suggested_answer_length": number_in_seconds
  }
]

Categories should be one of: Technical, Behavioral, Experience, Problem-Solving, Company-Specific
Difficulty should be based on the seniority level implied by the job title
Suggested answer length should be between 60-180 seconds`
          },
          {
            role: 'user',
            content: `Job Title: ${jobTitle}
Company: ${company}
Job Description: ${jobDescription}

Candidate Resume: ${resumeContent}

Generate 5 interview questions tailored to this specific role and candidate background.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
    let questions: InterviewQuestion[]
    try {
      questions = JSON.parse(content)
    } catch (parseError) {
      // Fallback to mock questions if parsing fails
      console.error('Failed to parse Deepseek response:', parseError)
      questions = generateMockQuestions(jobTitle, company)
    }

    // Validate and ensure proper format
    const validatedQuestions = questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      question: q.question || `Sample question ${index + 1}`,
      category: q.category || 'General',
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      suggested_answer_length: typeof q.suggested_answer_length === 'number' ? q.suggested_answer_length : 120,
    })) as InterviewQuestion[]

    res.status(200).json({ questions: validatedQuestions })
  } catch (error) {
    console.error('Error generating questions:', error)
    
    // Fallback to mock questions
    const mockQuestions = generateMockQuestions(
      req.body.jobTitle || 'Software Engineer',
      req.body.company || 'Tech Company'
    )
    
    res.status(200).json({ questions: mockQuestions })
  }
}

function generateMockQuestions(jobTitle: string, company: string): InterviewQuestion[] {
  return [
    {
      id: `q_${Date.now()}_1`,
      question: `Tell me about yourself and why you're interested in the ${jobTitle} position at ${company}.`,
      category: 'Behavioral',
      difficulty: 'easy',
      suggested_answer_length: 90,
    },
    {
      id: `q_${Date.now()}_2`,
      question: `Describe a challenging project you've worked on and how you overcame the obstacles.`,
      category: 'Experience',
      difficulty: 'medium',
      suggested_answer_length: 120,
    },
    {
      id: `q_${Date.now()}_3`,
      question: `How do you stay updated with the latest technologies and industry trends?`,
      category: 'Technical',
      difficulty: 'easy',
      suggested_answer_length: 75,
    },
    {
      id: `q_${Date.now()}_4`,
      question: `Walk me through how you would approach solving a complex problem you've never encountered before.`,
      category: 'Problem-Solving',
      difficulty: 'hard',
      suggested_answer_length: 150,
    },
    {
      id: `q_${Date.now()}_5`,
      question: `What do you know about ${company} and why do you want to work here specifically?`,
      category: 'Company-Specific',
      difficulty: 'medium',
      suggested_answer_length: 100,
    },
  ]
}