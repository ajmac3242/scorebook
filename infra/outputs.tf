output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.client.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.distribution.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.hosting_bucket.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}
