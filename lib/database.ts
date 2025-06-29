import { database } from './firebase'
import { ref, push, set, get, update } from 'firebase/database'

export interface InterviewQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  suggested_answer_length: number
}

export interface ResponseFeedback {
  content_score: number
  communication_score: number
  confidence_score: number
  detailed_feedback: string
  strengths: string[]
  improvements: string[]
}

export interface InterviewResponse {
  question_id: string
  audio_url?: string
  video_url?: string
  transcript: string
  response_time: number
  feedback: ResponseFeedback
  created_at: string
}

export interface MockInterviewSession {
  id: string
  user_id: string
  job_application_id?: string
  job_description: string
  resume_content: string
  job_title?: string
  company?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  questions: InterviewQuestion[]
  responses: InterviewResponse[]
  overall_feedback?: string
  completion_rate: number
  rating?: number
  created_at: number
  updated_at: number
  completed_at?: number
}

export async function createInterviewSession(
  userId: string,
  sessionData: Partial<MockInterviewSession>
): Promise<string> {
  if (!database) {
    // Demo mode - return a mock ID
    return 'demo-session-' + Date.now()
  }

  try {
    const sessionsRef = ref(database, 'mock_interview_sessions')
    const newSessionRef = push(sessionsRef)
    
    const session: MockInterviewSession = {
      id: newSessionRef.key!,
      user_id: userId,
      job_description: sessionData.job_description || '',
      resume_content: sessionData.resume_content || '',
      job_title: sessionData.job_title,
      company: sessionData.company,
      status: 'pending',
      questions: sessionData.questions || [],
      responses: [],
      completion_rate: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      ...sessionData,
    }

    await set(newSessionRef, session)
    return newSessionRef.key!
  } catch (error) {
    console.error('Error creating interview session:', error)
    throw error
  }
}

export async function updateInterviewSession(
  sessionId: string,
  updates: Partial<MockInterviewSession>
): Promise<void> {
  if (!database) {
    // Demo mode - just log the update
    console.log('Demo mode: Would update session', sessionId, updates)
    return
  }

  try {
    const sessionRef = ref(database, `mock_interview_sessions/${sessionId}`)
    await update(sessionRef, {
      ...updates,
      updated_at: Date.now(),
    })
  } catch (error) {
    console.error('Error updating interview session:', error)
    throw error
  }
}

export async function getInterviewSession(sessionId: string): Promise<MockInterviewSession | null> {
  if (!database) {
    // Demo mode - return null
    return null
  }

  try {
    const sessionRef = ref(database, `mock_interview_sessions/${sessionId}`)
    const snapshot = await get(sessionRef)
    
    if (snapshot.exists()) {
      return snapshot.val() as MockInterviewSession
    }
    
    return null
  } catch (error) {
    console.error('Error getting interview session:', error)
    throw error
  }
}

export async function getUserInterviewSessions(userId: string): Promise<MockInterviewSession[]> {
  if (!database) {
    // Demo mode - return empty array
    return []
  }

  try {
    const sessionsRef = ref(database, 'mock_interview_sessions')
    const snapshot = await get(sessionsRef)
    
    if (!snapshot.exists()) {
      return []
    }

    const sessions = snapshot.val()
    return Object.values(sessions).filter(
      (session: any) => session.user_id === userId
    ) as MockInterviewSession[]
  } catch (error) {
    console.error('Error getting user interview sessions:', error)
    throw error
  }
}