/**
 * Server-side actions that perform mutations on List models.
 */

// External Imports ----------------------------------------------------------

import {
  ActionResult,
  ERRORS,
  ValidationActionResult,
} from "@repo/daisy-form/ActionResult";
import { dbShopShop } from "@repo/db-shopshop";
import { MemberRole } from "@repo/db-shopshop/enums";
import type { List } from "@repo/db-shopshop/types";
import { IdSchema, IdSchemaType } from "@repo/db-shopshop/zod-schemas/IdSchema";
import {
  ListCreateSchema,
  ListCreateSchemaType,
  ListUpdateSchema,
  ListUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ListSchema";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Imports ----------------------------------------------------------

import { executeIdempotentOperation } from "@/lib/ExecuteIdempotentOperation";
import { populateList } from "@/lib/ListHelpers";
import { safeParseOperationEnvelope } from "@/lib/OperationEnvelopeHelpers";
import {
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
} from "@/lib/PrismaErrorHelpers";
import { findProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

export async function createList(data: ListCreateSchemaType, operationEnvelope?: unknown): Promise<ActionResult<List>> {

  try {

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // AUTHORIZATION - Any signed-in profile can create a list

    // VALIDATION - Validate input content
    const result = ListCreateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "ListActions.createList",
        data,
        issues: result.error.issues,
      });
      return ValidationActionResult<List>(result.error);
    }

    const mutateList = async (): Promise<ActionResult<List>> => {
      const createdList = await dbShopShop.$transaction(async (transaction) => {
        const list = await transaction.list.create({
          data: {
            ...result.data,
            members: {
              create: {
                profileId: profile.id,
                role: MemberRole.ADMIN,
              },
            },
          },
        });

        await populateList(list.id, true, true, transaction);

        return list;
      });

      logger.info({
        context: "ListActions.createList",
        listId: createdList.id,
        profileId: profile.id,
      });

      return { model: createdList };
    };

    const operationId = parseOperationId(operationEnvelope, "createList");
    if (!operationId) {
      return mutateList();
    }

    return executeIdempotentOperation<List>({
      actorProfileId: profile.id,
      operationId,
      operationType: "createList",
      payload: result.data,
    }, mutateList);

  } catch (error) {
    if (isPrismaForeignKeyConstraintError(error)) {
      logger.warn({
        context: "ListActions.createList",
        error,
        message: "List create hit foreign key constraint",
      });
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    logger.error({
      context: "ListActions.createList",
      error,
      message: "Unexpected error creating List",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function deleteList(listId: IdSchemaType, operationEnvelope?: unknown): Promise<ActionResult<List>> {

  try {

    // VALIDATION - Validate list ID
    const validatedListId = IdSchema.safeParse(listId);
    if (!validatedListId.success) {
      logger.error({
        context: "ListActions.deleteList",
        issues: validatedListId.error.issues,
        listId,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    const mutateList = async (): Promise<ActionResult<List>> => {
      const member = await findAdminMembership(validatedListId.data, profile.id);
      if (!member) {
        logger.warn({
          context: "ListActions.deleteList",
          listId: validatedListId.data,
          profileId: profile.id,
          message: "Unauthorized list deletion attempt",
        });
        return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
      }

      const deletedList = await dbShopShop.list.delete({
        where: {
          id: validatedListId.data,
        },
      });

      logger.info({
        context: "ListActions.deleteList",
        listId: deletedList.id,
        profileId: profile.id,
      });

      return { model: deletedList };
    };

    const operationId = parseOperationId(operationEnvelope, "deleteList");
    if (operationId) {
      return executeIdempotentOperation<List>({
        actorProfileId: profile.id,
        operationId,
        operationType: "deleteList",
        payload: {
          listId: validatedListId.data,
        },
      }, mutateList);
    }

    return mutateList();

  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      logger.warn({
        context: "ListActions.deleteList",
        error,
        message: "List delete raced with another operation",
      });
      return { message: NO_LIST_MESSAGE, status: 404 };
    }

    logger.error({
      context: "ListActions.deleteList",
      error,
      message: "Unexpected error deleting List",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function updateList(listId: IdSchemaType, data: ListUpdateSchemaType, operationEnvelope?: unknown): Promise<ActionResult<List>> {

  try {

    // VALIDATION - Validate list ID
    const validatedListId = IdSchema.safeParse(listId);
    if (!validatedListId.success) {
      logger.error({
        context: "ListActions.updateList",
        issues: validatedListId.error.issues,
        listId,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // AUTHORIZATION - Must be an ADMIN member of this list
    const member = await findAdminMembership(validatedListId.data, profile.id);
    if (!member) {
      logger.warn({
        context: "ListActions.updateList",
        listId: validatedListId.data,
        profileId: profile.id,
        message: "Unauthorized list update attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // VALIDATION - Validate input content
    const result = ListUpdateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "ListActions.updateList",
        data,
        issues: result.error.issues,
        listId: validatedListId.data,
        profileId: profile.id,
      });
      return ValidationActionResult<List>(result.error);
    }

    const mutateList = async (): Promise<ActionResult<List>> => {
      const updatedList = await dbShopShop.list.update({
        data: result.data,
        where: {
          id: validatedListId.data,
        },
      });

      logger.info({
        context: "ListActions.updateList",
        listId: updatedList.id,
        profileId: profile.id,
      });

      return { model: updatedList };
    };

    const operationId = parseOperationId(operationEnvelope, "updateList");
    if (!operationId) {
      return mutateList();
    }

    return executeIdempotentOperation<List>({
      actorProfileId: profile.id,
      operationId,
      operationType: "updateList",
      payload: {
        data: result.data,
        listId: validatedListId.data,
      },
    }, mutateList);

  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      logger.warn({
        context: "ListActions.updateList",
        error,
        message: "List update raced with another operation",
      });
      return { message: NO_LIST_MESSAGE, status: 404 };
    }

    logger.error({
      context: "ListActions.updateList",
      error,
      message: "Unexpected error updating List",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

// Private Objects -----------------------------------------------------------

const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";
const NO_LIST_MESSAGE = "No List found for the specified ID";

function parseOperationId(operationEnvelope: unknown, operationType: "createList" | "deleteList" | "updateList"): string | null {
  if (!operationEnvelope) {
    return null;
  }

  const result = safeParseOperationEnvelope(operationEnvelope);
  if (!result.success) {
    return null;
  }

  if (result.data.operationType !== operationType) {
    return null;
  }

  return result.data.operationId;
}

async function findAdminMembership(listId: string, profileId: string) {
  return dbShopShop.member.findFirst({
    where: {
      listId,
      profileId,
      role: MemberRole.ADMIN,
    },
  });
}
