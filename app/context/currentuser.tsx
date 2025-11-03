"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type CurrentUser = string | null;
type ContextType = {
  currentUser: CurrentUser;
  setCurrentUser: (u: CurrentUser) => void;
};

const CurrentUserContext = createContext<ContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  useEffect(() => {
    invoke("get_current_user")
      .then((res) => {
        if (res && typeof res === "object" && "name" in (res as any)) {
          setCurrentUser((res as any).name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUser = (): ContextType => useContext(CurrentUserContext);