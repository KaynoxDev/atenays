"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option...",
  emptyMessage = "Aucune option trouvée.",
  displayKey = "label",
  valueKey = "value",
  className,
  renderOption,
  popoverWidth = "w-[300px]",
  searchPlaceholder = "Rechercher..."
}) {
  const [open, setOpen] = React.useState(false)

  // Find the display value for the selected item
  const selectedOption = React.useMemo(() => {
    return options?.find(option => option[valueKey] === value)
  }, [options, value, valueKey])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? (
            renderOption ? renderOption(selectedOption, false) : selectedOption?.[displayKey]
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(popoverWidth, "p-0")} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {options?.map((option) => (
              <CommandItem
                key={option[valueKey]}
                value={option[valueKey]?.toString()}
                onSelect={() => {
                  onChange(option[valueKey] === value ? null : option[valueKey])
                  setOpen(false)
                }}
                className="flex items-center gap-2"
              >
                {renderOption ? (
                  renderOption(option, option[valueKey] === value)
                ) : (
                  <>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === option[valueKey] ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option[displayKey]}</span>
                  </>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
