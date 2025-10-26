import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const reviewFormSchema = z.object({
  reviewer_name: z.string().min(2, "Name must be at least 2 characters"),
  reviewer_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  rating: z.number().min(1, "Please select a rating").max(5),
  review_text: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  propertyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm = ({ propertyId, onSuccess, onCancel }: ReviewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      reviewer_name: "",
      reviewer_email: "",
      rating: 0,
      review_text: "",
    },
  });

  // Generate a simple device fingerprint (combination of user agent and screen size)
  const getDeviceFingerprint = () => {
    return btoa(
      `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`
    );
  };

  const onSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const deviceFingerprint = getDeviceFingerprint();

      // Check for duplicate reviews
      const { data: existingReviews, error: checkError } = await supabase
        .from("property_reviews")
        .select("id")
        .eq("property_id", propertyId)
        .or(
          session?.session?.user?.id
            ? `user_id.eq.${session.session.user.id},device_fingerprint.eq.${deviceFingerprint}`
            : `device_fingerprint.eq.${deviceFingerprint}`
        )
        .limit(1);

      if (checkError) throw checkError;

      if (existingReviews && existingReviews.length > 0) {
        toast.error("You have already reviewed this property");
        setIsSubmitting(false);
        return;
      }

      // Insert the review
      const { error: insertError } = await supabase
        .from("property_reviews")
        .insert({
          property_id: propertyId,
          user_id: session?.session?.user?.id || null,
          reviewer_name: values.reviewer_name,
          reviewer_email: values.reviewer_email || null,
          rating: values.rating,
          review_text: values.review_text || null,
          device_fingerprint: deviceFingerprint,
        });

      if (insertError) throw insertError;

      toast.success("Review submitted successfully!");
      form.reset();
      setSelectedRating(0);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating *</FormLabel>
              <FormControl>
                <div>
                  <StarRating
                    rating={selectedRating}
                    interactive
                    size="lg"
                    onRatingChange={(rating) => {
                      setSelectedRating(rating);
                      field.onChange(rating);
                    }}
                  />
                  {selectedRating === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Click to rate
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewer_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="review_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReviewForm;
