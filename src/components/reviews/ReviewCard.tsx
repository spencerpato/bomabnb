import { formatDistanceToNow } from "date-fns";
import StarRating from "./StarRating";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Flag } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ReviewCardProps {
  review: Review;
  canReply?: boolean;
  canReport?: boolean;
  partnerId?: string;
  onReplyAdded?: () => void;
  onReported?: () => void;
}

const ReviewCard = ({
  review,
  canReply = false,
  canReport = true,
  partnerId,
  onReplyAdded,
  onReported,
}: ReviewCardProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !partnerId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("review_replies").insert({
        review_id: review.id,
        partner_id: partnerId,
        reply_text: replyText,
      });

      if (error) throw error;

      toast.success("Reply posted successfully!");
      setReplyText("");
      setShowReplyForm(false);
      if (onReplyAdded) onReplyAdded();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    try {
      const reason = prompt("Please provide a reason for reporting this review:");
      if (!reason) return;

      const { data: session } = await supabase.auth.getSession();

      const { error } = await supabase.from("review_reports").insert({
        review_id: review.id,
        reported_by: session?.session?.user?.id || null,
        report_reason: reason,
      });

      if (error) throw error;

      toast.success("Review reported. Our team will review it shortly.");
      if (onReported) onReported();
    } catch (error) {
      console.error("Error reporting review:", error);
      toast.error("Failed to report review");
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{review.reviewer_name}</h4>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>
        {canReport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            className="h-8 px-2"
          >
            <Flag className="h-3 w-3" />
          </Button>
        )}
      </div>

      {review.review_text && (
        <p className="text-sm text-gray-700">{review.review_text}</p>
      )}

      {review.review_replies && review.review_replies.length > 0 && (
        <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4 space-y-2">
          {review.review_replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">Property Owner</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(reply.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{reply.reply_text}</p>
            </div>
          ))}
        </div>
      )}

      {canReply && !showReplyForm && (!review.review_replies || review.review_replies.length === 0) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReplyForm(true)}
          className="mt-2"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Reply
        </Button>
      )}

      {showReplyForm && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={isSubmitting || !replyText.trim()}
            >
              {isSubmitting ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReviewCard;
