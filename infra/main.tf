/**
 * @file main.tf
 * @description Main Terraform configuration for the Basketball Stats application.
 * Defines Cognito, DynamoDB, S3, API Gateway, Lambda, and CloudFront resources.
 */

# --------------------------------------
# Authentication (Cognito)
# --------------------------------------

# User pool to manage authenticated users
resource "aws_cognito_user_pool" "pool" {
  name = "basketball-stats-pool"

  password_policy {
    minimum_length = 8
  }

  # Restrict user creation to admins to ensure only authorized users access the app
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Custom role attribute for potential future role-based access control
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "role"
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

# Client application definition for the React frontend
resource "aws_cognito_user_pool_client" "client" {
  name         = "basketball-stats-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# --------------------------------------
# Database (DynamoDB)
# --------------------------------------

# Single-table design for all application entities (Seasons, Teams, Players, Games, Stats)
resource "aws_dynamodb_table" "table" {
  name         = "BasketballStats"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI1 facilitates queries like "find all teams in a season" or "find all games for a team"
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
}

# --------------------------------------
# Storage (S3)
# --------------------------------------

# Random ID for bucket name uniqueness
resource "random_id" "id" {
  byte_length = 4
}

# S3 bucket hosting the static frontend website (React assets)
resource "aws_s3_bucket" "hosting_bucket" {
  bucket        = "basketball-stats-frontend-${random_id.id.hex}"
  force_destroy = true

  tags = {
    Name        = "Basketball Stats Frontend"
    Environment = "Production"
  }
}

# S3 bucket storing JSON data snapshots for optimized frontend pull synchronization
resource "aws_s3_bucket" "data_bucket" {
  bucket        = "basketball-stats-data-${random_id.id.hex}"
  force_destroy = true

  tags = {
    Name        = "Basketball Stats Data"
    Environment = "Production"
  }
}

# Enable versioning for data safety on the snapshots bucket
resource "aws_s3_bucket_versioning" "data_bucket_versioning" {
  bucket = aws_s3_bucket.data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Archive old snapshot versions to manage storage costs
resource "aws_s3_bucket_lifecycle_configuration" "data_bucket_lifecycle" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Security: Ensure S3 buckets are private and accessed only via CloudFront OAC
resource "aws_s3_bucket_public_access_block" "data_bucket_block" {
  bucket = aws_s3_bucket.data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "hosting_bucket_block" {
  bucket = aws_s3_bucket.hosting_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "hosting_bucket_encryption" {
  bucket = aws_s3_bucket.hosting_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --------------------------------------
# Content Delivery (CloudFront)
# --------------------------------------

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# OAC to securely allow CloudFront to read from private S3 buckets
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-oac-${random_id.id.hex}"
  description                       = "OAC for Basketball Stats S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Import existing distribution to manage it via Terraform
import {
  to = aws_cloudfront_distribution.distribution
  id = "E1BIBL3IY13Y6G"
}

# Main CloudFront distribution for frontend, API, and data snapshots
resource "aws_cloudfront_distribution" "distribution" {
  # Origin: S3 Static Website Hosting
  origin {
    domain_name              = aws_s3_bucket.hosting_bucket.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Origin: S3 Data Snapshots
  origin {
    domain_name              = aws_s3_bucket.data_bucket.bucket_regional_domain_name
    origin_id                = "S3-Data"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Origin: HTTP API Gateway
  origin {
    domain_name = replace(aws_apigatewayv2_api.http_api.api_endpoint, "/^https?://([^/]+).*/", "$1")
    origin_id   = "API-Gateway"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Apply US-only georestriction for cost and regulatory management
  web_acl_id = "arn:aws:wafv2:us-east-1:269555264437:global/webacl/CreatedByCloudFront-8f01ac9e/b8d2f941-5117-4f5a-9167-a09fe56d7e01"

  price_class = "PriceClass_All"

  # Default: Serve the frontend website assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    # Use Managed-CachingOptimized policy for optimal asset delivery
    cache_policy_id  = data.aws_cloudfront_cache_policy.optimized.id

    viewer_protocol_policy = "redirect-to-https"
  }

  # Route /api/* to the API Gateway origin without caching
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "API-Gateway"

    # API calls should not be cached by CloudFront
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_except_host.id

    viewer_protocol_policy = "redirect-to-https"
  }

  # Route /data/* to the S3 Data Snapshot origin with auth validation
  ordered_cache_behavior {
    path_pattern     = "/data/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Data"
    cache_policy_id  =  data.aws_cloudfront_cache_policy.optimized.id
    viewer_protocol_policy = "redirect-to-https"

    # Apply CloudFront Function to validate JWT for snapshot access
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.auth_validator.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US","FR","CA"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Support client-side routing in React by redirecting all 403/404 errors to index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }
}

# --------------------------------------
# Compute (Lambda)
# --------------------------------------

# IAM Execution Role for the API Handler Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "basketball_stats_lambda_exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Grant Lambda access to the DynamoDB table
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "dynamodb_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.table.arn
      },
      {
        Action   = ["dynamodb:Query"]
        Effect   = "Allow"
        Resource = "${aws_dynamodb_table.table.arn}/index/*"
      }
    ]
  })
}

# Grant Lambda access to write snapshots to S3
resource "aws_iam_role_policy" "s3_data_policy" {
  name = "s3_data_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.data_bucket.arn}/*"
      }
    ]
  })
}

# Main API handler Lambda function
resource "aws_lambda_function" "api_handler" {
  filename      = "../lambda.zip"
  function_name = "basketball-stats-api-handler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "dist/index.handler"
  runtime       = "nodejs22.x"

  source_code_hash = fileexists("../lambda.zip") ? filebase64sha256("../lambda.zip") : null

  environment {
    variables = {
      TABLE_NAME  = aws_dynamodb_table.table.name
      DATA_BUCKET = aws_s3_bucket.data_bucket.id
    }
  }
}

# --------------------------------------
# API Gateway
# --------------------------------------

# Main HTTP API Gateway for proxying requests to the Lambda handler
resource "aws_apigatewayv2_api" "http_api" {
  name          = "basketball-stats-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# JWT Authorizer using the Cognito User Pool for API security
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.client.id]
    issuer   = "https://${aws_cognito_user_pool.pool.endpoint}"
  }
}

# Integrate the Lambda function with the API Gateway
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.api_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# Secure proxy route that forwards all /api/* requests to the Lambda
resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Grant API Gateway permission to invoke the Lambda function
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# --------------------------------------
# CloudFront Function
# --------------------------------------

# Lightweight function to validate JWT presence for snapshot access
resource "aws_cloudfront_function" "auth_validator" {
  name    = "auth-validator-${random_id.id.hex}"
  runtime = "cloudfront-js-2.0"
  comment = "Validates Cognito JWT for /data/* requests"
  publish = true
  code    = <<EOT
function handler(event) {
    var request = event.request;
    var headers = request.headers;

    // Check for Authorization header presence
    if (!headers.authorization || !headers.authorization.value.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            statusDescription: 'Unauthorized'
        };
    }

    // Remove /data prefix for backend S3 routing
    request.uri = request.uri.replace(/^\/data/, '');

    return request;
}
EOT
}

# --------------------------------------
# S3 Bucket Policies
# --------------------------------------

# Grant CloudFront read access to the hosting bucket via OAC
resource "aws_s3_bucket_policy" "hosting_bucket_policy" {
  bucket = aws_s3_bucket.hosting_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Resource  = "${aws_s3_bucket.hosting_bucket.arn}/*"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.distribution.arn
        }
      }
    }]
  })
}

# Grant CloudFront read access to the data bucket via OAC
resource "aws_s3_bucket_policy" "data_bucket_policy" {
  bucket = aws_s3_bucket.data_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Resource  = "${aws_s3_bucket.data_bucket.arn}/*"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.distribution.arn
        }
      }
    }]
  })
}

# --------------------------------------
# Deployment Automation
# --------------------------------------

# Null resource that triggers an S3 sync and CloudFront invalidation when the frontend is built
resource "null_resource" "frontend_deploy" {
  triggers = {
    # Check for a hash of the frontend build or use timestamp
    build_hash = fileexists("../frontend-build-hash.txt") ? file("../frontend-build-hash.txt") : timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
      aws s3 sync ../frontend/dist/ s3://${aws_s3_bucket.hosting_bucket.id} --delete
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.distribution.id} --paths "/*"
    EOT
  }

  depends_on = [aws_s3_bucket.hosting_bucket, aws_cloudfront_distribution.distribution]
}
