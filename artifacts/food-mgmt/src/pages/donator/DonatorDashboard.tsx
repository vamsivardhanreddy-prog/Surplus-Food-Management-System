import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { useListDonations } from "@workspace/api-client-react";
import { DonationCard } from "@/components/DonationCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { PlusCircle, Loader2, TrendingUp, Users, Package, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function DonatorDashboard() {
  const { user } = useAuth();
  const { data: donations, isLoading } = useListDonations({ myDonations: true });

  const activeDonations = donations?.filter(d => d.status !== 'completed') || [];
  const pastDonations = donations?.filter(d => d.status === 'completed') || [];

  // Calculate impact statistics
  const totalDonations = donations?.length || 0;
  const totalPeopleServed = donations?.reduce((sum, d) => sum + (d.servesCount || 0), 0) || 0;
  const completedDonations = pastDonations.length;
  const totalFoodItems = donations?.reduce((sum, d) => sum + (d.foodItems?.length || 0), 0) || 0;

  return (
    <ProtectedRoute allowedRoles={["donator"]}>
      <div className="min-h-screen bg-muted/20 pb-20">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}</h1>
              <p className="text-muted-foreground mt-1">Manage your surplus food donations</p>
            </div>
            <Link href="/donator/new-donation">
              <Button size="lg" className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Post Food
              </Button>
            </Link>
          </div>

          {/* Impact Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="rounded-2xl border-border/50">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="bg-primary/10 p-2.5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Donations</p>
                  <p className="text-3xl font-bold text-foreground">{totalDonations}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="bg-secondary/10 p-2.5 rounded-lg">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">People Served</p>
                  <p className="text-3xl font-bold text-foreground">{totalPeopleServed.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="bg-emerald-100/80 p-2.5 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Food Items Listed</p>
                  <p className="text-3xl font-bold text-foreground">{totalFoodItems}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="bg-blue-100/80 p-2.5 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Completed</p>
                  <p className="text-3xl font-bold text-foreground">{completedDonations}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Active Donations
                <span className="bg-primary/10 text-primary text-sm py-0.5 px-2.5 rounded-full">{activeDonations.length}</span>
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : activeDonations.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-border/60 p-12 text-center flex flex-col items-center">
                  <div className="bg-primary/5 p-4 rounded-full mb-4">
                    <PlusCircle className="h-8 w-8 text-primary/50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No active donations</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm mb-6">Post your surplus food to help NGOs in your area provide for those in need.</p>
                  <Link href="/donator/new-donation">
                    <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5">Create Donation</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeDonations.map(donation => (
                    <DonationCard 
                      key={donation.id} 
                      donation={donation} 
                    />
                  ))}
                </div>
              )}
            </section>

            {pastDonations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 text-foreground/80">Past Donations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {pastDonations.map(donation => (
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
