import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserNav } from "./UserNav";

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">Your App Name</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {!isLoading && !user ? (
            <div className="flex items-center space-x-4">
              <Link href="/log-in">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign up</Button>
              </Link>
            </div>
          ) : (
            <UserNav />
          )}
        </div>
      </div>
    </header>
  );
} 