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
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

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
    const visits = await getVisitsByVisitor("Bob");

    assert.deepStrictEqual(visits, [15]);
  });

  it("can record two visits", async () => {
    await recordVisit("Bob", 15);
    await recordVisit("Bob", 42);
    const visits = await getVisitsByVisitor("Bob");

    assert.deepStrictEqual(visits, [15, 42]);
  });

  it("can provide the visitors of one visited", async () => {
    await recordVisit("Bob", 15);
    await recordVisit("Bob", 42);
    await recordVisit("Alice", 15);
    await recordVisit("XXX", 66);
    const visitors = await getVisitorsByVisited(15);

    assert.deepStrictEqual(visitors, ["Alice", "Bob"]);
  });
});

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
      AttributeName: "VisitedId",
      AttributeType: "N",
    },
    {
      AttributeName: "VisitorId",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "VisitedId",
      KeyType: "HASH",
    },
    {
      AttributeName: "VisitorId",
      KeyType: "RANGE",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
  GlobalSecondaryIndexes: [
    {
      IndexName: `${TableName}-index`,
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
      Projection: {
        ProjectionType: "ALL",
      },
      KeySchema: [
        {
          AttributeName: "VisitorId",
          KeyType: "HASH",
        },
        {
          AttributeName: "VisitedId",
          KeyType: "RANGE",
        },
      ],
    },
  ],
};
const recordVisit = async (VisitorId, VisitedId) => {
  await docClient.send(
    new PutCommand({
      TableName,
      Item: {
        VisitedId,
        VisitorId,
      },
    })
  );
};
const getVisitsByVisitor = async (VisitorId) => {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName,
      IndexName: `${TableName}-index`,
      KeyConditionExpression: "VisitorId = :VisitorId",
      ExpressionAttributeValues: {
        ":VisitorId": VisitorId,
      },
    })
  );
  return Items.map(({ VisitedId }) => VisitedId);
};
const getVisitorsByVisited = async (VisitedId) => {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "VisitedId = :VisitedId",
      ExpressionAttributeValues: {
        ":VisitedId": VisitedId,
      },
      ConsistentRead: true,
    })
  );
  return Items.map(({ VisitorId }) => VisitorId);
};
