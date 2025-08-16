import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { canShowReset } from "@/security/HatchGate";

// Lazy load main route components
const SelfHostedDashboard = React.lazy(() => import("@/components/SelfHostedDashboard").then(module => ({ default: module.SelfHostedDashboard })));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ResetKeyper = React.lazy(() => import("./pages/ResetKeyper"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-cyan-400 animate-pulse">Loading Keyper...</p>
              </div>
            </div>
          }>
            <Routes>
              {/* Self-hosted version - single route */}
              <Route path="/" element={<SelfHostedDashboard />} />
              {/* Hidden reset route - only accessible when armed */}
              <Route 
                path="/reset" 
                element={
                  canShowReset(false) ? (
                    <ResetKeyper />
                  ) : (
                    <NotFound />
                  )
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;