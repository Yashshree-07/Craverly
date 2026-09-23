import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { useUserStore } from "../store/userStore";
import { loginWithEmail, isGoogleAuthEnabled } from "../lib/authService";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useUserStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const result = await loginWithEmail(data.email, data.password);

    if (result.success && result.user) {
      login(result.user);
      toast.success(`Welcome back, ${result.user.name.split(" ")[0]}!`);
      const redirectTo = (location.state as { from?: string })?.from ?? "/";
      navigate(redirectTo);
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to order your favorite food"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Login
        </Button>
      </form>

      {isGoogleAuthEnabled() && (
        <div className="mt-4">
          <GoogleAuthButton />
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg text-xs text-gray-500">
        {isSupabaseEnabled
          ? "Demo tip: sign up first to create an account, then log back in. Your account and orders live in Supabase."
          : "Demo tip: sign up first to create an account, then log back in with the same credentials — there's no real backend, so accounts only exist in this browser."}
      </div>
    </AuthLayout>
  );
}