import { Beer } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <Beer className="h-8 w-8 text-primary" />
          <h1 className="ml-3 text-3xl font-bold tracking-tight text-foreground font-headline">
            NomikAI
          </h1>
        </div>
      </div>
    </header>
  );
}
