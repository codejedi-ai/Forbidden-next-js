import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    if (!process.env.TAVUS_API_KEY) {
      // Return a placeholder video URL if Tavus is not configured
      return res.status(200).json({ 
        videoUrl: null,
        message: 'Tavus not configured' 
      })
    }

    // Use Tavus API to generate avatar video
    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TAVUS_API_KEY,
      },
      body: JSON.stringify({
        script: text,
        replica_id: process.env.TAVUS_REPLICA_ID || 'default-replica',
        video_name: `Interview Question - ${Date.now()}`,
        callback_url: null, // We'll poll for status instead
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavus API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // For now, return the video ID - in production you'd poll for completion
    // and return the final video URL
    res.status(200).json({ 
      videoUrl: data.download_url || null,
      videoId: data.video_id,
      status: data.status 
    })
  } catch (error) {
    console.error('Error generating Tavus video:', error)
    res.status(500).json({ 
      error: 'Failed to generate video',
      videoUrl: null 
    })
  }
}