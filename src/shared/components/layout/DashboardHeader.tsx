import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb';
import { Separator } from '@shared/components/ui/separator';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import { useAuth } from '@context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'courses':
        return 'Courses';
      case 'labs':
        return 'Practice Labs';
      case 'community':
        return 'Community';
      case 'videos':
        return 'Lessons';
      case 'profile':
        return 'Profile';
      case 'certificates':
        return 'Certificates';
      default:
        return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <header className="border-sidebar-border bg-background flex h-20 shrink-0 items-center justify-between gap-2 border-b px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/dashboard');
                }}
              >
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="GradeU" className="h-10 w-10 object-contain" />
                  <span className="text-foreground font-sans text-2xl font-extrabold tracking-tighter uppercase">
                    Grade<span className="text-brand-400">U</span>
                  </span>
                </div>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{getBreadcrumbTitle(activeTab)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <div className="hidden text-right md:block">
                <p className="text-foreground text-sm font-medium">{user?.name}</p>
              </div>
              <Avatar className="border-border h-8 w-8 border">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mt-2 w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await logout();
                  router.push('/');
                } catch (e) {
                  console.error(e);
                }
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
