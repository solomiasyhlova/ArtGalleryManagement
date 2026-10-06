import { Palette } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  /** The "No account? Register" / "Have an account? Log in" line. */
  footer: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
            <Palette className="size-6" aria-hidden="true" />
            ArtGalleryManager
          </p>
          <CardTitle>
            <h1 className="text-xl font-semibold">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-muted-foreground">{footer}</CardFooter>
      </Card>
    </main>
  );
}
