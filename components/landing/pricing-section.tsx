"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const paymentMethods = [
  {
    name: "Robux",
    description: "Pay in-game with your Roblox balance",
    price: { label: "R$", sublabel: "your price" },
    features: [
      "Join the in-game Payment Hub",
      "Enter your 6-digit payment code",
      "Transaction verified in seconds",
      "File delivered automatically",
      "No PayPal account needed",
    ],
    cta: "Browse with Robux",
    href: "/store",
    highlight: false,
  },
  {
    name: "PayPal",
    description: "Pay direct — goes straight to the seller",
    price: { label: "$", sublabel: "your price" },
    features: [
      "Send as Friends & Family",
      "Submit your transaction ID",
      "Seller verifies & sends file",
      "0% cut taken by Syck",
      "Instant access to your file",
    ],
    cta: "Browse with PayPal",
    href: "/store",
    highlight: true,
  },
  {
    name: "Sellers",
    description: "List your own scripts and earn",
    price: { label: "Free", sublabel: "to list" },
    features: [
      "Accept Robux, PayPal, or both",
      "Keep 100% of PayPal revenue",
      "Dashboard with sales analytics",
      "Re-download tracking built-in",
      "Discord login for buyers",
      "Upload files directly to your page",
    ],
    cta: "Start selling",
    href: "/dashboard",
    highlight: false,
  },
];

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="payments" ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Payments
            </span>
            <h2 className={`text-4xl sm:text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              Pay your
              <br />
              <span className="text-stroke">way.</span>
            </h2>
          </div>

          <div className="lg:col-span-5 flex items-end pb-2">
            <p className={`text-xl text-muted-foreground leading-relaxed transition-all duration-1000 delay-100 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              Robux in-game or PayPal direct. Both methods are supported on every product that enables them.
            </p>
          </div>
        </div>

        {/* Payment method cards */}
        <div className="relative">
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-0">
            {paymentMethods.map((method, index) => (
              <div
                key={method.name}
                className={`relative bg-background border transition-all duration-700 ${
                  method.highlight
                    ? "border-foreground lg:-mx-2 lg:z-10 lg:scale-105"
                    : "border-foreground/10 lg:first:-mr-2 lg:last:-ml-2"
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Popular badge */}
                {method.highlight && (
                  <div className="absolute -top-4 left-8 right-8 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                      0% platform cut
                    </span>
                  </div>
                )}

                <div className="p-8 lg:p-10">
                  {/* Method header */}
                  <div className="mb-8 pb-8 border-b border-foreground/10">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-display mt-2">{method.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
                  </div>

                  {/* Price display */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl lg:text-6xl font-display">{method.price.label}</span>
                      <span className="text-muted-foreground text-sm">{method.price.sublabel}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-10">
                    {method.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={method.href}
                    className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                      method.highlight
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {method.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className={`mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Discord login required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Staff-verified products
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              5× re-downloads per purchase
            </span>
          </div>
          <a href="/store" className="text-sm underline underline-offset-4 hover:text-foreground transition-colors">
            Browse the store
          </a>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </section>
  );
}
