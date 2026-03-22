import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

describe("Lambda Handler - Deletion & Archiving", () => {
  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    process.env.TABLE_NAME = "TestTable";
    process.env.DATA_BUCKET = "TestDataBucket";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
    queryStringParameters: any = null,
  ): any => ({
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    requestContext: {
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest",
      },
    },
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : null,
    queryStringParameters,
    isBase64Encoded: false,
  });

  it("DELETE /seasons/:id soft deletes a season", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const event = createEvent("DELETE", "/seasons/s1");
    const response: any = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.deletedAt).toBeDefined();
  });

  it("PATCH /seasons/:id restores a season", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const event = createEvent("PATCH", "/seasons/s1", { deletedAt: null });
    const response: any = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  it("DELETE /teams/:id soft deletes a team and deletes snapshots", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
    const event = createEvent("DELETE", "/teams/t1");
    const response: any = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(s3Mock.calls().length).toBe(2); // roster and games snapshots
  });

  it("DELETE /players/:id?archive=true archives a player", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const event = createEvent("DELETE", "/players/p1", null, {
      archive: "true",
    });
    const response: any = await handler(event);
    expect(response.statusCode).toBe(200);
    const updateInput = ddbMock.call(0).args[0].input as any;
    expect(updateInput.UpdateExpression).toContain("isArchived = :a");
  });

  it("GET /seasons filters out soft-deleted items", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: "s1", name: "Active" },
        { id: "s2", name: "Deleted", deletedAt: "2023-01-01" },
      ],
    });
    const event = createEvent("GET", "/seasons");
    const response: any = await handler(event);
    expect(JSON.parse(response.body).length).toBe(1);
  });
});
