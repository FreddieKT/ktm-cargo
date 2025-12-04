import { z } from 'zod';

export const vendorInviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  companyName: z.string().optional(),
});
