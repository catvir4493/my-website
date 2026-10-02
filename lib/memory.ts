export type MemoryBlock = { id: number; start: number; size: number };
export const heapSize = 64;
export function allocate(blocks: MemoryBlock[], size: number, id: number): MemoryBlock[] | null {
  if (!Number.isInteger(size) || size < 1 || size > heapSize) return null;
  const ordered = [...blocks].sort((a, b) => a.start - b.start);
  let start = 0;
  for (const block of ordered) {
    if (block.start - start >= size) break;
    start = block.start + block.size;
  }
  if (start + size > heapSize) return null;
  return [...ordered, { id, start, size }].sort((a, b) => a.start - b.start);
}
export function release(blocks: MemoryBlock[], id: number) {
  return blocks.filter((block) => block.id !== id);
}
export function freeSegments(blocks: MemoryBlock[]): { start: number; size: number }[] {
  const segments = [];
  let cursor = 0;
  for (const block of [...blocks].sort((a, b) => a.start - b.start)) {
    if (block.start > cursor) segments.push({ start: cursor, size: block.start - cursor });
    cursor = block.start + block.size;
  }
  if (cursor < heapSize) segments.push({ start: cursor, size: heapSize - cursor });
  return segments;
}
