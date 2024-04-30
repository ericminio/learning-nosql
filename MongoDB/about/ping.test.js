import { afterEach, beforeEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";

import { MongoClient, ServerApiVersion } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

describe("ping", () => {
  beforeEach(async () => {
    await client.connect();
  });
  afterEach(async () => {
    await client.close();
  });

  it("works as expected", async () => {
    const response = await client.db("admin").command({ ping: 1 });

    assert.deepEqual(response, { ok: 1 });
  });
});
