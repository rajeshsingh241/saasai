"use client";

import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectModelContext } from "@/context/AiSelectedModelContext";
import axios from "axios";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { db } from "@/config/FirebaseConfig";
import { v4 as uuidv4 } from "uuid";
import AiMultiModels from "./AiMultiModels";
import { useSearchParams } from "next/navigation";
import { DefaultModel } from "@/shared/AiModelsShared";

function ChatInputBox() {
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { user } = useUser();
  const { aiSelectedModels, setAiSelectedModels, messages, setMessages, setRemainingToken } = useContext(AiSelectModelContext);
  const [chatId, setChatId] = useState(null);
  const params = useSearchParams();
  const saveTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const textareaRef = useRef(null);

  // Initialize chatId from URL params or generate new
  useEffect(() => {
    const idFromParams = params.get("chatId");
    const newId = idFromParams || uuidv4();
    setChatId(newId);
    hasLoadedRef.current = false; // Reset load flag for new chat
  }, [params]);

  // Fetch messages from Firestore when chatId changes
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const docRef = doc(db, "chatHistory", chatId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedMessages = docSnap.data().messages || {};
          setMessages(loadedMessages);

          // Auto-enable any model that has messages in this chat history
          const modelsInHistory = Object.keys(loadedMessages).filter(
            (key) => Array.isArray(loadedMessages[key]) && loadedMessages[key].length > 0
          );
          if (modelsInHistory.length > 0) {
            setAiSelectedModels((prev) => {
              const updated = { ...prev };
              let changed = false;
              modelsInHistory.forEach((model) => {
                if (updated[model] && !updated[model].enable) {
                  updated[model] = {
                    ...updated[model],
                    enable: true,
                  };
                  changed = true;
                }
              });
              return changed ? updated : prev;
            });
          }
        } else {
          // Initialize empty messages for enabled models
          const initialMessages = {};
          Object.keys(aiSelectedModels).forEach((key) => {
            if (aiSelectedModels[key]?.enable) initialMessages[key] = [];
          });
          setMessages(initialMessages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
      // Mark as loaded so saves can begin
      hasLoadedRef.current = true;
    };

    fetchMessages();
  }, [chatId]);

  // Debounced auto-save messages to Firestore
  useEffect(() => {
    if (!chatId || !user || !hasLoadedRef.current) return;

    // Don't save empty message state
    const hasAnyMessages = Object.values(messages).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    if (!hasAnyMessages) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, "chatHistory", chatId);
        await setDoc(docRef, {
          chatId,
          userEmail: user.primaryEmailAddress?.emailAddress || "anonymous",
          messages,
          lastUpdated: Date.now(),
        });
      } catch (err) {
        console.error("Error saving messages:", err);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, chatId, user]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, []);

  // Handle sending user message
  const handleSend = async () => {
    if (!userInput.trim() || isSending) return;

    const currentInput = userInput;
    setUserInput("");
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message immediately to UI
    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        if (aiSelectedModels[modelKey]?.enable) {
          updated[modelKey] = [
            ...(updated[modelKey] ?? []),
            { role: "user", content: currentInput },
          ];
        }
      });
      return updated;
    });

    // Deduct token for free plan (only for signed-in users)
    if (user) {
      try {
        const result = await axios.post("/api/user-remaining-msg", { token: 1 });
        const remaining = result?.data?.remainingToken;
        if (remaining !== undefined) {
          setRemainingToken(remaining);
          if (remaining <= 0) {
            toast.error("Daily message limit reached. Upgrade for unlimited access!");
            setIsSending(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error checking remaining messages:", err);
        // Don't block the user if rate-limit check fails — allow the message through
        toast.warning("Could not verify message limit. Proceeding anyway.");
      }
    }

    // Send message to all enabled, non-premium AI models
    const requests = Object.entries(aiSelectedModels)
      .filter(([parentModel, modelInfo]) => {
        const modelId = modelInfo.modelId || DefaultModel[parentModel]?.modelId;
        return modelInfo.enable && modelId;
      })
      .map(async ([parentModel, modelInfo]) => {
        const modelId = modelInfo.modelId || DefaultModel[parentModel]?.modelId;

        // Add loading placeholder
        setMessages((prev) => ({
          ...prev,
          [parentModel]: [
            ...(prev[parentModel] ?? []),
            { role: "assistant", content: "", model: parentModel, loading: true },
          ],
        }));

        try {
          // Build full conversation history for this model (excluding loading/error placeholders)
          const existingMessages = (messages[parentModel] ?? [])
            .filter((m) => !m.loading && !m.error)
            .map((m) => ({ role: m.role, content: m.content }));

          // Append the new user message
          const fullHistory = [
            ...existingMessages,
            { role: "user", content: currentInput },
          ];

          const result = await axios.post("/api/ai-multi-model", {
            model: modelId,
            msg: fullHistory,
            parentModel,
          });

          const { aiResponse, model } = result.data;

          setMessages((prev) => {
            const updated = [...(prev[parentModel] ?? [])];
            const loadingIndex = updated.findIndex((m) => m.loading);
            if (loadingIndex !== -1) {
              updated[loadingIndex] = {
                role: "assistant",
                content: aiResponse,
                model,
                loading: false,
              };
            } else {
              updated.push({
                role: "assistant",
                content: aiResponse,
                model,
                loading: false,
              });
            }
            return { ...prev, [parentModel]: updated };
          });
        } catch (err) {
          console.error(`Error from ${parentModel}:`, err);
          setMessages((prev) => {
            const updated = [...(prev[parentModel] ?? [])];
            const loadingIndex = updated.findIndex((m) => m.loading);
            const errorMsg = {
              role: "assistant",
              content: "⚠️ Failed to get response. Please try again.",
              model: parentModel,
              loading: false,
              error: true,
            };
            if (loadingIndex !== -1) {
              updated[loadingIndex] = errorMsg;
            } else {
              updated.push(errorMsg);
            }
            return { ...prev, [parentModel]: updated };
          });
        }
      });

    await Promise.all(requests);
    setIsSending(false);
  };

  const enabledCount = Object.values(aiSelectedModels).filter((m) => m?.enable).length;

  return (
    <div className="relative min-h-[calc(100vh-56px)] flex flex-col">
      {/* Chat panels area */}
      <div className="flex-1">
        <AiMultiModels />
      </div>

      {/* Chat input - fixed at bottom */}
      <div className="sticky bottom-0 z-30 w-full bg-gradient-to-t from-background via-background to-background/0 pt-6 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="chat-input-glass rounded-2xl p-1 shadow-2xl shadow-blue-500/5 border border-border/50">
            <div className="flex items-end gap-2 p-3">
              <textarea
                ref={textareaRef}
                placeholder={
                  enabledCount > 0
                    ? `Ask ${enabledCount} AI model${enabledCount > 1 ? "s" : ""} anything...`
                    : "Enable at least one AI model to start chatting..."
                }
                className="flex-1 resize-none border-0 outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm leading-relaxed min-h-[24px] max-h-[200px] py-2 px-1"
                value={userInput}
                rows={1}
                disabled={enabledCount === 0}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  handleTextareaResize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <Button
                size="icon"
                disabled={!userInput.trim() || isSending || enabledCount === 0}
                onClick={handleSend}
                className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-30 disabled:shadow-none"
              >
                {isSending ? (
                  <Sparkles className="h-4 w-4 animate-pulse" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/40 mt-2">
            AI Fusion compares responses from multiple AI models simultaneously
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatInputBox;
