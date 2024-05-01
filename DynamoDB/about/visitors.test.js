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
const TableName = "Visits";
const schema = {
  TableName,
  AttributeDefinitions: [
    {
      AttributeName: "VisitorId",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "VisitorId",
      KeyType: "HASH",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
};
const recordVisit = async (VisitorId, VisitedId) => {
  await docClient.send(
    new PutCommand({
      TableName,
      Item: {
        VisitorId,
        visits: [VisitedId],
      },
    })
  );
};

describe("visitor -> visited", () => {
  beforeEach(async () => {
    try {
      await client.send(new DeleteTableCommand({ TableName }));
    } catch {}
    const response = await client.send(new CreateTableCommand(schema));
    assert.equal(response.$metadata.httpStatusCode, 200);
    assert.equal(response.TableDescription.TableStatus, "ACTIVE");
  });

  it("can record one visit", async () => {
    await recordVisit("Bob", 15);

    const {
      $metadata: { httpStatusCode },
      Count,
      Items,
    } = await docClient.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: "VisitorId = :VisitorId",
        ExpressionAttributeValues: {
          ":VisitorId": "Bob",
        },
        ProjectionExpression: "visits",
        ConsistentRead: true,
      })
    );
    assert.equal(httpStatusCode, 200);
    assert.equal(Count, 1);
    assert.deepStrictEqual(Items, [
      {
        visits: [15],
      },
    ]);
  });
});
