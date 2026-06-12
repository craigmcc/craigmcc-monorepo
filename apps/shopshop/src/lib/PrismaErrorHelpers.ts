/**
 * Shared helpers for interpreting Prisma known request error payloads.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

/**
 * Return constrained field targets from a Prisma unique-constraint error.
 */
export function extractPrismaUniqueConstraintTargets(error: unknown): string[] {
  if (!isPrismaUniqueConstraintError(error)) {
    return [];
  }

  const directTargets = arrayStrings(error.meta?.target);
  if (directTargets.length > 0) {
    return directTargets;
  }

  return arrayStrings(error.meta?.driverAdapterError?.cause?.constraint?.fields);
}

/**
 * Return true when the error is a Prisma foreign key constraint error.
 */
export function isPrismaForeignKeyConstraintError(error: unknown): boolean {
  return isPrismaKnownRequestErrorCode(error, FOREIGN_KEY_CONSTRAINT_ERROR_CODE);
}

/**
 * Return true when the error is a Prisma record-not-found error.
 */
export function isPrismaRecordNotFoundError(error: unknown): boolean {
  return isPrismaKnownRequestErrorCode(error, RECORD_NOT_FOUND_ERROR_CODE);
}

/**
 * Return true when the error is a Prisma unique-constraint error.
 */
export function isPrismaUniqueConstraintError(error: unknown): error is PrismaKnownRequestErrorShape {
  return isPrismaKnownRequestErrorCode(error, UNIQUE_CONSTRAINT_ERROR_CODE);
}

// Private Objects -----------------------------------------------------------

const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";
const FOREIGN_KEY_CONSTRAINT_ERROR_CODE = "P2003";
const RECORD_NOT_FOUND_ERROR_CODE = "P2025";

type PrismaErrorMeta = {
  target?: unknown;
  driverAdapterError?: {
    cause?: {
      constraint?: {
        fields?: unknown;
      };
    };
  };
};

type PrismaKnownRequestErrorShape = {
  code?: unknown;
  meta?: PrismaErrorMeta;
};

function arrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => typeof entry === "string");
}

function isPrismaKnownRequestErrorCode(error: unknown, code: string): error is PrismaKnownRequestErrorShape {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as PrismaKnownRequestErrorShape;
  return candidate.code === code;
}



