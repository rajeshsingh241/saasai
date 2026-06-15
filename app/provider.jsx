"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AiModelList, DefaultModel } from "@/shared/AiModelsShared";
import { updateDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AppSidebar } from "./_components/AppSidebar";
import { AppHeader } from "./_components/AppHeader";
import { db } from "@/config/FirebaseConfig";
import { useUser } from "@clerk/nextjs";
import { AiSelectModelContext } from "@/context/AiSelectedModelContext";
import { UserDetailContext } from "@/context/UserDetailContext";

// Build initial model state from the shared model list
function buildInitialModels() {
  const initialModels = {};
  AiModelList.forEach((model) => {
    initialModels[model.model] = {
      enable: !model.premium, // Only enable non-premium models by default
      modelId: DefaultModel[model.model]?.modelId || "",
    };
  });
  return initialModels;
}

// Generate a safe Firestore document ID from email
function getSafeUserId(user) {
  const emailId = user?.primaryEmailAddress?.emailAddress;
  if (emailId) return emailId.replace(/\./g, "_").replace(/@/g, "_");
  return user?.id || null;
}

function Provider({ children, ...props }) {
  const { user } = useUser();
  const isInitializedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  const [aiSelectedModels, setAiSelectedModels] = useState(buildInitialModels);
  const [userDetail, setUserDetail] = useState(null);
  const [messages, setMessages] = useState({});
  const [remainingToken, setRemainingToken] = useState(5);

  // Create or fetch user on mount
  useEffect(() => {
    if (user) {
      createOrFetchUser();
    }
  }, [user]);

  // Debounced save of AI model preferences to Firestore
  // Only runs AFTER initial data has loaded from Firestore
  useEffect(() => {
    if (!isInitializedRef.current || !user) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 800ms before saving
    saveTimeoutRef.current = setTimeout(() => {
      saveModelPreferences();
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [aiSelectedModels, user]);

  // Save model preferences to Firestore
  const saveModelPreferences = async () => {
    try {
      const userId = getSafeUserId(user);
      if (!userId) return;

      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, { selectModelpref: aiSelectedModels });
    } catch (err) {
      console.error("Error saving model preferences:", err);
    }
  };

  // Create new user in Firestore or fetch existing
  const createOrFetchUser = async () => {
    try {
      const userId = getSafeUserId(user);
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userInfo = userSnap.data();

        // Load saved preferences or use defaults
        if (userInfo?.selectModelpref) {
          setAiSelectedModels(userInfo.selectModelpref);
        }
        setUserDetail(userInfo);
      } else {
        // Create new user
        const initialModels = buildInitialModels();
        const newUserData = {
          name: user?.fullName || "Unknown",
          email: user?.primaryEmailAddress?.emailAddress || "",
          createdAt: new Date(),
          remainingMsg: 5,
          plan: "free",
          credits: 1000,
          selectModelpref: initialModels,
        };

        await setDoc(userRef, newUserData);
        setAiSelectedModels(initialModels);
        setUserDetail(newUserData);
      }

      // Mark as initialized AFTER loading from Firestore
      // This prevents the save effect from firing on initial load
      isInitializedRef.current = true;
    } catch (err) {
      console.error("Error creating/fetching user:", err);
      isInitializedRef.current = true; // Still mark as initialized to unblock saves
    }
  };

  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <AiSelectModelContext.Provider
          value={{
            aiSelectedModels,
            setAiSelectedModels,
            messages,
            setMessages,
            remainingToken,
            setRemainingToken,
          }}
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="w-full flex flex-col min-h-screen">
              <AppHeader />
              <main className="flex-1">{children}</main>
            </div>
          </SidebarProvider>
        </AiSelectModelContext.Provider>
      </UserDetailContext.Provider>
    </NextThemesProvider>
  );
}

export default Provider;