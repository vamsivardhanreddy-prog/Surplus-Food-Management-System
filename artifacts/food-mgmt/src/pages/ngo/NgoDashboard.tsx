import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, MapPin, HandHeart, CheckCircle, Navigation, Award, PackageCheck } from "lucide-react";
import { useListDonations, useCompleteDonation, getListDonationsQueryKey } from "@workspace/api-client-react";
import { DonationCard } from "@/components/DonationCard";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export function NgoDashboard() {
  const { user } = useAuth();
  const { data: myDonations, isLoading } = useListDonations({ myDonations: true }); // Backend should return claims for NGO
  const completeMutation = useCompleteDonation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      toast({ title: "Success", description: "Donation marked as completed." });
      queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
    } catch(err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to complete." });
    }
  };

  const claimedDonations = myDonations?.filter(d => d.status === 'claimed') || [];
  const completedDonations = myDonations?.filter(d => d.status === 'completed') || [];

  // Calculate NGO impact statistics
  const totalFoodItemsClaimed = claimedDonations.reduce((sum, d) => sum + (d.foodItems?.length || 0), 0);
  const totalFoodItemsCompleted = completedDonations.reduce((sum, d) => sum + (d.foodItems?.length || 0), 0);
  const totalPeopleServed = completedDonations.reduce((sum, d) => sum + (d.servesCount || 0), 0);

  if (user?.status === "pending_verification") {
    return (
      <ProtectedRoute allowedRoles={["ngo"]}>
        <div className="min-h-screen bg-muted/20 pb-20">
          <Navbar />
          <main className="max-w-3xl mx-auto px-4 pt-16">
            <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden text-center p-12">
              <div className="flex justify-center mb-6">
                <div className="bg-amber-100 p-6 rounded-full">
                  <Clock className="h-16 w-16 text-amber-600 animate-pulse" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">Verification Pending</h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                Your NGO registration is currently under review by our administration team. 
                This usually takes 24-48 hours. Once approved, you'll be able to claim surplus food in your area.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium">
                <AlertCircle className="h-4 w-4" /> You will be notified when your status updates.
              </div>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ngo"]}>
      <div className="min-h-screen bg-muted/20 pb-20">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-gradient-to-r from-secondary/20 to-primary/10 p-8 rounded-3xl border border-white">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user?.organizationName}</h1>
              <p className="text-primary font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Verified NGO Partner
              </p>
            </div>
            <Link href="/ngo/donations">
              <Button size="lg" className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20">
                <MapPin className="mr-2 h-5 w-5" /> Find Nearby Food
              </Button>
            </Link>
          </div>

          {/* Impact Statistics - only show when verified */}
          {user?.status !== "pending_verification" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <Card className="rounded-2xl border-border/50">
                <CardContent className="pt-6 flex flex-col items-start gap-2">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <PackageCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Pending Pickup</p>
                    <p className="text-3xl font-bold text-foreground">{totalFoodItemsClaimed}</p>
                    <p className="text-xs text-muted-foreground mt-1">{claimedDonations.length} claims</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50">
                <CardContent className="pt-6 flex flex-col items-start gap-2">
                  <div className="bg-emerald-100/80 p-2.5 rounded-lg">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Food Received</p>
                    <p className="text-3xl font-bold text-foreground">{totalFoodItemsCompleted}</p>
                    <p className="text-xs text-muted-foreground mt-1">{completedDonations.length} completed</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50">
                <CardContent className="pt-6 flex flex-col items-start gap-2">
                  <div className="bg-blue-100/80 p-2.5 rounded-lg">
                    <HandHeart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">People Served</p>
                    <p className="text-3xl font-bold text-foreground">{totalPeopleServed.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">from pickups</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Active Claims
                <span className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full">{claimedDonations.length}</span>
              </h2>
              
              {claimedDonations.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-border p-12 text-center">
                  <div className="bg-muted p-4 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HandHeart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No active claims</h3>
                  <p className="text-muted-foreground mt-2 mb-6">Check the map to find available food donations nearby.</p>
                  <Link href="/ngo/donations">
                    <Button variant="outline" className="rounded-xl border-primary text-primary">Browse Donations</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {claimedDonations.map(donation => (
                    <Card key={donation.id} className="rounded-2xl border-primary/20 shadow-md overflow-hidden flex flex-col sm:flex-row">
                      <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-border/50">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-bold text-xl">{donation.title}</h3>
                        </div>
                        <div className="space-y-3 mt-4 text-sm text-foreground/80">
                          <p><strong>Donator:</strong> {donation.donator?.name} ({donation.donator?.phone || 'No phone'})</p>
                          <p className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span>{donation.pickupAddress}</span>
                          </p>
                          {donation.pickupInstructions && (
                            <p className="bg-muted/50 p-2 rounded-lg italic">"{donation.pickupInstructions}"</p>
                          )}
                        </div>
                      </div>
                      <div className="p-6 sm:w-64 bg-muted/10 flex flex-col justify-center gap-4">
                         <Button 
                           variant="outline"
                           className="w-full rounded-xl flex items-center justify-center gap-2 h-12"
                           onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${donation.latitude},${donation.longitude}`, '_blank')}
                         >
                           <Navigation className="h-4 w-4" /> Get Directions
                         </Button>
                         <Button 
                           className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-12"
                           onClick={() => handleComplete(donation.id)}
                           disabled={completeMutation.isPending}
                         >
                           Mark Picked Up
                         </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {completedDonations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 text-foreground/80">Completed Pickups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                  {completedDonations.map(donation => (
                    <DonationCard key={donation.id} donation={donation} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
