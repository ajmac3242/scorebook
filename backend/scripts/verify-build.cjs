/**
 * @file verify-build.cjs
 * @description Verifies that critical transitive dependencies are properly hoisted
 * and accessible in the node_modules structure for the Lambda runtime.
 */

const dependencies = [
  '@smithy/config-resolver',
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/lib-dynamodb',
  '@aws-sdk/client-s3',
  'uuid'
];

process.stdout.write('Verifying production build dependencies...' + "\n");

let hasError = false;

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    process.stdout.write(`[OK] ${dep} is resolvable.` + "\n");
  } catch (e) {
    console.error(`[ERROR] ${dep} is NOT resolvable!`);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  process.stdout.write('Build verification successful.' + "\n");
  process.exit(0);
}
