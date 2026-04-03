import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  COMMON_CURRENCIES,
  getCommonCurrencyLabel,
} from "~/features/templates/shared/common-currencies";
import { cn } from "~/lib/utils";

export type CurrencyPickerProps = {
  value: string;
  onValueChange: (code: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
};

export function CurrencyPicker({
  value,
  onValueChange,
  id,
  className,
  disabled,
}: CurrencyPickerProps) {
  const [open, setOpen] = React.useState(false);
  const normalized = value.trim().toUpperCase() || "USD";

  React.useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
          id={id}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="truncate text-left">
            {getCommonCurrencyLabel(normalized)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {COMMON_CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency.code}
                  onSelect={() => {
                    onValueChange(currency.code);
                    setOpen(false);
                  }}
                  value={`${currency.code} ${currency.name}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      normalized === currency.code
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {currency.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
