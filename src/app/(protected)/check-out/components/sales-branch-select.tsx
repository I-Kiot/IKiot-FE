"use client";

import { Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SalesBranch } from "../_hooks/use-sales-branch";

interface SalesBranchSelectProps {
  sales: SalesBranch;
  error?: string;
  /** Show the label above the select (default) or just the select. */
  showLabel?: boolean;
}

/** "Nơi bán": editable on the chain-wide / warehouse view, fixed to the branch otherwise. */
export function SalesBranchSelect({ sales, error, showLabel = true }: SalesBranchSelectProps) {
  const { branchId, locked, branches, ready, setBranchId } = sales;
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <Label className="font-semibold text-base text-muted-foreground flex items-center gap-1.5">
          <Store className="size-4" />
          Nơi bán <span className="text-destructive">*</span>
        </Label>
      )}
      <Select value={branchId} onValueChange={setBranchId} disabled={locked || !ready}>
        <SelectTrigger className="w-full" aria-label="Nơi bán">
          <SelectValue placeholder="Chọn nơi bán" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
