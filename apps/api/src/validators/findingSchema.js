import { z } from 'zod';

export const FindingSeveritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

export const FindingConfidenceSchema = z.enum([
  'high',
  'medium',
  'low',
]);

export const FindingSourceSchema = z.enum([
  'eslint',
  'semgrep',
  'ai',
  'regex',
]);

export const VerificationStatusSchema = z.enum([
  'unverified',
  'verified',
  'dismissed',
]);

export const FindingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Finding title is required'),
  severity: FindingSeveritySchema,
  confidence: FindingConfidenceSchema,
  source: FindingSourceSchema,
  ruleId: z.string().min(1, 'Rule ID is required'),
  filePath: z.string().min(1, 'File path is required'),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  evidence: z.string().min(1, 'Evidence is required'),
  explanation: z.string().min(1, 'Explanation is required'),
  suggestedFix: z.string().optional(),
  verificationStatus: VerificationStatusSchema.default('unverified'),
  createdAt: z.string().datetime().optional(),
});

export const FindingListSchema = z.array(FindingSchema);

