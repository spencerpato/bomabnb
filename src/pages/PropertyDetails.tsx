import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Users, Home, Phone, Mail, MessageCircle, Calendar } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Property {
  id: string;
  property_name: string;
  location: string;
  description: string;
  price_per_night: number;
  max_guests_per_unit: number;
  number_of_units: number;
  property_type: string;
  amenities: string[];
  featured_image: string;
  contact_email?: string;
  contact_phone?: string;
  google_maps_link?: string;
  terms_policies?: string;
}

interface PropertyImage {
  image_url: string;
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setIsLoading(true);
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      const { data: imagesData } = await supabase
        .from("property_images")
        .select("image_url")
        .eq("property_id", id)
        .order("display_order", { ascending: true });

      setImages(imagesData || []);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Property not found");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property) return;

    try {
      const { error } = await supabase.from("bookings").insert({
        property_id: property.id,
        guest_name: bookingForm.name,
        guest_email: bookingForm.email,
        guest_phone: bookingForm.phone,
        check_in: bookingForm.checkIn,
        check_out: bookingForm.checkOut,
        number_of_guests: bookingForm.guests,
        total_price: property.price_per_night * calculateNights(),
        status: "pending",
      });

      if (error) throw error;

      const message = `New Booking Request!\n\nProperty: ${property.property_name}\nGuest: ${bookingForm.name}\nEmail: ${bookingForm.email}\nPhone: ${bookingForm.phone}\nCheck-in: ${bookingForm.checkIn}\nCheck-out: ${bookingForm.checkOut}\nGuests: ${bookingForm.guests}\nTotal: KES ${(property.price_per_night * calculateNights()).toLocaleString()}`;

      if (property.contact_phone) {
        window.open(`https://wa.me/${property.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
      }

      toast.success("Booking request sent successfully!");
      setBookingForm({ name: "", email: "", phone: "", checkIn: "", checkOut: "", guests: 1 });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking");
    }
  };

  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const start = new Date(bookingForm.checkIn);
    const end = new Date(bookingForm.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const allImages = [property.featured_image, ...images.map((img) => img.image_url)];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            ← Back
          </Button>

          {/* Image Gallery */}
          <div className="mb-8">
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                      <img src={url} alt={`${property.property_name} - Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">{property.property_name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                  <span>{property.location}</span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {property.property_type}
                </Badge>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Units</p>
                        <p className="font-semibold">{property.number_of_units}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Guests/Unit</p>
                        <p className="font-semibold">{property.max_guests_per_unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">KES {property.price_per_night.toLocaleString()}/night</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="font-heading font-bold text-2xl mb-3">About This Property</h2>
                <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="font-heading font-bold text-2xl mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {property.terms_policies && (
                <div>
                  <h2 className="font-heading font-bold text-2xl mb-3">Terms & Policies</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{property.terms_policies}</p>
                </div>
              )}

              {property.google_maps_link && (
                <div>
                  <h2 className="font-heading font-bold text-2xl mb-3">Location</h2>
                  <Button asChild variant="outline">
                    <a href={property.google_maps_link} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Google Maps
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Booking Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-heading font-bold text-xl mb-4">Book This Property</h3>
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkIn">Check-in</Label>
                        <Input
                          id="checkIn"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={bookingForm.checkIn}
                          onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkOut">Check-out</Label>
                        <Input
                          id="checkOut"
                          type="date"
                          min={bookingForm.checkIn || new Date().toISOString().split("T")[0]}
                          value={bookingForm.checkOut}
                          onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          max={property.max_guests_per_unit}
                          value={bookingForm.guests}
                          onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) })}
                          required
                        />
                      </div>

                      {bookingForm.checkIn && bookingForm.checkOut && (
                        <div className="pt-4 border-t">
                          <div className="flex justify-between mb-2">
                            <span>KES {property.price_per_night.toLocaleString()} × {calculateNights()} nights</span>
                            <span className="font-semibold">KES {(property.price_per_night * calculateNights()).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                        Request Booking
                      </Button>
                    </form>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">Contact Owner</h4>
                    <div className="flex gap-3">
                      {property.contact_phone && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            asChild
                            className="hover:bg-green-50 hover:border-green-500"
                          >
                            <a href={`https://wa.me/${property.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-5 w-5 text-green-600" />
                            </a>
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            asChild
                          >
                            <a href={`tel:${property.contact_phone}`}>
                              <Phone className="h-5 w-5" />
                            </a>
                          </Button>
                        </>
                      )}
                      {property.contact_email && (
                        <Button
                          size="icon"
                          variant="outline"
                          asChild
                        >
                          <a href={`mailto:${property.contact_email}`}>
                            <Mail className="h-5 w-5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyDetails;
