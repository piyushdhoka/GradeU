"use client";

import { AnimatedTooltip } from "@/shared/components/ui/animated-tooltip";

const people = [
    {
        id: 1,
        name: "Piyush Dhoka",
        designation: "Founder",
        image: "/founders/piyush.png",
        url: "https://piyush.sparkstudio.co.in"
    },
    {
        id: 2,
        name: "Aadarsh Pathre",
        designation: "Founder",
        image: "/founders/aadarsh.png",
        url: "https://aadarsh.sparkstudio.co.in"
    },
    {
        id: 3,
        name: "Varun Inamdar",
        designation: "Founder",
        image: "/founders/varun.png",
        url: "https://varun.sparkstudio.co.in"
    },
    {
        id: 4,
        name: "Vedant Pandhare",
        designation: "Founder",
        image: "/founders/vedant.png",
        url: "https://www.linkedin.com/in/vedant-pandhare"
    },
];

export default function FoundersTooltip() {
    return (
        <div className="flex flex-row items-center justify-center w-full">
            <AnimatedTooltip items={people} />
        </div>
    );
}
