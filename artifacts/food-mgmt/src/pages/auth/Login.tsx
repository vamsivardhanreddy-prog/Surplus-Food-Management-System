import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function Login() {
  const { login } = useAuth();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
      // Redirect happens in AuthProvider or ProtectedRoute
    } catch (error) {
      // Error handled by AuthProvider toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <HeartHandshake className="h-10 w-10 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-primary">ShareBite</span>
          </Link>
        </div>
        
        <Card className="rounded-3xl border-border/50 shadow-xl overflow-hidden glass-panel">
          <CardHeader className="space-y-1 pb-8 text-center pt-8">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Demo Admin Credentials</p>
              <p>Email: <span className="font-mono">admin@foodmgmt.com</span></p>
              <p>Password: <span className="font-mono">password</span></p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" className="h-12 rounded-xl bg-background border-border/50" {...field} />
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
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-background border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-lg font-medium shadow-lg hover:-translate-y-0.5 transition-transform"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
