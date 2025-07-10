
"use client";

import { useState, useMemo } from 'react';
import { Invoice } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface InvoiceListPanelProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice) => void;
}

export default function InvoiceListPanel({ invoices, selectedInvoice, onSelectInvoice }: InvoiceListPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lowercasedTerm = searchTerm.toLowerCase();
    return invoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(lowercasedTerm) ||
      invoice.invoiceNumber.toString().includes(searchTerm)
    );
  }, [invoices, searchTerm]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو رقم الفاتورة..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4 pt-0">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => onSelectInvoice(invoice)}
                className={cn(
                  "w-full text-right p-3 rounded-lg border transition-colors",
                  selectedInvoice?.id === invoice.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="flex justify-between items-center">
                    <span className="font-semibold">#{invoice.invoiceNumber}</span>
                    <div className="flex items-center gap-2">
                        <span className={cn("status-icon", invoice.isTransfer ? "transferred" : "not-transferred")}>
                            {invoice.isTransfer ? 'مرحّلة' : 'غير مرحّلة'}
                        </span>
                        <span className={cn("status-icon", invoice.isCompleted ? "closed" : "open")}>
                            {invoice.isCompleted ? 'مقفولة' : 'مفتوحة'}
                        </span>
                    </div>
                </div>
                <div className="mt-1 font-medium">{invoice.customerName}</div>
                <div className="text-sm text-muted-foreground mt-1">{invoice.date}</div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground p-4">لا توجد فواتير مطابقة للبحث.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
