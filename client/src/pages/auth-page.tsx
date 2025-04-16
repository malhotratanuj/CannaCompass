import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// Create the zod schemas for login and registration
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Hero section */}
        <div className="hidden md:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-emerald-500 to-green-700 text-white">
          <h1 className="text-4xl font-bold mb-4 text-center">Cannabis Strain Finder</h1>
          <p className="text-lg mb-8 text-center">
            Discover the perfect cannabis strain for your needs and find it at nearby dispensaries.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="mr-2">✓</span> Personalized strain recommendations
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Find nearby dispensaries
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Save your favorite strains
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Canadian market focused
            </li>
          </ul>
        </div>

        {/* Auth forms */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-2 md:hidden">Cannabis Strain Finder</h2>
          <p className="text-center text-muted-foreground mb-6 md:hidden">
            Sign in or create an account to get started
          </p>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm isLoading={loginMutation.isPending} onSubmit={loginMutation.mutate} />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm isLoading={registerMutation.isPending} onSubmit={registerMutation.mutate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, isLoading }: { onSubmit: (values: LoginFormValues) => void, isLoading: boolean }) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} />
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
                <Input type="password" placeholder="Your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ onSubmit, isLoading }: { onSubmit: (values: RegisterFormValues) => void, isLoading: boolean }) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
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
                <Input type="password" placeholder="Create a password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}