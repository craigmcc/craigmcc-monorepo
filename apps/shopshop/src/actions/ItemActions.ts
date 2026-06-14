/**
 * Server-side actions that perform mutations on Item models.
 */

// External Imports ----------------------------------------------------------

import {
  ActionResult,
  ERRORS,
  ValidationActionResult,
} from "@repo/daisy-form/ActionResult";
import { dbShopShop } from "@repo/db-shopshop";
import type { Item } from "@repo/db-shopshop/types";
import { IdSchema, IdSchemaType } from "@repo/db-shopshop/zod-schemas/IdSchema";
import {
  ItemCreateSchema,
  ItemCreateSchemaType,
  ItemUpdateSchema,
  ItemUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ItemSchema";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Imports ----------------------------------------------------------

import { executeIdempotentOperation } from "@/lib/ExecuteIdempotentOperation";
import { lookupCategoryById, lookupItemById } from "@/lib/CategoryHelpers";
import { lookupListMembership } from "@/lib/ListHelpers";
import { safeParseOperationEnvelope } from "@/lib/OperationEnvelopeHelpers";
import {
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
} from "@/lib/PrismaErrorHelpers";
import { findProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

export async function createItem(data: ItemCreateSchemaType, operationEnvelope?: unknown): Promise<ActionResult<Item>> {

  try {

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // VALIDATION - Validate input content
    const result = ItemCreateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "ItemActions.createItem",
        data,
        issues: result.error.issues,
      });
      return ValidationActionResult<Item>(result.error);
    }

    // AUTHORIZATION - Must be a member of the target List
    const member = await lookupListMembership(result.data.listId, profile.id);
    if (!member) {
      logger.warn({
        context: "ItemActions.createItem",
        listId: result.data.listId,
        profileId: profile.id,
        message: "Unauthorized item create attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // VALIDATION - The Category must exist and belong to the specified List
    const category = await lookupCategoryById(result.data.categoryId);
    if (!category) {
      logger.warn({
        categoryId: result.data.categoryId,
        context: "ItemActions.createItem",
        listId: result.data.listId,
        profileId: profile.id,
        message: "Category not found",
      });
      return { message: NO_CATEGORY_MESSAGE, status: 404 };
    }
    if (category.listId !== result.data.listId) {
      logger.warn({
        categoryId: category.id,
        context: "ItemActions.createItem",
        listId: result.data.listId,
        profileId: profile.id,
        message: "Category does not belong to the specified List",
      });
      return { message: CATEGORY_LIST_MISMATCH_MESSAGE, status: 400 };
    }

    const mutateItem = async (): Promise<ActionResult<Item>> => {
      const item = await dbShopShop.item.create({
        data: result.data,
      });

      logger.info({
        categoryId: item.categoryId,
        context: "ItemActions.createItem",
        itemId: item.id,
        listId: item.listId,
        profileId: profile.id,
      });

      return { model: item };
    };

    const operationId = parseOperationId(operationEnvelope, "createItem");
    if (!operationId) {
      return mutateItem();
    }

    return executeIdempotentOperation<Item>({
      actorProfileId: profile.id,
      operationId,
      operationType: "createItem",
      payload: result.data,
    }, mutateItem);

  } catch (error) {
    if (isPrismaForeignKeyConstraintError(error)) {
      logger.warn({
        context: "ItemActions.createItem",
        error,
        message: "Item create hit foreign key constraint",
      });
      return { message: NO_CATEGORY_MESSAGE, status: 404 };
    }

    logger.error({
      context: "ItemActions.createItem",
      error,
      message: "Unexpected error creating Item",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function deleteItem(itemId: IdSchemaType, operationEnvelope?: unknown): Promise<ActionResult<Item>> {

  try {

    // VALIDATION - Validate item ID
    const validatedItemId = IdSchema.safeParse(itemId);
    if (!validatedItemId.success) {
      logger.error({
        context: "ItemActions.deleteItem",
        itemId,
        issues: validatedItemId.error.issues,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    const mutateItem = async (): Promise<ActionResult<Item>> => {
      const item = await lookupItemById(validatedItemId.data);
      if (!item) {
        logger.warn({
          context: "ItemActions.deleteItem",
          itemId: validatedItemId.data,
          profileId: profile.id,
          message: "Item not found",
        });
        return { message: NO_ITEM_MESSAGE, status: 404 };
      }

      const member = await lookupListMembership(item.listId, profile.id);
      if (!member) {
        logger.warn({
          context: "ItemActions.deleteItem",
          itemId: item.id,
          listId: item.listId,
          profileId: profile.id,
          message: "Unauthorized item delete attempt",
        });
        return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
      }

      const deletedItem = await dbShopShop.item.delete({
        where: {
          id: item.id,
        },
      });

      logger.info({
        categoryId: deletedItem.categoryId,
        context: "ItemActions.deleteItem",
        itemId: deletedItem.id,
        listId: deletedItem.listId,
        profileId: profile.id,
      });

      return { model: deletedItem };
    };

    const operationId = parseOperationId(operationEnvelope, "deleteItem");
    if (!operationId) {
      return mutateItem();
    }

    return executeIdempotentOperation<Item>({
      actorProfileId: profile.id,
      operationId,
      operationType: "deleteItem",
      payload: {
        itemId: validatedItemId.data,
      },
    }, mutateItem);

  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      logger.warn({
        context: "ItemActions.deleteItem",
        error,
        message: "Item delete raced with another operation",
      });
      return { message: NO_ITEM_MESSAGE, status: 404 };
    }

    logger.error({
      context: "ItemActions.deleteItem",
      error,
      message: "Unexpected error deleting Item",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function updateItem(itemId: IdSchemaType, data: ItemUpdateSchemaType, operationEnvelope?: unknown): Promise<ActionResult<Item>> {

  try {

    // VALIDATION - Validate item ID
    const validatedItemId = IdSchema.safeParse(itemId);
    if (!validatedItemId.success) {
      logger.error({
        context: "ItemActions.updateItem",
        itemId,
        issues: validatedItemId.error.issues,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // AUTHORIZATION - Must be a member of the Item's List
    const item = await lookupItemById(validatedItemId.data);
    if (!item) {
      logger.warn({
        context: "ItemActions.updateItem",
        itemId: validatedItemId.data,
        profileId: profile.id,
        message: "Item not found",
      });
      return { message: NO_ITEM_MESSAGE, status: 404 };
    }

    const member = await lookupListMembership(item.listId, profile.id);
    if (!member) {
      logger.warn({
        context: "ItemActions.updateItem",
        itemId: item.id,
        listId: item.listId,
        profileId: profile.id,
        message: "Unauthorized item update attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // VALIDATION - Validate input content
    const result = ItemUpdateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "ItemActions.updateItem",
        data,
        itemId: item.id,
        issues: result.error.issues,
        listId: item.listId,
        profileId: profile.id,
      });
      return ValidationActionResult<Item>(result.error);
    }

    const mutateItem = async (): Promise<ActionResult<Item>> => {
      const updatedItem = await dbShopShop.item.update({
        data: result.data,
        where: {
          id: item.id,
        },
      });

      logger.info({
        categoryId: updatedItem.categoryId,
        context: "ItemActions.updateItem",
        itemId: updatedItem.id,
        listId: updatedItem.listId,
        profileId: profile.id,
      });

      return { model: updatedItem };
    };

    const operationId = parseOperationId(operationEnvelope, "updateItem");
    if (!operationId) {
      return mutateItem();
    }

    return executeIdempotentOperation<Item>({
      actorProfileId: profile.id,
      operationId,
      operationType: "updateItem",
      payload: {
        data: result.data,
        itemId: item.id,
      },
    }, mutateItem);

  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      logger.warn({
        context: "ItemActions.updateItem",
        error,
        message: "Item update raced with another operation",
      });
      return { message: NO_ITEM_MESSAGE, status: 404 };
    }

    logger.error({
      context: "ItemActions.updateItem",
      error,
      message: "Unexpected error updating Item",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

// Private Objects -----------------------------------------------------------

const CATEGORY_LIST_MISMATCH_MESSAGE = "Specified Category does not belong to the specified List";
const NO_CATEGORY_MESSAGE = "No Category found for the specified ID";
const NO_ITEM_MESSAGE = "No Item found for the specified ID";
const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";

function parseOperationId(
  operationEnvelope: unknown,
  operationType: "createItem" | "deleteItem" | "updateItem",
): string | null {
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

