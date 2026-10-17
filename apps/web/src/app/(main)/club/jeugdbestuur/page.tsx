import { createBoardPage } from "../createBoardPage";

const { generateMetadata, Page, Layout } = createBoardPage({
  slug: "jeugdbestuur",
  fallbackDescription: "Het jeugdbestuur van KCVV Elewijt",
  fallbackTitle: "Jeugdbestuur",
});

export { generateMetadata, Layout };
export default Page;
export const revalidate = 3600;
