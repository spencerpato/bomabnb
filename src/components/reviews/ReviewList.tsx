import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReviewCard from "./ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Review {
  id: string;
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

interface ReviewListProps {
  propertyId: string;
  canReply?: boolean;
  partnerId?: string;
  initialLimit?: number;
}

const ReviewList = ({
  propertyId,
  canReply = false,
  partnerId,
  initialLimit = 5,
}: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from("property_reviews")
        .select(
          `
          *,
          review_replies(
            id,
            reply_text,
            created_at,
            partner_id
          )
        `,
          { count: "exact" }
        )
        .eq("property_id", propertyId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      setReviews(data || []);
      setHasMore((count || 0) > limit);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [propertyId, limit]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "property_reviews",
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          fetchReviews();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review_replies",
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          canReply={canReply}
          partnerId={partnerId}
          onReplyAdded={fetchReviews}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setLimit((prev) => prev + 5)}
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
