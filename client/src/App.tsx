import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "./pages/home";
import PulsePage from "./pages/pulse";
import ContentPage from "./pages/content";
import AdminPage from "./pages/admin";
import CircleRoom from "./pages/circle";
import LibraryPage from "./pages/library";
import LoginPage from "./pages/auth/login";
import ProfilePage from "@/pages/profile/index";
import FriendsPage from "@/pages/social/friends";
import ListenChatPage from "@/pages/social/listen-chat";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path?: string }) {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{() => <ProtectedRoute component={HomePage} />}</Route>
      <Route path="/pulse">{() => <ProtectedRoute component={PulsePage} />}</Route>
      <Route path="/content/:contentId">{(params) => <ProtectedRoute component={ContentPage} {...params} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPage} />}</Route>
      <Route path="/circle">{() => <ProtectedRoute component={CircleRoom} />}</Route>
      <Route path="/library">{() => <ProtectedRoute component={LibraryPage} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route path="/social">{() => <ProtectedRoute component={FriendsPage} />}</Route>
      <Route path="/listen-chat">{() => <ProtectedRoute component={ListenChatPage} />}</Route>
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
