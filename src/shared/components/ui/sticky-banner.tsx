"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@lib/utils";

export const StickyBanner = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        <motion.div
            className={cn(
                "relative flex min-h-12 w-full items-center justify-center bg-blue-600 px-4 py-2 z-[100]",
                className,
            )}
            initial={{
                y: -10,
                opacity: 0,
            }}
            animate={{
                y: 0,
                opacity: 1,
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
        >
            {children}
        </motion.div>
    );
};
