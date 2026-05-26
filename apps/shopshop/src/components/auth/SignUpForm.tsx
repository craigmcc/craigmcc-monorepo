"use client";

/**
 * Form for the Sign Up page.
 *
 * @packageDocumentation
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

import { getSession, signUp } from "@/auth/auth-client";
import { useCurrentProfileContext } from "@/contexts/CurrentProfileContext";
import { Profile } from "@repo/db-shopshop";
import { SignUpSchema, type SignUpSchemaType } from "@/zod-schemas/SignUpSchema";

// Public Objects ------------------------------------------------------------

export function SignUpForm() {

  const [result, setResult] = useState<ActionResult<Profile> | null>(null);
  const { setCurrentProfile } = useCurrentProfileContext();
  const router = useRouter();

  const defaultValues: SignUpSchemaType = {
    confirmPassword: "",
    email: "",
    name: "",
    password: "",
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await submitForm(value);
    },
    validators: {
      onBlur: SignUpSchema,
      onChange: SignUpSchema,
    },
  });

  async function submitForm(formData: SignUpSchemaType) {

    logger.trace({
      context: "SignUpForm.submitForm.input",
      formData: {
        ...formData,
        confirmPassword: "*REDACTED*",
        password: "*REDACTED*",
      }
    });

    // Step 1: create the Better Auth account via the HTTP route so the browser
    // receives the session cookie in the response headers.
    const { data: authData, error: authError } = await signUp.email({
      email: formData.email,
      name: formData.name,
      password: formData.password,
    });

    if (authError || !authData) {
      const message = authError?.message ?? "Sign up failed. Please try again.";
      logger.trace({ context: "SignUpForm.submitForm.auth_error", message });
      setResult({ message });
      return;
    }

    // Step 2: fetch the enriched session so we have the newly created Profile.
    const sessionResult = await getSession();
    const profile = sessionResult.data?.profile ?? null;

    if (profile) {
      setResult(null);
      setCurrentProfile(profile);
      toast.success(`Profile for '${formData.name}' was successfully created`);
      router.push("/");
    } else {
      logger.trace({
        context: "SignUpForm.submitForm.profile_error",
        error: "Profile not returned in session",
      });
      setResult({ message: "Account created, but profile could not be loaded. Please try signing in." });
    }

  }

  return (
    <Card border className="w-lg" color="info">
      <Card.Body>
        <Card.Title>
          <p>Sign Up</p>
        </Card.Title>
        <ServerResult result={result}/>
        <form
          className="flex flex-col gap-2"
          name="SignUpForm"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <form.AppField name="email">
              {(field) =>
                <field.FieldInput
                  autoFocus
                  label="Email"
                  placeholder="Your email address"
                />}
            </form.AppField>
            <form.AppField name="name">
              {(field) =>
                <field.FieldInput
                  label="Name"
                  placeholder="Your Name"
                />}
            </form.AppField>
          </div>
          <div className="flex flex-row gap-2">
            <form.AppField name="password">
              {(field) =>
                <field.FieldInput
                  label="Password"
                  placeholder="Your Password"
                  type="password"
                />}
            </form.AppField>
            <form.AppField name="confirmPassword">
              {(field) =>
                <field.FieldInput
                  label="Confirm Password"
                  placeholder="Confirm Your Password"
                  type="password"
                />}
            </form.AppField>
          </div>
            <form.AppForm>
              <div className="flex flex-row justify-center pt-2 gap-4">
                <form.FormSubmitButton label="Sign Up" />
                <form.FormResetButton/>
                </div>
            </form.AppForm>
        </form>
      </Card.Body>
    </Card>
  )

}
