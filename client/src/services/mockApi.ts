// Mock API service to simulate all backend functionality
// This replaces the actual backend for frontend-only testing

interface MockUser {
  id: string;
  username: string;
  email: string;
  transcriptionsUsed: number;
  isSubscribed: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface MockTranscription {
  id: string;
  videoUrl: string;
  transcript: string;
  language: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// Mock data storage
let mockUser: MockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  transcriptionsUsed: 1,
  isSubscribed: false
};

let mockTranscriptions: MockTranscription[] = [
  {
    id: '1',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    transcript: 'This is a sample transcript of a video. It shows how the transcription service would work with real video content. The transcript includes all the spoken words from the video, properly formatted and easy to read.',
    language: 'en',
    status: 'completed',
    createdAt: new Date().toISOString()
  }
];

// Mock API functions
export const mockApi = {
  // Authentication
  async login(username: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    if (username === 'test' && password === 'password') {
      return { success: true, user: mockUser };
    }
    throw new Error('Invalid credentials');
  },

  async register(username: string, email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    mockUser = {
      id: '1',
      username,
      email,
      transcriptionsUsed: 0,
      isSubscribed: false
    };
    return { success: true, user: mockUser };
  },

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async getUser() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUser;
  },

  // Transcription
  async createTranscription(videoUrl: string, language: string = 'en') {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    if (mockUser.transcriptionsUsed >= 3 && !mockUser.isSubscribed) {
      throw new Error('Free transcription limit reached. Please subscribe to continue.');
    }

    const newTranscription: MockTranscription = {
      id: Date.now().toString(),
      videoUrl,
      transcript: `Mock transcript for video: ${videoUrl}. This is a simulated transcription that demonstrates how the service would work. In a real implementation, this would contain the actual speech-to-text output from the video. The transcript would be accurate and properly formatted, capturing all spoken content from the video with appropriate punctuation and paragraph breaks.`,
      language,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    mockTranscriptions.unshift(newTranscription);
    mockUser.transcriptionsUsed++;

    // Simulate processing completion after a delay
    setTimeout(() => {
      const transcription = mockTranscriptions.find(t => t.id === newTranscription.id);
      if (transcription) {
        transcription.status = 'completed';
      }
    }, 3000);

    return newTranscription;
  },

  async getTranscriptions() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTranscriptions;
  },

  async getTranscription(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const transcription = mockTranscriptions.find(t => t.id === id);
    if (!transcription) {
      throw new Error('Transcription not found');
    }
    return transcription;
  },

  // PayPal Mock
  async paypalSetup() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      clientToken: 'mock_client_token_' + Date.now()
    };
  },

  async createPaypalOrder(amount: string, currency: string, intent: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: 'mock_order_' + Date.now(),
      status: 'CREATED',
      amount,
      currency,
      intent
    };
  },

  async capturePaypalOrder(orderId: string) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment
    mockUser.isSubscribed = true;
    mockUser.transcriptionsUsed = 0; // Reset usage for new subscriber
    
    return {
      id: orderId,
      status: 'COMPLETED',
      payer: {
        email_address: 'payer@example.com',
        payer_id: 'mock_payer_id'
      },
      purchase_units: [{
        payments: {
          captures: [{
            id: 'capture_' + Date.now(),
            status: 'COMPLETED',
            amount: {
              currency_code: 'USD',
              value: '19.00'
            }
          }]
        }
      }]
    };
  },

  // Stripe Mock
  async createPaymentIntent(amount: number) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      clientSecret: 'pi_mock_' + Date.now() + '_secret_mock',
      id: 'pi_mock_' + Date.now()
    };
  },

  async getOrCreateSubscription() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mockUser.stripeSubscriptionId) {
      return {
        subscriptionId: mockUser.stripeSubscriptionId,
        clientSecret: 'pi_mock_subscription_' + Date.now() + '_secret_mock'
      };
    }

    // Create new subscription
    const subscriptionId = 'sub_mock_' + Date.now();
    const customerId = 'cus_mock_' + Date.now();
    
    mockUser.stripeCustomerId = customerId;
    mockUser.stripeSubscriptionId = subscriptionId;
    
    return {
      subscriptionId,
      clientSecret: 'pi_mock_subscription_' + Date.now() + '_secret_mock'
    };
  }
};

// Mock fetch interceptor for API calls
const originalFetch = window.fetch;

window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url instanceof URL ? url.href : (url as Request).url;
  
  // Intercept API calls and route to mock functions
  if (urlString.includes('/api/')) {
    const path = urlString.split('/api/')[1];
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : null;

    console.log('Mock API Call:', method, path, body);

    try {
      let result;

      switch (true) {
        case path === 'auth/login' && method === 'POST':
          result = await mockApi.login(body.username, body.password);
          break;
        
        case path === 'auth/register' && method === 'POST':
          result = await mockApi.register(body.username, body.email, body.password);
          break;
        
        case path === 'auth/logout' && method === 'POST':
          result = await mockApi.logout();
          break;
        
        case path === 'auth/user' && method === 'GET':
          result = await mockApi.getUser();
          break;
        
        case path === 'transcriptions' && method === 'POST':
          result = await mockApi.createTranscription(body.videoUrl, body.language);
          break;
        
        case path === 'transcriptions' && method === 'GET':
          result = await mockApi.getTranscriptions();
          break;
        
        case path.startsWith('transcriptions/') && method === 'GET':
          const transcriptionId = path.split('/')[1];
          result = await mockApi.getTranscription(transcriptionId);
          break;
        
        case path === 'paypal/setup' && method === 'GET':
          result = await mockApi.paypalSetup();
          break;
        
        case path === 'paypal/order' && method === 'POST':
          result = await mockApi.createPaypalOrder(body.amount, body.currency, body.intent);
          break;
        
        case path.includes('paypal/order/') && path.includes('/capture') && method === 'POST':
          const orderId = path.split('/')[2];
          result = await mockApi.capturePaypalOrder(orderId);
          break;
        
        case path === 'create-payment-intent' && method === 'POST':
          result = await mockApi.createPaymentIntent(body.amount);
          break;
        
        case path === 'get-or-create-subscription' && method === 'POST':
          result = await mockApi.getOrCreateSubscription();
          break;
        
        default:
          throw new Error(`Mock API: Unhandled route ${method} ${path}`);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Mock API Error:', error);
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // For non-API calls, use original fetch
  return originalFetch(url, options);
};

export default mockApi;