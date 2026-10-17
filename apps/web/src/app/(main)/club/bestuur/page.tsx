import { createBoardPage } from "../createBoardPage";

const { generateMetadata, Page, Layout } = createBoardPage({
  slug: "bestuur",
  fallbackDescription: "Het bestuur van KCVV Elewijt",
  fallbackTitle: "Bestuur",
});

export { generateMetadata, Layout };
export default Page;
export const revalidate = 3600;
