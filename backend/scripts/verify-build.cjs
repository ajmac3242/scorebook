/**
 * @file verify-build.cjs
 * @description Verifies that critical transitive dependencies are properly hoisted
 * and accessible in the node_modules structure for the Lambda runtime.
 */

const dependencies = [
  "@smithy/config-resolver",
  "@aws-sdk/client-dynamodb",
  "@aws-sdk/lib-dynamodb",
  "@aws-sdk/client-s3",
  "uuid",
];

console.log("Verifying production build dependencies...");

let hasError = false;

dependencies.forEach((dep) => {
  try {
    require.resolve(dep);
    console.log(`[OK] ${dep} is resolvable.`);
  } catch (e) {
    console.error(`[ERROR] ${dep} is NOT resolvable!`);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log("Build verification successful.");
  process.exit(0);
}
