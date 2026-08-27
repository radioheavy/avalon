import type { JsonObject } from '@/types/prompt';
import type { DocumentRevision, PromptDocument, StructuredProjection } from '@/types/prompt-document';
import { createRevisionId, stableHash } from './hash';

export function projectionHash(projection: StructuredProjection): string {
  return stableHash(projection);
}

export function createDocumentRevision(
  sourceHash: string,
  projection: StructuredProjection,
  number: number,
  reason: DocumentRevision['reason'] = 'organize',
  label?: string,
): DocumentRevision {
  const projectionHashValue = projectionHash(projection);
  return {
    id: createRevisionId(sourceHash, projectionHashValue, number),
    number,
    sourceHash,
    projectionHash: projectionHashValue,
    createdAt: new Date().toISOString(),
    reason,
    ...(label ? { label } : {}),
  };
}

export function isProjectionStale(sourceHash: string, projection: StructuredProjection, revision?: DocumentRevision): boolean {
  if (!revision) return true;
  return revision.sourceHash !== sourceHash || revision.projectionHash !== projectionHash(projection);
}

export function markArtifactsStale(document: PromptDocument, revisionId: string): PromptDocument['artifacts'] {
  return document.artifacts.map((artifact) => artifact.revisionId === revisionId ? artifact : { ...artifact, status: 'stale' as const });
}

export function projectionToContent(projection: StructuredProjection): JsonObject {
  return projection.content;
}

export const hashProjection = projectionHash;
export const createRevision = createDocumentRevision;
