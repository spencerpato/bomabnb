import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/reviews/StarRating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyReviewsSectionProps {
  partnerId: string;
}

interface Property {
  id: string;
  property_name: string;
}

interface Review {
  id: string;
  property_id: string;
  reviewer_name: string;
  rating: number;
  review_text?: string;
  created_at: string;
  review_replies?: Array<{
    id: string;
    reply_text: string;
    created_at: string;
    partner_id: string;
  }>;
}

const PropertyReviewsSection = ({ partnerId }: PropertyReviewsSectionProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, averageRating: 0 });

  useEffect(() => {
    fetchProperties();
  }, [partnerId]);

  useEffect(() => {
    if (properties.length > 0 || selectedProperty !== "all") {
      fetchReviews();
    }
  }, [partnerId, selectedProperty, properties]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, property_name")
        .eq("partner_id", partnerId)
        .eq("is_active", true);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      if (selectedProperty === "all" && properties.length === 0) {
        setReviews([]);
        setStats({ total: 0, averageRating: 0 });
        setLoading(false);
        return;
      }

      let query = supabase
        .from("property_reviews" as any)
        .select(
          `
          *,
          review_replies(
            id,
            reply_text,
            created_at,
            partner_id
          )
        `
        )
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (selectedProperty !== "all") {
        query = query.eq("property_id", selectedProperty);
      } else {
        query = query.in(
          "property_id",
          properties.map((p) => p.id)
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const total = data.length;
        const avgRating =
          data.reduce((sum: number, r: any) => sum + r.rating, 0) / total;
        setStats({ total, averageRating: avgRating });
      } else {
        setStats({ total: 0, averageRating: 0 });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Property Reviews</CardTitle>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.property_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {stats.total > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
              <div className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  <StarRating rating={stats.averageRating} size="md" />
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reviews yet for your properties.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  canReply={true}
                  canReport={false}
                  partnerId={partnerId}
                  onReplyAdded={fetchReviews}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyReviewsSection;
