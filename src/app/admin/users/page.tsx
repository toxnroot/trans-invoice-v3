
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, secondaryAuth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/invoice/header';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, updateUserRole, createUserProfile } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // State for the create user dialog
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          if (profile.role !== 'admin') {
            toast({ variant: 'destructive', title: 'غير مصرح به', description: 'ليس لديك إذن لعرض هذه الصفحة.' });
            router.push('/');
          } else {
            fetchUsers();
          }
        } else {
            router.push('/');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router, toast]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة المستخدمين.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'deploy') => {
      if (!userProfile || userProfile.role !== 'admin') {
          toast({ variant: 'destructive', title: 'غير مصرح به' });
          return;
      }
      if (currentUser?.uid === targetUserId) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكنك تغيير صلاحيتك.' });
        return;
      }

      setIsUpdating(targetUserId);
      try {
        await updateUserRole(targetUserId, newRole);
        toast({ title: 'تم التحديث', description: `تم تحديث صلاحية المستخدم بنجاح.` });
        fetchUsers();
      } catch (error) {
          console.error("Error updating role:", error);
          const errorMessage = error instanceof Error ? error.message : "فشل تحديث الصلاحية.";
          toast({ variant: 'destructive', title: 'خطأ', description: errorMessage });
      } finally {
        setIsUpdating(null);
      }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول.' });
      return;
    }
    if (!secondaryAuth) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'خدمة المصادقة غير متاحة، لا يمكن إنشاء مستخدم.' });
      return;
    }
    setIsCreatingUser(true);
    try {
      // Use secondary auth to create user without logging out the admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      const user = userCredential.user;
      
      // Create the user profile in Firestore via server action
      await createUserProfile({ uid: user.uid, name: newUserName, email: user.email! });

      toast({ title: 'تم إنشاء المستخدم', description: 'تم إنشاء المستخدم بنجاح.' });
      setIsCreateUserDialogOpen(false);
      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      // Refresh the user list
      fetchUsers();
    } catch (error: any) {
      console.error("User creation error:", error);
      let description = "حدث خطأ غير متوقع.";
      if (error.code === 'auth/email-already-in-use') {
        description = "هذا البريد الإلكتروني مستخدم بالفعل.";
      } else if (error.code === 'auth/weak-password') {
        description = "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
      }
      toast({ variant: 'destructive', title: 'فشل إنشاء المستخدم', description });
    } finally {
      setIsCreatingUser(false);
    }
  };


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
            إدارة المستخدمين
          </h1>
          <div className="flex-1" />
           <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <Button><PlusCircle className="ml-2 h-4 w-4" /> إضافة مستخدم جديد</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل المستخدم الجديد. سيتم تعيين صلاحية "موظف" له بشكل افتراضي.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      الاسم
                    </Label>
                    <Input id="name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      البريد الإلكتروني
                    </Label>
                    <Input id="email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      كلمة المرور
                    </Label>
                    <Input id="password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateUser} disabled={isCreatingUser}>
                    {isCreatingUser ? "جاري الإنشاء..." : "إنشاء مستخدم"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>عرض وتعديل صلاحيات المستخدمين في النظام.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>الاسم</TableHead>
                            <TableHead>البريد الإلكتروني</TableHead>
                            <TableHead className="w-[180px]">الصلاحية</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Select
                                        value={user.role}
                                        onValueChange={(newRole: 'admin' | 'deploy') => handleRoleChange(user.uid, newRole)}
                                        disabled={user.uid === currentUser?.uid || isUpdating === user.uid}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">مدير</SelectItem>
                                            <SelectItem value="deploy">موظف</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
