import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop",
    caption: "Experience Authentic Kenyan Hospitality",
    subtitle: "Find your perfect home away from home"
  },
  {
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=600&fit=crop",
    caption: "Modern Comfort Meets Local Charm",
    subtitle: "Explore curated stays across Kenya"
  },
  {
    image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&h=600&fit=crop",
    caption: "Your Adventure Starts Here",
    subtitle: "Book verified properties with confidence"
  },
  {
    image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&h=600&fit=crop",
    caption: "Discover Hidden Gems",
    subtitle: "From Nairobi to the Coast and Beyond"
  }
];

export const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="relative w-full h-[45vh] md:h-[70vh] overflow-hidden rounded-2xl">
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          </div>
          <div className="relative h-full flex flex-col justify-center items-center px-3 md:px-16 text-white text-center">
            <h2 className="font-heading font-bold text-2xl md:text-5xl lg:text-6xl mb-2 md:mb-4 animate-fade-in max-w-4xl">
              {slide.caption}
            </h2>
            <p className="text-sm md:text-xl lg:text-2xl text-white/90 mb-4 md:mb-8 animate-fade-in animation-delay-200 max-w-2xl">
              {slide.subtitle}
            </p>
            
            <div className="flex flex-col gap-2 md:gap-4 w-full max-w-lg backdrop-blur-sm bg-black/20 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                <Button
                  data-testid="button-partner-with-us"
                  onClick={() => navigate("/partner-register")}
                  className="h-10 md:h-14 text-sm md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:flex-1"
                  style={{ backgroundColor: "#D4A017", color: "white" }}
                >
                  🏡 Partner With Us
                </Button>
                <Button
                  data-testid="button-partner-login"
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="h-10 md:h-14 text-sm md:text-lg font-semibold border-2 border-white text-white bg-transparent hover:bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:flex-1"
                >
                  🔑 Partner Login
                </Button>
              </div>
              <Button
                data-testid="button-join-as-agent"
                onClick={() => navigate("/partner-register?role=agent")}
                variant="outline"
                className="h-9 md:h-12 text-xs md:text-base font-medium border-2 border-amber-300 text-amber-300 bg-transparent hover:bg-amber-300/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 w-full group relative"
                title="Earn commission by referring hosts to BomaBnB"
              >
                <span className="flex items-center justify-center gap-2">
                  💼 Join as Agent
                  <span className="hidden md:inline text-xs opacity-75">- Earn Commissions</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};
