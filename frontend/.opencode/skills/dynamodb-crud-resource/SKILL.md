---
name: dynamodb-crud-resource
description: Use when adding a DynamoDB CRUD entity, API route, server/client UI, mock fallback, schema entry, model functions, or migration for this Next.js template.
---

# DynamoDB CRUD Resource

Use this skill for tasks that add or change a DynamoDB-backed CRUD resource in this template.

Do not reread `components/service-catalog.tsx` or `app/api/services/route.ts` just to recover the basic pattern; this skill captures the playbook. Read those files only when a task needs a detail not covered here.

Follow `AGENTS.md` for verification boundaries. This skill does not authorize running `npm run lint`, `npm run typecheck`, `npm run check`, or browser smoke-tests when the external prompt disables them.

## Checklist

1. Add or update the table/index declaration in `lib/schema.ts`.
2. Add TypeScript types and data-access functions in `lib/models.ts`.
3. Add mock fallback rows in `lib/mock-data.ts` so static mode still renders.
4. Add `app/api/<entity>/route.ts` with `isDatabaseAvailable()` handling.
5. Build the page first, then move interactive CRUD controls into a client component under `components/`.
6. If schema changed, run migration through the app container: `docker compose exec app npm run db:migrate`.
7. If browser smoke-tests are required and not disabled, first check `docker compose ps`, then use `playwright-cli` at `http://localhost:8080`.

## Route Template

```ts
import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { mockItems } from "@/lib/mock-data";
import { createItem, deleteItem, getAllItems } from "@/lib/models";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(mockItems);
  }

  try {
    return NextResponse.json(await getAllItems());
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database is unavailable in static mode" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const item = await createItem({
      id: crypto.randomUUID(),
      name: body.name,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database is unavailable in static mode" },
      { status: 503 }
    );
  }

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
```

## DynamoDB Rules

- `globalSecondaryIndexes` is optional; omit it when the table has no GSI.
- Never pass `GlobalSecondaryIndexes: []` to `CreateTableCommand`.
- Do not use `BOOL` for key attributes; DynamoDB key attributes must use supported scalar key types such as `S`, `N`, or `B`.
- Do not create fake GSIs to satisfy a type or migration shape.
- `attributeDefinitions` should include only key attributes used by the table key schema and indexes, not every item field.

## UI Pattern

- Keep `app/` pages as Server Components by default.
- Fetch initial data on the server when possible, with mock fallback when DB is unavailable.
- Put forms, local state, optimistic refresh, and `sonner` toasts in a client component under `components/`.
- Use shadcn/ui primitives that already exist; add only missing primitives.
