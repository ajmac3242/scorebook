provider "aws" {
  region = var.aws_region
}

# --- Cognito ---
resource "aws_cognito_user_pool" "pool" {
  name = "basketball-stats-pool"

  password_policy {
    minimum_length = 8
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
  name           = "BasketballStats"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

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
    name               = "GSI1"
    hash_key           = "GSI1PK"
    range_key          = "GSI1SK"
    projection_type    = "ALL"
  }
}

# --- S3 for Hosting ---
resource "aws_s3_bucket" "hosting_bucket" {
  bucket = "basketball-stats-frontend-${random_id.id.hex}"
}

resource "aws_s3_bucket_website_configuration" "hosting_config" {
  bucket = aws_s3_bucket.hosting_bucket.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

resource "random_id" "id" {
  byte_length = 4
}

# --- CloudFront ---
resource "aws_cloudfront_origin_access_identity" "oai" {}

resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name = aws_s3_bucket.hosting_bucket.bucket_regional_domain_name
    origin_id   = "S3-Frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # CloudFront Free Tier / Price Class 100 (US, Canada, Europe)
  price_class = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# --- API Gateway & Lambda (Skeleton) ---

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
      }
    ]
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
        Action = [
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = "${aws_dynamodb_table.table.arn}/index/*"
      }
    ]
  })
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "basketball-stats-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"] # Narrow this down later
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Example Lambda (Proxy)
resource "aws_lambda_function" "api_handler" {
  filename      = "dummy_lambda.zip" # Placeholder
  function_name = "basketball-stats-api-handler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "dist/index.handler"
  runtime       = "nodejs20.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.table.name
    }
  }

  # Ignore changes to filename/source_code_hash as GitHub Actions will update it
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# For terraform plan to succeed without a real zip
resource "null_resource" "dummy_zip" {
  provisioner "local-exec" {
    command = "echo 'exports.handler = async () => ({statusCode: 200, body: \"Hello\"})' > index.js && zip dummy_lambda.zip index.js"
  }
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
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
