/**
 * Reusable codecs for reading and writing typed filter values from query params.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

import type { FilterCodec } from "./FilterTypes.js";

// Public Objects ------------------------------------------------------------

export function booleanCodec(): FilterCodec<boolean> {
  return {
    format: (value) => String(value),
    parse: (rawValue) => {
      if (rawValue === null) {
        return undefined;
      }
      if (rawValue === "true" || rawValue === "1") {
        return true;
      }
      if (rawValue === "false" || rawValue === "0") {
        return false;
      }
      return undefined;
    },
  };
}

export function csvCodec(options?: {
  delimiter?: string;
  trimValues?: boolean;
}): FilterCodec<string[]> {
  const delimiter = options?.delimiter ?? ",";
  const trimValues = options?.trimValues ?? true;

  return {
    equals: (left, right) => {
      if (left.length !== right.length) {
        return false;
      }
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) {
          return false;
        }
      }
      return true;
    },
    format: (value) => value.join(delimiter),
    parse: (rawValue) => {
      if (rawValue === null || rawValue.length === 0) {
        return undefined;
      }

      const parsed = rawValue
        .split(delimiter)
        .map((entry) => (trimValues ? entry.trim() : entry))
        .filter((entry) => entry.length > 0);

      return parsed;
    },
  };
}

export function enumCodec<TValue extends string>(
  allowedValues: readonly TValue[],
): FilterCodec<TValue> {
  return {
    format: (value) => value,
    parse: (rawValue) => {
      if (rawValue === null) {
        return undefined;
      }
      return allowedValues.includes(rawValue as TValue)
        ? (rawValue as TValue)
        : undefined;
    },
  };
}

export function intCodec(options?: {
  max?: number;
  min?: number;
}): FilterCodec<number> {
  return {
    format: (value) => String(value),
    parse: (rawValue) => {
      const parsed = parseInteger(rawValue);
      if (parsed === undefined) {
        return undefined;
      }

      if (options?.min !== undefined && parsed < options.min) {
        return undefined;
      }
      if (options?.max !== undefined && parsed > options.max) {
        return undefined;
      }

      return parsed;
    },
  };
}

export function stringCodec(options?: {
  allowEmpty?: boolean;
  trimValues?: boolean;
}): FilterCodec<string> {
  const allowEmpty = options?.allowEmpty ?? false;
  const trimValues = options?.trimValues ?? true;

  return {
    format: (value) => value,
    parse: (rawValue) => {
      if (rawValue === null) {
        return undefined;
      }

      const parsed = trimValues ? rawValue.trim() : rawValue;
      if (!allowEmpty && parsed.length === 0) {
        return undefined;
      }

      return parsed;
    },
  };
}

// Private Objects -----------------------------------------------------------

function parseInteger(rawValue: string | null): number | undefined {
  if (rawValue === null || rawValue.length === 0) {
    return undefined;
  }

  if (!/^-?\d+$/.test(rawValue)) {
    return undefined;
  }

  return Number.parseInt(rawValue, 10);
}
