import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-6xl md:text-8xl font-bold text-accent">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Return
            to the dashboard to continue.
          </p>
        </div>

        <Link href="/dashboard">
          <Button variant="default" size="lg">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
