import Link from "next/link";

interface EditorialCardProps {
  href: string;
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
  featured?: boolean;
  backgroundImage?: string;
}

export function EditorialCard({
  href,
  tag,
  title,
  description,
  arrowText,
  featured,
  backgroundImage,
}: EditorialCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-sm flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover bg-kcvv-black h-full"
    >
      {backgroundImage && (
        <div
          data-testid="card-bg"
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,32,36,0.5) 40%, rgba(30,32,36,0.1) 100%)",
        }}
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
