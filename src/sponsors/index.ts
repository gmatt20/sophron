import type { ExternalContextService, ProceduralMemoryService } from './contracts.js';
import { GBrainExternalContextService } from './gbrain.js';
import { MemorableProceduralMemoryService } from './memorable.js';

export type {
  ExternalContextService,
  ProceduralMemoryService,
  ReflectionContext,
  ReflectionMoment,
  ReflectionStrategy,
} from './contracts.js';

const noMemory: ProceduralMemoryService = {
  async recall() {
    return [];
  },
  async learn() {},
};

const noExternalContext: ExternalContextService = {
  async getRelevantContext() {
    return [];
  },
};

export function createSponsorServices(
  options: { enableMemorable?: boolean; gbrainToken?: string } = {},
): {
  proceduralMemory: ProceduralMemoryService;
  externalContext: ExternalContextService;
} {
  return {
    proceduralMemory: options.enableMemorable ? new MemorableProceduralMemoryService() : noMemory,
    externalContext: options.gbrainToken
      ? new GBrainExternalContextService(options.gbrainToken)
      : noExternalContext,
  };
}
