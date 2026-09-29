import { getTreeTypeDataUrl } from "@/utils/treeTypeSymbols";

interface TreeTypeIconProps {
  treeType: string;
  size?: number;
  className?: string;
}

export function TreeTypeIcon({ treeType, size = 34, className = "" }: TreeTypeIconProps) {
  return (
    <span
      className={`tree-type-visual${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      title={treeType}
      aria-label={treeType}
    >
      <img src={getTreeTypeDataUrl(treeType)} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}
