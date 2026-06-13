import { SearchMasthead } from "./SearchMasthead";
import { searchFieldShellClasses } from "./search-field-styles";

/**
 * Server-renderable loading shell for `/zoeken`: the real `<SearchMasthead>`
 * band (so the `<h1>` ships in the initial HTML, no layout shift) wrapping an
 * inert skeleton of the search field. Used by both `loading.tsx` (route loading
 * UI) and the page's `<Suspense>` fallback while the client `<SearchInterface>`
 * (which reads `useSearchParams`) hydrates.
 *
 * No icon is rendered: a Phosphor import here would pull `createElement`/context
 * into the server bundle and break `next build` (see
 * `reference_phosphor_data_module_use_client`). The warm cell stands in for the
 * magnifier button.
 */
export function SearchMastheadSkeleton() {
  return (
    <SearchMasthead>
      <div aria-hidden className={`${searchFieldShellClasses} animate-pulse`}>
        {/* 3.625rem ≈ SearchForm's input height (py-4 + body-lg line box) so
            the skeleton reserves the same space as the real field. */}
        <div className="h-[3.625rem] flex-1" />
        <div className="bg-warm border-ink w-14 border-l-2" />
      </div>
    </SearchMasthead>
  );
}
