"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

interface Review {
  id: string;
  product: string;
  rating: number;
  author: string;
  comment: string;
  postedAt: string;
}

const FALLBACK: Review[] = [
  {
    id: "1",
    product: "Admin System",
    rating: 5,
    author: "xDevRoblox",
    comment: "Bought an admin system for my RPG and it worked right out of the box. The developer answered my questions within hours.",
    postedAt: new Date().toISOString(),
  },
  {
    id: "2",
    product: "GUI Kit",
    rating: 5,
    author: "CelestialStudio",
    comment: "The GUI kit saved me weeks of work. Clean code, well documented. Re-downloaded it three times across different projects.",
    postedAt: new Date().toISOString(),
  },
  {
    id: "3",
    product: "Anime Tower Defense Map",
    rating: 5,
    author: "PixelForge_RBX",
    comment: "Good looking map, and this is also for the Loading Screen V2 which looks great and functions great with some tweaks.",
    postedAt: new Date().toISOString(),
  },
  {
    id: "4",
    product: "Main Menu System",
    rating: 4,
    author: "golden bacon",
    comment: "It's fantastic, I really mean it. A tip maybe: lower systems from 500 to like 300 or 350.",
    postedAt: new Date().toISOString(),
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "fill-[#fbbf24] text-[#fbbf24]" : "text-background/20"}`}
        />
      ))}
    </span>
  );
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [live, setLive] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch live reviews
  useEffect(() => {
    fetch("/api/reviews/discord")
      .then(r => r.json())
      .then((data: Review[]) => {
        if (Array.isArray(data) && data.length >= 2) {
          setReviews(data)
          setLive(true)
          setActiveIndex(0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % reviews.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const goPrev = () => setActiveIndex(prev => (prev - 1 + reviews.length) % reviews.length);
  const goNext = () => setActiveIndex(prev => (prev + 1) % reviews.length);

  const active = reviews[activeIndex] ?? reviews[0];
  if (!active) return null;

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-32 lg:py-40 bg-foreground text-background overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 font-mono text-[10px] text-background/[0.02] leading-tight overflow-hidden whitespace-pre select-none">
        {Array.from({ length: 60 }, () =>
          Array.from({ length: 100 }, () =>
            Math.random() > 0.7 ? '"' : ' '
          ).join("")
        ).join("\n")}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-4">
              <span className="w-12 h-px bg-background/20" />
              {live ? "Live from Discord · #reviews" : "Reviews"}
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              Trusted by developers
              <span className="text-background/40"> everywhere.</span>
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button onClick={goPrev} className="p-4 border border-background/20 hover:bg-background/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} className="p-4 border border-background/20 hover:bg-background/10 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Quote */}
          <div className="lg:col-span-7 relative">
            <span className="absolute -left-4 -top-8 text-[200px] font-display text-background/5 leading-none select-none">&ldquo;</span>

            <div className="relative">
              <div className="mb-6">
                <StarRow rating={active.rating} />
              </div>

              <blockquote
                key={active.id}
                className="text-2xl lg:text-3xl xl:text-4xl font-display leading-[1.3] tracking-tight animate-fadeSlideIn"
              >
                {active.comment || `Great product — ${active.product}`}
              </blockquote>

              <div className="mt-10 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center">
                  <span className="font-display text-xl">{active.author.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-lg font-medium">{active.author}</p>
                  <p className="text-background/60 text-sm font-mono">
                    {active.product}
                    {live && (
                      <span className="ml-2 text-background/30">
                        · {new Date(active.postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-6">
            {/* Active metric */}
            <div key={`metric-${activeIndex}`} className="p-10 border border-background/20 bg-background/5 animate-fadeSlideIn">
              <div className="flex gap-1 mb-4">
                <StarRow rating={active.rating} />
              </div>
              <span className="text-7xl lg:text-8xl font-display block mb-2">
                {active.rating}/5
              </span>
              <span className="text-lg text-background/60">{active.product}</span>
            </div>

            {/* Progress */}
            <div className="flex gap-2">
              {reviews.map((_, idx) => (
                <button key={idx} onClick={() => setActiveIndex(idx)} className="flex-1 h-1 bg-background/20 overflow-hidden">
                  <div
                    className={`h-full bg-background transition-all duration-300 ${
                      idx === activeIndex ? "w-full" : idx < activeIndex ? "w-full opacity-50" : "w-0"
                    }`}
                    style={idx === activeIndex ? { animation: "progress 7s linear forwards" } : {}}
                  />
                </button>
              ))}
            </div>

            {/* Recent reviewers */}
            <div className="mt-4 pt-6 border-t border-background/10">
              <span className="text-xs font-mono text-background/30 uppercase tracking-widest block mb-4">
                {live ? `${reviews.length} reviews from Discord` : "Recent reviews"}
              </span>
              <div className="flex flex-wrap gap-2">
                {reviews.slice(0, 8).map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`px-3 py-1.5 text-sm border transition-all ${
                      idx === activeIndex
                        ? "border-background/40 text-background"
                        : "border-background/10 text-background/40 hover:border-background/30"
                    }`}
                  >
                    {r.author}
                  </button>
                ))}
                {reviews.length > 8 && (
                  <span className="px-3 py-1.5 text-sm text-background/30">+{reviews.length - 8} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeSlideIn { animation: fadeSlideIn 0.5s ease-out forwards; }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
