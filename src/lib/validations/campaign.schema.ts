import { z } from 'zod';

/**
 * 1. Campaign Creation Runtime Schema
 * Validates budget strictly in minor units (cents), valid date ordering, and string constraints.
 */
export const CampaignCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Campaign title must be at least 5 characters')
      .max(100, 'Campaign title cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .min(20, 'Campaign description must be detailed (at least 20 characters)')
      .max(2000, 'Description cannot exceed 2000 characters'),
    platform: z.enum(['youtube', 'tiktok', 'instagram', 'all'], {
      message: 'Invalid target platform selected',
    }),
    totalBudgetCents: z
      .number({ message: 'Budget must be a valid number' })
      .int('Budget must be an integer in cents')
      .positive('Budget must be greater than zero ($0.00)'),
    payoutPer1kViewsCents: z
      .number({ message: 'Payout rate must be a valid number' })
      .int('Payout rate must be an integer in cents')
      .positive('Payout rate must be greater than zero'),
    minViewThreshold: z
      .number()
      .int()
      .nonnegative('Minimum view threshold cannot be negative')
      .default(1000),
    maxPayoutPerCreatorCents: z
      .number()
      .int()
      .positive('Maximum payout per creator must be greater than zero')
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date ISO string' }),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date ISO string' }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be scheduled after the start date',
    path: ['endDate'],
  })
  .refine(
    (data) => !data.maxPayoutPerCreatorCents || data.maxPayoutPerCreatorCents <= data.totalBudgetCents,
    {
      message: 'Max creator payout cannot exceed total campaign budget',
      path: ['maxPayoutPerCreatorCents'],
    }
  );

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;

/**
 * 2. Creator Withdrawal Request Runtime Schema
 * Validates payout methods, strict positive cents, and payment destination formats.
 */
export const WithdrawalRequestSchema = z
  .object({
    amountCents: z
      .number({ message: 'Withdrawal amount must be a number' })
      .int('Amount must be an integer in cents')
      .min(1000, 'Minimum withdrawal amount is $10.00 (1000 cents)'),
    paymentMethod: z.enum(['stripe', 'razorpay', 'paypal', 'upi', 'bank_transfer'], {
      message: 'Unsupported payment method selected',
    }),
    destinationAccount: z
      .string()
      .trim()
      .min(3, 'Destination account ID/address is required'),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === 'paypal') {
        return z.string().email().safeParse(data.destinationAccount).success;
      }
      if (data.paymentMethod === 'upi') {
        return /^[\w.-]+@[\w.-]+$/.test(data.destinationAccount);
      }
      return true;
    },
    {
      message: 'Invalid destination account format for the selected payment method',
      path: ['destinationAccount'],
    }
  );

export type WithdrawalRequestInput = z.infer<typeof WithdrawalRequestSchema>;
