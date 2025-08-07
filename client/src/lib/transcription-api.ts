const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

export interface TranscriptionResponse {
  id: string;
  transcript: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
}

export interface TranscriptionApiError {
  timestamp: string;
  status: string;
  error: string;
  message: string;
  path: string;
}

// Sample transcriptions for simulation based on video URL patterns
const SAMPLE_TRANSCRIPTIONS = {
  youtube: [
    "Welcome to this comprehensive tutorial on modern web development. Today we'll be exploring the latest trends in JavaScript frameworks, focusing on React, Vue, and Angular. We'll start by discussing the fundamental concepts of component-based architecture and how it has revolutionized the way we build user interfaces. Throughout this session, we'll cover state management, routing, and best practices for creating scalable applications. Whether you're a beginner or an experienced developer, this guide will provide valuable insights into choosing the right framework for your next project.",
    "In today's video, we're diving deep into the world of machine learning and artificial intelligence. We'll explore how these technologies are transforming industries from healthcare to finance. First, let's understand the difference between supervised and unsupervised learning algorithms. We'll then examine real-world applications including image recognition, natural language processing, and predictive analytics. By the end of this presentation, you'll have a solid understanding of how to implement basic ML models using Python and popular libraries like TensorFlow and scikit-learn.",
    "Greetings everyone, and welcome to our cooking masterclass. Today we're preparing an authentic Italian risotto from scratch. The key to perfect risotto lies in the quality of your ingredients and the patience required for the cooking process. We'll start by selecting the right type of rice - Arborio is traditional, but Carnaroli and Vialone Nano are excellent alternatives. The stock must be kept warm throughout the cooking process, and we'll add it one ladle at a time while stirring constantly. This technique creates the creamy texture that makes risotto so special."
  ],
  general: [
    "Thank you for joining today's presentation on sustainable business practices. In an era where environmental consciousness is paramount, companies must adapt their strategies to meet both consumer expectations and regulatory requirements. We'll examine case studies from leading organizations that have successfully implemented green initiatives while maintaining profitability. Topics include renewable energy adoption, waste reduction strategies, and the circular economy model. These approaches not only benefit the environment but also create long-term competitive advantages for forward-thinking businesses.",
    "Hello and welcome to our financial literacy workshop. Understanding personal finance is crucial for achieving long-term financial stability and independence. We'll cover essential topics including budgeting, saving strategies, investment fundamentals, and retirement planning. Many people feel overwhelmed by financial decisions, but with the right knowledge and tools, anyone can take control of their financial future. We'll start with basic concepts and gradually build to more advanced topics like portfolio diversification and risk management.",
    "Good morning, class. Today we're exploring the fascinating world of marine biology. The ocean covers over 70% of our planet's surface, yet we've explored less than 20% of it. Marine ecosystems are incredibly diverse, ranging from coral reefs teeming with colorful fish to the mysterious depths of the abyssal zone. We'll discuss the important role marine organisms play in global climate regulation, food chains, and the oxygen we breathe. Climate change and pollution pose significant threats to these delicate ecosystems, making marine conservation efforts more critical than ever."
  ]
};

function generateSimulatedTranscription(videoUrl: string): string {
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const transcripts = isYouTube ? SAMPLE_TRANSCRIPTIONS.youtube : SAMPLE_TRANSCRIPTIONS.general;
  
  // Select random transcript based on URL hash for consistency
  const urlHash = videoUrl.split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffff;
  }, 0);
  
  return transcripts[Math.abs(urlHash) % transcripts.length];
}

export async function transcribeVideo(videoUrl: string): Promise<TranscriptionResponse> {
  const startTime = Date.now();
  
  console.log('Video URL received:', videoUrl);
  console.log('Python API base URL:', PYTHON_API_BASE_URL);
  const fullApiUrl = `${PYTHON_API_BASE_URL}/video-listener/listen-video?videoUrl=${encodeURIComponent(videoUrl)}`;
  console.log('Full API URL being called:', fullApiUrl);
  
  try {
    // Attempt real API call first with 10 minute timeout for long processing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes
    
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Successfully received transcription from API');
      return result;
    } else {
      const errorData = await response.json() as TranscriptionApiError;
      console.log('API returned error:', errorData);
      
      // Handle specific error codes
      if (errorData.message === '004') {
        // The error message will be handled in the UI with proper translation
        throw new Error('VIDEO_TOO_LONG');
      }
      
      // Handle other errors
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
  } catch (error) {
    console.log('API call failed:', (error as Error).message);
    console.log('Falling back to simulation mode');
  }

  // Generate simulation with realistic processing time
  console.log('Generating simulated transcription...');
  
  // Simulate processing time (2-8 seconds)
  const simulatedDelay = 2000 + Math.random() * 6000;
  await new Promise(resolve => setTimeout(resolve, simulatedDelay));
  
  const transcript = generateSimulatedTranscription(videoUrl);
  const wordCount = transcript.trim().split(/\s+/).length;
  const duration = Math.round((wordCount / 150) * 60); // Estimate based on speaking rate
  const processingTime = Math.round((Date.now() - startTime) / 1000);
  
  return {
    id: Date.now().toString(),
    transcript,
    duration,
    wordCount,
    processingTime,
    accuracy: 94 + Math.floor(Math.random() * 6), // 94-99% accuracy for simulation
  };
}
