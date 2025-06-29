'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InterviewQuestion, InterviewResponse } from '@/lib/database'
import { 
  Download, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  Mic2, 
  Target,
  Play,
  Volume2,
  Loader2
} from 'lucide-react'

interface FeedbackPanelProps {
  questions: InterviewQuestion[]
  responses: InterviewResponse[]
  onDownloadReport: () => void
  onStartNewInterview: () => void
}

export function FeedbackPanel({
  questions,
  responses,
  onDownloadReport,
  onStartNewInterview
}: FeedbackPanelProps) {
  const [playingFeedback, setPlayingFeedback] = useState<string | null>(null)

  // Calculate overall metrics
  const totalQuestions = questions.length
  const answeredQuestions = responses.length
  const completionRate = (answeredQuestions / totalQuestions) * 100

  const averageScores = {
    content: responses.reduce((sum, r) => sum + r.feedback.content_score, 0) / responses.length,
    communication: responses.reduce((sum, r) => sum + r.feedback.communication_score, 0) / responses.length,
    confidence: responses.reduce((sum, r) => sum + r.feedback.confidence_score, 0) / responses.length,
  }

  const overallScore = (averageScores.content + averageScores.communication + averageScores.confidence) / 3

  const handlePlayFeedback = async (feedbackText: string, responseId: string) => {
    if (playingFeedback === responseId) {
      // Stop current playback
      setPlayingFeedback(null)
      return
    }

    setPlayingFeedback(responseId)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: feedbackText,
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setPlayingFeedback(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.play()
      }
    } catch (error) {
      console.error('Error playing feedback audio:', error)
      setPlayingFeedback(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Interview Complete!
        </h1>
        <p className="text-xl text-gray-600">
          Here's your detailed performance analysis and feedback
        </p>
      </div>

      {/* Overall Performance */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{overallScore.toFixed(1)}/10</div>
              <div className="text-blue-100">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{completionRate.toFixed(0)}%</div>
              <div className="text-blue-100">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{answeredQuestions}</div>
              <div className="text-blue-100">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {responses.reduce((sum, r) => sum + r.response_time, 0)}s
              </div>
              <div className="text-blue-100">Total Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  {averageScores.content.toFixed(1)}/10
                </span>
                <Badge className={getScoreBadgeColor(averageScores.content)}>
                  {averageScores.content >= 8 ? 'Excellent' : 
                   averageScores.content >= 6 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
              <Progress value={averageScores.content * 10} className="h-2" />
              <p className="text-sm text-gray-600">
                Quality and relevance of your answers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic2 className="h-5 w-5 text-green-600" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {averageScores.communication.toFixed(1)}/10
                </span>
                <Badge className={getScoreBadgeColor(averageScores.communication)}>
                  {averageScores.communication >= 8 ? 'Excellent' : 
                   averageScores.communication >= 6 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
              <Progress value={averageScores.communication * 10} className="h-2" />
              <p className="text-sm text-gray-600">
                Clarity and structure of your responses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-purple-600" />
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-600">
                  {averageScores.confidence.toFixed(1)}/10
                </span>
                <Badge className={getScoreBadgeColor(averageScores.confidence)}>
                  {averageScores.confidence >= 8 ? 'Excellent' : 
                   averageScores.confidence >= 6 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
              <Progress value={averageScores.confidence * 10} className="h-2" />
              <p className="text-sm text-gray-600">
                Poise and self-assurance in delivery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detailed Question Feedback
          </CardTitle>
          <CardDescription>
            Review your performance on each question with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
              {responses.map((_, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  Q{index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {responses.map((response, index) => {
              const question = questions.find(q => q.id === response.question_id)
              if (!question) return null

              return (
                <TabsContent key={index} value={index.toString()} className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">Question:</p>
                    <p className="text-blue-800">{question.question}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(response.feedback.content_score)}`}>
                        {response.feedback.content_score}/10
                      </div>
                      <div className="text-sm text-gray-600">Content</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(response.feedback.communication_score)}`}>
                        {response.feedback.communication_score}/10
                      </div>
                      <div className="text-sm text-gray-600">Communication</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(response.feedback.confidence_score)}`}>
                        {response.feedback.confidence_score}/10
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Detailed Feedback</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayFeedback(response.feedback.detailed_feedback, response.question_id)}
                          disabled={playingFeedback === response.question_id}
                        >
                          {playingFeedback === response.question_id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Volume2 className="mr-2 h-4 w-4" />
                          )}
                          Play Audio
                        </Button>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {response.feedback.detailed_feedback}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {response.feedback.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-green-600 flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement</h4>
                        <ul className="space-y-1">
                          {response.feedback.improvements.map((improvement, idx) => (
                            <li key={idx} className="text-sm text-orange-600 flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Response:</p>
                      <p className="text-sm text-gray-700">{response.transcript}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Response time: {response.response_time}s
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onDownloadReport}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button
          onClick={onStartNewInterview}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start New Interview
        </Button>
      </div>
    </div>
  )
}