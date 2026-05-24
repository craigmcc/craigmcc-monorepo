"use client";

/**
 * Context to hold the currently logged in profile.
 */

// External Modules ----------------------------------------------------------

import React, { createContext, useContext, useEffect, useState } from "react";

// Internal Modules ----------------------------------------------------------

import { Profile } from "@repo/db-shopshop";

// Public Objects ------------------------------------------------------------

export type CurrentProfileContextType = {
  // Currently logged in profile (if any)
  currentProfile: Profile | null;
  // Function to set the current profile
  setCurrentProfile: (profile: Profile | null) => void;
}

export const CurrentProfileContext = createContext<CurrentProfileContextType>({
  currentProfile: null,
  setCurrentProfile: () => {},
});

const LOCAL_STORAGE_NAME = "shopshop-currentProfile";

export const CurrentProfileContextProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [currentProfile, changeCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // A lazy useState initializer cannot be used: localStorage is undefined
    // during SSR, and would cause a hydration mismatch if the server renders a
    // different default than the client reads from storage.
    const stored = localStorage.getItem(LOCAL_STORAGE_NAME);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      changeCurrentProfile(JSON.parse(stored));
    }
  }, []);

  const setCurrentProfile = (profile: Profile | null) => {
    changeCurrentProfile(profile);
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_NAME);
    }
  }

  return (
    <CurrentProfileContext.Provider value={{ currentProfile, setCurrentProfile }}>
      {children}
    </CurrentProfileContext.Provider>
  );
};

export function useCurrentProfileContext() {
  const context = useContext(CurrentProfileContext);
  if (!context) {
    throw new Error("useCurrentProfileContext must be used within a CurrentProfileContextProvider");
  }
  return context;
}
