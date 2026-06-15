"use client";

import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Zap, Settings, Plus, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import axios from "axios";
import moment from "moment";
import Link from "next/link";
import { collection, getDocs, where, query, onSnapshot } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { AiSelectModelContext } from "@/context/AiSelectedModelContext";
import { UsageCreditProgress } from "./UsageCreditProgress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import PricingModal from "./PricingModal";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const { remainingToken, setRemainingToken } = useContext(AiSelectModelContext);
  const [chatHistory, setChatHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    GetRemainingMsgs();

    const q = query(
      collection(db, "chatHistory"),
      where("userEmail", "==", user.primaryEmailAddress.emailAddress)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const chats = [];
        querySnapshot.forEach((doc) => {
          const chatData = doc.data();
          chats.push({
            id: doc.id,
            ...chatData,
          });
        });

        chats.sort((a, b) => {
          const getTimestamp = (chat) => {
            if (!chat.lastUpdated) return 0;
            if (chat.lastUpdated.toDate && typeof chat.lastUpdated.toDate === "function") {
              return chat.lastUpdated.toDate().getTime();
            }
            if (chat.lastUpdated instanceof Date) return chat.lastUpdated.getTime();
            if (typeof chat.lastUpdated === "number") return chat.lastUpdated;
            if (typeof chat.lastUpdated === "string") return new Date(chat.lastUpdated).getTime();
            return 0;
          };
          return getTimestamp(b) - getTimestamp(a);
        });

        setChatHistory(chats);
      },
      (err) => {
        console.error("Error listening to chat history:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const GetLastUserMessageFromChat = (chat) => {
    try {
      if (!chat?.messages) return null;

      let allMessages = [];
      Object.values(chat.messages).forEach((modelMessages) => {
        if (Array.isArray(modelMessages)) {
          allMessages = [...allMessages, ...modelMessages];
        }
      });

      const userMessages = allMessages.filter((msg) => msg.role === "user");
      const lastUserMsg =
        userMessages.length > 0
          ? userMessages[userMessages.length - 1].content
          : "(No messages yet)";

      const getDisplayDate = (chat) => {
        if (!chat.lastUpdated) return new Date();
        try {
          if (chat.lastUpdated.toDate && typeof chat.lastUpdated.toDate === "function") {
            return chat.lastUpdated.toDate();
          }
          if (chat.lastUpdated instanceof Date) return chat.lastUpdated;
          if (typeof chat.lastUpdated === "number") return new Date(chat.lastUpdated);
          if (typeof chat.lastUpdated === "string") return new Date(chat.lastUpdated);
          return new Date();
        } catch {
          return new Date();
        }
      };

      return {
        chatId: chat.chatId || chat.id,
        message: lastUserMsg,
        lastMsgDate: moment(getDisplayDate(chat)).fromNow(),
      };
    } catch {
      return null;
    }
  };

  const GetRemainingMsgs = async () => {
    try {
      const result = await axios.post("/api/user-remaining-msg", {});
      setRemainingToken(result?.data?.remainingToken ?? 0);
    } catch {
      setRemainingToken(0);
    }
  };

  const handleNewChat = () => {
    const newChatId = uuidv4();
    router.push(`/?chatId=${newChatId}`);
  };

  return (
    <Sidebar className="border-r border-border/30">
      <SidebarHeader className="p-0">
        <div className="p-4 pb-3">
          {/* Logo and theme toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Image
                  src="/logo.svg"
                  alt="AI Fusion"
                  width={20}
                  height={20}
                  className="brightness-200"
                />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight">AI Fusion</h1>
                <p className="text-[10px] text-muted-foreground/50 -mt-0.5">Multi-Model Chat</p>
              </div>
            </div>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* New Chat button */}
          {user ? (
            <Button
              className="w-full h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/20 text-xs font-medium"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Chat
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button className="w-full h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/20 text-xs font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                New Chat
              </Button>
            </SignInButton>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 pt-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">
              Recent Chats
            </h2>

            {!user && (
              <p className="text-xs text-muted-foreground/40 py-4 text-center">
                Sign in to chat with multiple AI models
              </p>
            )}

            {chatHistory.length === 0 && user && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/40">No chats yet</p>
                <p className="text-[10px] text-muted-foreground/30 mt-0.5">
                  Start a new conversation
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              {chatHistory.map((chat, index) => {
                const last = GetLastUserMessageFromChat(chat);
                if (!last) return null;

                return (
                  <Link href={`/?chatId=${last.chatId}`} key={chat.id || index}>
                    <div className="py-2 px-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-all duration-150 group">
                      <h3 className="text-xs truncate font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                        {last.message}
                      </h3>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                        {last.lastMsgDate}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <div className="p-4 border-t border-border/30">
          {!user ? (
            <SignInButton mode="modal">
              <Button
                className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/20 font-medium text-sm"
                size="lg"
              >
                Sign In / Sign Up
              </Button>
            </SignInButton>
          ) : (
            <div className="space-y-3">
              <UsageCreditProgress remainingToken={remainingToken} />

              <PricingModal>
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 text-xs font-medium"
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade Plan
                </Button>
              </PricingModal>

              <div className="flex items-center gap-3 pt-1">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}