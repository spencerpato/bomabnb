import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, Users, Mail } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

const PrivacyPolicy = () => {
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
      
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="font-heading font-bold text-4xl">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6">
            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name, email address, and phone number</li>
                    <li>Profile information and business details (for partners)</li>
                    <li>Property information and images</li>
                    <li>Booking and payment information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Usage patterns and preferences</li>
                    <li>Cookies and similar technologies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Service Provision</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Process bookings and payments</li>
                    <li>Connect guests with property owners</li>
                    <li>Provide customer support</li>
                    <li>Send important service notifications</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Communication</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Send booking confirmations and updates</li>
                    <li>Provide customer support</li>
                    <li>Send marketing communications (with consent)</li>
                    <li>Notify about account changes</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Platform Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Analyze usage patterns to improve our service</li>
                    <li>Develop new features and functionality</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Data Protection & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Security Measures</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure servers and databases</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Retention</h3>
                  <p className="text-muted-foreground">
                    We retain your personal information only as long as necessary to provide our services, 
                    comply with legal obligations, resolve disputes, and enforce our agreements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">We Share Information With:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Property Partners:</strong> Guest information for booking purposes</li>
                    <li><strong>Service Providers:</strong> Payment processors and hosting services</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                    <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">We Do NOT Sell Your Data</h3>
                  <p className="text-muted-foreground">
                    We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">You Have The Right To:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Delete your account and data</li>
                    <li>Withdraw consent for marketing communications</li>
                    <li>Data portability (receive your data in a structured format)</li>
                    <li>Object to certain processing activities</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How to Exercise Your Rights</h3>
                  <p className="text-muted-foreground">
                    Contact us at the information provided below to exercise any of these rights. 
                    We will respond to your request within 30 days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies & Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Types of Cookies We Use</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how you use our site</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Managing Cookies</h3>
                  <p className="text-muted-foreground">
                    You can control cookies through your browser settings. However, disabling certain cookies 
                    may affect the functionality of our website.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our service is not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13. If you believe we have collected 
                  information from a child under 13, please contact us immediately.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date. 
                  We encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Questions About This Policy?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this privacy policy or our data practices, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      <strong>Email:</strong>{" "}
                      {settings?.privacy_email ? (
                        <a 
                          href={`mailto:${settings.privacy_email}`}
                          className="text-primary hover:underline transition-colors"
                        >
                          {settings.privacy_email}
                        </a>
                      ) : (
                        "privacy@bomabnb.com"
                      )}
                    </p>
                    <p className="text-muted-foreground">
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
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Address:</strong> {settings?.business_address || "Nairobi, Kenya"}
                    </p>
                    {settings?.whatsapp_number && (
                      <p className="text-muted-foreground">
                        <strong>WhatsApp:</strong>{" "}
                        <a 
                          href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline transition-colors"
                        >
                          {settings.whatsapp_number}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
