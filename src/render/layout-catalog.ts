import type {FlexSceneDataType} from './flex-blocks.js';
import {LAYOUTS} from './layouts/registry.js';

export interface FlexCatalogEntry {
  /** Editor id; the scene data itself stays template:"flex". */
  id: string;
  label: string;
  group: string;
  kind: 'flex';
  data: FlexSceneDataType;
}

/** Generated from the registry so a new layout cannot be forgotten by the UI. */
export const FLEX_CATALOG: FlexCatalogEntry[] = LAYOUTS.map(layout => ({
  id: `flex-${layout.id}`,
  label: `Flex · ${layout.label}`,
  group: layout.group,
  kind: 'flex',
  data: layout.sample,
}));

export function flexCatalogEntry(id: string): FlexCatalogEntry | undefined {
  return FLEX_CATALOG.find(entry => entry.id === id);
}
