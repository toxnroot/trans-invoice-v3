"use client";

import { Invoice } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

interface InvoicePreviewPanelProps {
  invoice: Invoice | null;
}

export default function InvoicePreviewPanel({ invoice }: InvoicePreviewPanelProps) {
  
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  const totals = invoice?.products.reduce((acc, p) => ({
      quantity: acc.quantity + (p.quantity || 0),
      meter: acc.meter + (p.meter || 0),
      total: acc.total + (p.total || 0)
  }), { quantity: 0, meter: 0, total: 0}) || { quantity: 0, meter: 0, total: 0};
  
  const discount = invoice?.discount || 0;
  const finalTotal = totals.total - discount;


  return (
    <ScrollArea className="flex-1 p-4 bg-slate-100 dark:bg-slate-800">
        {invoice ? (
            <div id="paper">
                <div className="header">
                    <div>
                        <span id="storeName">SHAMS TEX</span>
                        <p>لصناعة وتجارة الأقمشة</p>
                    </div>
                    <div>
                        <h3 id="state-invoice" className="p-1 rounded-md" style={{
                            backgroundColor: invoice.state === 'أذن مرتجع' ? 'rgb(209, 32, 32)' : '#28a745',
                            color: '#fff'
                        }}>{invoice.state}</h3>
                        <p className="invoice-number w-full text-center text-lg"> No : <span id="invoiceNumber">{invoice.invoiceNumber || '-'}</span></p>
                    </div>
                    <div>
                        <Image src="/logo.png" alt="SHAMS TEX Logo" className="logo" width={130} height={130} />
                    </div>
                </div>
                <div className="info">
                    <p className="customer text-right">اسم العميل: <span id="customerNameDisplay">{invoice.customerName}</span></p>
                    <p className="text-center">طريقة الدفع: <span>{invoice.paymentType}</span></p>
                    <p className="date text-left">التاريخ: <span id="invoiceDate">{new Date(invoice.date).toLocaleDateString('en-CA')}</span></p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>م</th>
                            <th>الصنف</th>
                            <th>السعر</th>
                            <th>العدد</th>
                            <th>متر / كغ</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.products.map((p, i) => (
                           <tr key={p.id}>
                                <td className='tr'>{i + 1}</td>
                                <td className='tr'>{p.name}</td>
                                <td className='tr'>{formatNumber(p.price || 0)}</td>
                                <td className='tr'>{p.quantity || 0}</td>
                                <td className='tr'>{formatNumber(p.meter || 0)}</td>
                                <td className='tr'>{formatNumber(p.total || 0)}</td>
                           </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3}>الإجمالي الفرعي</td>
                            <td>{totals.quantity}</td>
                            <td>{formatNumber(totals.meter)}</td>
                            <td>{formatNumber(totals.total)}</td>
                        </tr>
                        <tr>
                            <td colSpan={5}>الخصم</td>
                            <td>{formatNumber(discount)}</td>
                        </tr>
                        <tr style={{fontSize: '1.4rem'}}>
                            <td colSpan={5} className="font-semibold">الإجمالي النهائي</td>
                            <td className="font-semibold">{formatNumber(finalTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div className="footer mt-8 flex flex-col items-end">
                    <p className="note-r">ملاحظة: لسنا مسؤولين عن القماش بعد القص</p>
                    <p className="note-r">اسم المستلم وتوقيعه: <span>__________________</span></p>
                    {invoice.note && <p id="notesContainer" className="mt-4">ملاحظة إضافية: <span id="productsNotes">{invoice.note}</span></p>}
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>الرجاء تحديد فاتورة لعرض المعاينة.</p>
            </div>
        )}
      </ScrollArea>
  );
}
