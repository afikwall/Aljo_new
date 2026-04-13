import { useState, useCallback, useMemo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  showNumeric?: boolean;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

const gapClasses = {
  sm: "gap-0.5",
  md: "gap-0.5",
  lg: "gap-1",
};

export const StarRating = ({
  rating,
  maxStars = 5,
  interactive = false,
  onRate,
  size = "md",
  showNumeric = true,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = useCallback(
    (starIndex: number) => {
      if (interactive) {
        setHoverRating(starIndex);
      }
    },
    [interactive]
  );

  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      setHoverRating(0);
    }
  }, [interactive]);

  const handleClick = useCallback(
    (starIndex: number) => {
      if (interactive && onRate) {
        onRate(starIndex);
      }
    },
    [interactive, onRate]
  );

  const displayRating = hoverRating || rating;

  const stars = useMemo(() => {
    return Array.from({ length: maxStars }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= Math.floor(displayRating);
      const isHalf =
        !isFilled &&
        starNumber === Math.ceil(displayRating) &&
        displayRating % 1 >= 0.25;

      return { starNumber, isFilled, isHalf };
    });
  }, [maxStars, displayRating]);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn("flex items-center", gapClasses[size])}
        onMouseLeave={handleMouseLeave}
      >
        {stars.map(({ starNumber, isFilled, isHalf }) => (
          <button
            key={starNumber}
            type="button"
            className={cn(
              "relative",
              interactive
                ? "cursor-pointer transition-transform hover:scale-110"
                : "cursor-default"
            )}
            onMouseEnter={() => handleMouseEnter(starNumber)}
            onClick={() => handleClick(starNumber)}
            disabled={!interactive}
            aria-label={`${starNumber} star${starNumber > 1 ? "s" : ""}`}
          >
            {isHalf ? (
              <div className="relative">
                <Star
                  className={cn(sizeClasses[size], "text-muted fill-none")}
                />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "text-chart-3 fill-chart-3"
                    )}
                  />
                </div>
              </div>
            ) : (
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? "text-chart-3 fill-chart-3"
                    : "text-muted fill-none"
                )}
              />
            )}
          </button>
        ))}
      </div>
      {showNumeric && rating > 0 && (
        <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};