/**
 * Server-side actions that perform mutations on Category models.
 */

// External Imports ----------------------------------------------------------

import {
  ActionResult,
  ERRORS,
  ValidationActionResult,
} from "@repo/daisy-form/ActionResult";
import { dbShopShop } from "@repo/db-shopshop";
import type { Category } from "@repo/db-shopshop/types";
import { IdSchema, IdSchemaType } from "@repo/db-shopshop/zod-schemas/IdSchema";
import {
  CategoryCreateSchema,
  CategoryCreateSchemaType,
  CategoryUpdateSchema,
  CategoryUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Imports ----------------------------------------------------------

import { lookupCategoryById } from "@/lib/CategoryHelpers";
import { lookupListMembership } from "@/lib/ListHelpers";
import { findProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

export async function createCategory(data: CategoryCreateSchemaType): Promise<ActionResult<Category>> {

  try {

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // VALIDATION - Validate input content
    const result = CategoryCreateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "CategoryActions.createCategory",
        data,
        issues: result.error.issues,
      });
      return ValidationActionResult<Category>(result.error);
    }

    // AUTHORIZATION - Must be a member of the target List
    const member = await lookupListMembership(result.data.listId, profile.id);
    if (!member) {
      logger.warn({
        context: "CategoryActions.createCategory",
        listId: result.data.listId,
        profileId: profile.id,
        message: "Unauthorized category create attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // MUTATION - Create the Category
    const category = await dbShopShop.category.create({
      data: result.data,
    });

    logger.info({
      context: "CategoryActions.createCategory",
      categoryId: category.id,
      listId: category.listId,
      profileId: profile.id,
    });

    return { model: category };

  } catch (error) {
    logger.error({
      context: "CategoryActions.createCategory",
      error,
      message: "Unexpected error creating Category",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function deleteCategory(categoryId: IdSchemaType): Promise<ActionResult<Category>> {

  try {

    // VALIDATION - Validate category ID
    const validatedCategoryId = IdSchema.safeParse(categoryId);
    if (!validatedCategoryId.success) {
      logger.error({
        context: "CategoryActions.deleteCategory",
        categoryId,
        issues: validatedCategoryId.error.issues,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // AUTHORIZATION - Must be a member of the Category's List
    const category = await lookupCategoryById(validatedCategoryId.data);
    if (!category) {
      logger.warn({
        context: "CategoryActions.deleteCategory",
        categoryId: validatedCategoryId.data,
        profileId: profile.id,
        message: "Category not found",
      });
      return { message: NO_CATEGORY_MESSAGE, status: 404 };
    }

    const member = await lookupListMembership(category.listId, profile.id);
    if (!member) {
      logger.warn({
        context: "CategoryActions.deleteCategory",
        categoryId: category.id,
        listId: category.listId,
        profileId: profile.id,
        message: "Unauthorized category delete attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // MUTATION - Delete the Category (Items cascade via schema)
    const deletedCategory = await dbShopShop.category.delete({
      where: {
        id: category.id,
      },
    });

    logger.info({
      context: "CategoryActions.deleteCategory",
      categoryId: deletedCategory.id,
      listId: deletedCategory.listId,
      profileId: profile.id,
    });

    return { model: deletedCategory };

  } catch (error) {
    logger.error({
      context: "CategoryActions.deleteCategory",
      error,
      message: "Unexpected error deleting Category",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

export async function updateCategory(categoryId: IdSchemaType, data: CategoryUpdateSchemaType): Promise<ActionResult<Category>> {

  try {

    // VALIDATION - Validate category ID
    const validatedCategoryId = IdSchema.safeParse(categoryId);
    if (!validatedCategoryId.success) {
      logger.error({
        context: "CategoryActions.updateCategory",
        categoryId,
        issues: validatedCategoryId.error.issues,
      });
      return { message: ERRORS.ID_VALIDATION, status: 400 };
    }

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return { message: ERRORS.AUTHENTICATION, status: 401 };
    }

    // AUTHORIZATION - Must be a member of the Category's List
    const category = await lookupCategoryById(validatedCategoryId.data);
    if (!category) {
      logger.warn({
        context: "CategoryActions.updateCategory",
        categoryId: validatedCategoryId.data,
        profileId: profile.id,
        message: "Category not found",
      });
      return { message: NO_CATEGORY_MESSAGE, status: 404 };
    }

    const member = await lookupListMembership(category.listId, profile.id);
    if (!member) {
      logger.warn({
        context: "CategoryActions.updateCategory",
        categoryId: category.id,
        listId: category.listId,
        profileId: profile.id,
        message: "Unauthorized category update attempt",
      });
      return { message: NOT_AUTHORIZED_MESSAGE, status: 403 };
    }

    // VALIDATION - Validate input content
    const result = CategoryUpdateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "CategoryActions.updateCategory",
        categoryId: category.id,
        data,
        issues: result.error.issues,
        listId: category.listId,
        profileId: profile.id,
      });
      return ValidationActionResult<Category>(result.error);
    }

    // MUTATION - Update the Category
    const updatedCategory = await dbShopShop.category.update({
      data: result.data,
      where: {
        id: category.id,
      },
    });

    logger.info({
      context: "CategoryActions.updateCategory",
      categoryId: updatedCategory.id,
      listId: updatedCategory.listId,
      profileId: profile.id,
    });

    return { model: updatedCategory };

  } catch (error) {
    logger.error({
      context: "CategoryActions.updateCategory",
      error,
      message: "Unexpected error updating Category",
    });
    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

}

// Private Objects -----------------------------------------------------------

const NO_CATEGORY_MESSAGE = "No Category found for the specified ID";
const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";

