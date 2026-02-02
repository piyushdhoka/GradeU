"use client";
import { RegisterForm } from "@student/components/Auth/RegisterForm";
import { useAuth } from "@context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <RegisterForm />
        </div>
    );
}
