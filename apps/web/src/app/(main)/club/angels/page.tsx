import { createBoardPage } from "../createBoardPage";

const { generateMetadata, Page, Layout } = createBoardPage({
  slug: "angels",
  fallbackDescription: "De Angels van KCVV Elewijt",
  fallbackTitle: "Angels",
});

export { generateMetadata, Layout };
export default Page;
export const revalidate = 3600;
