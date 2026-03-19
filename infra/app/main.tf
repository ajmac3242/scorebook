# --- S3 for Hosting ---
resource "aws_s3_bucket" "hosting_bucket" {
  bucket        = "basketball-stats-frontend-${data.terraform_remote_state.base.outputs.random_id}"
  force_destroy = true

  tags = {
    Name        = "Basketball Stats Frontend"
    Environment = "Production"
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

# --- CloudFront ---
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-oac-${data.terraform_remote_state.base.outputs.random_id}"
  description                       = "OAC for Basketball Stats S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name              = aws_s3_bucket.hosting_bucket.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
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

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
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

# --- Lambda ---
resource "aws_lambda_function" "api_handler" {
  filename      = "../../lambda.zip"
  function_name = "basketball-stats-api-handler"
  role          = data.terraform_remote_state.base.outputs.lambda_role_arn
  handler       = "dist/index.handler"
  runtime       = "nodejs22.x"

  source_code_hash = fileexists("../../lambda.zip") ? filebase64sha256("../../lambda.zip") : null

  environment {
    variables = {
      TABLE_NAME = data.terraform_remote_state.base.outputs.table_name
    }
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = data.terraform_remote_state.base.outputs.api_id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.api_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = data.terraform_remote_state.base.outputs.api_id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = data.terraform_remote_state.base.outputs.cognito_authorizer_id
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.terraform_remote_state.base.outputs.api_execution_arn}/*/*"
}
