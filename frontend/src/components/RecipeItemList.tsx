import React from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { RecipeItemRow } from "./RecipeItemRow";

interface RecipeItemListProps {
  errors?: (string | null)[];
  errorAnims?: boolean[];
  items: RecipeItem[];
  draft?: boolean;
  resolved?: boolean;
  loading?: boolean;
  loadingIdx?: number | null;
  disableRemove?: boolean;
  onChange?: (idx: number, field: string, value: any) => void;
  onRemove?: (idx: number) => void;
  onResolve?: (idx: number) => void;
  onQtyChange?: (idx: number, qty: number) => void;
}

export const RecipeItemList: React.FC<RecipeItemListProps> = ({
  items,
  draft = false,
  resolved = false,
  loading = false,
  loadingIdx = null,
  disableRemove = false,
  onChange,
  onRemove,
  onResolve,
  onQtyChange,
  errors = [],
  errorAnims = [],
}) => {
  if (!items || items.length === 0) return null;
  return (
    <>
      {items.map((item, idx) => (
        <RecipeItemRow
          key={(draft ? "draft-" : "resolved-") + idx}
          item={item}
          draft={draft}
          resolved={resolved}
          loading={loadingIdx === idx}
          disableRemove={disableRemove || (draft && (items.length <= 1 || idx === items.length - 1))}
          onChange={onChange ? (field, value) => onChange(idx, field, value) : undefined}
          onRemove={onRemove ? () => onRemove(idx) : undefined}
          onResolve={onResolve ? () => onResolve(idx) : undefined}
          onQtyChange={onQtyChange ? qty => onQtyChange(idx, qty) : undefined}
          error={errors[idx]}
          errorAnim={errorAnims[idx]}
        />
      ))}
    </>
  );
};
