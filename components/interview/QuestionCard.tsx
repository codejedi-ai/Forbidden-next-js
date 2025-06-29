'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InterviewQuestion } from '@/lib/database'
import { formatDuration } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Mic, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Clock,
  User,
  Loader2
} from 'lucide-react'

interface QuestionCardProps {
  question: InterviewQuestion
  questionNumber: number
  totalQuestions: number
  onRecordingComplete: (transcript: string, duration: number, audioBlob?: Blob, videoBlob?: Blob) => void
  onNext: () => void
  onPrevious: () => void
  onComplete: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  isLastQuestion: boolean
  hasResponse: boolean
  loading: boolean
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'completed'

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onRecordingComplete,
  onNext,
  onPrevious,
  onComplete,
  canGoNext,
  canGoPrevious,
  isLastQuestion,
  hasResponse,
  loading
}: QuestionCardProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [aiVideoUrl, setAiVideoUrl] = useState<string | null>(null)
  const [loadingAiVideo, setLoadingAiVideo] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  // Generate AI interviewer video when question changes
  useEffect(() => {
    const generateAiVideo = async () => {
      setLoadingAiVideo(true)
      try {
        const response = await fetch('/api/tavus-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: question.question,
          }),
        })

        if (response.ok) {
          const { videoUrl } = await response.json()
          setAiVideoUrl(videoUrl)
        }
      } catch (error) {
        console.error('Error generating AI video:', error)
      } finally {
        setLoadingAiVideo(false)
      }
    }

    generateAiVideo()
  }, [question.question])

  // Speak question using ElevenLabs TTS
  useEffect(() => {
    const speakQuestion = async () => {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: question.question,
          }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.play()
        }
      } catch (error) {
        console.error('Error playing question audio:', error)
      }
    }

    speakQuestion()
  }, [question.question])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setMediaStream(stream)
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream
      }

      const recorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      const videoChunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
        setVideoBlob(videoBlob)
      }

      setMediaRecorder(recorder)
      recorder.start()
      setRecordingState('recording')
      setRecordingTime(0)

      // Start speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript)
          }
        }

        recognition.start()
        recognitionRef.current = recognition
      }

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      setRecordingState('paused')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      setRecordingState('recording')
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Resume speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setRecordingState('completed')
  }

  const resetRecording = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setRecordingState('idle')
    setRecordingTime(0)
    setTranscript('')
    setAudioBlob(null)
    setVideoBlob(null)
  }

  const handleSubmitResponse = () => {
    if (transcript.trim()) {
      onRecordingComplete(transcript.trim(), recordingTime, audioBlob || undefined, videoBlob || undefined)
      resetRecording()
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((questionNumber / totalQuestions) * 100)}% Complete
            </span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Interviewer Side */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              AI Interviewer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* AI Video */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {loadingAiVideo ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : aiVideoUrl ? (
                  <video
                    ref={videoRef}
                    src={aiVideoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <User className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">AI Interviewer</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{question.category}</Badge>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-medium text-blue-900">
                    {question.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Suggested answer length: {formatDuration(question.suggested_answer_length)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Response Side */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Your Response
              {hasResponse && <CheckCircle className="h-5 w-5 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User Video */}
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={userVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {/* Recording Controls */}
              <div className="space-y-4">
                {recordingState === 'idle' && (
                  <Button
                    onClick={startRecording}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                )}

                {recordingState === 'recording' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                      <span className="font-mono text-lg">
                        {formatDuration(recordingTime)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={pauseRecording} variant="outline" className="flex-1">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button onClick={stopRecording} variant="destructive" className="flex-1">
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                )}

                {recordingState === 'paused' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-yellow-600">
                      <Pause className="w-4 h-4" />
                      <span className="font-mono text-lg">
                        {formatDuration(recordingTime)} (Paused)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={resumeRecording} className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                      <Button onClick={stopRecording} variant="destructive" className="flex-1">
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                )}

                {recordingState === 'completed' && (
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Recording completed ({formatDuration(recordingTime)})
                      </AlertDescription>
                    </Alert>
                    
                    {transcript && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Transcript:</p>
                        <p className="text-sm text-gray-700">{transcript}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={resetRecording} variant="outline" className="flex-1">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Re-record
                      </Button>
                      <Button 
                        onClick={handleSubmitResponse} 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Response
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              variant="outline"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {hasResponse ? 'Response recorded' : 'Record your response to continue'}
              </p>
            </div>

            {isLastQuestion ? (
              <Button
                onClick={onComplete}
                disabled={!hasResponse || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Interview
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}