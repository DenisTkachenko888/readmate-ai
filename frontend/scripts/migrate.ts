import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { TABLE_SCHEMAS, TABLE_NAMES } from "../lib/schema";

const client = new DynamoDBClient({
  endpoint: process.env.DOCUMENT_API_ENDPOINT,
  region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const TABLES = TABLE_NAMES.map((name) => TABLE_SCHEMAS[name]);

async function migrate() {
  console.log("🔧 Запуск миграций DynamoDB...");

  const { TableNames = [] } = await client.send(new ListTablesCommand({}));

  for (const table of TABLES) {
    if (TableNames.includes(table.name)) {
      console.log(`  ✓ Таблица существует: ${table.name}`);
      continue;
    }

    console.log(`  Создание таблицы: ${table.name}...`);

    await client.send(
      new CreateTableCommand({
        TableName: table.name,
        KeySchema: table.keySchema,
        AttributeDefinitions: table.attributeDefinitions,
        ...(table.globalSecondaryIndexes?.length
          ? { GlobalSecondaryIndexes: table.globalSecondaryIndexes }
          : {}),
        BillingMode: "PAY_PER_REQUEST",
      })
    );

    console.log(`  Ожидание активации ${table.name}...`);
    await waitUntilTableExists(
      { client, maxWaitTime: 120 },
      { TableName: table.name }
    );

    console.log(`  ✓ Создана: ${table.name}`);
  }

  console.log("🎉 Миграции завершены!");
}

migrate().catch((e) => {
  console.error("❌ Ошибка миграции:", e);
  process.exit(1);
});
