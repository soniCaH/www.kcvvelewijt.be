import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface EventCardProps {
  title: string;
  href: string;
  date?: Date;
  endDate?: Date;
  location?: string;
  imageUrl?: string;
  excerpt?: string;
  className?: string;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventCard({
  title,
  href,
  date,
  endDate,
  location,
  imageUrl,
  excerpt,
  className,
}: EventCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-white",
        "border border-[#edeff4] shadow-sm",
        "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1",
        className,
      )}
    >
      <div
        className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
        aria-hidden="true"
      />
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#edeff4] flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            data-testid="event-image-placeholder"
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              className="w-16 h-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Date */}
        {date && (
          <div className="flex items-center gap-1 text-xs text-green-main font-semibold mb-2">
            <time dateTime={date.toISOString()}>{formatEventDate(date)}</time>
            {endDate && (
              <span data-testid="event-end-date">
                &nbsp;– {formatEventTime(endDate)}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-1 group-hover:text-green-main transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Location */}
        {location && (
          <p
            data-testid="event-location"
            className="text-xs text-gray-500 mb-2 flex items-center gap-1"
          >
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {location}
          </p>
        )}

        {/* Excerpt */}
        {excerpt && (
          <p
            data-testid="event-excerpt"
            className="text-sm text-gray-600 line-clamp-3 mt-auto"
          >
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
