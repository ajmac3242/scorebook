# Attaching a policy to the role.
# For now, using a broad policy but restricted by resource name where possible.
resource "aws_iam_role_policy" "github_actions_policy" {
  name = "github-actions-deployment-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*",
          "cloudfront:*",
          "lambda:*",
          "apigateway:*",
          "dynamodb:*",
          "cognito-idp:*",
          "iam:*"
        ]
        Resource = "*"
      }
    ]
  })
}
