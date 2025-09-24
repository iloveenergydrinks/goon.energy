import type {
  Hull,
  ModuleDef,
  PrimaryArchetype,
  SecondaryDef,
} from "@/types/fitting";

export function filterModulesForContext(
  modules: ModuleDef[],
  hull: Hull | undefined,
  primary: PrimaryArchetype | undefined,
  secondaries: SecondaryDef[],
): ModuleDef[] {
  if (!hull) {
    return modules;
  }

  const selectionTags = new Set<string>([
    ...(primary?.tags ?? []),
    ...secondaries.flatMap((s) => s.tags ?? []),
  ]);

  const filtered = modules.filter((module) => {
    const moduleTags = module.tags ?? [];

    if (hull.incompatibleTags?.some((tag) => moduleTags.includes(tag))) {
      return false;
    }

    if (hull.compatibleTags?.length) {
      if (moduleTags.some((tag) => hull.compatibleTags?.includes(tag))) {
        return true;
      }
      if (moduleTags.some((tag) => selectionTags.has(tag))) {
        return true;
      }
      return moduleTags.length === 0;
    }

    if (selectionTags.size > 0) {
      if (moduleTags.length === 0) {
        return true;
      }
      if (moduleTags.some((tag) => selectionTags.has(tag))) {
        return true;
      }
    }

    return moduleTags.length === 0 || selectionTags.size === 0;
  });

  return filtered.length > 0 ? filtered : modules;
}

