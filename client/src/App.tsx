import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth, type UserRole } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "./pages/home";
import PulsePage from "./pages/pulse";
import ContentPage from "./pages/content";
import AdminPage from "./pages/admin";
import CircleRoom from "./pages/circle";
import CirclesHub from "./pages/circles";
import LibraryPage from "./pages/library";
import LoginPage from "./pages/auth/login";
import ProfilePage from "@/pages/profile/index";
import FriendsPage from "@/pages/social/friends";
import ListenChatPage from "@/pages/social/listen-chat";
import UploadPage from "./pages/upload";
import ArtistDashboard from "./pages/artist-dashboard";
import AdminAnalytics from "./pages/admin-analytics";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path?: string }) {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function RoleRoute({ component: Component, allowedRoles, ...rest }: { component: React.ComponentType<any>; allowedRoles: UserRole[]; path?: string }) {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role ?? "user")) {
    return <Redirect to="/" />;
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
      <Route path="/admin">{() => <RoleRoute component={AdminPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/analytics">{() => <RoleRoute component={AdminAnalytics} allowedRoles={["admin"]} />}</Route>
      <Route path="/circles">{() => <ProtectedRoute component={CirclesHub} />}</Route>
      <Route path="/circle">{() => <ProtectedRoute component={CircleRoom} />}</Route>
      <Route path="/library">{() => <ProtectedRoute component={LibraryPage} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route path="/social">{() => <ProtectedRoute component={FriendsPage} />}</Route>
      <Route path="/listen-chat">{() => <ProtectedRoute component={ListenChatPage} />}</Route>
      <Route path="/upload">{() => <RoleRoute component={UploadPage} allowedRoles={["admin", "artist"]} />}</Route>
      <Route path="/artist">{() => <RoleRoute component={ArtistDashboard} allowedRoles={["artist", "admin"]} />}</Route>
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
