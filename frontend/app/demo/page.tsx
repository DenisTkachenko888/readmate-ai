import { isDatabaseAvailable } from "@/lib/db";
import { getAllServices } from "@/lib/models";
import { mockServices } from "@/lib/mock-data";
import { ServiceCatalog } from "@/components/service-catalog";

export const dynamic = "force-dynamic";

async function getServices() {
  if (await isDatabaseAvailable()) {
    try {
      return { services: await getAllServices(), dbAvailable: true };
    } catch {
      // fall through to mock data
    }
  }
  return { services: mockServices, dbAvailable: false };
}

export default async function DemoPage() {
  const { services, dbAvailable } = await getServices();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">Каталог сервисов</h1>
        <p className="text-muted-foreground">
          Образец CRUD-приложения на DynamoDB. Удалите эту страницу, когда
          реализуете ваш сервис.
        </p>
      </div>
      <ServiceCatalog initialServices={services} dbAvailable={dbAvailable} />
    </div>
  );
}
