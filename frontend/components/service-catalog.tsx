"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Server,
  Globe,
  Clock,
  Activity,
  AlertCircle,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "deploying";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceCatalogProps {
  initialServices: Service[];
  dbAvailable: boolean;
}

export function ServiceCatalog({
  initialServices,
  dbAvailable,
}: ServiceCatalogProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "deploying">(
    "active"
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshServices = useCallback(async () => {
    const response = await fetch("/api/services");
    if (response.ok) {
      const data = await response.json();
      setServices(data);
    }
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, status }),
      });

      if (response.ok) {
        setName("");
        setDescription("");
        setStatus("active");
        await refreshServices();
        toast.success("Сервис добавлен");
      } else {
        const error = await response.json();
        toast.error(error.error || "Ошибка создания сервиса");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = (id: string) => {
    toast("Удалить сервис?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          try {
            const response = await fetch(`/api/services?id=${id}`, {
              method: "DELETE",
            });

            if (response.ok) {
              await refreshServices();
              toast.success("Сервис удалён");
            } else {
              const error = await response.json();
              toast.error(error.error || "Ошибка удаления сервиса");
            }
          } catch {
            toast.error("Ошибка удаления сервиса");
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          badge: (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              <Activity className="h-3 w-3 mr-1" />
              Активен
            </Badge>
          ),
          icon: <Globe className="h-5 w-5 text-emerald-600" />,
          border: "border-l-emerald-500",
        };
      case "inactive":
        return {
          badge: (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Неактивен
            </Badge>
          ),
          icon: <Server className="h-5 w-5 text-slate-500" />,
          border: "border-l-slate-400",
        };
      case "deploying":
        return {
          badge: (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
              <div className="h-3 w-3 mr-1 rounded-full bg-amber-500 animate-pulse" />
              Деплой
            </Badge>
          ),
          icon: <Server className="h-5 w-5 text-amber-600" />,
          border: "border-l-amber-500",
        };
      default:
        return {
          badge: <Badge variant="outline">{status}</Badge>,
          icon: <Server className="h-5 w-5 text-slate-500" />,
          border: "border-l-slate-400",
        };
    }
  };

  const getStatusCount = (status: string) =>
    services.filter((s) => s.status === status).length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-700">
                {getStatusCount("active")}
              </div>
              <p className="text-xs text-muted-foreground">Активных</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-700">
                {getStatusCount("deploying")}
              </div>
              <p className="text-xs text-muted-foreground">В деплое</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-700">
                {getStatusCount("inactive")}
              </div>
              <p className="text-xs text-muted-foreground">Неактивных</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Service Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Добавить сервис</CardTitle>
          </div>
          <CardDescription>
            {dbAvailable
              ? "Создайте новый сервис в каталоге"
              : "Режим просмотра — база данных недоступна"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: API Gateway"
                  disabled={!dbAvailable || isLoading}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "active" | "inactive" | "deploying"
                    )
                  }
                  disabled={!dbAvailable || isLoading}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                  <option value="deploying">Деплой</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание сервиса"
                disabled={!dbAvailable || isLoading}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={!dbAvailable || isLoading}
              className="h-11 px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? "Создание..." : "Добавить сервис"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Каталог сервисов
          </h2>
          <Badge variant="outline" className="text-sm">
            <Server className="h-3.5 w-3.5 mr-1" />
            {services.length}{" "}
            {services.length === 1
              ? "сервис"
              : services.length < 5
                ? "сервиса"
                : "сервисов"}
          </Badge>
        </div>

        {services.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Server className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">
                Сервисы не найдены
              </p>
              {dbAvailable && (
                <p className="text-sm text-muted-foreground">
                  Добавьте первый сервис с помощью формы выше
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const config = getStatusConfig(service.status);
              return (
                <Card
                  key={service.id}
                  className={`card-hover border-l-4 ${config.border} group`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">
                            {service.name}
                          </CardTitle>
                          <div className="mt-1">{config.badge}</div>
                        </div>
                      </div>
                    </div>
                    {service.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {service.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(service.createdAt).toLocaleDateString(
                            "ru-RU"
                          )}
                        </span>
                      </div>
                      {dbAvailable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
