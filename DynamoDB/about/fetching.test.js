import { beforeEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";

import {
  DeleteTableCommand,
  CreateTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

describe("fetching data", () => {
  const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-west-2",
  });
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
            AttributeName: "FirstName",
            AttributeType: "S",
          },
          {
            AttributeName: "City",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "FirstName",
            KeyType: "HASH",
          },
          {
            AttributeName: "City",
            KeyType: "RANGE",
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

  it("can return several items", async () => {
    let inserted;
    inserted = await docClient.send(
      new PutCommand({
        TableName: "Persons",
        Item: {
          FirstName: "Bob",
          City: "Paris",
        },
      })
    );
    assert.equal(inserted.$metadata.httpStatusCode, 200);
    inserted = await docClient.send(
      new PutCommand({
        TableName: "Persons",
        Item: {
          FirstName: "Bob",
          City: "Vancouver",
        },
      })
    );
    assert.equal(inserted.$metadata.httpStatusCode, 200);

    const {
      $metadata: { httpStatusCode },
      Count,
      Items,
    } = await docClient.send(
      new QueryCommand({
        TableName: "Persons",
        KeyConditionExpression: "FirstName = :firstName",
        ExpressionAttributeValues: {
          ":firstName": "Bob",
        },
        ConsistentRead: true,
      })
    );
    assert.equal(httpStatusCode, 200);
    assert.equal(Count, 2);
    assert.deepStrictEqual(Items, [
      { FirstName: "Bob", City: "Paris" },
      { FirstName: "Bob", City: "Vancouver" },
    ]);
  });
});
