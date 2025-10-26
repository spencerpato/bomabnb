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
import { MapPin, Users, Home, Phone, Mail, MessageCircle, Calendar, X, User, Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";

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
  partners?: {
    business_name: string;
    show_contacts_publicly: boolean;
    user_id: string;
  };
}

interface PartnerContact {
  full_name: string;
  phone_number?: string;
  whatsapp_number?: string;
  business_name?: string;
  show_contacts_publicly: boolean;
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [partnerContact, setPartnerContact] = useState<PartnerContact | null>(null);
  const [ownerContactForBooking, setOwnerContactForBooking] = useState<{name: string; whatsapp: string} | null>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
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
        .select(`
          *,
          partners (
            business_name,
            show_contacts_publicly,
            user_id
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Always fetch partner contact info for booking WhatsApp functionality
      if (propertyData.partners?.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, phone_number, whatsapp_number")
          .eq("id", propertyData.partners.user_id)
          .single();

        if (profileData) {
          // Set owner contact for booking (always available)
          const whatsappNumber = (profileData as any).whatsapp_number || profileData.phone_number || propertyData.contact_phone || "";
          const ownerName = profileData.full_name || propertyData.partners.business_name || "there";
          
          setOwnerContactForBooking({
            name: ownerName,
            whatsapp: whatsappNumber
          });

          // Set public contact only if publicly visible
          if (propertyData.partners.show_contacts_publicly) {
            setPartnerContact({
              full_name: profileData.full_name,
              phone_number: profileData.phone_number,
              whatsapp_number: (profileData as any).whatsapp_number,
              business_name: propertyData.partners.business_name,
              show_contacts_publicly: propertyData.partners.show_contacts_publicly,
            });
          }
        }
      }

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

  const handleNotifyOwner = () => {
    if (!property || !ownerContactForBooking) return;
    
    const ownerName = ownerContactForBooking.name;
    const ownerWhatsApp = ownerContactForBooking.whatsapp.replace(/\D/g, "");
    const propertyName = property.property_name;
    
    const message = `Hello ${ownerName}, I just booked your property (${propertyName}) on BomaBnB. Looking forward to my stay!`;
    
    if (ownerWhatsApp) {
      window.open(
        `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    } else {
      toast.error("Owner WhatsApp number not available");
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property) return;

    try {
      // First, get the partner ID for this property
      const { data: propertyData } = await supabase
        .from("properties")
        .select("partner_id")
        .eq("id", property.id)
        .single();

      if (!propertyData) {
        throw new Error("Property not found");
      }

      // Insert the booking
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

      // Create notification for the partner
      const totalPrice = property.price_per_night * calculateNights();
      const nights = calculateNights();
      
      await supabase
        .from("partner_notifications")
        .insert({
          partner_id: propertyData.partner_id,
          type: "new_booking",
          title: "🎉 New Booking Request",
          message: `You have a new booking request for "${property.property_name}"!\n\nGuest: ${bookingForm.name}\nEmail: ${bookingForm.email}\nPhone: ${bookingForm.phone}\nCheck-in: ${bookingForm.checkIn}\nCheck-out: ${bookingForm.checkOut}\nGuests: ${bookingForm.guests}\nNights: ${nights}\nTotal: KES ${totalPrice.toLocaleString()}\n\nPlease respond to the guest as soon as possible.`,
          status: "unread",
          property_id: property.id
        });

      setShowBookingSuccess(true);
      toast.success("✅ Booking submitted successfully! You can also notify the host directly via WhatsApp.", {
        duration: 5000
      });
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
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 px-4 py-8">
          <div className="container mx-auto max-w-6xl">
            <div className="h-10 w-20 bg-muted rounded mb-6 animate-pulse"></div>
            {/* Image Skeleton */}
            <div className="aspect-[16/9] bg-muted rounded-2xl mb-8 animate-pulse"></div>
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-32 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            ← Back
          </Button>

          {/* Image Gallery */}
          <div className="mb-8 space-y-4">
            {/* Featured Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <img 
                src={property.featured_image} 
                alt={property.property_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
                }}
              />
            </div>

            {/* Gallery Images Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-video overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => setSelectedImage(img.image_url)}
                  >
                    <img 
                      src={img.image_url} 
                      alt={`${property.property_name} - Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <p className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Click to enlarge</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Image Lightbox */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
              <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  {selectedImage && (
                    <img 
                      src={selectedImage} 
                      alt="Gallery view"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
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

              {/* Ratings & Reviews Section */}
              <div className="border-t pt-8 mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="font-heading font-bold text-2xl sm:text-3xl">Ratings & Reviews</h2>
                  <Button 
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="w-full sm:w-auto"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {showReviewForm ? "Cancel" : "Leave a Review"}
                  </Button>
                </div>

                {/* Rating Summary */}
                <div className="mb-8">
                  <RatingSummary propertyId={id!} />
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <Card className="mb-8">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-4">Share Your Experience</h3>
                      <ReviewForm
                        propertyId={id!}
                        onSuccess={() => {
                          setShowReviewForm(false);
                          toast.success("Thank you for your review!");
                        }}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Recent Reviews</h3>
                  <ReviewList propertyId={id!} />
                </div>
              </div>
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

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => setShowBookingSuccess(false)}
                      >
                        Request Booking
                      </Button>
                      
                      {showBookingSuccess && ownerContactForBooking && ownerContactForBooking.whatsapp && (
                        <Button
                          onClick={handleNotifyOwner}
                          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white mt-3"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Send to WhatsApp
                        </Button>
                      )}
                    </form>
                  </div>

                  {/* Contact Owner Section */}
                  {partnerContact && partnerContact.show_contacts_publicly && (
                    <div className="border-t pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg">Property Owner</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Owner Name */}
                        <div>
                          <p className="text-sm text-muted-foreground">Hosted by</p>
                          <p className="font-semibold text-lg">{partnerContact.full_name}</p>
                          {partnerContact.business_name && (
                            <p className="text-sm text-muted-foreground">{partnerContact.business_name}</p>
                          )}
                        </div>

                        {/* Contact Buttons */}
                        {(partnerContact.phone_number || partnerContact.whatsapp_number) && (
                          <div className="space-y-2">
                            <Label className="text-sm">Contact</Label>
                            <div className="flex gap-2">
                              {/* WhatsApp button - uses whatsapp_number if available, otherwise phone_number */}
                              {(partnerContact.whatsapp_number || partnerContact.phone_number) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="flex-1 hover:bg-green-50 hover:border-green-500"
                                >
                                  <a href={`https://wa.me/${(partnerContact.whatsapp_number || partnerContact.phone_number)?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                    WhatsApp
                                  </a>
                                </Button>
                              )}
                              {/* Call button - uses phone_number */}
                              {partnerContact.phone_number && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="flex-1"
                                >
                                  <a href={`tel:${partnerContact.phone_number}`}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call
                                  </a>
                                </Button>
                              )}
                            </div>
                            {/* Show both numbers if different */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              {partnerContact.phone_number && (
                                <p>Phone: {partnerContact.phone_number}</p>
                              )}
                              {partnerContact.whatsapp_number && partnerContact.whatsapp_number !== partnerContact.phone_number && (
                                <p>WhatsApp: {partnerContact.whatsapp_number}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
