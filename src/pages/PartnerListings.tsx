import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Home, Plus, Edit2, Trash2, Eye, EyeOff, Star, Image as ImageIcon, BarChart3, RefreshCw, Search, Upload, X, MessageSquare } from "lucide-react";
import PropertyReviewsSection from "@/components/partner/PropertyReviewsSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Property {
  id: string;
  property_name: string;
  location: string;
  price_per_night: number;
  is_active: boolean;
  is_featured?: boolean;
  featured_image?: string;
  status?: string;
  created_at: string;
}

const PartnerListings = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{id: string, image_url: string}>>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "partner");

    if (!roles || roles.length === 0) {
      toast.error("Access denied. Partner account required.");
      navigate("/");
    }
  };

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return;
      
      setPartnerId(partner.id);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePropertyStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_active: !currentStatus })
        .eq("id", propertyId);

      if (error) throw error;

      toast.success(`Property ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchProperties();
    } catch (error) {
      console.error("Error updating property status:", error);
      toast.error("Failed to update property status");
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      toast.success("Property deleted successfully");
      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProperties(properties);
      return;
    }
    const filtered = properties.filter(
      (prop) =>
        prop.property_name.toLowerCase().includes(query.toLowerCase()) ||
        prop.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProperties(filtered);
  };

  const getStatusBadge = (property: Property) => {
    if (property.is_featured) return { label: "⭐ Featured", variant: "default" as const };
    if (property.status === "pending") return { label: "🕓 Pending", variant: "secondary" as const };
    if (!property.is_active) return { label: "❌ Unavailable", variant: "secondary" as const };
    return { label: "✅ Active", variant: "default" as const };
  };

  const fetchGalleryImages = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error: any) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const handleFeaturedImageUpload = async (propertyId: string, file: File) => {
    try {
      setIsUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}-featured-${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('properties')
        .update({ featured_image: publicUrl })
        .eq('id', propertyId);

      if (updateError) throw updateError;

      toast.success("Featured image updated!");
      fetchProperties();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGalleryImageUpload = async (propertyId: string, files: FileList) => {
    try {
      setIsUploadingImage(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}-gallery-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        // Insert into property_images table
        const { error: insertError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            image_url: publicUrl
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      toast.success("Gallery images uploaded!");
      if (selectedProperty) {
        fetchGalleryImages(selectedProperty.id);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload images");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteGalleryImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/storage/v1/object/public/property-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('property-images')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success("Image deleted!");
      if (selectedProperty) {
        fetchGalleryImages(selectedProperty.id);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("Failed to delete image");
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">My Properties</h1>
                <p className="text-muted-foreground">
                  Manage all your property listings
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={showReviews ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowReviews(!showReviews)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showReviews ? "Hide Reviews" : "View Reviews"}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchProperties}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => navigate("/add-property")} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Property
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property name or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Reviews Section */}
          {showReviews && partnerId && (
            <div className="mb-8">
              <PropertyReviewsSection partnerId={partnerId} />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProperties.length === 0 && searchQuery ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No properties found matching "{searchQuery}"</p>
              </CardContent>
            </Card>
          ) : properties.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-semibold text-xl mb-2">No Properties Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start listing your properties to reach more guests
                </p>
                <Button onClick={() => navigate("/add-property")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
                const statusBadge = getStatusBadge(property);
                return (
                <Card key={property.id} className="hover:shadow-lg transition-all">
                  {/* Featured Image */}
                  {property.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={property.featured_image}
                        alt={property.property_name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
                        }}
                      />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{property.property_name}</CardTitle>
                        <CardDescription>{property.location}</CardDescription>
                      </div>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      KES {property.price_per_night.toLocaleString()}
                      <span className="text-sm text-muted-foreground font-normal">/night</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* Row 1 - Primary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="w-full"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/edit-property/${property.id}`)}
                          className="w-full"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>

                      {/* Row 2 - Toggle & Feature */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePropertyStatus(property.id, property.is_active)}
                          className="w-full"
                        >
                          {property.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/feature-request?property=${property.id}`)}
                          className="w-full"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Feature
                        </Button>
                      </div>

                      {/* Row 3 - Images & Delete */}
                      <div className="grid grid-cols-2 gap-2">
                        <Dialog open={imageDialogOpen && selectedProperty?.id === property.id} onOpenChange={(open) => {
                          setImageDialogOpen(open);
                          if (!open) setSelectedProperty(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProperty(property);
                                fetchGalleryImages(property.id);
                              }}
                              className="w-full"
                            >
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Images
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Manage Property Images</DialogTitle>
                              <DialogDescription>
                                {property.property_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Featured Image Section */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Featured Image</CardTitle>
                                  <CardDescription>This is the main image shown in property listings</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {property.featured_image && (
                                    <div className="relative">
                                      <img
                                        src={property.featured_image}
                                        alt="Featured"
                                        className="w-full h-64 object-cover rounded-lg"
                                        onError={(e) => {
                                          e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <Label htmlFor="featuredUpload" className="cursor-pointer">
                                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm font-medium">Click to upload new featured image</p>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
                                      </div>
                                    </Label>
                                    <Input
                                      id="featuredUpload"
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFeaturedImageUpload(property.id, file);
                                        }
                                      }}
                                      disabled={isUploadingImage}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Gallery Images Section */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Gallery Images</CardTitle>
                                  <CardDescription>Additional images shown in property details (up to 10 images)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {/* Current Gallery Images */}
                                  {galleryImages.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {galleryImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                          <img
                                            src={image.image_url}
                                            alt="Gallery"
                                            className="w-full h-32 object-cover rounded-lg"
                                          />
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteGalleryImage(image.id, image.image_url)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Upload Gallery Images */}
                                  {galleryImages.length < 10 && (
                                    <div>
                                      <Label htmlFor="galleryUpload" className="cursor-pointer">
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                          <p className="text-sm font-medium">Click to upload gallery images</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {galleryImages.length}/10 images • Select multiple files
                                          </p>
                                        </div>
                                      </Label>
                                      <Input
                                        id="galleryUpload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files.length > 0) {
                                            const remainingSlots = 10 - galleryImages.length;
                                            if (e.target.files.length > remainingSlots) {
                                              toast.error(`You can only upload ${remainingSlots} more images`);
                                              return;
                                            }
                                            handleGalleryImageUpload(property.id, e.target.files);
                                          }
                                        }}
                                        disabled={isUploadingImage}
                                      />
                                    </div>
                                  )}

                                  {galleryImages.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                      No gallery images yet. Upload some to showcase your property!
                                    </p>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Action Buttons */}
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setImageDialogOpen(false)}
                                >
                                  Close
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete {property.property_name} and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProperty(property.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Added: {new Date(property.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerListings;
