import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Heart } from "lucide-react";
import logo from "@/assets/bomabnb-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={logo} alt="BomaBnB" className="h-12 w-auto mb-4 brightness-0 invert" />
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
            <p className="text-sm text-secondary-foreground/80 mb-2">
              Email: info@bomabnb.com
            </p>
            <p className="text-sm text-secondary-foreground/80 mb-4">
              Phone: +254 700 000 000
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-secondary-foreground/80 mb-4 md:mb-0">
            © 2025 BomaBnB. All rights reserved.
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
