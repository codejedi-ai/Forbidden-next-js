'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuth } from '@/lib/hooks/useAuth'
import { checkFirebaseConfig, checkDatabaseConnection } from '@/lib/firebase'
import { 
  Brain, 
  Video, 
  Mic, 
  BarChart3, 
  Users, 
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [firebaseConfigured, setFirebaseConfigured] = useState(false)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkServices = async () => {
      try {
        const configCheck = checkFirebaseConfig()
        setFirebaseConfigured(configCheck)
        
        if (configCheck) {
          const dbCheck = await checkDatabaseConnection()
          setDatabaseConnected(dbCheck)
        }
      } catch (error) {
        console.error('Error checking services:', error)
      } finally {
        setChecking(false)
      }
    }

    checkServices()
  }, [])

  const handleStartInterview = () => {
    router.push('/interview')
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview Coach
              </h1>
              <p className="text-gray-600 mt-2">
                Practice interviews with AI-powered feedback
              </p>
            </div>
            <AuthForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Interview Coach
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master your interview skills with AI-powered practice sessions, 
            personalized feedback, and realistic simulations
          </p>
        </div>

        {/* Service Status */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">Firebase Authentication</span>
                  {firebaseConfigured ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Demo Mode
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">Database</span>
                  {databaseConnected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Demo Mode
                    </Badge>
                  )}
                </div>
              </div>
              
              {(!firebaseConfigured || !databaseConnected) && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some services are running in demo mode. Configure Firebase to enable full functionality.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Welcome Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {user.email?.split('@')[0]}!
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Ready to ace your next interview? Let's practice together.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3"
                  onClick={handleStartInterview}
                >
                  Start Interview Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI-Powered Questions</CardTitle>
              <CardDescription>
                Get personalized interview questions generated by advanced AI based on your resume and job description
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Video Practice</CardTitle>
              <CardDescription>
                Practice with realistic AI avatar interviewers and record your responses for comprehensive analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Mic className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Voice Feedback</CardTitle>
              <CardDescription>
                Receive detailed audio feedback with natural-sounding voice synthesis powered by ElevenLabs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track your progress with detailed scoring on content, communication, and confidence levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>Realistic Simulations</CardTitle>
              <CardDescription>
                Experience lifelike interview scenarios with AI avatars that adapt to different interview styles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle>Instant Results</CardTitle>
              <CardDescription>
                Get immediate feedback and actionable insights to improve your interview performance
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to Transform Your Interview Skills?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who have improved their interview performance 
                with our AI-powered coaching platform. Start your journey to interview success today.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold px-8 py-3"
                onClick={handleStartInterview}
              >
                Begin Your First Practice Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}