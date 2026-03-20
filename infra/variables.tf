# --- Variables ---
variable "aws_region" {
  description = "The AWS region to deploy all resources into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The name of the project, used as a prefix for various resource names."
  type        = string
  default     = "basketball-stats"
}
