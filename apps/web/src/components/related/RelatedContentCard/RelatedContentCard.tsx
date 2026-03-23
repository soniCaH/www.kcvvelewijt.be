import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { RelatedContentItem } from "../types";

export interface RelatedContentCardProps {
  /** The related content item to display */
  item: RelatedContentItem;
  /** Additional CSS classes */
  className?: string;
}

function getHref(item: RelatedContentItem): string | null {
  switch (item.type) {
    case "article":
      return `/news/${item.slug}`;
    case "page":
      return `/${item.slug}`;
    case "player":
      return `/players/${item.psdId}`;
    case "team":
      return `/team/${item.slug}`;
    case "staff":
      return null;
  }
}

function getImageAlt(item: RelatedContentItem): string {
  switch (item.type) {
    case "article":
    case "page":
      return item.title;
    case "player":
      return [item.firstName, item.lastName].filter(Boolean).join(" ");
    case "team":
      return item.name;
    case "staff":
      return [item.firstName, item.lastName].filter(Boolean).join(" ");
  }
}

function getImageUrl(item: RelatedContentItem): string | null {
  return item.imageUrl;
}

function CardContent({ item }: { item: RelatedContentItem }) {
  switch (item.type) {
    case "article":
      return (
        <div className="p-3 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-kcvv-green-dark transition-colors">
            {item.title}
          </h4>
          {item.date && (
            <time
              className="text-xs text-gray-500 mt-1 block"
              dateTime={item.date}
            >
              {new Date(item.date).toLocaleDateString("nl-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
          {item.excerpt && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.excerpt}
            </p>
          )}
        </div>
      );

    case "page":
      return (
        <div className="p-3 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-kcvv-green-dark transition-colors">
            {item.title}
          </h4>
          {item.excerpt && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.excerpt}
            </p>
          )}
        </div>
      );

    case "player":
      return (
        <div className="p-3 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-kcvv-green-dark transition-colors">
            {[item.firstName, item.lastName].filter(Boolean).join(" ")}
          </h4>
          {item.position && (
            <p className="text-xs text-gray-500 mt-1">{item.position}</p>
          )}
        </div>
      );

    case "team":
      return (
        <div className="p-3 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-kcvv-green-dark transition-colors">
            {item.name}
          </h4>
          {item.tagline && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.tagline}
            </p>
          )}
        </div>
      );

    case "staff":
      return (
        <div className="p-3 flex flex-col flex-1">
          <h4 className="font-semibold text-sm line-clamp-1">
            {[item.firstName, item.lastName].filter(Boolean).join(" ")}
          </h4>
          {item.role && (
            <p className="text-xs text-gray-500 mt-1">{item.role}</p>
          )}
        </div>
      );
  }
}

export const RelatedContentCard = ({
  item,
  className,
}: RelatedContentCardProps) => {
  const href = getHref(item);
  const imageUrl = getImageUrl(item);
  const imageAlt = getImageAlt(item);

  const cardClasses = cn(
    "w-64 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 flex flex-col",
    href && "group hover:border-kcvv-green-bright transition-colors",
    className,
  );

  const imageBlock = imageUrl ? (
    <div className="relative aspect-video overflow-hidden">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes="256px"
      />
    </div>
  ) : (
    <div className="aspect-video bg-gray-100" />
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses} data-related-card={item.type}>
        {imageBlock}
        <CardContent item={item} />
      </Link>
    );
  }

  return (
    <div className={cardClasses} data-related-card={item.type}>
      {imageBlock}
      <CardContent item={item} />
    </div>
  );
};
