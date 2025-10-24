import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Home,
  Eye,
  Edit,
  Trash2,
  Star,
  Search,
  AlertCircle,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Property {
  id: string;
  partner_id: string;
  property_name: string;
  property_type: string;
  location: string;
  price_per_night: number;
  is_active: boolean;
  is_featured: boolean;
  feature_start_date?: string;
  feature_end_date?: string;
  created_at: string;
  partners: {
    profiles: {
      full_name: string;
    };
  };
}

const AdminProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [featureDuration, setFeatureDuration] = useState("7");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, properties]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin-login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Administrator privileges required.");
        navigate("/");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/admin-login");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch partner details separately for each property
      const propertiesWithPartners = await Promise.all(
        (data || []).map(async (property) => {
          // First get the partner
          const { data: partnerData } = await supabase
            .from("partners")
            .select("user_id")
            .eq("id", property.partner_id)
            .single();

          // Then get the profile using user_id
          let profileData = null;
          if (partnerData?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", partnerData.user_id)
              .single();
            
            profileData = profile;
          }

          return {
            ...property,
            partners: {
              profiles: profileData || null,
            },
          };
        })
      );

      setProperties(propertiesWithPartners);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(
      (property) =>
        property.property_name.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        (property.partners?.profiles?.full_name || "").toLowerCase().includes(query)
    );
    setFilteredProperties(filtered);
  };

  const handleForceFeature = async () => {
    if (!selectedProperty) return;

    try {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(featureDuration));
      const endDateISO = endDate.toISOString();

      const { error } = await supabase
        .from("properties")
        .update({
          is_featured: true,
          feature_start_date: startDate,
          feature_end_date: endDateISO
        })
        .eq("id", selectedProperty.id);

      if (error) throw error;

      // Send notification to partner
      await supabase
        .from("partner_notifications")
        .insert({
          partner_id: selectedProperty.partner_id,
          type: "feature_approved",
          title: "⭐ Property Featured by Admin",
          message: `Your property "${selectedProperty.property_name}" has been featured by the admin for ${featureDuration} days. It will appear at the top of search results.`,
          status: "unread",
          property_id: selectedProperty.id
        });

      toast.success(`Property featured for ${featureDuration} days`);
      setShowFeatureDialog(false);
      setSelectedProperty(null);
      fetchData();
    } catch (error) {
      console.error("Error force featuring:", error);
      toast.error("Failed to feature property");
    }
  };

  const handleExtendFeature = async () => {
    if (!selectedProperty) return;

    try {
      const currentEndDate = selectedProperty.feature_end_date ? new Date(selectedProperty.feature_end_date) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(featureDuration));
      const newEndDateISO = newEndDate.toISOString();

      const { error } = await supabase
        .from("properties")
        .update({
          feature_end_date: newEndDateISO
        })
        .eq("id", selectedProperty.id);

      if (error) throw error;

      // Send notification to partner
      await supabase
        .from("partner_notifications")
        .insert({
          partner_id: selectedProperty.partner_id,
          type: "feature_extended",
          title: "⭐ Featured Period Extended",
          message: `The featured period for "${selectedProperty.property_name}" has been extended by ${featureDuration} days by the admin.`,
          status: "unread",
          property_id: selectedProperty.id
        });

      toast.success(`Featured period extended by ${featureDuration} days`);
      setShowExtendDialog(false);
      setSelectedProperty(null);
      fetchData();
    } catch (error) {
      console.error("Error extending feature:", error);
      toast.error("Failed to extend feature period");
    }
  };

  const handleRemoveFeature = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          is_featured: false,
          feature_start_date: null,
          feature_end_date: null
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast.success("Featured status removed");
      fetchData();
    } catch (error) {
      console.error("Error removing feature:", error);
      toast.error("Failed to remove featured status");
    }
  };

  const handleToggleActive = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_active: !currentStatus })
        .eq("id", propertyId);

      if (error) throw error;

      toast.success(`Property ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchData();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", selectedProperty.id);

      if (error) throw error;

      toast.success("Property deleted");
      setShowDeleteDialog(false);
      setSelectedProperty(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    }
  };

  const viewPropertyDetails = async (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Properties Management</h1>
        <p className="text-muted-foreground">View, edit, or delete all partner listings</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties by name, location, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            All Properties ({filteredProperties.length})
          </CardTitle>
          <CardDescription>Manage all partner property listings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No properties found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Property Name</th>
                    <th className="text-left p-4 font-semibold">Owner</th>
                    <th className="text-left p-4 font-semibold">Location</th>
                    <th className="text-left p-4 font-semibold">Price</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Featured</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{property.property_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{property.property_type}</p>
                        </div>
                      </td>
                      <td className="p-4">{property.partners?.profiles?.full_name || "Unknown"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {property.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          KES {property.price_per_night.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        {property.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {property.is_featured ? (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Featured</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewPropertyDetails(property.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProperty(property);
                              setShowDetailsDialog(true);
                            }}
                            title="Edit Property"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!property.is_featured ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProperty(property);
                                setShowFeatureDialog(true);
                              }}
                              title="Force Feature"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowExtendDialog(true);
                                }}
                                title="Extend Feature"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFeature(property.id)}
                                title="Remove Feature"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProperty(property);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete Property"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
            <DialogDescription>Manage property information</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Property Name</p>
                <p className="text-lg font-semibold">{selectedProperty.property_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Owner</p>
                <p>{selectedProperty.partners?.profiles?.full_name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p>{selectedProperty.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price per Night</p>
                <p>KES {selectedProperty.price_per_night.toLocaleString()}</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant={selectedProperty.is_active ? "destructive" : "default"}
                  onClick={() => {
                    handleToggleActive(selectedProperty.id, selectedProperty.is_active);
                    setShowDetailsDialog(false);
                  }}
                >
                  {selectedProperty.is_active ? "Deactivate" : "Activate"}
                </Button>
                {!selectedProperty.is_featured ? (
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowFeatureDialog(true);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Force Feature
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowExtendDialog(true);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Extend
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRemoveFeature(selectedProperty.id);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Remove Feature
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the property and all associated data. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Feature Property</DialogTitle>
            <DialogDescription>
              Feature "{selectedProperty?.property_name}" without a partner request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Feature Duration</Label>
              <Select value={featureDuration} onValueChange={setFeatureDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFeatureDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleForceFeature}>
                Feature Property
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Feature Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Featured Period</DialogTitle>
            <DialogDescription>
              Extend the featured period for "{selectedProperty?.property_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extendDuration">Extend By</Label>
              <Select value={featureDuration} onValueChange={setFeatureDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedProperty?.feature_end_date && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current expiration:</p>
                <p className="font-medium">{new Date(selectedProperty.feature_end_date).toLocaleDateString()}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendFeature}>
                Extend Period
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default AdminProperties;

