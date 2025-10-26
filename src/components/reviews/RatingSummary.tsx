import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "./StarRating";
import { Progress } from "@/components/ui/progress";

interface RatingSummaryProps {
  propertyId: string;
}

interface RatingData {
  average_rating: number;
  total_reviews: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

const RatingSummary = ({ propertyId }: RatingSummaryProps) => {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatingSummary = async () => {
      setLoading(true);
      try {
        // Try to get from materialized view first
        const { data: viewData, error: viewError } = await supabase
          .from("property_ratings_summary")
          .select("*")
          .eq("property_id", propertyId)
          .single();

        if (viewData && !viewError) {
          setRatingData(viewData);
        } else {
          // Fallback to calculating directly
          const { data: reviews, error } = await supabase
            .from("property_reviews")
            .select("rating")
            .eq("property_id", propertyId)
            .eq("is_approved", true);

          if (error) throw error;

          if (reviews && reviews.length > 0) {
            const ratings = reviews.map((r) => r.rating);
            const avgRating =
              ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

            setRatingData({
              average_rating: avgRating,
              total_reviews: reviews.length,
              five_star_count: ratings.filter((r) => r === 5).length,
              four_star_count: ratings.filter((r) => r === 4).length,
              three_star_count: ratings.filter((r) => r === 3).length,
              two_star_count: ratings.filter((r) => r === 2).length,
              one_star_count: ratings.filter((r) => r === 1).length,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching rating summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatingSummary();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`ratings-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "property_reviews",
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          fetchRatingSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  if (loading || !ratingData || ratingData.total_reviews === 0) {
    return null;
  }

  const ratingBreakdown = [
    { stars: 5, count: ratingData.five_star_count },
    { stars: 4, count: ratingData.four_star_count },
    { stars: 3, count: ratingData.three_star_count },
    { stars: 2, count: ratingData.two_star_count },
    { stars: 1, count: ratingData.one_star_count },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="text-center sm:text-left">
          <div className="text-4xl font-bold mb-2">
            {ratingData.average_rating.toFixed(1)}
          </div>
          <StarRating rating={ratingData.average_rating} size="lg" />
          <p className="text-sm text-gray-600 mt-1">
            {ratingData.total_reviews} review{ratingData.total_reviews !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 w-full space-y-2">
          {ratingBreakdown.map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-12 text-right">{stars} star</span>
              <Progress
                value={(count / ratingData.total_reviews) * 100}
                className="h-2 flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;
