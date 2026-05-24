"use client";

/**
 * Form for the Sign Out page.
 */

// External Modules ----------------------------------------------------------

import { ActionResult } from "@repo/daisy-form/ActionResult";
import { Button } from "@repo/daisy-ui/Button";
import { Card } from "@repo/daisy-ui/Card";
import { ServerResult } from "@repo/daisy-form/ServerResult";
import { clientLogger as logger } from "@repo/shared-utils/ClientLogger";
import { LoaderCircle } from "lucide-react";
//import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

// Internal Modules ----------------------------------------------------------

import { doSignOutAction } from "@/actions/AuthActions";
import { useCurrentProfileContext } from "@/contexts/CurrentProfileContext";
import { Profile } from "@repo/db-shopshop/client";

// Public Objects ------------------------------------------------------------

export function SignOutForm() {

//  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [result, setResult] = useState<ActionResult<Profile> | null>(null);
  const { setCurrentProfile } = useCurrentProfileContext();

  async function performSignOut() {

    logger.trace({
      context: "SignOutForm.performSignOut.input",
      message: "Performing sign out",
    })

    try {

      setIsSigningOut(true);
      await doSignOutAction();
      logger.trace({
        context: "SignOutForm.submitForm.success",
        message: "Sign out successful",
      });
      setIsSigningOut(false);
      setCurrentProfile(null);

      toast.success("Sign out successful");

    } catch (error) {

      setIsSigningOut(false);
      logger.trace({
        context: "SignOutForm.submitForm.error",
        error,
      });
      setResult({message: (error as Error).message})

    }

  }

  return (
    <Card border className="w-96" color="info">
      <Card.Body>
        <Card.Title>
          <p>Sign Out</p>
        </Card.Title>
        <ServerResult result={result}/>
        <p>Are you sure you want to sign out?</p>
        <Card.Actions className="justify-center">
          <Button
            color="primary"
            onPress={performSignOut}
            type="button"
          >
            {isSigningOut ? (
              <>
                <LoaderCircle className="animate-spin"/>Signing Out
              </>
            ): "Sign Out" }
          </Button>
        </Card.Actions>
      </Card.Body>

    </Card>
  )

}
