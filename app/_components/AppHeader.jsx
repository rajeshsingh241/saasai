"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border/30 bg-background/80 backdrop-blur-lg sticky top-0 z-20">
      <SidebarTrigger className="h-8 w-8 rounded-lg" />
      <Separator orientation="vertical" className="h-5 bg-border/30" />
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground/80">Chat</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
          Multi-Model
        </span>
      </div>
    </div>
  );
}

export default AppHeader;