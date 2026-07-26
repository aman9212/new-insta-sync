import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

export interface StripePayoutConfig {
  secretKey: string;
  webhookSecret: string;
  applicationFeePercent?: number;
}

export interface StripePayoutInput {
  withdrawalId: string;
  userId: string;
  amountCents: number;
  stripeAccountId: string;
  currency?: string;
}

export interface StripePayoutResult {
  provider: 'stripe';
  reference: string;
  status: 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';
  stripeTransferId?: string;
  stripePayoutId?: string;
  error?: string;
}

export class StripePayoutProvider {
  private stripe: Stripe;
  private config: StripePayoutConfig;

  constructor(config: StripePayoutConfig) {
    this.config = config;
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2024-04-10',
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  /**
   * Create a payout to a connected Stripe account
   */
  async createPayout(input: StripePayoutInput): Promise<StripePayoutResult> {
    const { withdrawalId, userId, amountCents, stripeAccountId, currency = 'inr' } = input;

    try {
      // Validate the connected account exists and is ready for payouts
      const account = await this.stripe.accounts.retrieve(stripeAccountId);
      
      if (!account.charges_enabled || !account.payouts_enabled) {
        return {
          provider: 'stripe',
          reference: `stripe:${withdrawalId}`,
          status: 'rejected',
          error: 'Connected account not ready for payouts (charges_enabled or payouts_enabled is false)',
        };
      }

      // Create a transfer to the connected account
      // This moves funds from the platform to the connected account
      const transfer = await this.stripe.transfers.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        destination: stripeAccountId,
        metadata: {
          withdrawal_id: withdrawalId,
          user_id: userId,
        },
      });

      // Create a payout from the connected account to their bank
      // Note: In Stripe Connect, the connected account initiates payouts to their bank
      // But we can create a payout on their behalf if we have the right permissions
      const payout = await this.stripe.payouts.create(
        {
          amount: amountCents,
          currency: currency.toLowerCase(),
          metadata: {
            withdrawal_id: withdrawalId,
            user_id: userId,
            transfer_id: transfer.id,
          },
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      return {
        provider: 'stripe',
        reference: `stripe:${transfer.id}`,
        status: 'paid',
        stripeTransferId: transfer.id,
        stripePayoutId: payout.id,
      };
    } catch (error: any) {
      console.error('Stripe payout error:', error);
      
      // Determine status based on error type
      let status: StripePayoutResult['status'] = 'failed';
      if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
        status = 'rejected';
      }

      return {
        provider: 'stripe',
        reference: `stripe:${withdrawalId}`,
        status,
        error: error.message || 'Unknown Stripe error',
      };
    }
  }

  /**
   * Get the status of a payout by its reference (transfer ID)
   */
  async getPayoutStatus(reference: string): Promise<'approved' | 'processing' | 'paid' | 'rejected' | 'failed'> {
    try {
      // Extract transfer ID from reference (format: "stripe:tr_...")
      const transferId = reference.replace('stripe:', '');
      
      const transfer = await this.stripe.transfers.retrieve(transferId);
      
      // Map Stripe transfer status to our status
      switch (transfer.status) {
        case 'paid':
          return 'paid';
        case 'pending':
          return 'processing';
        case 'failed':
          return 'failed';
        case 'canceled':
          return 'rejected';
        default:
          return 'processing';
      }
    } catch (error) {
      console.error('Error getting payout status:', error);
      return 'failed';
    }
  }

  /**
   * Verify a webhook signature
   */
  verifyWebhookSignature(payload: string | Uint8Array, signature: string): Stripe.Event | null {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.config.webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  /**
   * Get connected account details for a user
   */
  async getConnectedAccount(accountId: string): Promise<Stripe.Account | null> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      console.error('Error retrieving connected account:', error);
      return null;
    }
  }

  /**
   * Create an account link for onboarding a creator to Stripe Connect
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<Stripe.AccountLink> {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  /**
   * Create a new connected account for a creator
   */
  async createConnectedAccount(email: string, country: string = 'IN'): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: false },
      },
      business_type: 'individual',
    });
  }
}

// Factory function to create provider from environment
export function createStripePayoutProvider(): StripePayoutProvider {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }

  return new StripePayoutProvider({
    secretKey,
    webhookSecret,
    applicationFeePercent: parseFloat(Deno.env.get('STRIPE_APPLICATION_FEE_PERCENT') || '0'),
  });
}