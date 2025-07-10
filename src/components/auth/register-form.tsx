
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile } from '@/app/actions';
import Link from 'next/link';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'كلمات المرور غير متطابقة.' });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await createUserProfile({ uid: user.uid, name, email: user.email! });

      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء حسابك بنجاح. الرجاء تسجيل الدخول.",
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Registration Error:", error.code);
      let description = "حدث خطأ غير متوقع.";
      if (error.code === 'auth/email-already-in-use') {
        description = "هذا البريد الإلكتروني مستخدم بالفعل.";
      } else if (error.code === 'auth/weak-password') {
        description = "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
      }
      toast({ variant: 'destructive', title: 'فشل التسجيل', description });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء حساب</CardTitle>
        <CardDescription>أدخل بياناتك للتسجيل.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
          </div>
            <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
            </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
            هل لديك حساب بالفعل؟{" "}
            <Link href="/login" className="underline">
                تسجيل الدخول
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
