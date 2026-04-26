# card-hierarchy

Accordion-style card hierarchy for the organigram (`/club/organigram`). Renders the club structure as expandable/collapsible cards arranged vertically.

## Components

| File                  | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `CardHierarchy.tsx`   | Root component — search, filter, expand controls |
| `HierarchyLevel.tsx`  | Recursive level renderer                         |
| `ExpandableCard.tsx`  | Single expandable card with expand/collapse      |

## Props — `CardHierarchy`

| Prop                   | Type                           | Default | Description                          |
| ---------------------- | ------------------------------ | ------- | ------------------------------------ |
| `members`              | `OrgChartNode[]`               | —       | All organization members             |
| `onMemberClick`        | `(member: OrgChartNode) => void` | —     | Opens the details modal              |
| `initialExpandedDepth` | `number`                       | `2`     | Levels expanded on mount             |
| `maxDepth`             | `number`                       | `10`    | Maximum hierarchy depth to render    |
| `isLoading`            | `boolean`                      | `false` | Shows skeleton cards                 |
| `className`            | `string`                       | —       | Additional CSS classes               |

## Usage

```tsx
import { CardHierarchy } from "@/components/organigram/card-hierarchy/CardHierarchy";

<CardHierarchy
  members={members}
  onMemberClick={setSelectedMember}
  initialExpandedDepth={2}
/>
```

## Storybook

Stories are in `CardHierarchy.stories.tsx`, `HierarchyLevel.stories.tsx`, and `ExpandableCard.stories.tsx` under `Features/Organigram/`.
