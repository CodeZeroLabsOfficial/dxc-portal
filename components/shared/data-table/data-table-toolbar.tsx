"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: {
    columnId: string;
    title: string;
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
  }[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey = "title",
  searchPlaceholder = "Filter...",
  filters = []
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col justify-between gap-2 md:flex-row lg:items-center">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {table.getColumn(searchKey) ? (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : null}
        {filters.map((filter) =>
          table.getColumn(filter.columnId) ? (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={table.getColumn(filter.columnId)}
              title={filter.title}
              options={filter.options}
            />
          ) : null
        )}
        {isFiltered ? (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3">
            Reset
            <X />
          </Button>
        ) : null}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
