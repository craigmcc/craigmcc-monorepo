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
import type { Profile } from "@repo/db-shopshop/types";

// Internal Modules ----------------------------------------------------------

import { getSession, signIn } from "@/auth/auth-client";
import { useCurrentProfileContext } from "@/contexts/CurrentProfileContext";
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

    // Step 1: authenticate via the HTTP route so the browser receives the
    // session cookie in the response headers (cannot use a server action for
    // this — server actions don't forward Better Auth's set-cookie headers).
    const { data: authData, error: authError } = await signIn.email({
      email: formData.email,
      password: formData.password,
    });

    if (authError || !authData) {
      const message = authError?.message ?? "Sign in failed. Please check your credentials.";
      logger.trace({ context: "SignInForm.submitForm.auth_error", message });
      setResult({ message });
      return;
    }

    // Step 2: fetch the enriched session so we have the application Profile.
    const sessionResult = await getSession();
    const profile = sessionResult.data?.profile ?? null;

    if (profile) {
      logger.trace({
        context: "SignInForm.submitForm.success",
        email: formData.email,
      });
      setResult(null);
      setCurrentProfile(profile);
      toast.success("Welcome to this application!");
      router.push("/");
    } else {
      logger.trace({
        context: "SignInForm.submitForm.profile_error",
        error: "Profile not returned in session",
      });
      setResult({ message: "Sign in succeeded but profile could not be loaded." });
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
