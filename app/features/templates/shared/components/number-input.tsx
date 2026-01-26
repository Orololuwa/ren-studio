import type * as React from "react";
import { forwardRef, useEffect, useState } from "react";

import { inputClassName } from "~/components/ui/input";
import { cn } from "~/lib/utils";

// Type for NumericFormat props
type NumericFormatProps = {
  value?: string | number;
  onValueChange?: (values: { value: string; formattedValue: string }) => void;
  getInputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  thousandSeparator?: boolean | string;
  [key: string]: unknown;
};

export interface NumberInputProps {
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  thousandSeparator?: boolean | string;
  [key: string]: unknown;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    const {
      value,
      onChange,
      disabled = false,
      className,
      placeholder,
      decimalScale = 2,
      fixedDecimalScale = false,
      allowNegative = false,
      thousandSeparator = true,
      ...restProps
    } = props;
    const [NumericFormat, setNumericFormat] =
      useState<React.ComponentType<NumericFormatProps> | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      if (typeof window !== "undefined") {
        import("react-number-format").then((pkg: unknown) => {
          // Handle both CommonJS and ES module exports
          let NF: React.ComponentType<NumericFormatProps> | undefined;

          // Type guard for module with NumericFormat property
          const hasNumericFormat = (
            obj: unknown,
          ): obj is {
            NumericFormat: React.ComponentType<NumericFormatProps>;
          } =>
            typeof obj === "object" && obj !== null && "NumericFormat" in obj;

          // Type guard for module with default property
          const hasDefault = (obj: unknown): obj is { default: unknown } =>
            typeof obj === "object" && obj !== null && "default" in obj;

          // Try named export first
          if (hasNumericFormat(pkg)) {
            NF = pkg.NumericFormat;
          }
          // Try default export with NumericFormat property
          else if (hasDefault(pkg)) {
            const defaultExport = pkg.default;
            if (
              typeof defaultExport === "object" &&
              defaultExport !== null &&
              hasNumericFormat(defaultExport)
            ) {
              NF = defaultExport.NumericFormat;
            }
            // Try default export as the component itself
            else if (
              typeof defaultExport === "function" ||
              (typeof defaultExport === "object" &&
                defaultExport !== null &&
                "$$typeof" in defaultExport)
            ) {
              NF = defaultExport as React.ComponentType<NumericFormatProps>;
            }
          }

          if (NF) {
            setNumericFormat(() => NF);
          }
        });
      }
    }, []);

    // Type assertions for destructured props to work around index signature limitation
    const typedClassName = className as string | undefined;
    const typedDisabled = disabled as boolean;
    const typedPlaceholder = placeholder as string | undefined;
    const typedValue = value as string | number | undefined;
    const typedDecimalScale = decimalScale as number;
    const typedFixedDecimalScale = fixedDecimalScale as boolean;
    const typedAllowNegative = allowNegative as boolean;
    const typedThousandSeparator = thousandSeparator as boolean | string;
    const typedOnChange = onChange as ((value: string) => void) | undefined;

    if (!isMounted) {
      return (
        <input
          className={cn(inputClassName, typedClassName)}
          disabled={typedDisabled}
          placeholder={typedPlaceholder}
          ref={ref}
          type="text"
          value={typedValue ?? ""}
        />
      );
    }

    if (!NumericFormat) {
      return (
        <input
          className={cn(inputClassName, typedClassName)}
          disabled={typedDisabled}
          placeholder={typedPlaceholder}
          ref={ref}
          type="text"
          value={typedValue ?? ""}
        />
      );
    }

    // Extract only valid HTML attributes and data attributes from restProps
    const additionalProps: Record<string, unknown> = {};
    for (const key in restProps) {
      if (
        typeof key === "string" &&
        (key.startsWith("data-") ||
          key.startsWith("aria-") ||
          key === "id" ||
          key === "testId" ||
          key === "data-testid")
      ) {
        additionalProps[key] = (restProps as Record<string, unknown>)[key];
      }
    }

    return (
      <NumericFormat
        {...additionalProps}
        allowNegative={typedAllowNegative}
        className={cn(inputClassName, typedClassName)}
        decimalScale={typedDecimalScale}
        disabled={typedDisabled}
        fixedDecimalScale={typedFixedDecimalScale}
        getInputRef={ref}
        onValueChange={(values) => {
          if (typedOnChange) {
            typedOnChange(values.value);
          }
        }}
        placeholder={typedPlaceholder}
        thousandSeparator={typedThousandSeparator}
        value={typedValue ?? ""}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

// Quantity input variant (whole numbers only)
export interface QuantityInputProps
  extends Omit<
    NumberInputProps,
    "decimalScale" | "fixedDecimalScale" | "thousandSeparator"
  > {
  value?: string | number;
  onChange?: (value: string) => void;
}

export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <NumberInput
        {...props}
        allowNegative={false}
        decimalScale={0}
        fixedDecimalScale={false}
        onChange={onChange}
        ref={ref}
        thousandSeparator={false}
        value={value}
      />
    );
  },
);

QuantityInput.displayName = "QuantityInput";

// Currency input variant (for prices, amounts, etc.)
export interface CurrencyInputProps
  extends Omit<NumberInputProps, "decimalScale" | "fixedDecimalScale"> {
  value?: string | number;
  onChange?: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <NumberInput
        {...props}
        allowNegative={false}
        decimalScale={2}
        fixedDecimalScale={false}
        onChange={onChange}
        placeholder="0.00"
        ref={ref}
        thousandSeparator={true}
        value={value}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
