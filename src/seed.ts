import { type CaseInput, type Snapshot, type UseCase, calculate, defaultPolicy } from './domain';
const date = '2026-01-15T10:00:00.000Z';
const examples: [
  string,
  CaseInput['department'],
  string,
  number[],
  UseCase['flags'],
  UseCase['status'],
  CaseInput['stage'],
][] = [
  [
    'Customer support reply assistant',
    'Customer Support',
    'Drafts replies using fictional help articles. A support agent checks and approves every response.',
    [1, 2, 2, 1],
    [],
    'Awaiting review',
    'Pilot',
  ],
  [
    'Internal knowledge search assistant',
    'IT',
    'Finds answers in a synthetic staff handbook and includes references for people to verify.',
    [1, 0, 1, 0],
    [],
    'Approved',
    'Live',
  ],
  [
    'Meeting notes and action extractor',
    'Operations',
    'Turns fictional meeting notes into draft summaries and proposed action lists.',
    [1, 0, 1, 0],
    [],
    'Draft',
    'Idea',
  ],
  [
    'Invoice extraction assistant',
    'Finance',
    'Extracts fields from fictional invoices for human validation before entry into a sample ledger. Demonstrates a sensitive-information review.',
    [1, 2, 2, 1],
    ['sensitive'],
    'Approved',
    'Pilot',
  ],
  [
    'Sales demand forecasting model',
    'Sales',
    'Uses synthetic sales history to recommend demand forecasts. A planning team makes the final decisions.',
    [1, 2, 1, 0],
    [],
    'Approved',
    'Live',
  ],
  [
    'Marketing content drafting assistant',
    'Marketing',
    'Creates draft campaign copy for a fictional product. Review feedback requests clearer editorial controls.',
    [1, 1, 3, 1],
    [],
    'Changes requested',
    'Development',
  ],
  [
    'Recruitment application summariser',
    'Human Resources',
    'Summarises entirely fictional applications. It does not score candidates or make hiring decisions.',
    [1, 3, 2, 2],
    ['people', 'sensitive'],
    'Awaiting review',
    'Pilot',
  ],
  [
    'Legacy developer documentation assistant',
    'Engineering',
    'An archived tool that drafted documentation for fictional source code. Retained to demonstrate restoration.',
    [1, 0, 1, 0],
    [],
    'Approved',
    'Retired',
  ],
  [
    'Inventory replenishment agent',
    'Operations',
    'Simulates inventory checks and replenishment actions using fictional stock levels. No real orders are placed.',
    [3, 2, 2, 3],
    ['autonomous'],
    'Awaiting review',
    'Development',
  ],
  [
    'Expense policy rules checker',
    'Finance',
    'Applies fixed example rules to synthetic expenses. There is no AI model, so no numerical AI risk score is assigned.',
    [0, 0, 0, 0],
    [],
    'Recorded',
    'Live',
  ],
];
export function seed(): Snapshot {
  return {
    schema: 1,
    revision: 0,
    policy: { ...defaultPolicy },
    cases: examples.map(([title, department, description, points, flags, status, stage], i) => {
      const isAI = i !== 9;
      const answers = {
        complexity: points[0],
        impact: points[1],
        reach: points[2],
        reliance: status === 'Draft' ? null : points[3],
      };
      const saved =
        status === 'Draft'
          ? null
          : {
              answers: { ...answers },
              flags: [...flags],
              result: isAI ? calculate(answers, defaultPolicy) : null,
              policy: { ...defaultPolicy },
              at: date,
              isAI,
            };
      return {
        id: `demo-${String(i + 1).padStart(2, '0')}`,
        version: 1,
        title,
        department,
        description,
        owner: 'Demo Owner',
        stage,
        isAI,
        tools: isAI ? 'Synthetic model and local sample documents' : 'Deterministic rules engine',
        documentation:
          'Built-in sample: all inputs, outputs and activities are fictional. No external service is connected.',
        controls:
          i === 8
            ? 'Tool actions are simulated. Define approval limits and exception handling before any real deployment.'
            : 'A person checks outputs and can reject or correct them.',
        visibility: 'Demo members',
        answers,
        flags,
        flagsConfirmed: status !== 'Draft',
        status,
        archived: i === 7,
        createdAt: date,
        updatedAt: date,
        saved,
        history: [
          {
            id: `seed-${i}`,
            at: date,
            actor: 'Owner',
            kind: 'created',
            text: 'Fictional example created for the interactive demo.',
            ...(saved ? { evidence: saved } : {}),
          },
          ...(status === 'Changes requested'
            ? [
                {
                  id: 'seed-feedback',
                  at: date,
                  actor: 'Reviewer' as const,
                  kind: 'review' as const,
                  text: 'Add a documented editorial approval step before external publication.',
                },
              ]
            : []),
        ],
      };
    }),
  };
}
