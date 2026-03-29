import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider } from "@/hooks/use-auth";
import { useAppSocket } from "@/hooks/use-socket";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { DonatorDashboard } from "@/pages/donator/DonatorDashboard";
import { NewDonation } from "@/pages/donator/NewDonation";
import { NgoDashboard } from "@/pages/ngo/NgoDashboard";
import { NearbyDonations } from "@/pages/ngo/NearbyDonations";

const queryClient = new QueryClient();

function SocketInitializer() {
  useAppSocket();
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />

      {/* Donator Routes */}
      <Route path="/donator" component={DonatorDashboard} />
      <Route path="/donator/new-donation" component={NewDonation} />

      {/* NGO Routes */}
      <Route path="/ngo" component={NgoDashboard} />
      <Route path="/ngo/donations" component={NearbyDonations} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>);

}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SocketInitializer />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>);

}

export default App;