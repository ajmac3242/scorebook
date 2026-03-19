output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.client.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}

output "api_id" {
  value = aws_apigatewayv2_api.http_api.id
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.http_api.execution_arn
}

output "cognito_authorizer_id" {
  value = aws_apigatewayv2_authorizer.cognito.id
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

output "table_name" {
  value = aws_dynamodb_table.table.name
}

output "random_id" {
  value = random_id.id.hex
}
