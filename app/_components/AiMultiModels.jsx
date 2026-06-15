"use client";

import React, { useContext, useRef, useEffect, useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { AiSelectModelContext } from "@/context/AiSelectedModelContext";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { AiModelList, DefaultModel } from "@/shared/AiModelsShared";
import { MessageSquare, Lock, Sparkles, Bot, Copy, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectGroup } from "@radix-ui/react-select";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

// Consistent safe user ID (same logic as provider.jsx)
function getSafeUserId(user) {
  const emailId = user?.primaryEmailAddress?.emailAddress;
  if (emailId) return emailId.replace(/\./g, "_").replace(/@/g, "_");
  return user?.id || null;
}

function AiMultiModels() {
  const { user } = useUser();
  const { aiSelectedModels, setAiSelectedModels, messages } =
    useContext(AiSelectModelContext);

  // State for code zoom modal
  const [zoomedCode, setZoomedCode] = useState(null);

  const onToggleChange = (model, value) => {
    setAiSelectedModels((prev) => ({
      ...prev,
      [model]: {
        ...(prev?.[model] ?? {}),
        enable: value,
        modelId: prev?.[model]?.modelId || DefaultModel[model]?.modelId,
      },
    }));
  };

  const onSelectValue = async (parentModel, selectedId) => {
    const updatedModels = {
      ...aiSelectedModels,
      [parentModel]: {
        ...(aiSelectedModels[parentModel] ?? {}),
        modelId: selectedId,
      },
    };
    setAiSelectedModels(updatedModels);

    // Use consistent safe user ID for Firestore
    if (user) {
      const userId = getSafeUserId(user);
      if (userId) {
        try {
          const docRef = doc(db, "users", userId);
          await updateDoc(docRef, { selectModelpref: updatedModels });
        } catch (err) {
          console.error("Error saving model selection:", err);
        }
      }
    }
  };

  const enabledModels = AiModelList.filter(
    (m) => aiSelectedModels?.[m.model]?.enable
  );
  const disabledModels = AiModelList.filter(
    (m) => !aiSelectedModels?.[m.model]?.enable
  );

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* Enabled model panels */}
      {enabledModels.length === 0 ? (
        <WelcomeState />
      ) : (
        enabledModels.map((model, index) => (
          <ModelPanel
            key={model.model}
            model={model}
            index={index}
            totalEnabled={enabledModels.length}
            aiSelectedModels={aiSelectedModels}
            messages={messages}
            onToggleChange={onToggleChange}
            onSelectValue={onSelectValue}
            onCodeClick={setZoomedCode}
          />
        ))
      )}

      {/* Collapsed disabled models */}
      {disabledModels.length > 0 && (
        <div className="flex flex-col border-l border-border/30">
          {disabledModels.map((model) => (
            <button
              key={model.model}
              onClick={() => onToggleChange(model.model, true)}
              className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-accent/50 transition-all duration-200 border-b border-border/20 group"
              title={`Enable ${model.model}`}
            >
              <Image
                src={model.icon}
                alt={model.model}
                width={20}
                height={20}
                className="opacity-40 group-hover:opacity-80 transition-opacity"
              />
              <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors writing-vertical">
                {model.model}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Code Zoom Modal */}
      {zoomedCode && (
        <CodeZoomModal
          code={zoomedCode.code}
          language={zoomedCode.language}
          onClose={() => setZoomedCode(null)}
        />
      )}
    </div>
  );
}

// Individual model chat panel
function ModelPanel({
  model,
  index,
  totalEnabled,
  aiSelectedModels,
  messages,
  onToggleChange,
  onSelectValue,
  onCodeClick,
}) {
  const messagesEndRef = useRef(null);
  const currentModel =
    aiSelectedModels?.[model.model]?.modelId ||
    DefaultModel?.[model.model]?.modelId ||
    "";
  const modelMessages = messages?.[model.model] || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [modelMessages.length]);

  return (
    <div
      className={`flex flex-col h-full flex-1 min-w-0 overflow-hidden ${
        index < totalEnabled - 1 ? "border-r border-border/30" : ""
      } transition-all duration-300`}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Image
              src={model.icon}
              alt={model.model}
              width={24}
              height={24}
              className="rounded-md"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>

          <Select
            value={currentModel}
            onValueChange={(value) => onSelectValue(model.model, value)}
            disabled={model.premium}
          >
            <SelectTrigger className="h-8 text-xs border-border/30 bg-transparent min-w-[140px] max-w-[180px]">
              <SelectValue placeholder={currentModel || "Select model"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-1">
                <SelectLabel className="text-xs font-semibold text-muted-foreground px-2">
                  Free
                </SelectLabel>
                {model.subModel.map(
                  (sm) =>
                    !sm.premium && (
                      <SelectItem key={sm.id} value={sm.id} className="text-xs">
                        {sm.name}
                      </SelectItem>
                    )
                )}
              </SelectGroup>
              <SelectGroup className="p-1">
                <SelectLabel className="text-xs font-semibold text-muted-foreground/60 px-2">
                  🔒 Premium
                </SelectLabel>
                {model.subModel.map(
                  (sm) =>
                    sm.premium && (
                      <SelectItem
                        key={sm.id}
                        value={sm.id}
                        disabled
                        className="text-xs opacity-50"
                      >
                        {sm.name}
                      </SelectItem>
                    )
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Switch
          checked={true}
          onCheckedChange={(v) => onToggleChange(model.model, v)}
          className="shrink-0 scale-90"
        />
      </div>

      {/* Premium lock overlay */}
      {model.premium ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-transparent to-accent/20">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Premium Model</p>
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Upgrade to Unlock
            </Button>
          </div>
        </div>
      ) : (
        /* Chat messages area */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
          <div className="space-y-4 max-w-none min-w-0">
            {modelMessages.length > 0 ? (
              modelMessages.map((m, i) => (
                <ChatBubble key={i} message={m} modelName={model.model} onCodeClick={onCodeClick} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-3">
                  <Bot className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground/60 font-medium">
                  {model.model} ready
                </p>
                <p className="text-xs text-muted-foreground/30 mt-1">
                  Send a message to start
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// Chat bubble component
function ChatBubble({ message, modelName, onCodeClick }) {
  const isUser = message.role === "user";
  const isError = message.error;

  // Custom renderers to make code blocks clickable
  const markdownComponents = {
    pre({ children, ...props }) {
      // Extract code text from the pre > code structure
      const codeElement = React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === "code"
      );
      const codeText = codeElement
        ? extractTextFromChildren(codeElement.props.children)
        : "";
      const className = codeElement?.props?.className || "";
      const language = className.replace("language-", "") || "code";

      return (
        <pre
          {...props}
          className={`${props.className || ""} group relative cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10`}
          onClick={(e) => {
            e.stopPropagation();
            onCodeClick?.({ code: codeText, language });
          }}
          title="Click to expand"
        >
          {children}
          <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] bg-blue-500/80 text-white px-2 py-0.5 rounded-full pointer-events-none">
            Click to expand
          </span>
        </pre>
      );
    },
  };

  if (message.loading) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-md bg-card border border-border/30 shadow-sm">
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider block mb-2">
            {message.model ?? modelName}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin h-3.5 w-3.5" />
            <span className="text-sm">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] p-3 rounded-2xl shadow-sm transition-all duration-200 overflow-hidden break-words ${
          isUser
            ? "rounded-tr-md bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            : isError
            ? "rounded-tl-md bg-red-500/10 border border-red-500/20 text-red-400"
            : "rounded-tl-md bg-card border border-border/30 text-foreground"
        }`}
      >
        {!isUser && (
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider block mb-1.5">
            {message.model ?? modelName}
          </span>
        )}
        <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// Helper to extract plain text from React children (handles nested elements)
function extractTextFromChildren(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (React.isValidElement(children) && children.props?.children) {
    return extractTextFromChildren(children.props.children);
  }
  return "";
}

// Code zoom modal — fullscreen overlay with blurred background
function CodeZoomModal({ code, language, onClose }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal content */}
      <div
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-border/30 bg-card shadow-2xl shadow-blue-500/10 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied!</>
              ) : (
                <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Code</>
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Code content */}
        <div className="flex-1 overflow-auto p-5 custom-scrollbar">
          <pre className="text-sm font-mono leading-relaxed text-foreground whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Welcome state when no models are enabled
function WelcomeState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto animate-float">
          <Sparkles className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Welcome to AI Fusion
          </h2>
          <p className="text-muted-foreground/60 mt-2 text-sm leading-relaxed">
            Enable AI models from the panels to start comparing responses
            side-by-side. Toggle models on using the icons on the right.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AiMultiModels;