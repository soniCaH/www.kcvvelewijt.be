# chart

Enhanced d3-org-chart implementation for the organigram (`/club/organigram`). Renders the club structure as a hierarchical tree diagram with zoom/pan, mobile navigation drawer, and quick contact actions.

## Components

| File                        | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `EnhancedOrgChart.tsx`      | Root component — search, filter, zoom controls  |
| `NodeRenderer.tsx`          | Custom node templates for d3-org-chart           |
| `MobileNavigationDrawer.tsx`| Bottom-sheet member list for mobile              |
| `ContactOverlay.tsx`        | Quick contact actions overlay (hover/tap)        |

## Props — `EnhancedOrgChart`

| Prop            | Type                             | Default | Description              |
| --------------- | -------------------------------- | ------- | ------------------------ |
| `members`       | `OrgChartNode[]`                 | —       | Organization members     |
| `onMemberClick` | `(member: OrgChartNode) => void` | —       | Opens the details modal  |
| `isLoading`     | `boolean`                        | `false` | Loading state            |
| `className`     | `string`                         | —       | Additional CSS classes   |

## Usage

```tsx
import { EnhancedOrgChart } from "@/components/organigram/chart/EnhancedOrgChart";

<EnhancedOrgChart
  members={members}
  onMemberClick={setSelectedMember}
/>
```

## Dependencies

- `d3-org-chart` — hierarchical chart library
- `lucide-react` — icons

## Storybook

Stories are in `EnhancedOrgChart.stories.tsx` and `MobileNavigationDrawer.stories.tsx` under `Features/Organigram/`.
