"use client";
import React, { useState } from "react"
import { useAuth } from "@context/AuthContext"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SEO } from "@components/SEO/SEO"
import { Button } from "@components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import {
  Field,
  FieldGroup,
} from "@components/ui/field"

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginWithGoogle } = useAuth()
  const router = useRouter();
  // searchParams can be used for success redirects or error handling if needed in future
  // const searchParams = useSearchParams();

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true)
      setError('')
      // Google Auth handles both login and signup
      await loginWithGoogle('student')
    } catch (err: any) {
      setError('Google signup failed')
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Sign Up"
        description="Join GradeU, the elite training platform. Create your account to start hands-on labs and assessments."
      />
      <div className="dark bg-zinc-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link href="/" className="flex flex-col items-center gap-4 self-center font-medium group transition-all hover:opacity-90 mb-4 focus:outline-none">
            <div className="flex size-20 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-105">
              <img src="/logo.svg" alt="GradeU" className="size-20" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-black tracking-tighter text-white uppercase font-sans">Grade<span className="text-brand-400">U</span></div>
            </div>
          </Link>

          <Card className="bg-zinc-900/50 border-zinc-800/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
              <CardDescription className="text-zinc-400">
                Sign up with your Apple or Google account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-500 text-xs font-mono uppercase tracking-widest text-center">{error}</p>
                </div>
              )}

              <FieldGroup className="gap-6">
                <Field>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full bg-zinc-950 border-zinc-800 text-white hover:bg-brand-400 hover:text-black hover:border-brand-400 h-12 text-md font-bold transition-all duration-300"
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mr-2 size-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                        <span>Sign up with Google</span>
                      </>
                    )}
                  </Button>
                </Field>



                <Field>
                  <div className="text-center text-xs text-zinc-500 mt-6 leading-relaxed">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="hover:text-zinc-300 underline underline-offset-4">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="hover:text-zinc-300 underline underline-offset-4">
                      Privacy Policy
                    </Link>.
                    <div className="mt-4">
                      Already have an account?{" "}
                      <Link href="/login" className="text-brand-400 hover:underline font-bold">
                        Login
                      </Link>
                    </div>
                  </div>
                </Field>

              </FieldGroup>
            </CardContent>
          </Card>
          <p className="px-6 text-center text-xs text-zinc-500">
            By clicking continue, you agree to our <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>{" "}
            and <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  )
}