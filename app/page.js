"use client";

import { Suspense } from "react";
import ChatInputBox from "./_components/ChatInputBox";

export default function Home() {
  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <ChatInputBox />
    </Suspense>
  );
}

function ChatLoadingSkeleton() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
        <div className="h-4 w-48 bg-muted rounded-full" />
        <div className="h-3 w-32 bg-muted/60 rounded-full" />
      </div>
    </div>
  );
}