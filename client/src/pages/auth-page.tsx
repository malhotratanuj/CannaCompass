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
import { Loader2, AlertCircle } from "lucide-react";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useState } from "react";


import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) throw new Error('Failed to process request');
      
      setMessage('If an account exists with this username, you will receive a password reset email.');
      setTimeout(() => {
        onClose();
        toast({
          title: "Request sent",
          description: "Check your email for password reset instructions.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {message ? (
          <p className="text-sm text-center text-emerald-600">{message}</p>
        ) : (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}

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
  const { celebrateMilestone } = useCelebration();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // If user is already logged in, redirect to home page
  if (user) {
    // Trigger celebration if it's the first login from this session
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
    const justRegistered = sessionStorage.getItem('justRegistered') === 'true';
    
    if (justRegistered) {
      celebrateMilestone('account_created');
      sessionStorage.removeItem('justRegistered');
    } else if (justLoggedIn) {
      celebrateMilestone('first_login');
      sessionStorage.removeItem('justLoggedIn');
    }
    
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
              <span className="mr-2">✓</span> Compare prices and availability
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <ForgotPasswordForm onClose={() => setShowForgotPassword(false)} />
        </DialogContent>
      </Dialog>

    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setLoginError("Invalid username or password. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {loginError && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-amber-800 text-sm">{loginError}</span>
          </div>
        )}
        
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
        
        <Button type="submit" className="w-full mb-4" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        <div className="text-center">
          <button 
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </Form>
  );
}

function RegisterForm({ onSubmit, isLoading }: { onSubmit: (values: RegisterFormValues) => void, isLoading: boolean }) {
  const [registerError, setRegisterError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setRegisterError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setRegisterError("This username is already taken. Please choose another one.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {registerError && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-amber-800 text-sm">{registerError}</span>
          </div>
        )}
      
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