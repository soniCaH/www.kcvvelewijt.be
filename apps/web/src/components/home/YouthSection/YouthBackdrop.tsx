import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export const YouthBackdrop = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="absolute -inset-4">
      <Image
        src="/images/youth-trainers.jpg"
        alt=""
        fill
        className="object-cover object-top blur-[2px]"
        sizes="100vw"
      />
    </div>
    <div
      className={cn(
        "absolute inset-0",
        "from-kcvv-green-dark/90 via-kcvv-green-dark/75 to-kcvv-green-dark/50",
        "bg-gradient-to-b md:bg-gradient-to-r",
      )}
    />
  </div>
);
