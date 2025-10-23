import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { MapPin, DollarSign, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Property {
  id: string;
  property_name: string;
  location: string;
  price_per_night: number;
  max_guests_per_unit: number;
  featured_image: string;
  amenities: string[];
}

const Index = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchLocation]);

  const handleSearch = () => {
    if (searchLocation.trim()) {
      const filtered = properties.filter((p) => {
        const search = searchLocation.toLowerCase();
        return (
          p.location.toLowerCase().includes(search) ||
          p.property_name.toLowerCase().includes(search) ||
          p.amenities.some((a) => a.toLowerCase().includes(search))
        );
      });
      setProperties(filtered);
    } else {
      fetchProperties();
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/property/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-24 px-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-heading font-bold text-5xl md:text-6xl mb-6 text-foreground">
            Your Home Away From Home
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Discover authentic, locally-owned homestays across Kenya
          </p>

          {/* Search Bar */}
          <div className="bg-card p-6 rounded-2xl shadow-lg max-w-3xl mx-auto">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search by location, property name, or amenities..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-10 h-14 text-base border-border bg-background"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl mb-4 text-foreground">
              Featured Properties
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our handpicked selection of verified homestays
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No properties found. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose BomaBnB Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl mb-4 text-foreground">
              Why Choose BomaBnB?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Verified Properties</h3>
              <p className="text-muted-foreground">
                Every listing is carefully verified for quality and authenticity
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Local Experience</h3>
              <p className="text-muted-foreground">
                Stay with local hosts and experience authentic Kenyan hospitality
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Best Prices</h3>
              <p className="text-muted-foreground">
                Competitive rates directly from property owners
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
