/**
 * Shared filter schema contracts that stay framework and table agnostic.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export type FilterCodec<TValue> = {
  equals?: (left: TValue, right: TValue) => boolean;
  format: (value: TValue) => string;
  parse: (rawValue: string | null) => TValue | undefined;
};

export type FilterField<
  TState extends Record<string, unknown>,
  TKey extends keyof TState,
> = {
  codec: FilterCodec<TState[TKey]>;
  defaultValue: TState[TKey];
  key: TKey;
  normalize?: (value: TState[TKey]) => TState[TKey];
  queryKey: string;
};

export type FilterPatch<TState extends Record<string, unknown>> = Partial<TState>;

export type FilterSchemaFields<TState extends Record<string, unknown>> = {
  [TKey in keyof TState]: FilterField<TState, TKey>;
}[keyof TState];

export type FilterSchema<TState extends Record<string, unknown>> = {
  fields: FilterSchemaFields<TState>[];
};

// Private Objects -----------------------------------------------------------


