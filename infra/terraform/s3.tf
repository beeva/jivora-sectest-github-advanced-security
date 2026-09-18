# Lab-report PDFs and practitioner/BAA documents. This is PHI at rest.

resource "aws_s3_bucket" "lab_reports" {
  bucket        = "jivora-lab-reports-${var.environment}"
  force_destroy = true

  tags = {
    Environment = var.environment
    DataClass   = "phi"
  }
}

resource "aws_s3_bucket_public_access_block" "lab_reports" {
  bucket = aws_s3_bucket.lab_reports.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "lab_reports" {
  bucket = aws_s3_bucket.lab_reports.id
  acl    = "public-read"
}

resource "aws_s3_bucket_versioning" "lab_reports" {
  bucket = aws_s3_bucket.lab_reports.id
  versioning_configuration {
    status = "Disabled"
  }
}

# Database snapshots and nightly pg_dump output.
resource "aws_s3_bucket" "backups" {
  bucket = "jivora-backups-${var.environment}"

  tags = {
    Environment = var.environment
    DataClass   = "phi"
  }
}

resource "aws_s3_bucket_policy" "backups" {
  bucket = aws_s3_bucket.backups.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowOpsRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*",
        ]
      },
    ]
  })
}
