export interface PayoutProvider {
  createPayout(input: { withdrawalId: string; userId: string; amountCents: number }): Promise<PayoutResult>;
  getPayoutStatus(reference: string): Promise<PayoutStatus>;
}

export type PayoutStatus = 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';
export interface PayoutResult {
  provider: string;
  reference: string;
  status: PayoutStatus;
}

export const manualPayoutProvider: PayoutProvider = {
  async createPayout(input) {
    return {
      provider: 'manual',
      reference: `manual:${input.withdrawalId}`,
      status: 'processing',
    };
  },
  async getPayoutStatus() {
    return 'processing';
  },
};

// Stripe Connect Payout Provider for India (using Stripe Connect Standard/Express accounts)
export const createStripePayoutProvider = (stripeSecretKey: string): PayoutProvider => {
  // Import Stripe dynamically for Deno edge runtime
  const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  return {
    async createPayout(input) {
      try {
        // Get the user's Stripe Connect account ID from provider_connections
        // For now, we'll use a placeholder - in production, fetch from database
        const connectedAccountId = await getStripeConnectedAccountId(input.userId);
        
        if (!connectedAccountId) {
          throw new Error('No Stripe Connect account linked for user');
        }

        // Create a payout to the connected account
        const payout = await stripe.payouts.create(
          {
            amount: input.amountCents,
            currency: 'inr', // Indian Rupees
            destination: connectedAccountId,
          },
          {
            stripeAccount: connectedAccountId, // Act as the connected account
          }
        );

        return {
          provider: 'stripe',
          reference: payout.id,
          status: mapStripePayoutStatus(payout.status),
        };
      } catch (error) {
        console.error('Stripe payout creation failed:', error);
        return {
          provider: 'stripe',
          reference: `failed:${input.withdrawalId}`,
          status: 'failed',
        };
      }
    },

    async getPayoutStatus(reference) {
      try {
        const payout = await stripe.payouts.retrieve(reference);
        return mapStripePayoutStatus(payout.status);
      } catch (error) {
        console.error('Stripe payout status check failed:', error);
        return 'failed';
      }
    },
  };
};

// Helper function to get user's Stripe Connect account ID
async function getStripeConnectedAccountId(userId: string): Promise<string | null> {
  // In production, fetch from provider_connections table
  // For now, return null to indicate not configured
  // TODO: Implement database lookup
  return null;
}

// Map Stripe payout status to our internal status
function mapStripePayoutStatus(stripeStatus: string): PayoutStatus {
  switch (stripeStatus) {
    case 'paid':
      return 'paid';
    case 'pending':
    case 'in_transit':
      return 'processing';
    case 'canceled':
    case 'failed':
      return 'failed';
    default:
      return 'processing';
  }
}

// Factory function to get the appropriate payout provider based on configuration
export const getPayoutProvider = async (): Promise<PayoutProvider> => {
  const providerType = Deno.env.get('PAYOUT_PROVIDER') || 'manual';
  
  switch (providerType) {
    case 'stripe':
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        console.warn('STRIPE_SECRET_KEY not configured, falling back to manual provider');
        return manualPayoutProvider;
      }
      return createStripePayoutProvider(stripeKey);
    
    case 'manual':
    default:
      return manualPayoutProvider;
  }
};
