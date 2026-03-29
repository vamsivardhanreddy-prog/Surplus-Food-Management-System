import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDonation, CreateDonationRequestDietaryType, getListDonationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Plus, Trash2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const schema = z.object({
  title: z.string().min(3, "Title required"),
  foodItems: z.array(z.object({
    name: z.string().min(1, "Item name required"),
    quantity: z.string().min(1, "Quantity required")
  })).min(1, "At least one food item is required"),
  servesCount: z.coerce.number().min(1),
  expiryTime: z.string().min(1, "Expiry time required"),
  dietaryType: z.enum([CreateDonationRequestDietaryType.veg, CreateDonationRequestDietaryType["non-veg"], CreateDonationRequestDietaryType.both]),
  specialInstructions: z.string().optional(),
  pickupAddress: z.string().min(5, "Full address required"),
  latitude: z.coerce.number({ required_error: "Location required" }),
  longitude: z.coerce.number({ required_error: "Location required" }),
  pickupInstructions: z.string().optional()
}).refine((data) => {
  // Ensure expiry time is in the future
  const expiryDate = new Date(data.expiryTime);
  const now = new Date();
  return expiryDate > now;
}, {
  message: "Food must expire in the future, not in the past",
  path: ["expiryTime"]
});

export function NewDonation() {
  const mutation = useCreateDonation();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      foodItems: [{ name: "", quantity: "" }],
      dietaryType: "veg",
      specialInstructions: "",
      pickupAddress: "",
      pickupInstructions: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "foodItems"
  });

  const onSubmit = async (values) => {
    try {
      // Ensure expiry is in correct ISO format from datetime-local input
      const date = new Date(values.expiryTime);
      const isoString = date.toISOString();

      await mutation.mutateAsync({ data: { ...values, expiryTime: isoString } });
      toast({ title: "Donation posted!", description: "Nearby NGOs will be notified." });
      queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
      setLocation("/donator");
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to post", description: err.message });
    }
  };

  const getGeoLocation = () => {
    if (!navigator.geolocation) return toast({ variant: "destructive", title: "Error", description: "Not supported by browser" });
    toast({ title: "Getting location..." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
        toast({ title: "Location captured!" });
      },
      () => toast({ variant: "destructive", title: "Error", description: "Could not get location" })
    );
  };

  return (
    <ProtectedRoute allowedRoles={["donator"]}>
      <div className="min-h-screen bg-muted/20 pb-20">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Post Surplus Food</h1>
          
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-border/50 pb-6">
              <CardTitle className="text-xl">Donation Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Basic Info */}
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) =>
                      <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Wedding Buffet Leftovers" className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      } />
                    
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="servesCount"
                        render={({ field }) =>
                        <FormItem>
                            <FormLabel>Serves Approx (People) *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" className="h-12 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        } />
                      
                      <FormField
                        control={form.control}
                        name="dietaryType"
                        render={({ field }) =>
                        <FormItem>
                            <FormLabel>Dietary Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-xl">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="veg">Vegetarian</SelectItem>
                                <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                                <SelectItem value="both">Both (Mixed)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        } />
                      
                    </div>

                    <FormField
                      control={form.control}
                      name="expiryTime"
                      render={({ field }) => {
                        // Get minimum datetime (now)
                        const now = new Date();
                        const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        return (
                          <FormItem>
                            <FormLabel>Expiry Time (When it goes bad) *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="datetime-local"
                                  className="h-12 rounded-xl pl-10"
                                  min={minDateTime}
                                  {...field} />
                                
                                <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>);

                      }} />
                    
                  </div>

                  <hr className="border-border/50" />

                  {/* Food Items Array */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-base font-semibold text-foreground/80">Food Items *</label>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", quantity: "" })} className="rounded-lg h-8">
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) =>
                      <div key={field.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-3 flex-1">
                            <FormField
                            control={form.control}
                            name={`foodItems.${index}.name`}
                            render={({ field }) =>
                            <FormItem>
                                  <FormControl><Input placeholder="Item name (e.g. Rice)" className="rounded-lg" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                            } />
                          
                            <FormField
                            control={form.control}
                            name={`foodItems.${index}.quantity`}
                            render={({ field }) =>
                            <FormItem>
                                  <FormControl><Input placeholder="Quantity (e.g. 2 kgs)" className="rounded-lg" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                            } />
                          
                          </div>
                          {fields.length > 1 &&
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 shrink-0">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                        }
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-border/50" />

                  {/* Location */}
                  <div className="space-y-5 bg-muted/30 p-5 rounded-2xl">
                    <label className="text-base font-semibold text-foreground/80">Pickup Location *</label>
                    
                    <FormField
                      control={form.control}
                      name="pickupAddress"
                      render={({ field }) =>
                      <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main St, Appt 4..." className="rounded-xl resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      } />
                    

                    <div className="space-y-3">
                      <Button type="button" onClick={getGeoLocation} variant="outline" className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary/5">
                        <MapPin className="mr-2 h-5 w-5" /> Capture My GPS Location
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) =>
                          <FormItem>
                              <FormControl><Input type="number" step="any" placeholder="Latitude" className="bg-white rounded-lg" readOnly {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          } />
                        
                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) =>
                          <FormItem>
                              <FormControl><Input type="number" step="any" placeholder="Longitude" className="bg-white rounded-lg" readOnly {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          } />
                        
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="pickupInstructions"
                      render={({ field }) =>
                      <FormItem>
                          <FormLabel>Pickup Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Call me when you arrive at the gate" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      } />
                    
                  </div>

                  <Button type="submit" disabled={mutation.isPending} className="w-full h-14 rounded-xl text-lg shadow-lg hover:-translate-y-0.5 transition-all">
                    {mutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : "Post Donation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>);

}