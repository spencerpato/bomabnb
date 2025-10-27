import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  price?: number;
  currency?: string;
  availability?: "instock" | "outofstock";
  structuredData?: object;
}

export const SEO = ({
  title = "BomaBnB - Authentic Kenyan Homestays & Airbnbs",
  description = "Discover verified Kenyan Airbnbs and homestays hosted by locals. Experience authentic Kenyan hospitality with comfort, culture, and competitive rates directly from property owners.",
  keywords = "Kenya homestays, Kenya Airbnb, Kenyan accommodation, vacation rentals Kenya, Nairobi rentals, Mombasa stays, Kenya tourism, local hosts Kenya, verified properties Kenya",
  image = "https://bomabnb.netlify.app/og-image.jpg",
  url = "https://bomabnb.netlify.app",
  type = "website",
  price,
  currency = "KES",
  availability,
  structuredData,
}: SEOProps) => {
  const fullTitle = title.includes("BomaBnB") ? title : `${title} | BomaBnB`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="BomaBnB" />
      <meta property="og:locale" content="en_KE" />
      
      {/* Product specific OG tags */}
      {price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}
      {availability && (
        <meta property="product:availability" content={availability} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@BomaBnB" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kenya" />
      
      {/* Mobile Web App */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="BomaBnB" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
