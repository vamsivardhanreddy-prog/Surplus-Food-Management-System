import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPlatformStats, useListPendingNgos, useVerifyNgo, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getListPendingNgosQueryKey, getGetPlatformStatsQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { Users, Building, Utensils, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: pendingNgos, isLoading: pendingLoading } = useListPendingNgos();
  const { data: allUsers } = useListUsers();
  const verifyMutation = useVerifyNgo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleVerify = async (id, status) => {
    try {
      await verifyMutation.mutateAsync({ id, data: { status } });
      toast({ title: "Success", description: `NGO ${status} successfully.` });
      queryClient.invalidateQueries({ queryKey: getListPendingNgosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPlatformStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
  };

  const chartData = stats ? [
  { name: 'Total', value: stats.totalDonations },
  { name: 'Available', value: stats.availableDonations },
  { name: 'Claimed', value: stats.claimedDonations },
  { name: 'Completed', value: stats.completedDonations }] :
  [];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-muted/20 pb-20">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3 mb-8 bg-background border border-border/50 rounded-xl p-1 shadow-sm">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="verifications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white relative">
                Verifications
                {pendingNgos && pendingNgos.length > 0 &&
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive"></span>
                }
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">All Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
              {statsLoading ?
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div> :
              stats ?
              <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                  { label: "Total Users", value: stats.totalUsers, icon: <Users className="h-5 w-5 text-blue-500" />, bg: "bg-blue-500/10" },
                  { label: "Donators", value: stats.totalDonators, icon: <Utensils className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
                  { label: "Verified NGOs", value: stats.totalNgos, icon: <Building className="h-5 w-5 text-secondary" />, bg: "bg-secondary/10" },
                  { label: "Pending", value: stats.pendingVerifications, icon: <CheckCircle className="h-5 w-5 text-amber-500" />, bg: "bg-amber-500/10" }].
                  map((stat, i) =>
                  <Card key={i} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                  )}
                  </div>

                  <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>Donations Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </> :
              null}
            </TabsContent>

            <TabsContent value="verifications" className="animate-in fade-in duration-500">
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle>Pending NGO Verifications</CardTitle>
                </CardHeader>
                <div className="divide-y divide-border/50">
                  {pendingLoading ?
                  <div className="p-8 text-center"><Loader2 className="animate-spin text-primary h-6 w-6 mx-auto" /></div> :
                  pendingNgos?.length === 0 ?
                  <div className="p-12 text-center text-muted-foreground">No pending verification requests.</div> :

                  pendingNgos?.map((ngo) =>
                  <div key={ngo.id} className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:bg-muted/10 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{ngo.organizationName || ngo.name}</h3>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                            <p><strong>Contact:</strong> {ngo.name} ({ngo.phone})</p>
                            <p><strong>Email:</strong> {ngo.email}</p>
                            <p><strong>Reg No:</strong> {ngo.registrationNumber || 'N/A'}</p>
                            <p><strong>Address:</strong> {ngo.address}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <Button
                        variant="outline"
                        className="flex-1 md:w-auto text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleVerify(ngo.id, 'rejected')}
                        disabled={verifyMutation.isPending}>
                        
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                          </Button>
                          <Button
                        className="flex-1 md:w-auto bg-primary hover:bg-primary/90 text-white"
                        onClick={() => handleVerify(ngo.id, 'verified')}
                        disabled={verifyMutation.isPending}>
                        
                            <CheckCircle className="mr-2 h-4 w-4" /> Verify
                          </Button>
                        </div>
                      </div>
                  )
                  }
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="animate-in fade-in duration-500">
               <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase">
                      <tr>
                        <th className="px-6 py-4 font-medium">Name / Org</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {allUsers?.map((u) =>
                      <tr key={u.id} className="hover:bg-muted/10">
                          <td className="px-6 py-4 font-medium text-foreground">{u.organizationName || u.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                          <td className="px-6 py-4 capitalize">{u.role}</td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className={
                          u.status === 'verified' ? 'bg-green-100 text-green-700' :
                          u.status === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                          u.status === 'rejected' ? 'bg-red-100 text-red-700' : ''
                          }>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
               </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>);

}