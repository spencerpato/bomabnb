import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Upload, X } from "lucide-react";

const propertyTypes = ["Apartment", "Cottage", "Villa", "Guesthouse", "Hostel", "Bungalow", "Studio"];
const amenitiesList = ["Wi-Fi", "Parking", "Hot Shower", "TV", "Kitchen", "Air Conditioning", "Pool", "Garden", "Security", "Backup Power"];

const AddProperty = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "",
    location: "",
    description: "",
    pricePerNight: "",
    numberOfUnits: "1",
    maxGuestsPerUnit: "",
    amenities: [] as string[],
    googleMapsLink: "",
    termsAndPolicies: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: partnerData, error } = await supabase
        .from("partners")
        .select("id, status")
        .eq("user_id", user.id)
        .single();

      if (error || !partnerData || partnerData.status !== "active") {
        toast.error("Partner account required");
        navigate("/partner-dashboard");
        return;
      }

      setPartnerId(partnerData.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    }
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setFeaturedImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (additionalImages.length + files.length > 10) {
      toast.error("Maximum 10 additional images allowed");
      return;
    }
    setAdditionalImages([...additionalImages, ...files]);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerId) {
      toast.error("Partner account required");
      return;
    }

    if (!featuredImage) {
      toast.error("Please select a featured image");
      return;
    }

    // Validate required numeric fields
    if (!formData.maxGuestsPerUnit || parseInt(formData.maxGuestsPerUnit) < 1) {
      toast.error("Please enter the maximum number of guests per unit");
      return;
    }

    if (!formData.numberOfUnits || parseInt(formData.numberOfUnits) < 1) {
      toast.error("Please enter the number of units");
      return;
    }

    if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) {
      toast.error("Please enter a valid price per night");
      return;
    }

    setIsLoading(true);
    try {
      // Upload featured image to Supabase Storage
      let featuredImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"; // fallback
      
      if (featuredImage) {
        const fileExt = featuredImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        console.log('Uploading image to:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, featuredImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);
          featuredImageUrl = publicUrl;
          console.log('Image uploaded successfully:', publicUrl);
          toast.success("Image uploaded successfully!");
        } else {
          console.error('Upload error:', uploadError);
          toast.error(`Image upload failed: ${uploadError?.message || 'Unknown error'}. Using placeholder.`);
          // Continue with placeholder if upload fails
        }
      }

      // Log the values being saved
      const maxGuestsValue = parseInt(formData.maxGuestsPerUnit);
      const numberOfUnitsValue = parseInt(formData.numberOfUnits);
      
      console.log("Saving property with:", {
        max_guests_per_unit: maxGuestsValue,
        number_of_units: numberOfUnitsValue,
        raw_max_guests: formData.maxGuestsPerUnit,
        raw_units: formData.numberOfUnits
      });

      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .insert({
          partner_id: partnerId,
          property_name: formData.propertyName,
          property_type: formData.propertyType.toLowerCase() as "apartment" | "cottage" | "villa" | "guesthouse" | "hostel" | "other",
          location: formData.location,
          description: formData.description || null,
          price_per_night: parseFloat(formData.pricePerNight),
          number_of_units: numberOfUnitsValue,
          max_guests_per_unit: maxGuestsValue,
          amenities: formData.amenities,
          featured_image: featuredImageUrl,
          google_maps_link: formData.googleMapsLink || null,
          terms_policies: formData.termsAndPolicies || null,
          is_active: true,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Upload additional images if any
      if (additionalImages.length > 0 && propertyData) {
        for (let i = 0; i < additionalImages.length; i++) {
          const file = additionalImages[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `properties/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(filePath);

            await supabase.from("property_images").insert({
              property_id: propertyData.id,
              image_url: publicUrl,
              display_order: i,
            });
          }
        }
      }

      toast.success("Property added successfully!");
      navigate("/partner-dashboard");
    } catch (error: any) {
      console.error("Error adding property:", error);
      toast.error(error.message || "Failed to add property");
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

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading font-bold">Add New Property</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName">Property Name *</Label>
                    <Input
                      id="propertyName"
                      value={formData.propertyName}
                      onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select value={formData.propertyType} onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Nairobi, Westlands"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerNight">Price per Night (KES) *</Label>
                    <Input
                      id="pricePerNight"
                      type="number"
                      min="0"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfUnits">Number of Units *</Label>
                    <Input
                      id="numberOfUnits"
                      type="number"
                      min="1"
                      value={formData.numberOfUnits}
                      onChange={(e) => setFormData({ ...formData, numberOfUnits: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxGuestsPerUnit">Max Guests per Unit *</Label>
                    <Input
                      id="maxGuestsPerUnit"
                      type="number"
                      min="1"
                      value={formData.maxGuestsPerUnit}
                      onChange={(e) => setFormData({ ...formData, maxGuestsPerUnit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Describe your property, its features, and what makes it special..."
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
                  <Label htmlFor="featuredImage">Featured Image *</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      id="featuredImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageChange}
                      className="hidden"
                    />
                    <label htmlFor="featuredImage" className="cursor-pointer">
                      {featuredImagePreview ? (
                        <img src={featuredImagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload featured image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalImages">Additional Images (Max 10)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      id="additionalImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                    />
                    <label htmlFor="additionalImages" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload additional images</p>
                    </label>
                    {additionalImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {additionalImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Additional ${index + 1}`}
                              className="h-20 w-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsLink">Google Maps Link (Optional)</Label>
                  <Input
                    id="googleMapsLink"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.googleMapsLink}
                    onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndPolicies">Terms & Policies (Optional)</Label>
                  <Textarea
                    id="termsAndPolicies"
                    rows={4}
                    placeholder="Check-in/out times, cancellation policy, house rules..."
                    value={formData.termsAndPolicies}
                    onChange={(e) => setFormData({ ...formData, termsAndPolicies: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Adding Property..." : "Add Property"}
                </Button>
              </form>
            </CardContent>
          </Card>
      </div>
    </PartnerLayout>
  );
};

export default AddProperty;
