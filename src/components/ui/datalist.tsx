"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatalistProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onSelect?: (value: string) => void;
}

const Datalist = React.forwardRef<HTMLInputElement, DatalistProps>(
  ({ label, children, onSelect, onInput, ...props }, ref) => {
    const id = React.useId();
    const listId = `${id}-list`;

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onInput) {
        onInput(e);
      }
      const value = e.target.value;
      const option = document.querySelector(`#${listId} option[value="${value}"]`);
      if (option && onSelect) {
        onSelect(value);
      }
    };

    return (
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} list={listId} onInput={handleInput} ref={ref} autoComplete="off" {...props} />
        <datalist id={listId}>
          {children}
        </datalist>
      </div>
    );
  }
);
Datalist.displayName = "Datalist";

const DatalistOption = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
    (props, ref) => {
        return <option ref={ref} {...props} />;
    }
);
DatalistOption.displayName = "DatalistOption";

export { Datalist, DatalistOption };
