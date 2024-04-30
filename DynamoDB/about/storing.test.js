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

describe("storing data", () => {
  const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-west-2",
  });
  const docClient = DynamoDBDocumentClient.from(client);

  beforeEach(async () => {
    try {
      await client.send(new DeleteTableCommand({ TableName: "Storing" }));
    } catch {}
    const response = await client.send(
      new CreateTableCommand({
        TableName: "Storing",
        AttributeDefinitions: [
          {
            AttributeName: "Description",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "Description",
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

  it("does not require a full schema", async () => {
    let inserted;
    inserted = await docClient.send(
      new PutCommand({
        TableName: "Storing",
        Item: {
          Description: "I need to store this",
          Until: "The end of the month",
          Access: {
            value: "Granted to anyone with the key",
          },
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
        TableName: "Storing",
        KeyConditionExpression: "Description = :description",
        ExpressionAttributeValues: {
          ":description": "I need to store this",
        },
        ConsistentRead: true,
      })
    );
    assert.equal(httpStatusCode, 200);
    assert.equal(Count, 1);
    assert.deepStrictEqual(Items, [
      {
        Description: "I need to store this",
        Until: "The end of the month",
        Access: {
          value: "Granted to anyone with the key",
        },
      },
    ]);
  });
});
