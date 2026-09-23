import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { useUserStore } from "../store/userStore";
import { signupWithEmail, isGoogleAuthEnabled } from "../lib/authService";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import { toast } from "sonner";

const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    const result = await signupWithEmail(data.name, data.email, data.password);

    if (result.success && result.user) {
      login(result.user);
      toast.success("Account created! Welcome to Craverly.");
      navigate("/");
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start ordering delicious food"
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      {isGoogleAuthEnabled() && (
        <div className="mt-4">
          <GoogleAuthButton />
        </div>
      )}

      {!isSupabaseEnabled && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg text-xs text-gray-500">
          Demo tip: accounts only exist in this browser — clearing storage signs you out.
        </div>
      )}
    </AuthLayout>
  );
}