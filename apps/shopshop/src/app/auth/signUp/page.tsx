/**
 * Sign up to create a new profile page.
 *
 * @packageDocumentation
 */

// Internal Modules ----------------------------------------------------------

import { SignUpForm } from "@/components/auth/SignUpForm";

// Public Objects ------------------------------------------------------------

export default function SignUpPage() {
  return (
    <main className="flex h-full w-full items-center justify-center">
      <SignUpForm />
    </main>
  )
}
