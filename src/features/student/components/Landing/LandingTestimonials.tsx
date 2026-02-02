import { TestimonialsColumn } from "@components/ui/testimonials-columns";
import { motion } from "motion/react";

const testimonials = [
    {
        text: "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
        image: "/testimonials/kailas.png",
        name: "Kailas Patil",
        role: "Dean - Vishwakarma University",
    },
    {
        text: "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
        image: "/testimonials/pavitha.png",
        name: "Pavitha Nooji",
        role: "Associate Dean - Vishwakarma University",
    },
    {
        text: "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
        image: "/testimonials/sujal.png",
        name: "Sujal Gundlapelli",
        role: "ML Engineer - ARC",
    },
    {
        text: "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
        image: "/testimonials/abhijit.png",
        name: "Abhijit Karji",
        role: "President - ARC",
    },
    {
        text: "The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.",
        image: "/testimonials/samarth.png",
        name: "Samarth Ratnaparkhi",
        role: "Mobile App Developer",
    },
    {
        text: "Security training has never been this engaging. The hands-on labs are exactly what students need.",
        image: "/testimonials/rehan.jpeg",
        name: "Rehan Shaikh",
        role: "Cohesity Team Lead",
    },
    {
        text: "The platform's analytics give us deep insights into student progress. It's an invaluable tool for education.",
        image: "/testimonials/sarthak.jpeg",
        name: "Sarhtak Jadhav",
        role: "NLP Learner",
    },
    {
        text: "Finally, a platform that bridges the gap between theory and practice. Our students are job-ready faster.",
        image: "/testimonials/tanuj.jpeg",
        name: "Tanuj",
        role: "Frontend Developer",
    },
    {
        text: "The UI is slick and the gamification keeps students motivated. Best training platform we've used.",
        image: "/testimonials/lavanya.jpeg",
        name: "Lavanya Salian",
        role: "Cybersecurity Learner",
    },
];


const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


export default function LandingTestimonials() {
    return (
        <section className="bg-[#000000] my-20 relative overflow-hidden">

            <div className="container z-10 mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
                >
                    <div className="flex justify-center">
                        <div className="border border-zinc-700 py-1 px-4 rounded-full text-zinc-300 text-sm font-medium bg-zinc-900/50 backdrop-blur-md">Testimonials</div>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-5 text-white">
                        What our community says
                    </h2>
                    <p className="text-center mt-5 text-zinc-400 text-lg">
                        See how GradeU is transforming the learning experience.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 mt-10 mask-[linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </div>
        </section>
    );
}
