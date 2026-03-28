import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake, Loader2, MapPin, Utensils, Building2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { RegisterRequestRole } from "@workspace/api-client-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([RegisterRequestRole.donator, RegisterRequestRole.ngo]),
  
  // NGO specific fields
  organizationName: z.string().optional(),
  registrationNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
}).refine(data => {
  if (data.role === 'ngo') {
    return !!data.organizationName && !!data.address && data.latitude !== undefined && data.longitude !== undefined;
  }
  return true;
}, {
  message: "NGOs must provide organization name, address, and location",
  path: ["organizationName"]
});

export function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [locationStr] = useLocation();
  const defaultRole = locationStr.includes("role=ngo") ? "ngo" : "donator";

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      name: "", email: "", password: "", role: defaultRole,
      organizationName: "", registrationNumber: "", phone: "", address: ""
    },
  });

  const role = form.watch("role");

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      await register(values);
    } catch (error) {
      // Error handled by AuthProvider
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "Geolocation not supported by your browser." });
      return;
    }
    
    toast({ title: "Getting location...", description: "Please allow access when prompted." });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude);
        form.setValue("longitude", position.coords.longitude);
        toast({ title: "Success", description: "Location captured successfully." });
      },
      (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <HeartHandshake className="h-10 w-10 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-primary">ShareBite</span>
          </Link>
        </div>
        
        <Card className="rounded-3xl border-border/50 shadow-xl overflow-hidden glass-panel">
          <CardHeader className="space-y-1 pb-6 text-center pt-8">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription className="text-base">
              Join our community to start sharing or receiving food
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I want to join as a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="relative">
                            <RadioGroupItem value="donator" id="role-donator" className="peer sr-only" />
                            <label htmlFor="role-donator" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                              <Utensils className="mb-2 h-6 w-6 text-primary" />
                              <span className="font-bold">Donator</span>
                              <span className="text-xs text-muted-foreground mt-1 font-normal text-center">I have surplus food</span>
                            </label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem value="ngo" id="role-ngo" className="peer sr-only" />
                            <label htmlFor="role-ngo" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                              <HeartHandshake className="mb-2 h-6 w-6 text-primary" />
                              <span className="font-bold">NGO</span>
                              <span className="text-xs text-muted-foreground mt-1 font-normal text-center">I want to claim food</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="h-11 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 890" className="h-11 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "ngo" && (
                  <div className="space-y-5 bg-muted/20 p-5 rounded-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-sm font-medium text-secondary bg-secondary/10 p-3 rounded-lg flex gap-2">
                      <HeartHandshake className="h-5 w-5 shrink-0" />
                      NGO accounts require Admin verification before claiming food. Please provide accurate details.
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Hope Trust" className="h-11 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="REG-12345" className="h-11 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, City" className="h-11 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormLabel>Location Coordinates *</FormLabel>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={getLocation} className="rounded-xl w-full h-11 border-primary text-primary hover:bg-primary/5">
                          <MapPin className="mr-2 h-4 w-4" /> Get Current Location
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="any" placeholder="Latitude" className="h-11 rounded-xl bg-muted" readOnly {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="any" placeholder="Longitude" className="h-11 rounded-xl bg-muted" readOnly {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className={`w-full h-12 rounded-xl text-lg font-medium shadow-lg transition-all ${role === 'ngo' ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'}`}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
