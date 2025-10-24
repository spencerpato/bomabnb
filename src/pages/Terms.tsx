import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

const Terms = () => {
  const { settings, isLoading } = useGlobalSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-heading font-bold text-4xl mb-8 text-center">
            Terms & Conditions
          </h1>

          <Card className="shadow-lg">
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to BomaBnB. By accessing and using this platform, you agree to be bound by these
                  Terms and Conditions. If you do not agree with any part of these terms, please do not use
                  our services.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">2. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  <strong>For Guests:</strong> You may browse and book properties without creating an account.
                  However, you must provide accurate contact information for all bookings.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>For Partners:</strong> Property owners must register and await approval before
                  listing properties. You are responsible for maintaining the confidentiality of your account
                  credentials and for all activities under your account.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">3. Property Listings</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>All property listings must be accurate and truthful</li>
                  <li>Partners must have legal authority to list the property</li>
                  <li>BomaBnB reserves the right to remove any listing that violates our policies</li>
                  <li>Featured listings are selected at the discretion of BomaBnB administration</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">4. Bookings and Payments</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Booking confirmations are sent directly to property owners. Payment arrangements are made
                  between guests and property owners. BomaBnB is not responsible for payment disputes or
                  cancellations.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">5. Privacy and Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect and process personal information in accordance with Kenyan data protection laws.
                  Your information will be used solely for the purpose of facilitating bookings and improving
                  our services. We will not share your personal information with third parties without your
                  consent.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">6. Partner Responsibilities</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Maintain accurate and up-to-date property information</li>
                  <li>Respond promptly to booking inquiries</li>
                  <li>Honor confirmed bookings unless under exceptional circumstances</li>
                  <li>Maintain property standards as advertised</li>
                  <li>Comply with all applicable local laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">7. Guest Responsibilities</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide accurate booking information</li>
                  <li>Respect property rules and local customs</li>
                  <li>Report any issues promptly to the property owner</li>
                  <li>Leave properties in good condition</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  BomaBnB acts as a platform connecting property owners and guests. We are not responsible
                  for the actual provision of accommodation services, property conditions, or any incidents
                  that may occur during your stay. Users engage with properties at their own risk.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">9. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content on the BomaBnB platform, including logos, text, graphics, and software, is the
                  property of BomaBnB and protected by copyright laws. You may not reproduce, distribute, or
                  modify any content without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">10. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  BomaBnB reserves the right to suspend or terminate user accounts that violate these terms
                  or engage in fraudulent, abusive, or illegal activities.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">11. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms and Conditions from time to time. Continued use of the platform
                  after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">12. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms and Conditions are governed by the laws of Kenya. Any disputes arising from
                  the use of this platform shall be resolved in Kenyan courts.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-2xl mb-3">13. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms and Conditions, please contact us at:
                </p>
                <ul className="list-none text-muted-foreground space-y-1 mt-2">
                  <li>
                    <strong>Email:</strong>{" "}
                    {settings?.contact_email ? (
                      <a 
                        href={`mailto:${settings.contact_email}`}
                        className="text-primary hover:underline transition-colors"
                      >
                        {settings.contact_email}
                      </a>
                    ) : (
                      "contact@bomabnb.com"
                    )}
                  </li>
                  <li>
                    <strong>Phone:</strong>{" "}
                    {settings?.contact_phone ? (
                      <a 
                        href={`tel:${settings.contact_phone}`}
                        className="text-primary hover:underline transition-colors"
                      >
                        {settings.contact_phone}
                      </a>
                    ) : (
                      "+254 700 000 000"
                    )}
                  </li>
                  {settings?.whatsapp_number && (
                    <li>
                      <strong>WhatsApp:</strong>{" "}
                      <a 
                        href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline transition-colors"
                      >
                        {settings.whatsapp_number}
                      </a>
                    </li>
                  )}
                </ul>
              </section>

              <div className="pt-6 border-t mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  Last updated: October 2025
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
