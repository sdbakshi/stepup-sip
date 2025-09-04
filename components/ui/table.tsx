import * as React from "react";
export function Table({ className = "", ...props }: React.HTMLAttributes<HTMLTableElement>) { return <table className={`w-full text-sm ${className}`} {...props} />; }
export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props} />; }
export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} />; }
export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className="border-b" {...props} />; }
export function TableHead({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className={`text-left p-2 ${className}`} {...props} />; }
export function TableCell({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className={`p-2 ${className}`} {...props} />; }
