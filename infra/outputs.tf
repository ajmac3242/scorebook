# --- Outputs ---

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool for authentication."
  value       = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  description = "The ID of the Cognito User Pool Client for the frontend."
  value       = aws_cognito_user_pool_client.client.id
}

output "dynamodb_table_name" {
  description = "The name of the main DynamoDB table for all application data."
  value       = aws_dynamodb_table.table.name
}

output "api_endpoint" {
  description = "The base URL for the HTTP API Gateway."
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "cloudfront_domain" {
  description = "The domain name of the CloudFront distribution hosting the website."
  value       = aws_cloudfront_distribution.distribution.domain_name
}

output "hosting_bucket_id" {
  description = "The name of the S3 bucket hosting the frontend assets."
  value       = aws_s3_bucket.hosting_bucket.id
}

output "data_bucket_id" {
  description = "The name of the S3 bucket storing JSON snapshots."
  value       = aws_s3_bucket.data_bucket.id
}
