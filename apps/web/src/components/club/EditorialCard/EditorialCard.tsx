import Link from "next/link";

interface EditorialCardProps {
  href: string;
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
}

export function EditorialCard({
  href,
  tag,
  title,
  description,
  arrowText,
}: EditorialCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-sm flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] min-h-[280px] bg-kcvv-black"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,32,36,0.5) 40%, rgba(30,32,36,0.1) 100%)",
        }}
      />
      <div className="relative z-10 p-6">
        <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-green mb-2 block">
          {tag}
        </span>
        <span className="font-title font-extrabold text-white uppercase leading-[1.1] mb-2 block text-xl">
          {title}
        </span>
        {description && (
          <span className="text-[0.8125rem] text-white/70 leading-normal block mb-2">
            {description}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-kcvv-green mt-3 transition-[gap] duration-200 group-hover:gap-2.5">
          <span>{arrowText}</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
