import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, HelpCircle, Send, Upload, CheckCircle2, Clock, Mail, Phone } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  issue_type: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  last_updated: string;
}

const PartnerSupport = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [formData, setFormData] = useState({
    subject: "",
    issueType: "",
    description: "",
    attachment: null as File | null,
  });

  useEffect(() => {
    loadMockTickets();
  }, []);

  const loadMockTickets = () => {
    const mockTickets: Ticket[] = [
      {
        id: "1",
        subject: "Unable to upload property images",
        issue_type: "listing_issue",
        status: "in_progress",
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      },
      {
        id: "2",
        subject: "Payment confirmation needed",
        issue_type: "payment",
        status: "resolved",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        last_updated: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    setTickets(mockTickets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.issueType || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would create a ticket in the database
      const newTicket: Ticket = {
        id: String(Date.now()),
        subject: formData.subject,
        issue_type: formData.issueType,
        status: "open",
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };

      setTickets([newTicket, ...tickets]);
      setFormData({ subject: "", issueType: "", description: "", attachment: null });
      toast.success("✅ Support ticket submitted successfully! We'll respond within 24 hours.");
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast.error("Failed to submit ticket");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <MessageCircle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl mb-2 flex items-center gap-3">
            <MessageCircle className="h-10 w-10 text-primary" />
            Support & Help Center
          </h1>
          <p className="text-muted-foreground">
            Get assistance with your account, listings, or technical issues
          </p>
        </div>

        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="submit">
              <Send className="h-4 w-4 mr-2" />
              Submit Ticket
            </TabsTrigger>
            <TabsTrigger value="my-tickets">
              <MessageCircle className="h-4 w-4 mr-2" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Submit Ticket Tab */}
          <TabsContent value="submit">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Submit a Support Ticket</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issueType">Issue Type *</Label>
                      <Select value={formData.issueType} onValueChange={(value) => setFormData({ ...formData, issueType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="login_issue">Login Issue</SelectItem>
                          <SelectItem value="listing_issue">Listing/Property Issue</SelectItem>
                          <SelectItem value="payment">Payment Issue</SelectItem>
                          <SelectItem value="booking">Booking Issue</SelectItem>
                          <SelectItem value="technical">Technical Problem</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        rows={6}
                        placeholder="Please provide as much detail as possible about your issue..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attachment">Attachment (Optional)</Label>
                      <Input
                        id="attachment"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0] || null })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload screenshots or documents (Max 5MB)
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Submitting..." : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Direct Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Email</p>
                        <a href="mailto:patomaich611@gmail.com" className="text-sm text-primary hover:underline">
                          patomaich611@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Phone</p>
                        <a href="tel:+254703998717" className="text-sm text-primary hover:underline">
                          +254 703 998 717
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-sm">💡 Quick Tips</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Include screenshots for visual issues</li>
                      <li>• Mention your property name if relevant</li>
                      <li>• Check FAQ before submitting</li>
                      <li>• Response time: 12-24 hours</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="my-tickets">
            <Card>
              <CardHeader>
                <CardTitle>Your Support Tickets</CardTitle>
                <CardDescription>
                  Track the status of your submitted tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No support tickets yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Issue Type: {ticket.issue_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(ticket.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions and answers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">How do I add a new property?</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to "Add Property" in the sidebar, fill out all required fields including photos, amenities, and pricing, then submit for admin approval.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">How long does property approval take?</h3>
                  <p className="text-sm text-muted-foreground">
                    Most properties are reviewed and approved within 24-48 hours. You'll receive a notification once approved.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">How do I feature my property?</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to "Feature Request" in the sidebar, select your property, choose duration, and submit. Admin will review and approve based on availability.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Can I edit my property after submission?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Go to "My Properties", find your listing, and click the "Edit" button to make changes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">How do bookings work?</h3>
                  <p className="text-sm text-muted-foreground">
                    When a guest books your property, you'll receive a notification. Go to "Bookings" to confirm or decline the request and contact the guest.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">I forgot my password. What should I do?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the "Forgot Password" link on the login page, or contact support at patomaich611@gmail.com for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
};

export default PartnerSupport;
