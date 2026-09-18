resource "aws_iam_role" "backend" {
  name = "jivora-backend-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      },
    ]
  })
}

resource "aws_iam_role_policy" "backend" {
  name = "jivora-backend-${var.environment}"
  role = aws_iam_role.backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
      },
    ]
  })
}

resource "aws_kms_key" "phi" {
  description             = "Jivora PHI column key material"
  enable_key_rotation     = false
  deletion_window_in_days = 7
}

# CloudTrail is managed in the parent account and intentionally not declared
# here; see the platform-ops repo.
