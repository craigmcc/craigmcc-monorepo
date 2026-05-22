"use client";

/**
 * Top-level menu bar component for the daisyui-alone application.
 */

// External Imports ----------------------------------------------------------

import { Button } from "@repo/daisy-ui/Button";
import { Navbar } from "@repo/daisy-ui/Navbar";
import { List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
//import { useEffect } from "react";

// Internal Imports ----------------------------------------------------------

import { ThemeChanger } from "@/components/layout/ThemeChanger";
import { useCurrentProfileContext } from "@/contexts/CurrentProfileContext";

// Public Objects ------------------------------------------------------------

export function NavBar() {

  const { currentProfile } = useCurrentProfileContext();

/*
  useEffect(() => {
    // Trigger a re-render when the current profile changes
  }, [currentProfile]);
*/

  return (
    <Navbar>

      <Navbar.Start>
        <Link href="/">
          <Button color="ghost">
            <List className="navbar-logo" size={32} />
            <span className="font-semibold px-2">Shopshop</span>
          </Button>
        </Link>
      </Navbar.Start>

      <Navbar.Center className="gap-2">
        <NavLinkButton href="/todo">TODO</NavLinkButton>
      </Navbar.Center>

      <Navbar.End className="pr-2">
        {currentProfile && (
          <span className="text-secondary p-2">{currentProfile.email}</span>
        )}
        <ThemeChanger />
      </Navbar.End>

    </Navbar>
  )

}

// Private Objects -----------------------------------------------------------

type NavLinkButtonProps = {
  children: React.ReactNode;
  exact?: boolean;
  href: string;
}

function NavLinkButton({ children, exact = false, href }: NavLinkButtonProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname ?? "/", href, exact);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      href={href}
    >
      <Button
        active={isActive}
        color="primary"
        outline={!isActive}
        size="sm"
      >
        {children}
      </Button>
    </Link>
  );
}

function isActivePath(pathname: string, href: string, exact: boolean) {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/") {
    return currentPath === "/";
  }

  if (exact) {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function normalizePath(path: string) {
  if (path !== "/" && path.endsWith("/")) {
    return path.replace(/\/+$/, "");
  }
  return path;
}

