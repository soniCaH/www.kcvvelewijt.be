// `groupByDepartment` is deliberately NOT re-exported here: its only
// consumer (StructureDirectory.test.tsx) imports it directly from
// "./StructureDirectory".
export { StructureDirectory } from "./StructureDirectory";
export type { StructureDirectoryProps } from "./StructureDirectory";
