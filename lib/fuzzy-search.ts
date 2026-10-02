// Rank contiguous matches first, then ordered subsequences with fewer gaps.
export function fuzzyScore(query: string, candidate: string): number | null {
  const needle = query.toLowerCase().replace(/\s+/g, "");
  const haystack = candidate.toLowerCase();
  if (!needle) return 0;
  const exact = haystack.indexOf(needle);
  if (exact >= 0) return exact;
  let cursor = -1;
  let score = 100;
  for (const letter of needle) {
    const next = haystack.indexOf(letter, cursor + 1);
    if (next < 0) return null;
    score += next - cursor - 1;
    cursor = next;
  }
  return score;
}
