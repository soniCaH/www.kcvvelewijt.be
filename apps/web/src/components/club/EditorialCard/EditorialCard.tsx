import Link from "next/link";

interface EditorialCardProps {
  href: string;
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
  featured?: boolean;
  backgroundImage?: string;
  variant?: "default" | "nav";
}

export function EditorialCard({
  href,
  tag,
  title,
  description,
  arrowText,
  featured,
  backgroundImage,
  variant = "default",
}: EditorialCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-card hover:shadow-card-hover bg-kcvv-black relative flex h-full flex-col justify-end overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      {backgroundImage && (
        <div
          data-testid="card-bg"
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />
      )}
      <div
        data-testid="card-overlay"
        className={`absolute inset-0 ${variant === "nav" ? "editorial-card-overlay--nav" : "editorial-card-overlay--default"}`}
      />
      <div
        className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
        aria-hidden="true"
      />
      <div
        data-testid="card-content"
        className={`relative z-10 ${featured ? "p-10" : "p-6"}`}
      >
        <span className="tracking-label text-kcvv-green mb-2 block text-xs font-extrabold uppercase">
          {tag}
        </span>
        <span
          className={`font-title mb-2 block leading-tight font-extrabold text-white uppercase ${featured ? "md:text-stat text-3xl" : "text-xl"}`}
        >
          {title}
        </span>
        {description && (
          <span
            data-testid="card-description"
            className="mb-2 block text-sm leading-normal text-white/55"
          >
            {description}
          </span>
        )}
        <span className="tracking-caps text-kcvv-green mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase transition-[gap] duration-200 group-hover:gap-2.5">
          <span>{arrowText}</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
