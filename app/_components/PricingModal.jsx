"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function PricingModal({ children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock unlimited messages, premium models, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Free Plan */}
          <div className="p-4 rounded-xl border border-border/30 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Free</h3>
              <span className="text-xs text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                Current
              </span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />5 messages per session
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />Access to free models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />Chat history
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="p-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] text-white font-bold rounded-bl-lg">
              PRO
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Pro</h3>
              <span className="text-lg font-bold">
                $9<span className="text-xs font-normal text-muted-foreground">/mo</span>
              </span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500" />Unlimited messages
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500" />All premium models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500" />Priority support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500" />Advanced analytics
              </li>
            </ul>
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 shadow-lg shadow-amber-500/20 rounded-xl text-xs font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModal;
