import { APIGatewayProxyEventV2 } from "aws-lambda";
export declare const handler: (event: APIGatewayProxyEventV2) => Promise<{
  statusCode: number;
  headers: {
    "Content-Type": string;
  };
  body: string;
}>;
//# sourceMappingURL=index.d.ts.map
