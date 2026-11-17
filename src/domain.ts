import { z } from 'zod';

export const departments = [
  'Engineering',
  'Product',
  'Data & Analytics',
  'IT',
  'Security',
  'Operations',
  'Customer Support',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Legal & Compliance',
  'Research',
  'Leadership',
  'Other',
] as const;
export const stages = ['Idea', 'Development', 'Pilot', 'Live', 'Retired'] as const;
export const roles = ['Owner', 'Reviewer', 'Administrator'] as const;
export type Role = (typeof roles)[number];
export const factors = ['complexity', 'impact', 'reach', 'reliance'] as const;
export type Factor = (typeof factors)[number];
export const questions: Record<
  Factor,
  { label: string; help: string; choices: readonly string[] }
> = {
  complexity: {
    label: 'How does the system work?',
    help: 'Consider the system itself, including models and tools.',
    choices: [
      'Simple model with a narrow task',
      'A single generative or predictive model',
      'Retrieval or several connected models',
      'An agent selecting and using tools',
    ],
  },
  impact: {
    label: 'What could happen if it gets something wrong?',
    help: 'Consider a plausible failure before controls are applied.',
    choices: [
      'Minor inconvenience, easily corrected',
      'Rework or a limited operational disruption',
      'Material disruption or a consequential recommendation',
      'Serious harm or a difficult-to-reverse decision',
    ],
  },
  reach: {
    label: 'Who can be affected?',
    help: 'Count the people exposed to outputs or decisions, not just operators.',
    choices: [
      'An individual in a sandbox',
      'A small internal team',
      'Several teams or a limited external audience',
      'A broad external audience',
    ],
  },
  reliance: {
    label: 'Who decides what happens next?',
    help: 'Choose the actual level of human oversight.',
    choices: [
      'A person decides whether to use advice',
      'A person approves every action',
      'The system acts; a person monitors and can intervene',
      'The system acts without routine human review',
    ],
  },
};
export const triggerLabels = {
  sensitive: 'Sensitive information',
  people: 'Consequential decisions about people',
  autonomous: 'Autonomous external actions',
} as const;
export type Trigger = keyof typeof triggerLabels;
const answersSchema = z.object({
  complexity: z.number().int().min(0).max(3).nullable(),
  impact: z.number().int().min(0).max(3).nullable(),
  reach: z.number().int().min(0).max(3).nullable(),
  reliance: z.number().int().min(0).max(3).nullable(),
});
export type Answers = z.infer<typeof answersSchema>;
export const emptyAnswers = (): Answers => ({
  complexity: null,
  impact: null,
  reach: null,
  reliance: null,
});
export const policySchema = z
  .object({
    version: z.number().int().positive(),
    lowMax: z.number().int().min(0).max(10),
    highMin: z.number().int().min(2).max(12),
  })
  .refine(
    (p) => p.highMin > p.lowMax + 1,
    'Leave at least one medium-risk score between the boundaries.',
  );
export type Policy = z.infer<typeof policySchema>;
export const defaultPolicy: Policy = { version: 1, lowMax: 3, highMin: 8 };
export const resultSchema = z.object({
  score: z.number().int().min(0).max(12),
  band: z.enum(['Low', 'Medium', 'High']),
  x: z.number().int().min(0).max(6),
  y: z.number().int().min(0).max(6),
  policyVersion: z.number().int().positive(),
});
export type Result = z.infer<typeof resultSchema>;
export function calculate(answers: Answers, policy: Policy): Result | null {
  if (factors.some((key) => answers[key] === null)) return null;
  const score = factors.reduce((sum, key) => sum + (answers[key] ?? 0), 0);
  return {
    score,
    band: score <= policy.lowMax ? 'Low' : score >= policy.highMin ? 'High' : 'Medium',
    x: answers.impact! + answers.reach!,
    y: answers.complexity! + answers.reliance!,
    policyVersion: policy.version,
  };
}
const triggerSchema = z.enum(['sensitive', 'people', 'autonomous']);
const evidenceSchema = z.object({
  answers: answersSchema,
  flags: z.array(triggerSchema),
  result: resultSchema.nullable(),
  policy: policySchema,
  at: z.string(),
  isAI: z.boolean(),
});
const eventSchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.enum(roles),
  text: z.string().max(3000),
  kind: z.enum(['created', 'edited', 'submitted', 'review', 'comment', 'archived', 'restored']),
  evidence: evidenceSchema.optional(),
});
export const caseSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  title: z.string().max(160),
  description: z.string().max(3000),
  department: z.enum(departments),
  owner: z.literal('Demo Owner'),
  stage: z.enum(stages),
  isAI: z.boolean(),
  tools: z.string().max(400),
  documentation: z.string().max(2000),
  controls: z.string().max(2000),
  visibility: z.enum(['Demo members', 'Owner only']),
  answers: answersSchema,
  flags: z.array(triggerSchema),
  flagsConfirmed: z.boolean(),
  status: z.enum(['Draft', 'Awaiting review', 'Approved', 'Changes requested', 'Recorded']),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  saved: evidenceSchema.nullable(),
  history: z.array(eventSchema),
});
export type UseCase = z.infer<typeof caseSchema>;
export type CaseInput = Pick<
  UseCase,
  | 'title'
  | 'description'
  | 'department'
  | 'stage'
  | 'isAI'
  | 'tools'
  | 'documentation'
  | 'controls'
  | 'visibility'
  | 'answers'
  | 'flags'
  | 'flagsConfirmed'
>;
export const snapshotSchema = z
  .object({
    schema: z.literal(1),
    revision: z.number().int().nonnegative(),
    policy: policySchema,
    cases: z.array(caseSchema).max(1000),
  })
  .refine(
    (s) => new Set(s.cases.map((c) => c.id)).size === s.cases.length,
    'Duplicate record IDs.',
  );
export type Snapshot = z.infer<typeof snapshotSchema>;
export function issues(input: CaseInput): string[] {
  const errors = [];
  if (!input.title.trim()) errors.push('Enter a use case name.');
  if (!input.description.trim()) errors.push('Describe what the use case does.');
  if (input.isAI) {
    for (const key of factors)
      if (input.answers[key] === null) errors.push(`Answer: ${questions[key].label}`);
    if (!input.flagsConfirmed)
      errors.push('Complete the review checklist, including None apply if appropriate.');
  }
  return errors;
}
export function currentResult(c: UseCase, p: Policy) {
  return c.isAI && c.status !== 'Draft' ? calculate(c.answers, p) : null;
}
export function requiresReview(c: Pick<UseCase, 'isAI' | 'flags'>) {
  return c.isAI && c.flags.length > 0;
}
export function visibleCases(cases: UseCase[], role: Role) {
  return cases.filter((c) => c.visibility === 'Demo members' || role !== 'Reviewer');
}
export function plotGroups(cases: UseCase[], policy: Policy) {
  const groups = new Map<string, { x: number; y: number; cases: UseCase[] }>();
  for (const c of cases) {
    const result = currentResult(c, policy);
    if (c.archived || !result) continue;
    const key = `${result.x},${result.y}`;
    const group = groups.get(key) ?? { x: result.x, y: result.y, cases: [] };
    group.cases.push(c);
    groups.set(key, group);
  }
  return [...groups.values()];
}
export function csv(cases: UseCase[], policy: Policy) {
  const cell = (value: unknown) => {
    let s = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows = [
    [
      'Use case',
      'Department',
      'Owner',
      'Lifecycle',
      'Status',
      'Archived',
      'Risk score / 12',
      'Band',
      'Review required',
      'Methodology version',
    ],
    ...cases.map((c) => {
      const r = currentResult(c, policy);
      return [
        c.title,
        c.department,
        c.owner,
        c.stage,
        c.status,
        c.archived ? 'Yes' : 'No',
        r?.score,
        r?.band,
        requiresReview(c) ? 'Required' : 'None',
        policy.version,
      ];
    }),
  ];
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
