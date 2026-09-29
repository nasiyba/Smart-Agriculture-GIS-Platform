export type HealthClass = "Good" | "Fair" | "Poor" | "—";

/**
 * Converts the numeric vegetation-health score to a simple field condition.
 * Thresholds are tuned to the current Tree2409 dataset distribution:
 * Good >= 0.980, Fair >= 0.975 and < 0.980, Poor < 0.975.
 * Missing/non-numeric values remain unclassified.
 */
export function classifyVegetationHealth(value: unknown): HealthClass {
  if (value === null || value === undefined || value === "") return "—";
  const score = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(score)) return "—";
  if (score >= 0.98) return "Good";
  if (score >= 0.975) return "Fair";
  return "Poor";
}

export function healthClassName(value: unknown): string {
  const health = classifyVegetationHealth(value);
  return health === "—" ? "health-badge health-badge--unknown" : `health-badge health-badge--${health.toLowerCase()}`;
}
