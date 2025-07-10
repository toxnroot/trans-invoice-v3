import RegisterForm from "@/components/auth/register-form";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
            <Image src="/logo.png" alt="SHAMS TEX Logo" width={150} height={150} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">SHAMS TEX</h1>
            <p className="text-muted-foreground">إنشاء حساب جديد للمتابعة</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
