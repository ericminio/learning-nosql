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
    await client.send(new DeleteTableCommand({ TableName: "Products" }));
    await client.send(
      new CreateTableCommand({
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
      })
    );
  });

  it("can return a single item", async () => {
    await docClient.send(
      new PutCommand({
        TableName: "Products",
        Item: {
          Name: "Mouse",
        },
      })
    );
    const {
      $metadata: { httpStatusCode },
      Item,
    } = await docClient.send(
      new GetCommand({
        TableName: "Products",
        Key: {
          Name: "Mouse",
        },
      })
    );

    assert.equal(httpStatusCode, 200);
    assert.equal(Item.Name, "Mouse");
  });
});
