import { Link } from "react-router-dom";
import { Heart, MessageCircle, Phone, Mail } from "lucide-react";
import logo from "@/assets/bomabnb-logo.png";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

export const Footer = () => {
  const { settings, isLoading } = useGlobalSettings();

  if (isLoading) {
    return (
      <footer className="bg-secondary text-secondary-foreground mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={logo} alt={settings?.company_name || "BomaBnB"} className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-secondary-foreground/80">
              Your home away from home. Discover authentic Kenyan homestays.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4">Partners</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/partner-register" className="text-sm hover:text-primary transition-colors">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm hover:text-primary transition-colors">
                  Partner Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4">Contact Info</h3>
            <div className="space-y-2">
              <p className="text-sm text-secondary-foreground/80">
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
              </p>
              <p className="text-sm text-secondary-foreground/80">
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
              {settings?.whatsapp_number && (
                <p className="text-sm text-secondary-foreground/80">
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
              {settings?.business_address && (
                <p className="text-sm text-secondary-foreground/80">
                  <strong>Address:</strong> {settings.business_address}
                </p>
              )}
            </div>
            <div className="flex gap-4 md:gap-3 mt-6 md:mt-4 justify-center md:justify-start">
              {settings?.whatsapp_number && (
                <a 
                  data-testid="link-whatsapp"
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg" 
                  title="WhatsApp"
                >
                  <MessageCircle className="h-7 w-7 md:h-6 md:w-6 text-white" />
                </a>
              )}
              {settings?.contact_phone && (
                <a 
                  data-testid="link-call"
                  href={`tel:${settings.contact_phone}`} 
                  className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg" 
                  title="Call"
                >
                  <Phone className="h-7 w-7 md:h-6 md:w-6 text-white" />
                </a>
              )}
              {settings?.contact_email && (
                <a 
                  data-testid="link-email"
                  href={`mailto:${settings.contact_email}`} 
                  className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg" 
                  title="Email"
                >
                  <Mail className="h-7 w-7 md:h-6 md:w-6 text-white" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-secondary-foreground/80 mb-4 md:mb-0">
            © 2025 {settings?.company_name || "BomaBnB"}. All rights reserved.
          </p>
          <p className="text-sm flex items-center gap-1">
            Made with{" "}
            <Link to="/admin-login" className="inline-block hover:scale-110 transition-transform">
              <Heart className="h-4 w-4 text-accent fill-accent" />
            </Link>{" "}
            by Patrick
          </p>
        </div>
      </div>
    </footer>
  );
};
