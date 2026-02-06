import { Header } from "@/components/layout/header";
import { MealAnalyzer } from "@/components/features/meal-analyzer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-4 flex items-start justify-center">
        <MealAnalyzer />
      </main>
    </div>
  );
}
