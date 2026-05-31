/**
 * URLSearchParams adapter used by shared filter parsing and serialization utilities.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export function createUrlSearchParamsIO(searchParams: URLSearchParams): {
  getParam: (queryKey: string) => string | null;
  setParam: (queryKey: string, value: string | null) => void;
} {
  return {
    getParam: (queryKey) => searchParams.get(queryKey),
    setParam: (queryKey, value) => {
      if (value === null) {
        searchParams.delete(queryKey);
        return;
      }

      searchParams.set(queryKey, value);
    },
  };
}

// Private Objects -----------------------------------------------------------

