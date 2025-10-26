import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Trash2, Eye, EyeOff, Flag, CheckCircle2, XCircle } from "lucide-react";
import StarRating from "@/components/reviews/StarRating";
import { formatDistanceToNow } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  property_id: string;
  reviewer_name: string;
  reviewer_email?: string;
  rating: number;
  review_text?: string;
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
  properties: {
    property_name: string;
  };
}

interface Report {
  id: string;
  review_id: string;
  report_reason: string;
  status: string;
  created_at: string;
  property_reviews: {
    reviewer_name: string;
    review_text?: string;
    properties: {
      property_name: string;
    };
  };
}

const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    checkAdminAuth();
    fetchReviews();
    fetchReports();
  }, []);

  const checkAdminAuth = async () => {
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
      toast.error("Access denied");
      navigate("/");
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("property_reviews" as any)
        .select(`
          *,
          properties (
            property_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("review_reports" as any)
        .select(`
          *,
          property_reviews (
            reviewer_name,
            review_text,
            properties (
              property_name
            )
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const toggleApproval = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("property_reviews" as any)
        .update({ is_approved: !currentStatus })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success(`Review ${!currentStatus ? "approved" : "unapproved"}`);
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("property_reviews" as any)
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const resolveReport = async (reportId: string, action: "approve" | "delete") => {
    try {
      if (action === "delete") {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          await deleteReview(report.review_id);
        }
      }

      const { error } = await supabase
        .from("review_reports" as any)
        .update({ status: "resolved" })
        .eq("id", reportId);

      if (error) throw error;
      toast.success("Report resolved");
      fetchReports();
      fetchReviews();
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report");
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.properties.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "approved") return matchesSearch && review.is_approved;
    if (activeTab === "pending") return matchesSearch && !review.is_approved;
    if (activeTab === "flagged") return matchesSearch && review.is_flagged;
    return matchesSearch;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ratings & Reviews Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor, approve, and moderate property reviews
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reviews.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {reviews.filter((r) => r.is_approved).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {reviews.filter((r) => !r.is_approved).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reported
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{reports.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        {reports.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Reported Reviews ({reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="bg-white">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold">
                            {report.property_reviews.properties.property_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reviewer: {report.property_reviews.reviewer_name}
                          </p>
                          {report.property_reviews.review_text && (
                            <p className="text-sm mt-2 italic">
                              "{report.property_reviews.review_text}"
                            </p>
                          )}
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-sm font-medium text-red-700">
                            Report Reason:
                          </p>
                          <p className="text-sm text-red-900">{report.report_reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => resolveReport(report.id, "delete")}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveReport(report.id, "approve")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Keep Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>All Reviews</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading reviews...
                  </p>
                ) : filteredReviews.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No reviews found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">
                                    {review.reviewer_name}
                                  </h4>
                                  <Badge
                                    variant={
                                      review.is_approved
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {review.is_approved
                                      ? "Approved"
                                      : "Pending"}
                                  </Badge>
                                  {review.is_flagged && (
                                    <Badge variant="destructive">Flagged</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {review.properties.property_name}
                                </p>
                                <StarRating rating={review.rating} size="sm" />
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>

                            {review.review_text && (
                              <p className="text-sm text-gray-700">
                                {review.review_text}
                              </p>
                            )}

                            {review.reviewer_email && (
                              <p className="text-xs text-gray-500">
                                Email: {review.reviewer_email}
                              </p>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleApproval(review.id, review.is_approved)
                                }
                              >
                                {review.is_approved ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Unapprove
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Review?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The review
                                      will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteReview(review.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default AdminReviews;
