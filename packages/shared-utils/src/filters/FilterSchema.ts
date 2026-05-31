/**
 * Framework-agnostic helpers for parsing, patching, and serializing filter state.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

import type { FilterPatch, FilterSchema } from "./FilterTypes.js";

// Public Objects ------------------------------------------------------------

export function applyFilterPatch<TState extends Record<string, unknown>>(
  schema: FilterSchema<TState>,
  currentState: TState,
  patch: FilterPatch<TState>,
): TState {
  const patched = { ...currentState, ...patch } as TState;

  for (const field of schema.fields) {
    const value = patched[field.key];
    patched[field.key] = field.normalize ? field.normalize(value) : value;
  }

  return patched;
}

export function getDefaultFilters<TState extends Record<string, unknown>>(
  schema: FilterSchema<TState>,
): TState {
  const defaults = {} as TState;

  for (const field of schema.fields) {
    defaults[field.key] = field.defaultValue;
  }

  return defaults;
}

export function parseFilters<TState extends Record<string, unknown>>(
  schema: FilterSchema<TState>,
  getParam: (queryKey: string) => string | null,
): TState {
  const parsed = {} as TState;

  for (const field of schema.fields) {
    const rawValue = getParam(field.queryKey);
    const parsedValue = field.codec.parse(rawValue);
    const withDefault = parsedValue === undefined ? field.defaultValue : parsedValue;
    parsed[field.key] = field.normalize ? field.normalize(withDefault) : withDefault;
  }

  return parsed;
}

export function serializeFilters<TState extends Record<string, unknown>>(
  schema: FilterSchema<TState>,
  state: TState,
  setParam: (queryKey: string, value: string | null) => void,
): void {
  for (const field of schema.fields) {
    const value = state[field.key];
    const equals = field.codec.equals ?? Object.is;

    if (equals(value, field.defaultValue)) {
      setParam(field.queryKey, null);
      continue;
    }

    setParam(field.queryKey, field.codec.format(value));
  }
}

// Private Objects -----------------------------------------------------------
