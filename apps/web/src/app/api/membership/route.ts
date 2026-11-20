import { proxyFormPost } from "@/lib/server/form-proxy";

export const POST = (request: Request) =>
  proxyFormPost(request, "/forms/membership", "Membership API");
