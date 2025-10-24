import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "./reviews/StarRating";

interface PropertyCardProps {
  property: {
    id: string;
    property_name: string;
    location: string;
    price_per_night: number;
    max_guests_per_unit: number;
    featured_image: string;
    amenities?: string[];
    is_featured?: boolean;
  };
  onViewDetails?: (id: string) => void;
}

export const PropertyCard = ({ property, onViewDetails }: PropertyCardProps) => {
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase.rpc('get_property_rating', {
          p_property_id: property.id
        });
        
        if (!error && data) {
          setRating({ average: data.average_rating || 0, count: data.total_reviews || 0 });
        } else {
          const { data: reviews } = await supabase
            .from('property_reviews' as any)
            .select('rating')
            .eq('property_id', property.id)
            .eq('is_approved', true);
          
          if (reviews && reviews.length > 0) {
            const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
            setRating({ average: avg, count: reviews.length });
          }
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };

    fetchRating();
  }, [property.id]);

  return (
    <Card className={`overflow-hidden transition-all duration-300 group ${
      property.is_featured 
        ? 'border-2 border-yellow-400 hover:shadow-2xl hover:shadow-yellow-200/50 hover:scale-105' 
        : 'hover:shadow-lg'
    }`}>
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden bg-muted">
        <img
          src={property.featured_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
          alt={property.property_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
          }}
        />
        {/* Featured Badge - Responsive */}
        {property.is_featured && (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm animate-pulse">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-white" />
            <span className="hidden sm:inline">FEATURED</span>
            <span className="sm:hidden">⭐</span>
          </div>
        )}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-primary text-primary-foreground px-2 sm:px-3 py-1 rounded-full font-bold shadow-lg text-xs sm:text-sm">
          <span className="hidden sm:inline">KES {property.price_per_night.toLocaleString()}/night</span>
          <span className="sm:hidden">KES {property.price_per_night.toLocaleString()}</span>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {property.property_name}
        </h3>

        {rating && rating.count > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={rating.average} size="sm" showNumber />
            <span className="text-xs text-muted-foreground">({rating.count})</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-sm">{property.location}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Users className="h-4 w-4 text-secondary" />
          <span className="text-sm">Up to {property.max_guests_per_unit} guests</span>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button 
          onClick={() => onViewDetails?.(property.id)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
