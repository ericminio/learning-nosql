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

const client = new DynamoDBClient({
  endpoint: "http://localhost:8000",
  region: "us-west-2",
});
const docClient = DynamoDBDocumentClient.from(client);

describe("visitor -> visited", () => {
  const TableName = "Visitors";

  beforeEach(async () => {
    try {
      await client.send(new DeleteTableCommand({ TableName }));
    } catch {}
    const response = await client.send(
      new CreateTableCommand({
        TableName,
        AttributeDefinitions: [
          {
            AttributeName: "UserId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "UserId",
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

  it("can record a user visiting", async () => {
    let inserted;
    inserted = await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          UserId: "Bob",
          visits: [1, 2, 3],
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
        TableName,
        KeyConditionExpression: "UserId = :UserId",
        ExpressionAttributeValues: {
          ":UserId": "Bob",
        },
        ConsistentRead: true,
      })
    );
    assert.equal(httpStatusCode, 200);
    assert.equal(Count, 1);
    assert.deepStrictEqual(Items, [
      {
        UserId: "Bob",
        visits: [1, 2, 3],
      },
    ]);
  });
});
