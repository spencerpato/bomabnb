import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, DollarSign, Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Property {
  id: string;
  property_name: string;
  location: string;
  price_per_night: number;
  max_guests_per_unit: number;
  number_of_units?: number;
  featured_image: string;
  amenities: string[];
  is_featured?: boolean;
  feature_start_date?: string;
  feature_end_date?: string;
  last_featured_display?: string;
  partner_id?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured properties separately with rotation logic
      const { data: featuredData, error: featuredError } = await supabase
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("last_featured_display", { ascending: true, nullsFirst: true })
        .limit(5);

      // Fetch all regular properties
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Log fetched properties to check guest numbers
      console.log("Fetched properties:", data?.slice(0, 3).map(p => ({
        name: p.property_name,
        max_guests_per_unit: p.max_guests_per_unit,
        number_of_units: p.number_of_units
      })));
      
      // Log featured rotation
      if (featuredData && featuredData.length > 0) {
        console.log("Featured properties rotation:", featuredData.map(p => ({
          name: p.property_name,
          last_displayed: p.last_featured_display
        })));
        
        // Update last_featured_display for displayed featured properties
        const featuredIds = featuredData.map(p => p.id);
        await supabase
          .from("properties")
          .update({ last_featured_display: new Date().toISOString() })
          .in("id", featuredIds);
        
        console.log("Updated featured display timestamps for fair rotation");
      }
      
      // Check and update expired featured properties (only if feature dates exist)
      const now = new Date().toISOString();
      const expiredProperties = (data || []).filter(
        (p) => p.is_featured && p.feature_end_date && new Date(p.feature_end_date) < new Date(now)
      );

      if (expiredProperties.length > 0) {
        const expiredIds = expiredProperties.map((p) => p.id);
        await supabase
          .from("properties")
          .update({ is_featured: false })
          .in("id", expiredIds);

        // Send expiration notifications for expired properties
        for (const property of expiredProperties) {
          try {
            // Get partner info
            const { data: partnerData } = await supabase
              .from("partners")
              .select("id")
              .eq("id", property.partner_id)
              .single();

            if (partnerData) {
              await supabase
                .from("partner_notifications")
                .insert({
                  partner_id: partnerData.id,
                  type: "feature_expired",
                  title: "⭐ Featured Property Expired",
                  message: `Your featured property "${property.property_name}" has expired. It's no longer featured but remains active in regular listings. You can request to feature it again anytime.`,
                  status: "unread",
                  property_id: property.id
                });
            }
          } catch (error) {
            console.error("Error sending expiration notification:", error);
          }
        }
      }

      // Check for properties expiring soon (within 3 days) and send notifications
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const expiringSoon = (data || []).filter(
        (p) => 
          p.is_featured && 
          p.feature_end_date && 
          new Date(p.feature_end_date) <= new Date(threeDaysFromNow.toISOString()) &&
          new Date(p.feature_end_date) > new Date(now)
      );

      // Send expiration warnings for properties expiring soon
      for (const property of expiringSoon) {
        try {
          // Get partner info
          const { data: partnerData } = await supabase
            .from("partners")
            .select("id")
            .eq("id", property.partner_id)
            .single();

          if (partnerData) {
            // Check if we already sent a notification for this property
            const { data: existingNotification } = await supabase
              .from("partner_notifications")
              .select("id")
              .eq("partner_id", partnerData.id)
              .eq("type", "feature_expiring")
              .eq("property_id", property.id)
              .single();

            if (!existingNotification) {
              const daysLeft = Math.ceil((new Date(property.feature_end_date).getTime() - new Date(now).getTime()) / (1000 * 60 * 60 * 24));
              
              await supabase
                .from("partner_notifications")
                .insert({
                  partner_id: partnerData.id,
                  type: "feature_expiring",
                  title: "⭐ Featured Property Expiring Soon",
                  message: `Your featured property "${property.property_name}" will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Consider extending the feature period to maintain visibility.`,
                  status: "unread",
                  property_id: property.id
                });
            }
          }
        } catch (error) {
          console.error("Error sending expiration notification:", error);
        }
      }

      // Filter out expired properties
      const validData = (data || []).map((p) => {
        if (p.is_featured && p.feature_end_date && new Date(p.feature_end_date) < new Date(now)) {
          return { ...p, is_featured: false };
        }
        return p;
      });

      // Sort to prioritize featured properties
      const sortedData = validData.sort((a, b) => {
        const aFeatured = a.is_featured || false;
        const bFeatured = b.is_featured || false;
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
        return 0;
      });
      
      setProperties(sortedData);
      setFilteredProperties(sortedData);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchLocation, minPrice, maxPrice]);

  const handleSearch = () => {
    let filtered = [...properties];

    // Filter by search term
    if (searchLocation.trim()) {
      const search = searchLocation.toLowerCase();
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(search) ||
        p.property_name.toLowerCase().includes(search) ||
        p.amenities.some((a) => a.toLowerCase().includes(search))
      );
    }

    // Filter by price range
    if (minPrice) {
      filtered = filtered.filter((p) => p.price_per_night >= parseInt(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => p.price_per_night <= parseInt(maxPrice));
    }

    // Ensure featured properties appear first (if field exists)
    filtered.sort((a, b) => {
      const aFeatured = a.is_featured || false;
      const bFeatured = b.is_featured || false;
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });

    setFilteredProperties(filtered);
  };

  const clearFilters = () => {
    setSearchLocation("");
    setMinPrice("");
    setMaxPrice("");
    setFilteredProperties(properties);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/property/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Carousel Section - Responsive */}
      <section className="px-2 sm:px-4 pt-4 sm:pt-8">
        <div className="container mx-auto">
          <HeroCarousel />
          
          {/* Tagline below carousel */}
          <div className="text-center mt-6 md:mt-8 px-4">
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Explore verified Kenyan Airbnbs hosted by locals — comfort meets culture.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section - Responsive */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  data-testid="input-search"
                  placeholder="Search by location, name, or price range..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10 h-12 sm:h-14 text-sm sm:text-base border-border bg-background rounded-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
                {(searchLocation || minPrice || maxPrice) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                    Clear All
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice" className="text-sm sm:text-base">Min Price (KES/night)</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      placeholder="e.g. 1000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="bg-background h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice" className="text-sm sm:text-base">Max Price (KES/night)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="e.g. 10000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="bg-background h-10 sm:h-11"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties - Auto-Rotating Carousel */}
      {(() => {
        const featuredProperties = filteredProperties.filter(p => p.is_featured);
        return featuredProperties.length > 0 ? (
          <section className="py-8 px-3 md:px-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 fill-current" />
                  <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">
                    Featured Properties 🌟
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Rotates every 8 seconds
                </p>
              </div>
              
              <FeaturedCarousel autoRotateInterval={8000}>
                {featuredProperties.map((property) => (
                  <div key={property.id} className="flex-shrink-0 w-[260px] md:w-[300px]">
                    <PropertyCard
                      property={property}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                ))}
              </FeaturedCarousel>
            </div>
          </section>
        ) : null;
      })()}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {properties.length === 0 ? "No properties found. Check back soon!" : "No properties match your filters. Try adjusting your search."}
          </p>
          {properties.length > 0 && (
            <Button onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Single Unit Homes - Horizontal Scroll */}
          {(() => {
            const singleUnitProperties = filteredProperties.filter(p => {
              const units = p.number_of_units || 1;
              return units === 1;
            });
            return singleUnitProperties.length > 0 ? (
              <section className="py-6 px-3 md:px-4">
                <div className="container mx-auto max-w-7xl">
                  <h2 className="font-heading font-bold text-xl md:text-2xl mb-4 px-2">🏠 Single Unit Homes</h2>
                  
                  <div className="overflow-x-auto scrollbar-hide pb-4">
                    <div className="flex gap-4 px-2" style={{ minWidth: 'min-content' }}>
                      {singleUnitProperties.slice(0, 12).map((property) => (
                        <div key={property.id} className="flex-shrink-0 w-[260px] md:w-[300px]">
                          <PropertyCard
                            property={property}
                            onViewDetails={handleViewDetails}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null;
          })()}

          {/* Two-Unit Homes - Horizontal Scroll */}
          {(() => {
            const twoUnitProperties = filteredProperties.filter(p => {
              const units = p.number_of_units || 0;
              return units === 2;
            });
            return twoUnitProperties.length > 0 ? (
              <section className="py-6 px-3 md:px-4 bg-muted/20">
                <div className="container mx-auto max-w-7xl">
                  <h2 className="font-heading font-bold text-xl md:text-2xl mb-4 px-2">🏘️ Two-Unit Homes</h2>
                  
                  <div className="overflow-x-auto scrollbar-hide pb-4">
                    <div className="flex gap-4 px-2" style={{ minWidth: 'min-content' }}>
                      {twoUnitProperties.slice(0, 12).map((property) => (
                        <div key={property.id} className="flex-shrink-0 w-[260px] md:w-[300px]">
                          <PropertyCard
                            property={property}
                            onViewDetails={handleViewDetails}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null;
          })()}

          {/* Other Listings - Horizontal Scroll */}
          {(() => {
            const otherProperties = filteredProperties.filter(p => {
              const units = p.number_of_units || 0;
              return units >= 3 || units === 0;
            });
            return otherProperties.length > 0 ? (
              <section className="py-6 px-3 md:px-4">
                <div className="container mx-auto max-w-7xl">
                  <h2 className="font-heading font-bold text-xl md:text-2xl mb-4 px-2">🌆 More Options</h2>
                  
                  <div className="overflow-x-auto scrollbar-hide pb-4">
                    <div className="flex gap-4 px-2" style={{ minWidth: 'min-content' }}>
                      {otherProperties.slice(0, 12).map((property) => (
                        <div key={property.id} className="flex-shrink-0 w-[260px] md:w-[300px]">
                          <PropertyCard
                            property={property}
                            onViewDetails={handleViewDetails}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null;
          })()}
        </>
      )}

      {/* Why Choose BomaBnB Section - Responsive */}
      <section className="py-12 sm:py-16 px-2 sm:px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 text-foreground">
              Why Choose BomaBnB?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-3">Verified Properties</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Every listing is carefully verified for quality and authenticity
              </p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-3">Local Experience</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Stay with local hosts and experience authentic Kenyan hospitality
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
              </div>
              <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-3">Best Prices</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
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
