
"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, MenuSquare, Printer } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  userProfile: UserProfile;
  onToggleList?: () => void;
  onTogglePreview?: () => void;
}

export default function Header({ userProfile, onToggleList, onTogglePreview }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="SHAMS TEX logo" width={32} height={32} />
        <h1 className="text-xl font-bold">SHAMS TEX</h1>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {onToggleList && (
            <Button size="sm" variant="outline" onClick={onToggleList}>
                <MenuSquare className="ml-2 h-4 w-4" />
                عرض الفواتير
            </Button>
        )}
        {onTogglePreview && (
            <Button size="sm" variant="outline" onClick={onTogglePreview}>
                <Printer className="ml-2 h-4 w-4" />
                عرض المعاينة
            </Button>
        )}
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
            مرحباً, {userProfile.name} ({userProfile.role === 'admin' ? 'مدير' : 'موظف'})
            </span>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                <Avatar>
                    <AvatarImage src={`https://placehold.co/32x32.png`} alt={userProfile.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{getAvatarFallback(userProfile.name)}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userProfile.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
