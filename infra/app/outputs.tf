output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.distribution.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.hosting_bucket.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.distribution.id
}
