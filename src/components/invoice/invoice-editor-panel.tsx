"use client";

import { useState } from 'react';
import { Invoice, Product, UserProfile, InvoiceState, PaymentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, Unlock, FilePlus, Share2, Edit, Trash2 } from 'lucide-react';
import { createOrUpdateInvoice, updateInvoiceStatus, deleteInvoice } from '@/app/actions';
import ProductsTable from './products-table';
import { Datalist, DatalistOption } from '@/components/ui/datalist';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

interface InvoiceEditorPanelProps {
  invoice: Invoice;
  userProfile: UserProfile;
  onInvoiceChange: (updatedInvoice: Invoice) => void;
  onSelectInvoice: (invoice: Invoice | null) => void;
  getProductSuggestions: (query: string) => Promise<string[]>;
  getColorSuggestions: (query: string) => Promise<string[]>;
  getCustomerSuggestions: (query: string) => Promise<string[]>;
  userId: string;
}

const emptyProduct: Omit<Product, 'id' | 'total'> = { name: '', color: '', price: 0, quantity: 1, meter: 0 };

export default function InvoiceEditorPanel({ invoice, userProfile, onInvoiceChange, onSelectInvoice, getProductSuggestions, getColorSuggestions, getCustomerSuggestions, userId }: InvoiceEditorPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState(emptyProduct);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  
  const isNewInvoice = !invoice.id;
  const isLocked = invoice.isCompleted || false;

  const handleCreateNewInvoice = () => {
    if (invoice.id && !invoice.isCompleted) {
        toast({
            variant: "destructive",
            title: "الفاتورة الحالية مفتوحة",
            description: "يجب قفل الفاتورة الحالية أولاً قبل إنشاء واحدة جديدة.",
        });
        return;
    }
    onSelectInvoice(null);
  }

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    onInvoiceChange({ ...invoice, [field]: value });
  };
  
  const handleCustomerNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFieldChange('customerName', value);
    if (value.length > 1) {
      const result = await getCustomerSuggestions(value);
      setCustomerSuggestions(result);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoice.customerName || !invoice.date) {
        toast({ variant: "destructive", title: "خطأ", description: "اسم العميل وتاريخ الفاتورة حقول مطلوبة." });
        return;
    }
    if (invoice.products.length === 0) {
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكن حفظ فاتورة فارغة. الرجاء إضافة منتج واحد على الأقل." });
        return;
    }
    setIsSaving(true);
    try {
        const invoiceData: Partial<Invoice> = {
            ...invoice,
            userId: invoice.userId || userId,
        };
        const savedInvoice = await createOrUpdateInvoice(isNewInvoice ? null : invoice.id, invoiceData);
        toast({ title: "تم الحفظ", description: "تم حفظ الفاتورة بنجاح." });
        onSelectInvoice(savedInvoice);
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الفاتورة." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (isNewInvoice) return;
    setIsSaving(true);
    const newCompletedState = !invoice.isCompleted;
    try {
        await updateInvoiceStatus(invoice.id, { isCompleted: newCompletedState });
        toast({ title: "تم تحديث الحالة", description: `الفاتورة الآن ${newCompletedState ? 'مقفولة' : 'مفتوحة'}.` });
        handleFieldChange('isCompleted', newCompletedState);
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الفاتورة." });
    } finally {
        setIsSaving(false);
    }
  }

  const handleToggleTransfer = async () => {
    if (isNewInvoice) return;
    setIsSaving(true);
    const newTransferState = !invoice.isTransfer;
    try {
        await updateInvoiceStatus(invoice.id, { isTransfer: newTransferState });
        toast({ title: "تم تحديث الحالة", description: `تم ${newTransferState ? 'ترحيل' : 'إلغاء ترحيل'} الفاتورة.` });
        handleFieldChange('isTransfer', newTransferState);
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الترحيل." });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteInvoice = async () => {
    if (isNewInvoice) return;
    setIsSaving(true);
    try {
        await deleteInvoice(invoice.id);
        toast({ title: "تم الحذف", description: "تم حذف الفاتورة بنجاح." });
        onSelectInvoice(null);
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الفاتورة." });
    } finally {
        setIsSaving(false);
    }
};
  
  const handleAddOrUpdateProduct = () => {
    if (!product.name || !product.color || product.price <= 0 || product.quantity < 0 || product.meter < 0) {
      toast({ variant: 'destructive', title: 'بيانات المنتج غير صالحة', description: 'الرجاء التأكد من ملء الصنف واللون والسعر.' });
      return;
    }
    
    let updatedProducts: Product[];
    if (editingProductIndex !== null) {
      updatedProducts = [...invoice.products];
      const existingProduct = updatedProducts[editingProductIndex];
      updatedProducts[editingProductIndex] = { ...existingProduct, ...product, total: product.price * product.meter };
    } else {
      const newProduct: Product = { ...product, id: Date.now(), total: product.price * product.meter };
      updatedProducts = [...invoice.products, newProduct];
    }

    handleFieldChange('products', updatedProducts);
    setProduct(emptyProduct);
    setEditingProductIndex(null);
  };

  const handleEditProduct = (index: number) => {
    setProduct(invoice.products[index]);
    setEditingProductIndex(index);
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = invoice.products.filter((_, i) => i !== index);
    handleFieldChange('products', updatedProducts);
  };

  const handleProductNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProduct({ ...product, name: value });
    if (value.length > 1) {
      const result = await getProductSuggestions(value);
      setProductSuggestions(result);
    } else {
      setProductSuggestions([]);
    }
  };

  const handleColorNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProduct({ ...product, color: value });
    if (value.length > 1) {
      const result = await getColorSuggestions(value);
      setColorSuggestions(result);
    } else {
      setColorSuggestions([]);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col border-0 rounded-none">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10">
          <div>
            <CardTitle className="flex items-center gap-2">
                {isNewInvoice ? 'فاتورة جديدة' : 
                    userProfile.role === 'admin' ? (
                        <div className="flex items-baseline gap-1">
                            <span>تعديل الفاتورة #</span>
                            <Input
                                type="number"
                                value={invoice.invoiceNumber}
                                onChange={(e) => handleFieldChange('invoiceNumber', +e.target.value)}
                                disabled={isLocked || isSaving}
                                className="w-28 h-9 text-center font-semibold text-2xl bg-transparent border-dashed disabled:cursor-not-allowed disabled:border-none disabled:bg-transparent"
                            />
                        </div>
                    ) : (
                        `تعديل الفاتورة #${invoice.invoiceNumber}`
                    )
                }
                {/* حالة الفاتورة */}
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-bold',
                    invoice.state === 'أذن مرتجع'
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                  )}
                  style={{ minWidth: 80, textAlign: 'center' }}
                >
                  {invoice.state}
                </span>
                {!isNewInvoice && (
                    <span className={cn(
                        "status-icon text-sm",
                        invoice.isTransfer ? "transferred" : "not-transferred"
                    )}>
                    {invoice.isTransfer ? 'مرحّلة' : 'غير مرحّلة'}
                    </span>
                )}
            </CardTitle>
            <CardDescription>
                {isNewInvoice ? 'ادخل تفاصيل الفاتورة الجديدة' : `آخر تحديث: ${new Date(invoice.date).toLocaleDateString('en-CA')}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCreateNewInvoice}><FilePlus className="ml-2 h-4 w-4" />جديدة</Button>
            <Button size="sm" onClick={handleSaveInvoice} disabled={isSaving || isLocked}><Save className="ml-2 h-4 w-4" />حفظ</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Datalist
                    label="اسم العميل"
                    id="customerName"
                    value={invoice.customerName}
                    onInput={handleCustomerNameChange}
                    onSelect={(value) => {
                        handleFieldChange('customerName', value);
                        setCustomerSuggestions([]);
                    }}
                    disabled={isLocked}
                >
                    {customerSuggestions.map((s,i) => <DatalistOption key={i} value={s} />)}
                </Datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">تاريخ الفاتورة</Label>
                <Input id="invoiceDate" type="date" value={invoice.date} onChange={e => handleFieldChange('date', e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>نوع الفاتورة</Label>
                     <RadioGroup onValueChange={(v: InvoiceState) => handleFieldChange('state', v)} value={invoice.state} className="grid grid-cols-2 gap-2" disabled={isLocked}>
                        <div>
                          <RadioGroupItem value="أذن تسليم" id="r1" className="peer sr-only" />
                          <Label
                            htmlFor="r1"
                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            أذن تسليم
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="أذن مرتجع" id="r2" className="peer sr-only" />
                          <Label
                            htmlFor="r2"
                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            أذن مرتجع
                          </Label>
                        </div>
                      </RadioGroup>
                </div>
                 <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <RadioGroup onValueChange={(v: PaymentType) => handleFieldChange('paymentType', v)} value={invoice.paymentType} className="grid grid-cols-2 gap-2" disabled={isLocked}>
                        <div>
                          <RadioGroupItem value="نقدي" id="p1" className="peer sr-only" />
                          <Label
                            htmlFor="p1"
                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            نقدي
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="أجل" id="p2" className="peer sr-only" />
                          <Label
                            htmlFor="p2"
                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            أجل
                          </Label>
                        </div>
                      </RadioGroup>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>المنتجات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                       <Datalist
                            label="الصنف"
                            value={product.name}
                            onInput={handleProductNameChange}
                            onSelect={(value) => {
                                setProduct({ ...product, name: value });
                                setProductSuggestions([]);
                            }}
                            disabled={isLocked}
                        >
                            {productSuggestions.map((s,i) => <DatalistOption key={i} value={s} />)}
                        </Datalist>
                        <Datalist
                            label="اللون"
                            value={product.color}
                            onInput={handleColorNameChange}
                            onSelect={(value) => {
                                setProduct({ ...product, color: value });
                                setColorSuggestions([]);
                            }}
                            disabled={isLocked}
                        >
                            {colorSuggestions.map((s,i) => <DatalistOption key={i} value={s} />)}
                        </Datalist>
                        <div className="space-y-1">
                            <Label htmlFor="productPrice">السعر</Label>
                            <Input id="productPrice" type="number" value={product.price} onChange={e => setProduct({...product, price: +e.target.value})} disabled={isLocked} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="productCount">العدد</Label>
                            <Input id="productCount" type="number" value={product.quantity} onChange={e => setProduct({...product, quantity: +e.target.value})} disabled={isLocked} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="productMeter">متر/كغ</Label>
                            <Input id="productMeter" type="number" value={product.meter} onChange={e => setProduct({...product, meter: +e.target.value})} disabled={isLocked} />
                        </div>
                        <Button onClick={handleAddOrUpdateProduct} disabled={isSaving || isLocked} className="w-full">
                          {editingProductIndex !== null ? <Edit className="ml-2 h-4 w-4" /> : <PlusCircle className="ml-2 h-4 w-4" />}
                          {editingProductIndex !== null ? 'تحديث' : 'إضافة'}
                        </Button>
                    </div>

                    <ProductsTable 
                      products={invoice.products} 
                      discount={invoice.discount || 0} 
                      onEdit={handleEditProduct} 
                      onDelete={handleDeleteProduct} 
                      isLocked={isLocked}
                      userRole={userProfile.role}
                    />
                </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4 items-start pt-4">
                 <div className="space-y-2  ">
                    <Label htmlFor="discount">الخصم</Label>
                    <Input className='border-2 border-red-500' id="discount" type="number" value={invoice.discount || 0} onChange={e => handleFieldChange('discount', +e.target.value)} disabled={isLocked} />
                    <span>تقدر تستخدمه اذا كان في خصم</span>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="note">ملاحظات</Label>
                    <Textarea id="note" value={invoice.note} onChange={e => handleFieldChange('note', e.target.value)} disabled={isLocked}/>
                 </div>
            </div>

            {!isNewInvoice && (
              <div className="flex gap-2 justify-end pt-4 border-t sticky bottom-0 bg-background py-4">
                  {userProfile.role === 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isSaving || isLocked}>
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف الفاتورة
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                          <AlertDialogDescription>
                              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذه الفاتورة بشكل دائم من خوادمنا.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteInvoice}>متابعة</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button onClick={handleToggleComplete} variant={isLocked ? "secondary" : "destructive"} disabled={isSaving}>
                      <Unlock className="ml-2 h-4 w-4" />
                      {isLocked ? 'فتح الفاتورة' : 'قفل الفاتورة'}
                  </Button>
                  <Button onClick={handleToggleTransfer} variant="outline" disabled={isSaving || isLocked}>
                      <Share2 className="ml-2 h-4 w-4" />
                      {invoice.isTransfer ? 'إلغاء ترحيل' : 'ترحيل'}
                  </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
