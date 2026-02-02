"use client";
import { LoginForm } from "@student/components/Auth/LoginForm";
import { useAuth } from "@context/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            redirect("/dashboard");
        }
    }, [user, loading]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <LoginForm />
        </div>
    );
}
