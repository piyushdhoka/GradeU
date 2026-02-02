"use client";
import { cn } from "@lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "motion/react";

import React, { useRef, useState } from "react";


interface NavbarProps {
    children: React.ReactNode;
    className?: string;
}

interface NavBodyProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface NavItemsProps {
    items: {
        name: string;
        link: string;
        onClick?: () => void;
    }[];
    className?: string;
    onItemClick?: () => void;
}

interface MobileNavProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface MobileNavHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface MobileNavMenuProps {
    children: React.ReactNode;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const [visible, setVisible] = useState<boolean>(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 100) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    });

    return (
        <motion.div
            ref={ref}
            className={cn("sticky top-0 z-110 w-full transition-all duration-300", className)}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(
                        child as React.ReactElement<{ visible?: boolean }>,
                        { visible },
                    )
                    : child,
            )}
        </motion.div>
    );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(16px)" : "blur(0px)",
                backgroundColor: visible ? "rgba(0, 0, 0, 0.85)" : "transparent",
                borderColor: visible ? "rgba(110, 219, 128, 0.2)" : "transparent",
                width: visible ? "90%" : "100%",
                y: visible ? 12 : 0,
            }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 50,
            }}
            className={cn(
                "relative z-120 mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-2xl border px-6 py-3 lg:flex",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <motion.div
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "relative hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium lg:flex",
                className,
            )}
        >
            {items.map((item, idx) => (
                <button
                    onMouseEnter={() => setHovered(idx)}
                    onClick={() => {
                        item.onClick?.();
                        onItemClick?.();
                        const targetId = item.link.startsWith("#") ? item.link.slice(1) : item.link;
                        const el = document.getElementById(targetId);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="relative px-4 py-2 text-zinc-400 hover:text-brand-400 transition-colors cursor-pointer pointer-events-auto"
                    key={`link-${idx}`}
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            className="absolute inset-0 h-full w-full rounded-lg bg-brand-400/10"
                        />
                    )}
                    <span className="relative z-20 text-xs font-bold uppercase tracking-[0.15em]">{item.name}</span>
                </button>
            ))}
        </motion.div>
    );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(16px)" : "blur(0px)",
                backgroundColor: visible ? "rgba(0, 0, 0, 0.9)" : "transparent",
                width: visible ? "95%" : "100%",
                borderRadius: visible ? "16px" : "0px",
                y: visible ? 12 : 0,
            }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 50,
            }}
            className={cn(
                "relative z-50 mx-auto flex w-full flex-col items-center justify-between border border-transparent px-4 py-3 lg:hidden",
                visible && "border-brand-400/20",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const MobileNavHeader = ({
    children,
    className,
}: MobileNavHeaderProps) => {
    return (
        <div
            className={cn(
                "flex w-full flex-row items-center justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const MobileNavMenu = ({
    children,
    className,
    isOpen,
    onClose: _onClose,
}: MobileNavMenuProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                        "absolute inset-x-0 top-full z-50 mt-2 flex w-full flex-col items-start justify-start gap-4 rounded-2xl bg-black/95 backdrop-blur-xl border border-brand-400/20 px-6 py-8",
                        className,
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const MobileNavToggle = ({
    isOpen,
    onClickAction,
}: {
    isOpen: boolean;
    onClickAction: () => void;
}) => {
    return isOpen ? (
        <IconX className="h-6 w-6 text-brand-400 cursor-pointer" onClick={onClickAction} />
    ) : (
        <IconMenu2 className="h-6 w-6 text-brand-400 cursor-pointer" onClick={onClickAction} />
    );
};

export const NavbarLogo = ({ onClickAction }: { onClickAction?: () => void }) => {
    return (
        <button
            onClick={onClickAction}
            className="relative z-20 flex items-center gap-3 cursor-pointer group"
        >
            <div className="relative">
                <img
                    src="/logo.svg"
                    alt="GradeU"
                    className="relative h-12 w-12 group-hover:scale-110 transition-transform duration-300"
                />
            </div>
            <span className="font-black text-white text-2xl tracking-tighter uppercase hidden sm:block font-sans">
                Grade<span className="text-brand-400">U</span>
            </span>
        </button>
    );
};

export const NavbarButton = ({
    href,
    children,
    className,
    variant = "primary",
    onClickAction,
}: {
    href?: string;
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "outline";
    onClickAction?: () => void;
}) => {
    const baseStyles =
        "px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer transition-all duration-200";

    const variantStyles = {
        primary:
            "bg-brand-400 text-black hover:bg-brand-500 hover:scale-105",
        secondary: "bg-transparent text-zinc-400 hover:text-brand-400",
        outline: "bg-transparent border border-brand-400/30 text-brand-400 hover:bg-brand-400/10 hover:border-brand-400",
    };

    if (href) {
        return (
            <a
                href={href}
                className={cn(baseStyles, variantStyles[variant], className)}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onClickAction}
            className={cn(baseStyles, variantStyles[variant], className)}
        >
            {children}
        </button>
    );
};
