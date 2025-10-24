import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Heart, Users, Shield, MapPin } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="font-heading font-bold text-5xl mb-6 text-foreground">
              About BomaBnB
            </h1>
            <p className="text-xl text-muted-foreground">
              Connecting travelers with authentic Kenyan hospitality
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                BomaBnB is Kenya's premier platform for discovering and booking locally-owned accommodations. 
                We believe that every traveler deserves an authentic experience, and every property owner 
                deserves a platform to showcase their hospitality.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From the bustling streets of Nairobi to the serene beaches of Mombasa, from the wildlife 
                sanctuaries of Maasai Mara to the vibrant culture of Kisumu, we're building a network of 
                trusted homestays that make Kenya feel like home.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="font-heading font-bold text-3xl text-center mb-12">
              Our Core Values
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Authenticity</h3>
                <p className="text-muted-foreground">
                  Real homes, real hosts, real Kenyan hospitality
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Trust</h3>
                <p className="text-muted-foreground">
                  Every property is verified and approved
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Community</h3>
                <p className="text-muted-foreground">
                  Supporting local entrepreneurs and communities
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Discovery</h3>
                <p className="text-muted-foreground">
                  Uncovering hidden gems across Kenya
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-heading font-bold text-3xl mb-6">
              Join the BomaBnB Community
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether you're a traveler seeking authentic experiences or a property owner wanting 
              to share your space, BomaBnB is here to make meaningful connections happen.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
