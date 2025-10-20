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

// User Square configuration from account settings
export interface UserSquareConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
}

// Context type for Square configuration
export type SquareConfigContext = 'landing' | 'user';

// Square configuration for different contexts
export interface SquareConfigOptions {
  context: SquareConfigContext;
  userConfig?: UserSquareConfig;
}

// Get Square configuration based on context
export const getSquareConfig = (options: SquareConfigOptions) => {
  const { context, userConfig } = options;

  if (context === 'landing') {
    // Use environment variables for landing page
    return {
      applicationId:
        import.meta.env.VITE_SQUARE_APPLICATION_ID ||
        (() => {
          console.error('❌ VITE_SQUARE_APPLICATION_ID environment variable is required for landing page');
          return 'your_square_app_id_here';
        })(),
      locationId:
        import.meta.env.VITE_SQUARE_LOCATION_ID ||
        (() => {
          console.error('❌ VITE_SQUARE_LOCATION_ID environment variable is required for landing page');
          return 'your_square_location_id_here';
        })(),
      environment: (import.meta.env.VITE_SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    };
  } else if (context === 'user') {
    // Use user's Square credentials from account settings
    if (!userConfig) {
      throw new Error('User Square configuration is required for user context');
    }

    if (!userConfig.applicationId || !userConfig.locationId) {
      throw new Error(
        'User Square configuration is incomplete. Please configure your Square API keys in Account Settings.',
      );
    }

    return {
      applicationId: userConfig.applicationId,
      locationId: userConfig.locationId,
      environment: userConfig.environment || 'sandbox',
    };
  } else {
    throw new Error(`Unknown Square configuration context: ${context}`);
  }
};

// Legacy SQUARE_CONFIG for backward compatibility (landing page context)
export const SQUARE_CONFIG = getSquareConfig({ context: 'landing' });

// Load Square SDK dynamically with context-aware configuration
export const loadSquareSDK = (options?: SquareConfigOptions): Promise<SquarePayments> => {
  return new Promise((resolve, reject) => {
    // Use provided options or default to landing context
    const configOptions = options || { context: 'landing' };

    let squareConfig;
    try {
      squareConfig = getSquareConfig(configOptions);
    } catch (error) {
      console.error('❌ Square configuration error:', error);
      reject(error);
      return;
    }

    const sdkUrl =
      squareConfig.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';

    console.log('🔄 Loading Square SDK...', {
      context: configOptions.context,
      config: {
        applicationId: squareConfig.applicationId,
        locationId: squareConfig.locationId,
        environment: squareConfig.environment,
      },
      sdkUrl: sdkUrl,
    });

    // Validate required configuration
    if (
      squareConfig.applicationId.includes('MISSING') ||
      squareConfig.applicationId.includes('your_square_app_id_here') ||
      squareConfig.locationId.includes('MISSING') ||
      squareConfig.locationId.includes('your_square_location_id_here')
    ) {
      const error = new Error(
        `Square configuration is incomplete for ${configOptions.context} context. Please check your configuration.`,
      );
      console.error('❌ Square configuration validation failed:', error);
      reject(error);
      return;
    }

    // Check if Square is already loaded
    if (window.Square) {
      console.log('✅ Square SDK already loaded, initializing payments...');
      try {
        const payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
        console.log('✅ Square payments initialized successfully');
        resolve(payments);
      } catch (error) {
        console.error('❌ Error initializing Square payments:', error);
        reject(error);
      }
      return;
    }

    console.log('📦 Loading Square SDK from:', sdkUrl);

    // Create script element
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => {
      console.log('✅ Square SDK script loaded successfully');
      try {
        if (window.Square) {
          console.log('🔧 Initializing Square payments...');
          const payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
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
