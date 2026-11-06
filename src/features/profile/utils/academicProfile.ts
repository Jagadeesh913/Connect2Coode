export const normalizeCollegeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim();
  return normalized || null;
};
