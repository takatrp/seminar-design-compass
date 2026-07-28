import type { Pillar, SeminarPlan } from "./types";

export function normalizePillarOrder(pillars: Pillar[]): Pillar[] {
  return pillars.map((pillar, order) => ({ ...pillar, order }));
}

export function addPillar(pillars: Pillar[], pillar: Pillar): Pillar[] {
  return normalizePillarOrder([...pillars, pillar]);
}

export function updatePillar(pillars: Pillar[], pillarId: string, patch: Partial<Pillar>): Pillar[] {
  return normalizePillarOrder(
    pillars.map((pillar) =>
      pillar.id === pillarId
        ? {
            ...pillar,
            ...patch,
            id: pillar.id
          }
        : pillar
    )
  );
}

export function movePillar(
  pillars: Pillar[],
  pillarId: string,
  direction: "up" | "down"
): Pillar[] {
  const index = pillars.findIndex((pillar) => pillar.id === pillarId);
  if (index < 0) return pillars;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= pillars.length) return pillars;
  const next = [...pillars];
  const [pillar] = next.splice(index, 1);
  next.splice(target, 0, pillar);
  return normalizePillarOrder(next);
}

export function removePillar(plan: SeminarPlan, pillarId: string): SeminarPlan {
  const pillars = normalizePillarOrder(plan.pillars.filter((pillar) => pillar.id !== pillarId));
  const fallbackId = pillars[0]?.id ?? "";
  return {
    ...plan,
    pillars,
    segments: plan.segments.map((segment) =>
      segment.pillarId === pillarId ? { ...segment, pillarId: fallbackId } : segment
    )
  };
}
