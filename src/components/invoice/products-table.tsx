
"use client";

import { Product, UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogFooter
  } from "@/components/ui/alert-dialog"


interface ProductsTableProps {
  products: Product[];
  discount: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  isLocked: boolean;
  userRole: UserProfile['role'];
}

export default function ProductsTable({ products, discount, onEdit, onDelete, isLocked, userRole }: ProductsTableProps) {
  
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  
  const totals = products.reduce((acc, p) => ({
      quantity: acc.quantity + (p.quantity || 0),
      meter: acc.meter + (p.meter || 0),
      total: acc.total + (p.total || 0)
  }), { quantity: 0, meter: 0, total: 0});

  const finalTotal = totals.total - (discount || 0);

  if (products.length === 0) {
    return <div className="text-center text-muted-foreground p-8">لم يتم إضافة منتجات بعد.</div>;
  }
  
  return (
    <div className="mt-4 border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">م</TableHead>
            <TableHead>الصنف</TableHead>
            <TableHead className="text-center">السعر</TableHead>
            <TableHead className="text-center">العدد</TableHead>
            <TableHead className="text-center">متر/كغ</TableHead>
            <TableHead className="text-center">الإجمالي</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-center">{formatNumber(product.price || 0)}</TableCell>
              <TableCell className="text-center">{product.quantity || 0}</TableCell>
              <TableCell className="text-center">{formatNumber(product.meter || 0)}</TableCell>
              <TableCell className="text-center font-semibold">{formatNumber(product.total || 0)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(index)} disabled={isLocked}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {userRole === 'admin' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLocked} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد من حذف هذا المنتج؟</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(index)}>متابعة</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={5}>الإجمالي الفرعي</TableCell>
                <TableCell className="text-center" colSpan={2}>{formatNumber(totals.total)} ج.م</TableCell>
            </TableRow>
             <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={5}>الخصم</TableCell>
                <TableCell className="text-center" colSpan={2}>{formatNumber(discount || 0)} ج.م</TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-bold text-lg text-primary">
                <TableCell colSpan={5}>الإجمالي النهائي</TableCell>
                <TableCell className="text-center" colSpan={2}>{formatNumber(finalTotal)} ج.م</TableCell>
            </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
