"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductDetailsChips } from "@/app/(protected)/exchange/shared/form-fields";
import { filterProductItemsByQuery } from "@/app/(protected)/exchange/shared/product-item-search";
import { formatMoneyVnd } from "@/app/(protected)/exchange/shared/movement-detail-validation";
import { stockMovementApi } from "@/lib/api/stock-movement";
import { safeImageSrc } from "@/app/(protected)/products/_constants/product.constants";
import { cn } from "@/lib/utils";
import type { StockMovementProductItemOption } from "@/types/stock-movement";

export type MovementProductSearchScope = "catalog" | "list";

type MovementProductSearchProps = {
  usedIds: Set<string>;
  onPick: (item: StockMovementProductItemOption) => void;
  /** catalog = API toàn tenant (TO nhập hàng); list = lọc poolProducts. */
  searchScope?: MovementProductSearchScope;
  poolProducts?: StockMovementProductItemOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** stock = hiện tồn; price = hiện giá bán. */
  metaMode?: "price" | "stock" | "skuOnly";
};

/**
 * Ô tìm hàng dùng chung stock movement.
 * BR/WH: searchScope=list + pool = SP tại nơi gửi / NCC.
 */
export function MovementProductSearch({
  usedIds,
  onPick,
  searchScope = "catalog",
  poolProducts = [],
  placeholder,
  disabled = false,
  className,
  metaMode = "price",
}: MovementProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockMovementProductItemOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const seq = useRef(0);

  const resolvedPlaceholder =
    placeholder ??
    (searchScope === "list"
      ? "Tìm hàng theo tên, SKU..."
      : "Tìm hàng theo tên, mã, SKU...");

  useEffect(() => {
    if (disabled) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (searchScope === "list") {
      setIsSearching(false);
      setResults(filterProductItemsByQuery(poolProducts, q));
      return;
    }

    const id = ++seq.current;
    setIsSearching(true);
    const timer = setTimeout(() => {
      stockMovementApi
        .searchProductItems(q)
        .then((items) => {
          if (id !== seq.current) return;
          setResults(items);
        })
        .catch(() => {
          if (id !== seq.current) return;
          setResults([]);
        })
        .finally(() => {
          if (id === seq.current) setIsSearching(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchScope, poolProducts, disabled]);

  const showPanel = !disabled && query.trim().length >= 2;

  const clear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          className="h-10 pl-9"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {showPanel ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border bg-background">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {isSearching ? "Đang tìm..." : "Không tìm thấy hàng hóa phù hợp"}
            </p>
          ) : (
            <ul className="divide-y">
              {results.map((item) => {
                const already = usedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <div
                      role={already ? undefined : "button"}
                      tabIndex={already ? undefined : 0}
                      onClick={() => {
                        if (already) return;
                        onPick(item);
                        clear();
                      }}
                      onKeyDown={(e) => {
                        if (already) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onPick(item);
                          clear();
                        }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        already
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-muted/60",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={safeImageSrc(item.imageUrl)}
                        alt=""
                        className="mt-0.5 size-10 shrink-0 rounded-md border object-cover bg-muted"
                      />
                      <span className="min-w-0 flex-1 overflow-hidden">
                        <span className="block truncate text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {[
                            item.sku ? `SKU: ${item.sku}` : null,
                            metaMode === "price" &&
                            typeof item.retailPrice === "number"
                              ? `Giá bán: ${formatMoneyVnd(item.retailPrice)}`
                              : null,
                            metaMode === "stock" &&
                            typeof item.stock === "number"
                              ? `Tồn: ${item.stock.toLocaleString("vi-VN")}`
                              : null,
                            already ? "Đã thêm" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {item.productDetails?.length ? (
                          <span
                            className="mt-1 block"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <ProductDetailsChips details={item.productDetails} />
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
