"use client";

/**
 * Form for creating, deleting, or updating a List.
 */

// External Imports ----------------------------------------------------------

import { ActionResult } from "@repo/daisy-form/ActionResult";
import { ServerResult } from "@repo/daisy-form/ServerResult";
import { useAppForm } from "@repo/daisy-form/useAppForm";
import { Button } from "@repo/daisy-ui/Button";
import { Card } from "@repo/daisy-ui/Card";
import { Modal } from "@repo/daisy-ui/Modal";
import {
  ListCreateSchema,
  type ListCreateSchemaType,
  ListUpdateSchema,
  type ListUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ListSchema";
import { clientLogger as logger } from "@repo/shared-utils/ClientLogger";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

// Internal Imports ----------------------------------------------------------

import type { ListPlus } from "@/types/Types";

// Public Objects ------------------------------------------------------------

export type ListFormProps = {
  // Are we deleting this List?  [false]
  deleting?: boolean;
  // The List to be deleted or edited (if any).  Null means creating a new List.
  list?: ListPlus;
  // Function to close the modal when we are done
  onClose: () => void;
}

const DESTINATION = "/members";

export function ListForm({ deleting = false, list, onClose }: ListFormProps) {

  const isCreating = !list;
  const isDeleting = deleting && !!list;
  const isUpdating = !!list && !deleting;
  const [serverResult, setServerResult] = useState<ActionResult<ListPlus> | null>(null);
  const router = useRouter();

  // Set up the form
  const defaultValuesCreate: ListCreateSchemaType = {
    name: "",
  }
  const defaultValuesUpdate: ListUpdateSchemaType = {
    name: list?.name || "",
  }
  const form = useAppForm({
    defaultValues: isCreating ? defaultValuesCreate : defaultValuesUpdate,
    onSubmit: async ({value}) => {
      await submitForm(value);
    },
    validators: {
      onBlur: isCreating ? ListCreateSchema : ListUpdateSchema,
    },
  });

  // Invoke the requested action based on our mode
  async function submitForm(formData: ListCreateSchemaType | ListUpdateSchemaType) {
    {
      if (isCreating) {
        await handleCreate(formData as ListCreateSchemaType);
      } else if (isDeleting) {
        await handleDelete(list.id);
      } else if (isUpdating) {
        await handleUpdate(list.id, formData as ListUpdateSchemaType);
      } else {
        logger.error({
          context: "ListForm.submitForm.mode",
          message: "Unknown mode",
          isCreating,
          isDeleting,
          isUpdating,
          list,
        });
        setServerResult({ message:"Unknown mode, 'deleting' was set with no List" });
      }
      onClose();
    }
  }

  async function handleCreate(formData: ListCreateSchemaType) {
    const response = await fetch("/api/list", {
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (response.ok) {
      logger.info({
        context: "ListForm.handleCreate.success",
        formData,
      });
      setServerResult(null);
      toast.success(`List '${formData.name}' created successfully!`)
    } else {
      setServerResult({ message: `HTTP error ${response.status}: ${response.statusText}` });
      toast.error(`Error creating List: HTTP error ${response.status}`);
    }
  }

  async function handleDelete(listId: string) {
    const response = await fetch(`/api/list/${listId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      logger.info({
        context: "ListForm.handleDelete.success",
      });
      setServerResult(null);
      toast.success(`List '${list!.name}' deleted successfully!`)
    } else {
      setServerResult({message: `HTTP error ${response.status}: ${response.statusText}`});
      toast.error(`Error creating List: HTTP error ${response.status}`);
    }
  }

  async function handleUpdate(listId: string, formData: ListUpdateSchemaType) {
    const response = await fetch(`/api/list/${listId}`, {
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    if (response.ok) {
      logger.info({
        context: "ListForm.handleUpdate.success",
        formData,
      });
      setServerResult(null);
      toast.success(`List '${formData.name}' created successfully!`)
    } else {
      setServerResult({ message: `HTTP error ${response.status}: ${response.statusText}` });
      toast.error(`Error updating List: HTTP error ${response.status}`);
    }
  }

  return (
    <Modal border className="modal-open" id="list-form-modal">
      <Modal.Closer/>
      <Modal.Body>
        <Card>
          <Card.Title className="justify-center">
            { isCreating && "Create New List" }
            { isDeleting && "Delete Existing List" }
            { isUpdating && "Update Existing List" }
          </Card.Title>
          <Card.Body>
            <ServerResult result={serverResult}/>
            { isDeleting ? (
              <>
                <div className="flex flex-row mb-3 w-full justify-center">
                  Are you sure you want to remove List &#39;{list!.name}&#39;?)
                </div>
                <div className="flex flex-row w-full justify-center gap-4">
                  <Button
                    onClick={() => router.push(DESTINATION)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="warning"
                    onClick={() => form.handleSubmit(list)}
                  >
                    Remove
                  </Button>
                </div>
              </>

            ) : (
              <form
                className="flex flex-col gap-4"
                name={isCreating ? "ListCreateForm" : "ListUpdateForm"}
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <form.AppField name="name">
                  {(field) =>
                    <field.FieldInput
                      autoFocus
                      label="List Name"
                      placeholder="List Name"
                    />}
                </form.AppField>
                <form.AppForm>
                  <div className="flex flex-row justify-between">
                    <form.FormSubmitButton/>
                    <form.FormResetButton/>
                  </div>
                </form.AppForm>
              </form>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
    </Modal>
  )

}
