"use client";

/**
 * Shared infrastructure for forms based on TanStack Form.
 */

// External Modules ----------------------------------------------------------

import { createFormHook } from "@tanstack/react-form";

// Internal Modules ----------------------------------------------------------

//import { CheckboxField } from "./CheckboxField";
import { InputField } from "./InputField";
//import { ResetButton } from "./ResetButton";
//import { SelectField } from "./SelectField";
//import { SubmitButton } from "/SubmitButton";
//import { TextareaField } from "./TextareaField";
import { fieldContext, formContext } from "./useAppContexts";

// Public Objects ------------------------------------------------------------

// prettier-ignore
export const { useAppForm, withForm } = createFormHook({
  // prettier-ignore
  fieldComponents: {
//    CheckboxField,
    // prettier-ignore
    InputField,
//    SelectField,
//    TextareaField,
  },
  fieldContext,
  formComponents: {
//    ResetButton,
//    SubmitButton,
  },
  formContext,
});
