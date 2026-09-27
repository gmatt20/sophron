export type ReflectionMoment =
  | 'exploring'
  | 'revisiting-belief'
  | 'repeated-pattern'
  | 'feeling-stuck'
  | 'asking-for-advice'
  | 'ready-to-act';

export type ReflectionStrategy =
  | 'compare-beliefs'
  | 'ask-what-changed'
  | 'challenge-assumption'
  | 'surface-contradiction'
  | 'find-pattern'
  | 'offer-gentle-reframe'
  | 'offer-one-next-step';

export interface ProceduralMemoryService {
  recall(context: ReflectionMoment): Promise<string[]>;
  learn(input: {
    context: ReflectionMoment;
    strategy: ReflectionStrategy;
    outcome?: 'helpful' | 'unhelpful';
  }): Promise<void>;
}

export interface ExternalContextService {
  getRelevantContext(query: string): Promise<string[]>;
}

export interface ReflectionContext {
  proceduralMemory?: string[];
  externalContext?: string[];
}
