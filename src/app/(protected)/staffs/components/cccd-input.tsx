"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  CCCD_LENGTH,
  formatIdentificationId,
  parseIdentificationId,
} from "@/app/(protected)/staffs/shared/identification-format";

type CccdInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value?: string;
  onChange: (value: string) => void;
};

export const CccdInput = React.forwardRef<HTMLInputElement, CccdInputProps>(
  function CccdInput({ value, onChange, onBlur, onFocus, ...props }, ref) {
    const [isFocused, setIsFocused] = useState(false);
    const digits = parseIdentificationId(value);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="079 201 000 001"
        className="tabular-nums"
        maxLength={isFocused ? CCCD_LENGTH : undefined}
        value={isFocused ? digits : formatIdentificationId(digits)}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onPaste={(event) => {
          event.preventDefault();
          const pasted = event.clipboardData.getData("text");
          onChange(parseIdentificationId(`${digits}${pasted}`));
        }}
        onChange={(event) => {
          onChange(parseIdentificationId(event.target.value));
        }}
      />
    );
  },
);
