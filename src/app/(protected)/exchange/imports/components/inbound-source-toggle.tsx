"use client";

import { Factory, Truck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INBOUND_SOURCE_LABELS,
  type InboundSource,
} from "@/app/(protected)/exchange/shared/inbound-source";

const SOURCE_ICONS = { SUPPLIER: Truck, WORKSHOP: Factory } as const;

type Props = {
  value: InboundSource;
  options: InboundSource[];
  onChange: (source: InboundSource) => void;
  disabled?: boolean;
};

/** Công tắc Nhà cung cấp / Xưởng, dùng chung cho bảng và dialog tạo mới. Chỉ một lựa chọn thì không có gì để đổi nên không vẽ. */
export function InboundSourceToggle({ value, options, onChange, disabled }: Props) {
  if (options.length < 2) return null;

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as InboundSource)}
      className="w-fit"
    >
      <TabsList>
        {options.map((source) => {
          const Icon = SOURCE_ICONS[source];
          return (
            <TabsTrigger
              key={source}
              value={source}
              disabled={disabled}
              className="cursor-pointer"
            >
              <Icon />
              {INBOUND_SOURCE_LABELS[source]}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
