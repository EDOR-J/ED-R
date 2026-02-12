import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "./pages/home";
import PulsePage from "./pages/pulse";
import ContentPage from "./pages/content";
import AdminPage from "./pages/admin";
import CircleRoom from "./pages/circle";
import LibraryPage from "./pages/library";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pulse" component={PulsePage} />
      <Route path="/content/:contentId" component={ContentPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/circle" component={CircleRoom} />
      <Route path="/library" component={LibraryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
