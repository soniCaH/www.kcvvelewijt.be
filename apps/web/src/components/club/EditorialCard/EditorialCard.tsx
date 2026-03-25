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
      className="group relative overflow-hidden rounded-card flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover bg-kcvv-black h-full"
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
        className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
        aria-hidden="true"
      />
      <div
        data-testid="card-content"
        className={`relative z-10 ${featured ? "p-10" : "p-6"}`}
      >
        <span className="text-xs font-extrabold uppercase tracking-label text-kcvv-green mb-2 block">
          {tag}
        </span>
        <span
          className={`font-title font-extrabold text-white uppercase leading-tight mb-2 block ${featured ? "text-3xl md:text-stat" : "text-xl"}`}
        >
          {title}
        </span>
        {description && (
          <span
            data-testid="card-description"
            className="text-sm text-white/55 leading-normal block mb-2"
          >
            {description}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-caps text-kcvv-green mt-3 transition-[gap] duration-200 group-hover:gap-2.5">
          <span>{arrowText}</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
