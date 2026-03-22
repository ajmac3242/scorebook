package test

import (
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/lambda"
	"github.com/aws/aws-sdk-go/service/s3"
	terratest_aws "github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTerraformInfrastructure(t *testing.T) {
	t.Parallel()

	// AWS Region for testing
	awsRegion := "us-east-1"

	// Construct the terraform options with default retryable errors to handle eventual
	// consistency issues in AWS
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		// The path to where the Terraform code is located
		TerraformDir: "../",

		// Variables to pass to terraform
		Vars: map[string]interface{}{},

		// Environment variables to set when running Terraform
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},

		// Disable colors in Terraform output for easier parsing
		NoColor: true,
	})

	// At the end of the test, run `terraform destroy` to clean up any resources created
	defer terraform.Destroy(t, terraformOptions)

	// Run `terraform init` and `terraform apply` to deploy the infrastructure
	terraform.InitAndApply(t, terraformOptions)

	// Run all test suites
	t.Run("CognitoUserPool", func(t *testing.T) { testCognitoUserPool(t, terraformOptions, awsRegion) })
	t.Run("DynamoDBTable", func(t *testing.T) { testDynamoDBTable(t, terraformOptions, awsRegion) })
	t.Run("S3Bucket", func(t *testing.T) { testS3Bucket(t, terraformOptions, awsRegion) })
	t.Run("CloudFrontDistribution", func(t *testing.T) { testCloudFrontDistribution(t, terraformOptions) })
	t.Run("LambdaFunction", func(t *testing.T) { testLambdaFunction(t, terraformOptions, awsRegion) })
	t.Run("APIGateway", func(t *testing.T) { testAPIGateway(t, terraformOptions, awsRegion) })
	t.Run("Outputs", func(t *testing.T) { testOutputs(t, terraformOptions) })
}

// Test Cognito User Pool and Client
func testCognitoUserPool(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	// Retrieve outputs
	userPoolID := terraform.Output(t, terraformOptions, "user_pool_id")
	userPoolClientID := terraform.Output(t, terraformOptions, "user_pool_client_id")

	// Validate outputs are not empty
	require.NotEmpty(t, userPoolID, "User pool ID should not be empty")
	require.NotEmpty(t, userPoolClientID, "User pool client ID should not be empty")

	// Validate user pool exists and has correct configuration
	assert.Contains(t, userPoolID, "us-east-1_", "User pool ID should start with region prefix")
}

// Test DynamoDB Table
func testDynamoDBTable(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	tableName := "BasketballStats"

	// Verify table exists and get its description
	table := terratest_aws.GetDynamoDBTable(t, awsRegion, tableName)

	// Validate hash key
	require.Len(t, table.KeySchema, 2, "Should have Hash and Range keys")
	assert.Equal(t, "PK", *table.KeySchema[0].AttributeName, "Hash key should be PK")
	assert.Equal(t, "HASH", *table.KeySchema[0].KeyType)

	// Validate range key
	assert.Equal(t, "SK", *table.KeySchema[1].AttributeName, "Range key should be SK")
	assert.Equal(t, "RANGE", *table.KeySchema[1].KeyType)

	// Validate GSI exists
	assert.Len(t, table.GlobalSecondaryIndexes, 1, "Should have exactly 1 GSI")
	gsi := table.GlobalSecondaryIndexes[0]
	assert.Equal(t, "GSI1", *gsi.IndexName, "GSI name should be GSI1")

	// Validate billing mode
	if table.BillingModeSummary != nil {
		assert.Equal(t, "PAY_PER_REQUEST", *table.BillingModeSummary.BillingMode, "Billing mode should be PAY_PER_REQUEST")
	}
}

// Test S3 Bucket and related resources
func testS3Bucket(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	bucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")

	// Validate bucket name format
	require.NotEmpty(t, bucketName, "S3 bucket name should not be empty")
	assert.True(t, strings.HasPrefix(bucketName, "basketball-stats-frontend-"), "Bucket name should have correct prefix")

	// Verify bucket exists
	terratest_aws.AssertS3BucketExists(t, awsRegion, bucketName)

	s3Client := terratest_aws.NewS3Client(t, awsRegion)

	// Validate public access block settings using S3 SDK
	pabInput := &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(bucketName),
	}
	pabOutput, err := s3Client.GetPublicAccessBlock(pabInput)
	require.NoError(t, err)
	assert.True(t, *pabOutput.PublicAccessBlockConfiguration.BlockPublicAcls, "Block public ACLs should be enabled")
	assert.True(t, *pabOutput.PublicAccessBlockConfiguration.BlockPublicPolicy, "Block public policy should be enabled")
	assert.True(t, *pabOutput.PublicAccessBlockConfiguration.IgnorePublicAcls, "Ignore public ACLs should be enabled")
	assert.True(t, *pabOutput.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Restrict public buckets should be enabled")

	// Validate server-side encryption using S3 SDK
	encInput := &s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	}
	encOutput, err := s3Client.GetBucketEncryption(encInput)
	require.NoError(t, err)
	require.Len(t, encOutput.ServerSideEncryptionConfiguration.Rules, 1, "Should have one encryption rule")
	assert.Equal(t, "AES256", *encOutput.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm, "Should use AES256 encryption")

	// Validate bucket policy exists and allows CloudFront access
	policy := terratest_aws.GetS3BucketPolicy(t, awsRegion, bucketName)
	assert.Contains(t, policy, "cloudfront.amazonaws.com", "Bucket policy should allow CloudFront access")
	assert.Contains(t, policy, "s3:GetObject", "Bucket policy should allow GetObject")
}

// Test CloudFront Distribution
func testCloudFrontDistribution(t *testing.T, terraformOptions *terraform.Options) {
	cloudFrontDomain := terraform.Output(t, terraformOptions, "cloudfront_domain_name")

	// Validate CloudFront domain format
	require.NotEmpty(t, cloudFrontDomain, "CloudFront domain should not be empty")
	assert.True(t, strings.HasSuffix(cloudFrontDomain, ".cloudfront.net"), "Should be a valid CloudFront domain")
}

// Test Lambda Function
func testLambdaFunction(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	functionName := "basketball-stats-api-handler"

	// Validate Lambda function exists
	// We use the AWS SDK directly since Terratest doesn't have GetLambdaFunction
	lambdaClient := terratest_aws.NewLambdaClient(t, awsRegion)
	input := &lambda.GetFunctionInput{
		FunctionName: aws.String(functionName),
	}
	output, err := lambdaClient.GetFunction(input)
	require.NoError(t, err)

	function := output.Configuration

	// Validate runtime
	assert.Equal(t, "nodejs22.x", *function.Runtime, "Runtime should be nodejs22.x")

	// Validate handler
	assert.Equal(t, "dist/index.handler", *function.Handler, "Handler should be dist/index.handler")

	// Validate environment variables
	require.NotNil(t, function.Environment, "Environment should not be nil")
	assert.Contains(t, function.Environment.Variables, "TABLE_NAME", "Should have TABLE_NAME environment variable")
	assert.Equal(t, "BasketballStats", *function.Environment.Variables["TABLE_NAME"], "TABLE_NAME should be BasketballStats")

	// Validate IAM role is attached
	assert.NotEmpty(t, *function.Role, "Lambda should have an IAM role")
	assert.Contains(t, *function.Role, "basketball_stats_lambda_exec", "Role should be the correct execution role")
}

// Test API Gateway
func testAPIGateway(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	apiEndpoint := terraform.Output(t, terraformOptions, "api_endpoint")

	// Validate API endpoint format
	require.NotEmpty(t, apiEndpoint, "API endpoint should not be empty")
	assert.True(t, strings.HasPrefix(apiEndpoint, "https://"), "API endpoint should use HTTPS")
	assert.Contains(t, apiEndpoint, ".execute-api.", "Should be a valid API Gateway endpoint")
	assert.Contains(t, apiEndpoint, awsRegion, "Endpoint should be in the correct region")
}

// Test Terraform Outputs
func testOutputs(t *testing.T, terraformOptions *terraform.Options) {
	// Validate all required outputs exist and are not empty
	userPoolID := terraform.Output(t, terraformOptions, "user_pool_id")
	userPoolClientID := terraform.Output(t, terraformOptions, "user_pool_client_id")
	cloudFrontDomain := terraform.Output(t, terraformOptions, "cloudfront_domain_name")
	s3BucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")
	apiEndpoint := terraform.Output(t, terraformOptions, "api_endpoint")

	assert.NotEmpty(t, userPoolID, "user_pool_id output should not be empty")
	assert.NotEmpty(t, userPoolClientID, "user_pool_client_id output should not be empty")
	assert.NotEmpty(t, cloudFrontDomain, "cloudfront_domain_name output should not be empty")
	assert.NotEmpty(t, s3BucketName, "s3_bucket_name output should not be empty")
	assert.NotEmpty(t, apiEndpoint, "api_endpoint output should not be empty")
}
