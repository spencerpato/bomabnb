// Structured Data (Schema.org) helpers for SEO

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BomaBnB",
  "url": "https://bomabnb.netlify.app",
  "logo": "https://bomabnb.netlify.app/logo.png",
  "description": "Authentic Kenyan homestays and vacation rentals platform connecting travelers with local hosts",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KE",
    "addressRegion": "Nairobi"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@bomabnb.com"
  },
  "sameAs": [
    "https://facebook.com/bomabnb",
    "https://twitter.com/bomabnb",
    "https://instagram.com/bomabnb"
  ]
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BomaBnB",
  "url": "https://bomabnb.netlify.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://bomabnb.netlify.app/?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const generatePropertySchema = (property: {
  id: string;
  property_name: string;
  description?: string;
  location: string;
  price_per_night: number;
  featured_image: string;
  max_guests_per_unit: number;
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": property.property_name,
  "description": property.description || `Beautiful ${property.property_name} in ${property.location}`,
  "image": property.featured_image,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": property.location,
    "addressCountry": "KE"
  },
  "priceRange": `KES ${property.price_per_night}`,
  "telephone": "+254-XXX-XXXXXX",
  "url": `https://bomabnb.netlify.app/property/${property.id}`,
  "geo": {
    "@type": "GeoCoordinates",
    "addressCountry": "KE"
  },
  "amenityFeature": property.amenities?.map(amenity => ({
    "@type": "LocationFeatureSpecification",
    "name": amenity,
    "value": true
  })),
  ...(property.rating && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": property.rating,
      "reviewCount": property.reviewCount || 1,
      "bestRating": "5",
      "worstRating": "1"
    }
  }),
  "offers": {
    "@type": "Offer",
    "price": property.price_per_night,
    "priceCurrency": "KES",
    "availability": "https://schema.org/InStock",
    "url": `https://bomabnb.netlify.app/property/${property.id}`,
    "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
});

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "BomaBnB",
  "image": "https://bomabnb.netlify.app/logo.png",
  "@id": "https://bomabnb.netlify.app",
  "url": "https://bomabnb.netlify.app",
  "telephone": "+254-XXX-XXXXXX",
  "priceRange": "KES 1000 - 50000",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "",
    "addressLocality": "Nairobi",
    "addressRegion": "Nairobi",
    "postalCode": "00100",
    "addressCountry": "KE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -1.286389,
    "longitude": 36.817223
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "00:00",
    "closes": "23:59"
  }
});
