import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { useListNearbyDonations, useClaimDonation, getListDonationsQueryKey, getListNearbyDonationsQueryKey } from "@workspace/api-client-react";
import { DonationCard } from "@/components/DonationCard";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, HandHeart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAppSocket } from "@/hooks/use-socket"; // Instantiate socket here so we receive live updates
import { useLocation } from "wouter";

export function NearbyDonations() {
  const { data: donations, isLoading } = useListNearbyDonations({ radiusKm: 15 });
  const claimMutation = useClaimDonation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Initialize socket to get real-time donation pings
  useAppSocket();

  const handleClaim = async (id: number) => {
    try {
      await claimMutation.mutateAsync({ id });
      toast({ title: "Claimed successfully!", description: "Check your dashboard for pickup details." });
      queryClient.invalidateQueries({ queryKey: getListNearbyDonationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
      setLocation("/ngo");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Claim failed", description: err.message || "Could not claim." });
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ngo"]}>
      <div className="min-h-screen bg-muted/20 pb-20">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MapPin className="h-8 w-8 text-secondary" /> Nearby Surplus Food
            </h1>
            <p className="text-muted-foreground mt-2">Available donations within 15km of your registered location.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : !donations || donations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-border/60 p-16 text-center">
              <div className="bg-muted p-4 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HandHeart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">No available food nearby right now</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                We'll notify you automatically when new donations are posted in your area.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {donations.map(donation => (
                <DonationCard 
                  key={donation.id} 
                  donation={donation} 
                  actionButton={
                    <Button 
                      className="w-full rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold h-12"
                      onClick={() => handleClaim(donation.id)}
                      disabled={claimMutation.isPending}
                    >
                      {claimMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Claim Food"}
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
