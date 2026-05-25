/**
 * Sign out after confirmation.
 */

// Internal Modules ----------------------------------------------------------

import { SignOutForm } from "@/components/auth/SignOutForm";

// Public Objects ------------------------------------------------------------

export default function SignOutPage() {

  return (
    <main className="flex h-full w-full items-center justify-center">
      <SignOutForm/>
    </main>
  )
}
