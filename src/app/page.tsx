import { Header } from '@/components/header';
import { AppTabs } from '@/components/app-tabs';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AppTabs />
      </main>
    </div>
  );
}
