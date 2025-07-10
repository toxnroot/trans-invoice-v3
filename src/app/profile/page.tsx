
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/invoice/header';
import { ArrowRight, Download, FileUp, Upload, Trash2, Users, ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { backupInvoices, restoreInvoices, deleteAllInvoices } from '@/app/actions';
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
  } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            router.push('/'); // Redirect if no profile found
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          router.push('/');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
        const jsonString = await backupInvoices();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoiceflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'تم النسخ الاحتياطي بنجاح', description: 'تم تنزيل بياناتك.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'فشل النسخ الاحتياطي', description: 'لا يمكن إنشاء ملف النسخ الاحتياطي.' });
    } finally {
        setIsBackingUp(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
          setRestoreFile(event.target.files[0]);
      }
  };

  const handleRestore = async () => {
      if (!restoreFile) {
          toast({ variant: 'destructive', title: 'لم يتم تحديد ملف' });
          return;
      }

      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
          const content = e.target?.result as string;
          try {
              const result = await restoreInvoices(content);
              toast({ title: 'تمت الاستعادة بنجاح', description: `تمت استعادة ${result.count} فاتورة.` });
              setRestoreFile(null);
              if(fileInputRef.current) fileInputRef.current.value = "";
          } catch (error) {
              toast({ variant: 'destructive', title: 'فشلت الاستعادة', description: 'الملف المحدد ليس نسخة احتياطية صالحة.' });
          } finally {
              setIsRestoring(false);
          }
      };
      reader.onerror = () => {
          toast({ variant: 'destructive', title: 'خطأ في قراءة الملف' });
          setIsRestoring(false);
      };
      reader.readAsText(restoreFile);
  };

  const handleDeleteAll = async () => {
      setIsDeleting(true);
      try {
          await deleteAllInvoices();
          toast({ title: 'تم حذف جميع البيانات', description: 'تمت إزالة جميع الفواتير بشكل دائم.' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'فشل الحذف', description: 'لا يمكن حذف جميع الفواتير.' });
      } finally {
          setIsDeleting(false);
      }
  }


  if (isLoading || !userProfile) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header userProfile={userProfile} />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/')}>
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            الملف الشخصي
          </h1>
        </div>
        <div className="grid gap-6">
            <Card>
            <CardHeader>
                <CardTitle>{userProfile.name}</CardTitle>
                <CardDescription>هذه هي تفاصيل حسابك المسجلة في النظام.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                <p>{userProfile.email}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">الدور</p>
                <p className="capitalize">{userProfile.role === 'admin' ? 'مدير' : 'موظف'}</p>
                </div>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>أدوات</CardTitle>
                    <CardDescription>إدارة الاقتراحات لتحسين عملية إدخال الفواتير.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-semibold">إدارة الاقتراحات</h3>
                            <p className="text-sm text-muted-foreground">إضافة وحذف اقتراحات الأصناف والألوان.</p>
                        </div>
                        <Button onClick={() => router.push('/admin/suggestions')}>
                            <ListPlus className="ml-2 h-4 w-4" />
                            إدارة الاقتراحات
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {userProfile.role === 'admin' && (
              <Card>
                  <CardHeader>
                      <CardTitle>لوحة تحكم المدير</CardTitle>
                      <CardDescription>
                          إدارة البيانات وصلاحيات المستخدمين في النظام. كن حذراً، فهذه الإجراءات لا يمكن التراجع عنها.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                              <h3 className="font-semibold">إدارة المستخدمين</h3>
                              <p className="text-sm text-muted-foreground">عرض وتعديل صلاحيات المستخدمين.</p>
                          </div>
                          <Button onClick={() => router.push('/admin/users')}>
                              <Users className="ml-2 h-4 w-4" />
                              إدارة المستخدمين
                          </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                              <h3 className="font-semibold">نسخة احتياطية</h3>
                              <p className="text-sm text-muted-foreground">تنزيل جميع الفواتير كملف JSON.</p>
                          </div>
                          <Button onClick={handleBackup} disabled={isBackingUp}>
                              <Download className="ml-2 h-4 w-4" />
                              {isBackingUp ? 'جاري ...' : 'تنزيل النسخة الاحتياطية'}
                          </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                          <div>
                              <h3 className="font-semibold">استعادة البيانات</h3>
                              <p className="text-sm text-muted-foreground">استعادة الفواتير من ملف JSON.</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <Input
                                  id="restoreFile"
                                  type="file"
                                  accept=".json"
                                  onChange={handleFileChange}
                                  className="hidden"
                                  ref={fileInputRef}
                              />
                              <Label htmlFor="restoreFile" className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>
                                  <FileUp className="ml-2 h-4 w-4" />
                                  <span className="truncate max-w-xs">{restoreFile ? restoreFile.name : 'اختر ملف'}</span>
                              </Label>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button disabled={!restoreFile || isRestoring}>
                                          <Upload className="ml-2 h-4 w-4" />
                                          {isRestoring ? 'جاري ...' : 'استعادة'}
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              سيؤدي هذا إلى استبدال جميع الفواتير الحالية بالبيانات من الملف. هذا الإجراء لا يمكن التراجع عنه.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                          <AlertDialogAction onClick={handleRestore}>نعم، قم بالاستعادة</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                          <div>
                              <h3 className="font-semibold text-destructive">منطقة الخطر</h3>
                              <p className="text-sm text-red-500/80">حذف جميع الفواتير بشكل دائم.</p>
                          </div>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" disabled={isDeleting}>
                                      <Trash2 className="ml-2 h-4 w-4" />
                                      {isDeleting ? 'جاري الحذف...' : 'حذف كل شيء'}
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>تحذير! هل أنت متأكد تماماً؟</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          هذا الإجراء سيحذف <span className="font-bold">جميع</span> الفواتير بشكل دائم ولا يمكن التراجع عنه.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteAll} className={buttonVariants({variant: 'destructive'})}>
                                          نعم، أحذف كل شيء
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                  </CardContent>
              </Card>
            )}

        </div>
      </main>
    </div>
  );
}
