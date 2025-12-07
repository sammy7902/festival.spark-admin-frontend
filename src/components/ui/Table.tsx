import React from "react";
import { cn } from "../../utils/cn";

type TableRootProps = React.HTMLAttributes<HTMLTableElement>;

export const Table: React.FC<TableRootProps> = ({ className, ...props }) => {
  return (
    <table
      className={cn(
        "w-full border-collapse text-left text-sm text-gray-800",
        className
      )}
      {...props}
    />
  );
};

type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
export const TableHeader: React.FC<TableHeadProps> = ({ className, ...props }) => {
  return <thead className={cn("bg-gray-50 text-xs font-semibold", className)} {...props} />;
};

// TableHead is for <th> elements (header cells), not <thead>
type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement>;
export const TableHead: React.FC<TableHeaderCellProps> = ({
  className,
  ...props
}) => {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 font-semibold text-gray-700", className)}
      {...props}
    />
  );
};

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
export const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => {
  return <tbody className={cn("divide-y divide-gray-200", className)} {...props} />;
};

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;
export const TableRow: React.FC<TableRowProps> = ({ className, ...props }) => {
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 focus-within:bg-gray-50 transition-colors",
        className
      )}
      {...props}
    />
  );
};

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
export const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
};

// TableHeaderCell is an alias for TableHead for consistency
export const TableHeaderCell: React.FC<TableHeaderCellProps> = (props) => <TableHead {...props} />;


