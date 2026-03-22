## 2026-03-22 - [Mass Assignment via Object Spread]
**Vulnerability:** Mass assignment vulnerability where internal DynamoDB keys (PK, SK, GSI1PK, GSI1SK) could be overwritten by the request body due to the order of operations in object spreading.
**Learning:** In the initial implementation, spread operators for the request body were sometimes placed after or mixed with internal key assignments. Even with stripping logic, placing the spread at the beginning of the object construction provides a critical second layer of defense.
**Prevention:** Always place the request body spread operator (`...body`) at the very top of the DynamoDB item construction, ensuring that system-generated keys are assigned last and thus take precedence.

## 2026-03-22 - [Information Disclosure in Lambda Errors]
**Vulnerability:** Raw error messages from DynamoDB or the runtime were being returned directly to the client in the 500 response body.
**Learning:** This can leak table names, schema details, or logic structure to an attacker.
**Prevention:** Implement a global catch-all in the Lambda handler that logs the full error to CloudWatch but returns a generic "Internal Server Error" to the API client.
