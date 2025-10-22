import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  property: {
    id: string;
    property_name: string;
    location: string;
    price_per_night: number;
    max_guests_per_unit: number;
    featured_image: string;
    amenities?: string[];
  };
  onViewDetails?: (id: string) => void;
}

export const PropertyCard = ({ property, onViewDetails }: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.featured_image}
          alt={property.property_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold shadow-lg">
          KES {property.price_per_night.toLocaleString()}/night
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="font-heading font-bold text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
          {property.property_name}
        </h3>

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
