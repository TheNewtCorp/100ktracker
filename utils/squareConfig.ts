// Square Web Payments SDK configuration and utilities for frontend

// Square Web Payments SDK types (inline to avoid import issues)
interface SquarePayments {
  card(options?: any): Promise<SquareCard>;
  googlePay(options?: any): Promise<SquareGooglePay>;
  applePay(options?: any): Promise<SquareApplePay>;
  ach(options?: any): Promise<SquareACH>;
  giftCard(options?: any): Promise<SquareGiftCard>;
}

interface SquareCard {
  attach(selector: string): Promise<void>;
  destroy(): void;
  tokenize(): Promise<{ token: string; details: any }>;
  configure(options: any): void;
}

interface SquareGooglePay {
  attach(selector: string): Promise<void>;
  destroy(): void;
  tokenize(): Promise<{ token: string; details: any }>;
}

interface SquareApplePay {
  attach(selector: string): Promise<void>;
  destroy(): void;
  tokenize(): Promise<{ token: string; details: any }>;
}

interface SquareACH {
  attach(selector: string): Promise<void>;
  destroy(): void;
  tokenize(): Promise<{ token: string; details: any }>;
}

interface SquareGiftCard {
  attach(selector: string): Promise<void>;
  destroy(): void;
  tokenize(): Promise<{ token: string; details: any }>;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => SquarePayments;
    };
  }
}

// Square configuration for frontend
export const SQUARE_CONFIG = {
  applicationId:
    import.meta.env.VITE_SQUARE_APPLICATION_ID ||
    (() => {
      console.error('❌ VITE_SQUARE_APPLICATION_ID environment variable is required');
      console.error('Available env vars:', {
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE,
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        envVars: Object.keys(import.meta.env).filter((key) => key.startsWith('VITE_')),
      });
      return 'MISSING_SQUARE_APP_ID';
    })(),
  locationId:
    import.meta.env.VITE_SQUARE_LOCATION_ID ||
    (() => {
      console.error('❌ VITE_SQUARE_LOCATION_ID environment variable is required');
      return 'MISSING_SQUARE_LOCATION_ID';
    })(),
  environment: (import.meta.env.VITE_SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
};

// Square SDK script URL
const SQUARE_SDK_URL =
  SQUARE_CONFIG.environment === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

// Load Square SDK dynamically
export const loadSquareSDK = (): Promise<SquarePayments> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Loading Square SDK...', {
      config: SQUARE_CONFIG,
      sdkUrl: SQUARE_SDK_URL,
    });

    // Validate required configuration
    if (SQUARE_CONFIG.applicationId.includes('MISSING') || SQUARE_CONFIG.locationId.includes('MISSING')) {
      const error = new Error('Square configuration is incomplete. Please check your environment variables.');
      console.error('❌ Square configuration validation failed:', error);
      reject(error);
      return;
    }

    // Check if Square is already loaded
    if (window.Square) {
      console.log('✅ Square SDK already loaded, initializing payments...');
      try {
        const payments = window.Square.payments(SQUARE_CONFIG.applicationId, SQUARE_CONFIG.locationId);
        console.log('✅ Square payments initialized successfully');
        resolve(payments);
      } catch (error) {
        console.error('❌ Error initializing Square payments:', error);
        reject(error);
      }
      return;
    }

    console.log('📦 Loading Square SDK from:', SQUARE_SDK_URL);

    // Create script element
    const script = document.createElement('script');
    script.src = SQUARE_SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log('✅ Square SDK script loaded successfully');
      try {
        if (window.Square) {
          console.log('🔧 Initializing Square payments...');
          const payments = window.Square.payments(SQUARE_CONFIG.applicationId, SQUARE_CONFIG.locationId);
          console.log('✅ Square payments initialized successfully');
          resolve(payments);
        } else {
          const error = new Error('Square SDK failed to load - window.Square not available');
          console.error('❌ Square SDK load failed:', error);
          reject(error);
        }
      } catch (error) {
        console.error('❌ Error during Square SDK initialization:', error);
        reject(error);
      }
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Square SDK script:', error);
      reject(new Error('Failed to load Square SDK'));
    };

    // Add to document head
    document.head.appendChild(script);
    console.log('📝 Square SDK script added to document head');
  });
};

// Payment method types supported by Square
export type SquarePaymentMethod = 'card' | 'googlePay' | 'applePay' | 'ach' | 'giftCard';

// Square payment form configuration
export interface SquarePaymentConfig {
  amount: number; // Amount in cents
  currency: string;
  customerEmail: string;
  customerName: string;
  orderId?: string;
  metadata?: Record<string, string>;
}

// Square payment result
export interface SquarePaymentResult {
  success: boolean;
  token?: string;
  error?: string;
  details?: any;
}

// Square form styling options
export const SQUARE_FORM_STYLES = {
  input: {
    color: '#111827',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '24px',
    placeholderColor: '#6B7280',
    backgroundColor: '#FFFFFF',
  },
  '.input-container': {
    borderColor: '#D1D5DB',
    borderRadius: '8px',
    borderWidth: '1px',
  },
  '.input-container.is-focus': {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  '.input-container.is-error': {
    borderColor: '#EF4444',
  },
  '.message-text': {
    color: '#EF4444',
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  '.message-icon': {
    color: '#EF4444',
  },
};

// Utility to format amount for display
export const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Convert dollars to cents for Square API
export const dollarsToSquareCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Convert Square cents to dollars for display
export const squareCentsToDollars = (cents: number): number => {
  return cents / 100;
};
