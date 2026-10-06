"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerApi } from "@/lib/api/customer";
import type { Customer } from "@/types/customer";

export type CustomerChoice =
  | { mode: "existing"; customer: Customer | null }
  | { mode: "new"; name: string; phone: string; address: string };

interface CustomerPickerProps {
  value: CustomerChoice;
  onChange: (value: CustomerChoice) => void;
  /** Shown under the name field of a new customer. */
  error?: string;
}

/** An existing customer found by name / phone, or a new one typed in (the server matches it to an existing customer by phone first). */
export function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const [search, setSearch] = React.useState("");
  const term = search.trim();
  const wanted = value.mode === "existing" && !value.customer && term.length >= 2;
  const [found, setFound] = React.useState<{ term: string; items: Customer[] } | null>(null);
  const results = wanted && found?.term === term ? found.items : [];
  const searching = wanted && found?.term !== term;

  React.useEffect(() => {
    if (!wanted) return;
    let stale = false;
    const timer = setTimeout(() => {
      customerApi
        .getList({ search: term, limit: 8 })
        .then((page) => {
          if (!stale) setFound({ term, items: page.data });
        })
        .catch(() => {
          if (!stale) setFound({ term, items: [] });
        });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [wanted, term]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={value.mode === "existing" ? "default" : "outline"}
          onClick={() => onChange({ mode: "existing", customer: null })}
        >
          Khách có sẵn
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value.mode === "new" ? "default" : "outline"}
          onClick={() => onChange({ mode: "new", name: "", phone: "", address: "" })}
        >
          Khách mới
        </Button>
      </div>

      {value.mode === "existing" ? (
        value.customer ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{value.customer.name}</span>
              <span className="text-muted-foreground">
                {value.customer.phone ? ` · ${value.customer.phone}` : ""}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ mode: "existing", customer: null })}
            >
              Đổi khách
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Tìm theo tên hoặc số điện thoại"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Tìm khách hàng"
            />
            {searching && <p className="text-sm text-muted-foreground">Đang tìm...</p>}
            {results.length > 0 && (
              <ul className="divide-y rounded-md border">
                {results.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => onChange({ mode: "existing", customer })}
                    >
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {wanted && !searching && results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Không tìm thấy khách nào - chọn &ldquo;Khách mới&rdquo; để nhập tay.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="new-customer-name">
              Tên khách hàng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-customer-name"
              value={value.name}
              onChange={(event) => onChange({ ...value, name: event.target.value })}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-customer-phone">Số điện thoại</Label>
            <Input
              id="new-customer-phone"
              inputMode="tel"
              value={value.phone}
              onChange={(event) => onChange({ ...value, phone: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-customer-address">Địa chỉ</Label>
            <Input
              id="new-customer-address"
              value={value.address}
              onChange={(event) => onChange({ ...value, address: event.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
