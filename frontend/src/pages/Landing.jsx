import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Utensils, HeartHandshake, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-32 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 z-0 opacity-10">
            {/* Using declared AI image */}
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Warm abstract background"
              className="w-full h-full object-cover" />
            
          </div>
          
          {/* Decorative blurs */}
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-sm font-medium">Connecting surplus food to those in need</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                  Share food. <br />
                  <span className="text-gradient">End hunger.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                  A smart platform connecting restaurants, event organizers, and individuals with verified NGOs to seamlessly distribute surplus food before it goes to waste.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="rounded-full w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white shadow-[var(--shadow-hover)] hover:-translate-y-1 transition-all">
                      Join as Donator <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/register?role=ngo">
                    <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto text-lg h-14 px-8 border-2 border-primary/20 text-primary hover:bg-primary/5 hover:-translate-y-1 transition-all">
                      Register NGO
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
              <p className="mt-4 text-muted-foreground text-lg">Three simple steps to make a difference</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
              {
                icon: <Utensils className="h-8 w-8 text-secondary" />,
                title: "1. Post Surplus Food",
                desc: "Have extra food from an event or restaurant? Quickly post details, quantity, and pickup location."
              },
              {
                icon: <MapPin className="h-8 w-8 text-primary" />,
                title: "2. Nearby Match",
                desc: "Our system instantly notifies verified NGOs within a 10km radius about your available donation."
              },
              {
                icon: <HeartHandshake className="h-8 w-8 text-secondary" />,
                title: "3. Claim & Pickup",
                desc: "An NGO claims the food to prevent double-booking, and picks it up to serve those in need."
              }].
              map((feature, i) =>
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-background rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-[var(--shadow-hover)] transition-all text-center group">
                
                  <div className="mx-auto w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-foreground py-12 text-center text-primary-foreground/60">
        <div className="flex justify-center mb-6">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
            alt="ShareBite Logo"
            className="w-12 h-12 opacity-50" />
          
        </div>
        <p>© 2025 ShareBite Platform. Created for a better world.</p>
      </footer>
    </div>);

}