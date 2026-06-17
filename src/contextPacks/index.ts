import { genericContextPack } from "./generic";
import { tkcContextPack } from "./tkc";
import type { ContextPack } from "../domain/types";

export const contextPacks = [genericContextPack, tkcContextPack];

export function getContextPack(id: string | undefined): ContextPack {
  return contextPacks.find((pack) => pack.id === id) ?? genericContextPack;
}

export { genericContextPack, tkcContextPack };
