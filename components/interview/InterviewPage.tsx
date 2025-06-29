'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { SessionSetup } from './SessionSetup'
import { QuestionCard } from './QuestionCard'
import { FeedbackPanel } from './FeedbackPanel'
import { InterviewQuestion, InterviewResponse, createInterviewSession, updateInterviewSession } from '@/lib/database'
import { generateId, downloadJSON } from '@/lib/utils'
import { toast } from 'sonner'

type InterviewStage = 'setup' | 'questions' | 'feedback'

interface SessionData {
  jobTitle: string
  company: string
  jobDescription: string
  resumeContent: string
}

export function InterviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stage, setStage] = useState<InterviewStage>('setup')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [responses, setResponses] = useState<InterviewResponse[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  const handleSetupComplete = async (data: SessionData) => {
    setLoading(true)
    try {
      // Generate questions using AI
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: data.jobDescription,
          resumeContent: data.resumeContent,
          jobTitle: data.jobTitle,
          company: data.company,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const { questions: generatedQuestions } = await response.json()
      
      // Create interview session
      const newSessionId = await createInterviewSession(user!.uid, {
        job_description: data.jobDescription,
        resume_content: data.resumeContent,
        job_title: data.jobTitle,
        company: data.company,
        questions: generatedQuestions,
        status: 'in_progress',
      })

      setSessionData(data)
      setQuestions(generatedQuestions)
      setSessionId(newSessionId)
      setStage('questions')
      toast.success('Interview questions generated successfully!')
    } catch (error) {
      console.error('Error setting up interview:', error)
      toast.error('Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordingComplete = async (transcript: string, duration: number, audioBlob?: Blob, videoBlob?: Blob) => {
    const currentQuestion = questions[currentQuestionIndex]
    setLoading(true)

    try {
      // Generate feedback using AI
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          transcript,
          duration,
          jobContext: {
            jobTitle: sessionData!.jobTitle,
            jobDescription: sessionData!.jobDescription,
            company: sessionData!.company,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate feedback')
      }

      const feedback = await response.json()

      const newResponse: InterviewResponse = {
        question_id: currentQuestion.id,
        transcript,
        response_time: duration,
        feedback,
        created_at: new Date().toISOString(),
      }

      const updatedResponses = [...responses, newResponse]
      setResponses(updatedResponses)

      toast.success('Response recorded and analyzed!')
    } catch (error) {
      console.error('Error processing response:', error)
      toast.error('Failed to analyze response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteInterview = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      // Calculate overall metrics
      const totalScore = responses.reduce((sum, response) => {
        return sum + response.feedback.content_score + response.feedback.communication_score + response.feedback.confidence_score
      }, 0)
      const averageScore = totalScore / (responses.length * 3)
      const completionRate = (responses.length / questions.length) * 100

      // Generate overall feedback
      const overallFeedback = `Interview completed with ${responses.length} out of ${questions.length} questions answered. Average score: ${averageScore.toFixed(1)}/10. Great job on completing the interview practice session!`

      // Update session in database
      await updateInterviewSession(sessionId, {
        responses,
        overall_feedback: overallFeedback,
        completion_rate: completionRate,
        status: 'completed',
        completed_at: Date.now(),
      })

      setStage('feedback')
      toast.success('Interview completed successfully!')
    } catch (error) {
      console.error('Error completing interview:', error)
      toast.error('Failed to complete interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    const report = {
      sessionId,
      sessionData,
      questions,
      responses,
      completedAt: new Date().toISOString(),
      summary: {
        totalQuestions: questions.length,
        answeredQuestions: responses.length,
        completionRate: (responses.length / questions.length) * 100,
        averageScores: {
          content: responses.reduce((sum, r) => sum + r.feedback.content_score, 0) / responses.length,
          communication: responses.reduce((sum, r) => sum + r.feedback.communication_score, 0) / responses.length,
          confidence: responses.reduce((sum, r) => sum + r.feedback.confidence_score, 0) / responses.length,
        },
      },
    }

    downloadJSON(report, `interview-report-${new Date().toISOString().split('T')[0]}.json`)
    toast.success('Report downloaded successfully!')
  }

  const handleStartNewInterview = () => {
    setStage('setup')
    setSessionData(null)
    setQuestions([])
    setResponses([])
    setCurrentQuestionIndex(0)
    setSessionId(null)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {stage === 'setup' && (
          <SessionSetup onComplete={handleSetupComplete} loading={loading} />
        )}

        {stage === 'questions' && (
          <QuestionCard
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onRecordingComplete={handleRecordingComplete}
            onNext={() => setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1))}
            onPrevious={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
            onComplete={handleCompleteInterview}
            canGoNext={currentQuestionIndex < questions.length - 1}
            canGoPrevious={currentQuestionIndex > 0}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            hasResponse={responses.some(r => r.question_id === questions[currentQuestionIndex]?.id)}
            loading={loading}
          />
        )}

        {stage === 'feedback' && (
          <FeedbackPanel
            questions={questions}
            responses={responses}
            onDownloadReport={handleDownloadReport}
            onStartNewInterview={handleStartNewInterview}
          />
        )}
      </div>
    </div>
  )
}