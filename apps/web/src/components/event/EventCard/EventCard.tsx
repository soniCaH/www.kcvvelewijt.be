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
        "group rounded-card relative flex flex-col overflow-hidden bg-white",
        "border-foundation-gray-light border shadow-sm",
        "hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <div
        className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
        aria-hidden="true"
      />
      {/* Image */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden bg-[#edeff4]">
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
              className="h-16 w-16 text-gray-300"
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
      <div className="flex flex-1 flex-col p-4">
        {/* Date */}
        {date && (
          <div className="text-green-main mb-2 flex items-center gap-1 text-xs font-semibold">
            <time dateTime={date.toISOString()}>{formatEventDate(date)}</time>
            {endDate && (
              <span data-testid="event-end-date">
                &nbsp;– {formatEventTime(endDate)}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="group-hover:text-green-main mb-1 line-clamp-2 text-base leading-snug font-bold text-gray-900 transition-colors">
          {title}
        </h3>

        {/* Location */}
        {location && (
          <p
            data-testid="event-location"
            className="mb-2 flex items-center gap-1 text-xs text-gray-500"
          >
            <svg
              className="h-3 w-3 shrink-0"
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
            className="mt-auto line-clamp-3 text-sm text-gray-600"
          >
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
