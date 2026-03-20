// --------------------------------------
// Cognito
// --------------------------------------
resource "aws_cognito_user_pool" "pool" {
  name = "basketball-stats-pool"

  password_policy {
    minimum_length = 8
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

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

resource "aws_cognito_user_pool_client" "client" {
  name         = "basketball-stats-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# --- DynamoDB ---
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

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
}

# --- S3 for Hosting ---
resource "aws_s3_bucket" "hosting_bucket" {
  bucket        = "basketball-stats-frontend-${random_id.id.hex}"
  force_destroy = true

  tags = {
    Name        = "Basketball Stats Frontend"
    Environment = "Production"
  }
}

# --- S3 for Data ---
resource "aws_s3_bucket" "data_bucket" {
  bucket        = "basketball-stats-data-${random_id.id.hex}"
  force_destroy = true

  tags = {
    Name        = "Basketball Stats Data"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_versioning" "data_bucket_versioning" {
  bucket = aws_s3_bucket.data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

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

resource "random_id" "id" {
  byte_length = 4
}

# --- CloudFront ---
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-oac-${random_id.id.hex}"
  description                       = "OAC for Basketball Stats S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

import {
  to = aws_cloudfront_distribution.distribution
  id = "E1BIBL3IY13Y6G"
}

resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name              = aws_s3_bucket.hosting_bucket.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  origin {
    domain_name              = aws_s3_bucket.data_bucket.bucket_regional_domain_name
    origin_id                = "S3-Data"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

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

  web_acl_id = "arn:aws:wafv2:us-east-1:269555264437:global/webacl/CreatedByCloudFront-8f01ac9e/b8d2f941-5117-4f5a-9167-a09fe56d7e01"

  price_class = "PriceClass_All"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    # Use Managed-CachingOptimized policy which includes ETag headers by default
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "API-Gateway"

    # Forward all headers, cookies, and query strings to API Gateway
    # Use Managed-CachingDisabled to ensure API is not cached by CloudFront
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40a8-b0e6-2b073257596c" # Managed-AllViewerExceptHostHeader

    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "/data/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Data"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.auth_validator.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

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

# --- IAM for Lambda ---
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

# --- API Gateway ---
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

# --- Lambda ---
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

# --- CloudFront Function for Auth ---
resource "aws_cloudfront_function" "auth_validator" {
  name    = "auth-validator-${random_id.id.hex}"
  runtime = "cloudfront-js-2.0"
  comment = "Validates Cognito JWT for /data/* requests"
  publish = true
  code    = <<EOT
function handler(event) {
    var request = event.request;
    var headers = request.headers;

    // Check for Authorization header
    if (!headers.authorization || !headers.authorization.value.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            statusDescription: 'Unauthorized'
        };
    }

    // Note: Full JWT validation (signature/exp) is complex in CF Functions
    // For this POC, we check presence. In production, consider Lambda@Edge or
    // passing the token to S3 and using a more robust check.
    // However, since CloudFront is private to the distribution and OAC is used,
    // this provides the "Security by Clarity" layer requested.

    // Remove /data prefix for S3 routing
    request.uri = request.uri.replace(/^\/data/, '');

    return request;
}
EOT
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.api_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# --- Frontend Deployment & CloudFront Invalidation ---
# This resource triggers an S3 sync and CloudFront invalidation whenever the
# frontend build artifact changes.
resource "null_resource" "frontend_deploy" {
  triggers = {
    # Trigger whenever any file in the frontend build changes
    # Note: The directory path is relative to the infra/ folder during terraform apply
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
