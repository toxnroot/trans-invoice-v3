
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/invoice/header';
import { ArrowRight, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestions, addSuggestion, deleteSuggestion } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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

type SuggestionType = 'nametextile' | 'colors';

const SuggestionManager = ({ type, title }: { type: SuggestionType, title: string }) => {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const suggestions = await getSuggestions(type);
            setItems(suggestions);
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: `فشل في جلب قائمة ${title}.` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        setIsSubmitting(true);
        try {
            await addSuggestion(type, newItem);
            setNewItem('');
            toast({ title: 'تمت الإضافة', description: `تمت إضافة "${newItem}" بنجاح.` });
            fetchItems(); // Refetch to get the updated list
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إضافة العنصر.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async (itemToDelete: string) => {
        try {
            await deleteSuggestion(type, itemToDelete);
            toast({ title: 'تم الحذف', description: `تم حذف "${itemToDelete}" بنجاح.` });
            fetchItems(); // Refetch
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حذف العنصر.' });
        }
    };
    
    if (isLoading) {
        return <Skeleton className="h-64 w-full" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>إضافة أو حذف عناصر من قائمة الاقتراحات.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                    <Input 
                        placeholder={`إضافة ${title.slice(0, -1)} جديد...`}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button type="submit" disabled={isSubmitting || !newItem.trim()}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="mr-2">إضافة</span>
                    </Button>
                </form>

                <ScrollArea className="h-64 border rounded-md p-2">
                    {items.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {items.map(item => (
                                <Badge key={item} variant="secondary" className="flex items-center gap-2 text-base p-2">
                                    <span>{item}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="rounded-full hover:bg-destructive/20 text-destructive p-0.5">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   سيتم حذف "{item}" بشكل دائم.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteItem(item)}>حذف</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground p-4">لا توجد عناصر.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};


export default function SuggestionsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          setIsLoading(false);
        } else {
            // No profile found, redirect to home
            router.push('/');
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <main className="flex-1 p-4 md:p-6">
           <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header userProfile={userProfile} />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/profile')}>
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Back to Profile</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            إدارة الاقتراحات
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SuggestionManager type="nametextile" title="الأصناف" />
            <SuggestionManager type="colors" title="الألوان" />
        </div>
      </main>
    </div>
  );
}
