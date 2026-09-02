import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-background text-foreground">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Frontend ready - API: http://localhost:8000
          </span>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Kalano
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            A modern multi-vendor marketplace
          </p>
        </div>

        {/* Action Card */}
        <Card className="text-left shadow-sm">
          <CardHeader>
            <CardTitle>Find products from curated vendors</CardTitle>
            <CardDescription>
              Search through items across verified independent merchants or
              subscribe for updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="search" className="flex flex-col sm:flex-row gap-3">
              <Input
                type="search"
                placeholder="Search vendors, products, or categories..."
                aria-label="Search marketplace"
                className="flex-1"
              />
              <Button type="button">Search</Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-muted-foreground">
            <span>Fast, secure, and decentralized architecture</span>
            <span>v0.1.0-alpha</span>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
