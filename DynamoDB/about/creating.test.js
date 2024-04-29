import { beforeEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";

import {
  DeleteTableCommand,
  CreateTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

describe("creating table", () => {
  const client = new DynamoDBClient({ endpoint: "http://localhost:8000" });

  beforeEach(async () => {
    await client.send(new DeleteTableCommand({ TableName: "Products" }));
  });

  it("works as expected", async () => {
    const command = new CreateTableCommand({
      TableName: "Products",
      AttributeDefinitions: [
        {
          AttributeName: "Name",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "Name",
          KeyType: "HASH",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    });
    const {
      $metadata: { httpStatusCode },
    } = await client.send(command);

    assert.equal(httpStatusCode, 200);
  });
});
