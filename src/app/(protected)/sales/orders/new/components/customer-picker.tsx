"use client";

import * as React from "react";
import { AlertCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerApi } from "@/lib/api/customer";
import { CustomerDialog } from "@/app/(protected)/check-out/components/customer-dialog";

export interface PickedCustomer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  address: string;
}

interface CustomerPickerProps {
  value: PickedCustomer | null;
  onChange: (value: PickedCustomer | null) => void;
  error?: string;
}

/**
 * Same behaviour as the customer block of the direct-sale sidebar: search by name / phone with a
 * dropdown, or add a new customer through the shared dialog (which creates it straight away).
 */
export function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PickedCustomer[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    let stale = false;
    const timer = setTimeout(() => {
      customerApi
        .getList({ search: term, limit: 10 })
        .then((page) => {
          if (!stale) setResults(page.data);
        })
        .catch(() => {
          if (!stale) setResults([]);
        })
        .finally(() => {
          if (!stale) setLoading(false);
        });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  React.useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const pick = (customer: PickedCustomer | null) => {
    setQuery("");
    setOpen(false);
    onChange(customer);
  };

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="flex items-center justify-between border bg-primary/5 border-primary/20 rounded-lg p-2.5">
          <div>
            <div className="font-bold text-lg text-foreground">{value.name}</div>
            <div className="text-sm text-muted-foreground font-mono mt-0.5">
              {value.phone ? `SĐT: ${value.phone}` : "Chưa có SĐT"}
              {value.customerCode ? ` • ${value.customerCode}` : ""}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Bỏ chọn khách hàng"
            onClick={() => pick(null)}
            className="size-7 rounded-full text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1" ref={wrapperRef}>
            <Input
              type="text"
              placeholder="Tìm khách hàng (Tên, SĐT)..."
              aria-label="Tìm khách hàng"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full text-base"
            />
            {open && query.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-[200px] overflow-y-auto divide-y w-full text-base scrollbar-thin">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span>Đang tìm kiếm khách hàng...</span>
                  </div>
                ) : results.length > 0 ? (
                  results.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => pick(customer)}
                      className="p-2 hover:bg-muted cursor-pointer flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-base text-foreground">{customer.name}</span>
                      <span className="text-sm text-muted-foreground font-mono">
                        {customer.phone} • {customer.customerCode}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-base text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="size-5 text-yellow-500" />
                    <span>Khách hàng không tồn tại</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setDialogOpen(true)}
            className="h-11 w-11 cursor-pointer border-primary/30 text-primary hover:bg-primary/5 shrink-0"
            title="Thêm khách hàng"
          >
            <UserPlus className="size-4" />
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} onCustomerAdded={pick} />
    </div>
  );
}
