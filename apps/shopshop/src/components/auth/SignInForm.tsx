"use client";

/**
 * Form for the Sign In page.
 */

// External Modules ----------------------------------------------------------

import { ActionResult } from "@repo/daisy-form/ActionResult";
import { Card } from "@repo/daisy-ui/Card";
import { ServerResult } from "@repo/daisy-form/ServerResult";
import { useAppForm } from "@repo/daisy-form/useAppForm";
import { clientLogger as logger } from "@repo/shared-utils/ClientLogger";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

// Internal Modules ----------------------------------------------------------

import { doSignInAction } from "@/actions/AuthActions";
import { useCurrentProfileContext } from "@/contexts/CurrentProfileContext";
import { Profile } from "@repo/db-shopshop";
import { SignInSchema, type SignInSchemaType } from "@/zod-schemas/SignInSchema";

// Public Objects ------------------------------------------------------------

export function SignInForm() {

  const [result, setResult] = useState<ActionResult<Profile> | null>(null);
  const { setCurrentProfile } = useCurrentProfileContext();
  const router = useRouter();

  const defaultValues: SignInSchemaType = {
    email: "",
    password: "",
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await submitForm(value);
    },
    validators: {
      onBlur: SignInSchema,
      onChange: SignInSchema,
    },
  });

  async function submitForm(formData: SignInSchemaType) {

    logger.trace({
      context: "SignInForm.submitForm.input",
      formData: {
        ...formData,
        password: "*REDACTED*",
      }
    });

    const result = await doSignInAction(formData);
    if (result.model) {

      logger.trace({
        context: "SignInForm.submitForm.success",
        email: formData.email,
      });
      setResult(null);
      setCurrentProfile(result.model);
      toast.success("Welcome to this application!");
      router.push("/");

    } else {

      logger.trace({
        context: "SignInForm.submitForm.error",
        error: result.message,
      });
      setResult({ message: result.message });

    }

  }

  return (
    <Card border className="w-96" color="info">
      <Card.Body>
        <Card.Title>
          <p>Sign In</p>
        </Card.Title>
        <ServerResult result={result}/>
        <form
          className="flex flex-col gap-2"
          name="SignInForm"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="email">
            {(field) =>
              <field.FieldInput
                autoFocus
                label="Email"
                labelClassName="w-20"
                placeholder="Your email address"
              />}
          </form.AppField>
          <form.AppField name="password">
            {(field) =>
              <field.FieldInput
                label="Password"
                labelClassName="w-20"
                placeholder="Your Password"
                type="password"
              />}
          </form.AppField>
          <form.AppForm>
            <div className="flex flex-row justify-center pt-2 gap-4">
              <form.FormSubmitButton label="Sign In"/>
              <form.FormResetButton/>
            </div>
          </form.AppForm>
        </form>
      </Card.Body>
    </Card>
  )

}
