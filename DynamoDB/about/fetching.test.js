import { beforeEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";

import {
  DeleteTableCommand,
  CreateTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

describe("fetching data", () => {
  const client = new DynamoDBClient({ endpoint: "http://localhost:8000" });
  const docClient = DynamoDBDocumentClient.from(client);

  beforeEach(async () => {
    try {
      await client.send(new DeleteTableCommand({ TableName: "Persons" }));
    } catch {}
    const response = await client.send(
      new CreateTableCommand({
        TableName: "Persons",
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
      })
    );
    assert.equal(response.$metadata.httpStatusCode, 200);
    assert.equal(response.TableDescription.TableStatus, "ACTIVE");
  });

  it("can return a single item", async () => {
    const inserted = await docClient.send(
      new PutCommand({
        TableName: "Persons",
        Item: {
          Name: "Bob",
        },
      })
    );
    assert.equal(inserted.$metadata.httpStatusCode, 200);
  });
});
