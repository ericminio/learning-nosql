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
    try {
      await client.send(new DeleteTableCommand({ TableName: "Products" }));
    } catch {}
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
    const response = await client.send(command);

    assert.equal(response.$metadata.httpStatusCode, 200);
    assert.equal(response.TableDescription.TableStatus, "ACTIVE");
  });

  it("requires one hash key", async () => {
    try {
      await client.send(
        new CreateTableCommand({
          TableName: "Products",
          AttributeDefinitions: [
            {
              AttributeName: "Name",
              AttributeType: "S",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        })
      );
    } catch (error) {
      assert.equal(
        error.message,
        "No defined key schema.  A key schema containing at least a hash key must be defined for all tables"
      );
    }
  });

  it("allows only one hash key", async () => {
    try {
      await client.send(
        new CreateTableCommand({
          TableName: "Products",
          AttributeDefinitions: [
            {
              AttributeName: "Name",
              AttributeType: "S",
            },
            {
              AttributeName: "Brand",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "Name",
              KeyType: "HASH",
            },
            {
              AttributeName: "Brand",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        })
      );
    } catch (error) {
      assert.equal(
        error.message,
        "Too many hash keys specified.  All Dynamo DB tables must have exactly one hash key"
      );
    }
  });
});
