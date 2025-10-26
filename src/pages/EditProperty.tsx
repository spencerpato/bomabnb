import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface PropertyData {
  property_name: string;
  property_type: string;
  location: string;
  price_per_night: string;
  description: string;
  amenities: string[];
  number_of_units: string;
  max_guests_per_unit: string;
  google_maps_link: string;
  terms_and_policies: string;
}

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyData>({
    property_name: "",
    property_type: "",
    location: "",
    price_per_night: "",
    description: "",
    amenities: [],
    number_of_units: "1",
    max_guests_per_unit: "2",
    google_maps_link: "",
    terms_and_policies: "",
  });

  const amenitiesList = [
    "WiFi",
    "Parking",
    "Swimming Pool",
    "Air Conditioning",
    "Kitchen",
    "TV",
    "Washing Machine",
    "Garden",
    "Balcony",
    "Pet Friendly",
  ];

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          property_name: data.property_name || "",
          property_type: data.property_type || "",
          location: data.location || "",
          price_per_night: data.price_per_night?.toString() || "",
          description: data.description || "",
          amenities: data.amenities || [],
          number_of_units: data.number_of_units?.toString() || "1",
          max_guests_per_unit: data.max_guests_per_unit?.toString() || "2",
          google_maps_link: data.google_maps_link || "",
          terms_and_policies: data.terms_and_policies || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property");
      navigate("/partner-listings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          property_name: formData.property_name,
          property_type: formData.property_type,
          location: formData.location,
          price_per_night: parseFloat(formData.price_per_night),
          description: formData.description || null,
          amenities: formData.amenities,
          number_of_units: parseInt(formData.number_of_units),
          max_guests_per_unit: parseInt(formData.max_guests_per_unit),
          google_maps_link: formData.google_maps_link,
          terms_and_policies: formData.terms_and_policies,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("✅ Property updated successfully!");
      navigate("/partner-listings");
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast.error(error.message || "Failed to update property");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter((a) => a !== amenity)
        : [...formData.amenities, amenity],
    });
  };

  if (isLoading && !formData.property_name) {
    return (
      <PartnerLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading property...</p>
            </CardContent>
          </Card>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/partner-listings")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Properties
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-heading font-bold">Edit Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Property Name *</Label>
                  <Input
                    id="propertyName"
                    value={formData.property_name}
                    onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Cottage">Cottage</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="Bungalow">Bungalow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price per Night (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Number of Units *</Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    value={formData.number_of_units}
                    onChange={(e) => setFormData({ ...formData, number_of_units: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGuests">Max Guests per Unit *</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    min="1"
                    value={formData.max_guests_per_unit}
                    onChange={(e) => setFormData({ ...formData, max_guests_per_unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => handleAmenityToggle(amenity)}
                      />
                      <label htmlFor={amenity} className="text-sm cursor-pointer">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapsLink">Google Maps Link (Optional)</Label>
                <Input
                  id="mapsLink"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formData.google_maps_link}
                  onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Policies (Optional)</Label>
                <Textarea
                  id="terms"
                  rows={4}
                  placeholder="Check-in/out times, cancellation policy, house rules, etc."
                  value={formData.terms_and_policies}
                  onChange={(e) => setFormData({ ...formData, terms_and_policies: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Updating..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Property
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
};

export default EditProperty;
