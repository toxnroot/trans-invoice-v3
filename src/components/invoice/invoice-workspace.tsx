"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Invoice, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Printer, Image as ImageIcon } from 'lucide-react';
import Header from './header';
import InvoiceListPanel from './invoice-list-panel';
import InvoiceEditorPanel from './invoice-editor-panel';
import InvoicePreviewPanel from './invoice-preview-panel';
import { suggestProductName } from '@/ai/flows/smart-product-suggestions';


export default function InvoiceWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allProducts, setAllProducts] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [liveInvoice, setLiveInvoice] = useState<Invoice | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const liveInvoiceRef = useRef(liveInvoice);
  liveInvoiceRef.current = liveInvoice;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "invoices"), orderBy("invoiceNumber", "desc"));
    const unsubscribeInvoices = onSnapshot(q, (querySnapshot) => {
        const invoicesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invoice));
        setInvoices(invoicesData);
        
        const currentLiveId = liveInvoiceRef.current?.id;

        if (currentLiveId) {
            const updatedLive = invoicesData.find(inv => inv.id === currentLiveId);
            if (updatedLive) {
                setLiveInvoice(updatedLive);
                setSelectedInvoice(updatedLive);
            } else {
                // The invoice we were editing might have been deleted.
                // Revert to the first invoice or a new one.
                handleSelectInvoice(invoicesData.length > 0 ? invoicesData[0] : null);
            }
        } else if (!liveInvoiceRef.current) {
            // This is the initial load or we were creating a new invoice
            if (invoicesData.length > 0) {
                handleSelectInvoice(invoicesData[0]); // Default to first invoice
            } else {
                handleSelectInvoice(null); // No invoices, create a new one
            }
        }
    }, (error) => {
        console.error("Error fetching invoices:", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل الفواتير." });
    });
    
    const fetchProducts = async () => {
        try {
            const docRef = doc(db, "dropdown", "nametextile");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && Array.isArray(docSnap.data().fields)) {
                setAllProducts(docSnap.data().fields);
            }
        } catch (error) {
            console.error("Error fetching products for suggestions:", error);
        }
    };
    
    fetchProducts();

    return () => unsubscribeInvoices();
  }, [user, toast]);

  const handleSelectInvoice = (invoice: Invoice | null) => {
    if (invoice) {
        setSelectedInvoice(invoice);
        setLiveInvoice(invoice);
    } else {
        // Create new invoice object
        if (user) {
            setLiveInvoice({
                id: '', // Empty ID signifies a new, unsaved invoice
                invoiceNumber: 0,
                date: new Date().toISOString().split('T')[0],
                customerName: '',
                state: 'أذن تسليم',
                paymentType: 'نقدي',
                products: [],
                note: '',
                discount: 0,
                isCompleted: false,
                isTransfer: false,
                userId: user.uid,
            });
            setSelectedInvoice(null);
        }
    }
  };

  const onInvoiceSelectedFromList = (invoice: Invoice) => {
      handleSelectInvoice(invoice);
      setIsListVisible(false);
  };
  
  const handleLiveInvoiceChange = (updatedInvoice: Invoice) => {
      setLiveInvoice(updatedInvoice);
  };

  const getProductSuggestions = async (partialName: string) => {
    if (!partialName) return [];
    try {
      const result = await suggestProductName({
        partialProductName: partialName,
        availableProducts: allProducts,
      });
      return result.suggestions;
    } catch (error) {
      console.error("AI suggestion error:", error);
      return allProducts.filter(p => p.toLowerCase().includes(partialName.toLowerCase()));
    }
  };

   const handlePrint = () => {
    window.print();
  };

  const handleExportImage = () => {
    const paperElement = document.getElementById('paper');
    if (paperElement && (window as any).html2canvas) {
      (window as any).html2canvas(paperElement, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
       }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `Invoice_${liveInvoiceRef.current?.invoiceNumber || 'preview'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    } else {
        toast({ variant: 'destructive', description: "خاصية تصدير الصورة غير متاحة حالياً."})
    }
  };


  if (isLoading || !userProfile || !liveInvoice) {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between p-4 border-b">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </header>
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-full w-full" />
                <Skeleton className="h-full w-full" />
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header
            userProfile={userProfile}
            onToggleList={() => setIsListVisible(true)}
            onTogglePreview={() => setIsPreviewVisible(true)}
        />
        <main className="flex-1 flex flex-col p-4 md:p-6">
             <InvoiceEditorPanel
                key={liveInvoice.id || 'new'} 
                invoice={liveInvoice}
                userProfile={userProfile}
                onInvoiceChange={handleLiveInvoiceChange}
                onSelectInvoice={handleSelectInvoice}
                getProductSuggestions={getProductSuggestions}
                userId={user.uid}
            />
        </main>

        <Sheet open={isListVisible} onOpenChange={setIsListVisible}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>الفواتير المسجلة</SheetTitle>
                </SheetHeader>
                <InvoiceListPanel 
                    invoices={invoices}
                    selectedInvoice={selectedInvoice}
                    onSelectInvoice={onInvoiceSelectedFromList}
                />
            </SheetContent>
        </Sheet>
        
        <Sheet open={isPreviewVisible} onOpenChange={setIsPreviewVisible}>
            <SheetContent side="bottom" className="h-screen w-full p-0 flex flex-col">
                 <SheetHeader className="p-4 border-b flex flex-row items-center justify-between bg-background">
                    <SheetTitle>معاينة الفاتورة</SheetTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrint} disabled={!liveInvoice}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
                        <Button size="sm" variant="outline" onClick={handleExportImage} disabled={!liveInvoice}><ImageIcon className="ml-2 h-4 w-4" /> تصدير صورة</Button>
                    </div>
                </SheetHeader>
                 <InvoicePreviewPanel invoice={liveInvoice} />
            </SheetContent>
        </Sheet>
    </div>
  );
}
