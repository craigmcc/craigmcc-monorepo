"use client";

/**
 * Top-level menu bar component for the daisyui-alone application.
 */

// External Imports ----------------------------------------------------------

import { Button } from "@repo/daisy-ui/Button";
import { Menu } from "@repo/daisy-ui/Menu";
import { Navbar } from "@repo/daisy-ui/Navbar";
//import { clientLogger as logger } from "@repo/shared-utils";
import { List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Internal Imports ----------------------------------------------------------

import { ThemeChanger } from "@/components/layout/ThemeChanger";
import { useProfile } from "@/lib/ProfileHelper";

// Public Objects ------------------------------------------------------------

export function NavBar() {

  const profile = useProfile();

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
        {profile ? (
          <Menu trigger={<Button color={"info"} outline>{profile.name}</Button>}>
            <Menu.Item>
              <Link href="/profile">Edit Profile</Link>
            </Menu.Item>
            <Menu.Separator/>
            <Menu.Item>
              <Link href="/auth/signOut">Sign Out</Link>
            </Menu.Item>
          </Menu>
        ) : (
          <Menu trigger={<Button color={"info"} outline>Not Signed In</Button>}>
            <Menu.Item>
              <Link href="/auth/signIn">Sign In</Link>
            </Menu.Item>
            <Menu.Item>
              <Link href="/auth/signUp">Sign Up</Link>
            </Menu.Item>
          </Menu>
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

