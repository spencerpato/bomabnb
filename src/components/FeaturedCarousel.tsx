import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedCarouselProps {
  children: React.ReactNode[];
  autoRotateInterval?: number; // in milliseconds
}

export const FeaturedCarousel = ({ 
  children, 
  autoRotateInterval = 8000 // 8 seconds default
}: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused || children.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % children.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [children.length, autoRotateInterval, isPaused]);

  // Smooth scroll to current index
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 300; // md:w-[300px]
      const gap = 16; // gap-4
      const scrollPosition = currentIndex * (cardWidth + gap);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % children.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000); // Resume after 3 seconds
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + children.length) % children.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  if (children.length === 0) return null;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
      >
        <div className="flex gap-4 px-2" style={{ minWidth: 'min-content' }}>
          {children}
        </div>
      </div>

      {/* Navigation Arrows - Only show if more than 1 item */}
      {children.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10 hidden md:flex"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10 hidden md:flex"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {children.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-primary w-6" 
                    : "bg-muted-foreground/30 w-2"
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 3000);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Auto-rotation indicator */}
      {!isPaused && children.length > 1 && (
        <div className="absolute top-2 right-2 bg-primary/10 backdrop-blur-sm text-primary px-2 py-1 rounded-full text-xs font-medium">
          Auto-rotating
        </div>
      )}
    </div>
  );
};
