'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDropzone } from 'react-dropzone'
import { Loader2, Upload, FileText, Briefcase } from 'lucide-react'

interface SessionSetupProps {
  onComplete: (data: {
    jobTitle: string
    company: string
    jobDescription: string
    resumeContent: string
  }) => void
  loading: boolean
}

export function SessionSetup({ onComplete, loading }: SessionSetupProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeContent, setResumeContent] = useState('')
  const [resumeMethod, setResumeMethod] = useState<'upload' | 'paste'>('upload')
  const [error, setError] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setResumeContent(content)
        }
        reader.readAsText(file)
      }
    },
  })

  const handleSubmit = () => {
    setError('')

    if (!jobTitle.trim()) {
      setError('Please enter a job title')
      return
    }

    if (!company.trim()) {
      setError('Please enter a company name')
      return
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    if (!resumeContent.trim()) {
      setError('Please provide your resume content')
      return
    }

    onComplete({
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      jobDescription: jobDescription.trim(),
      resumeContent: resumeContent.trim(),
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Interview Setup
        </h1>
        <p className="text-xl text-gray-600">
          Let's prepare your personalized interview experience
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Interview Configuration
          </CardTitle>
          <CardDescription>
            Provide details about the position and your background to generate relevant questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft, Startup Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here. Include responsibilities, requirements, and any specific skills mentioned..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[120px]"
              disabled={loading}
            />
          </div>

          {/* Resume Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Resume Content *</Label>
            
            <Tabs value={resumeMethod} onValueChange={(value) => setResumeMethod(value as 'upload' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop your resume here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag & drop your resume here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: PDF, DOC, DOCX, TXT
                      </p>
                    </div>
                  )}
                </div>
                
                {resumeContent && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✓ Resume content loaded ({resumeContent.length} characters)
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <Textarea
                  placeholder="Paste your resume content here. Include your experience, skills, education, and achievements..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  className="min-h-[200px]"
                  disabled={loading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Interview Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}