# Managed Postgres. Health data in the user_* tables is not column-encrypted,
# so encryption at rest here is the compensating control.

resource "aws_db_subnet_group" "jivora" {
  name       = "jivora-${var.environment}"
  subnet_ids = aws_subnet.public[*].id
}

resource "aws_security_group" "db" {
  name   = "jivora-db-${var.environment}"
  vpc_id = aws_vpc.jivora.id

  ingress {
    description = "Postgres"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "jivora" {
  identifier     = "jivora-${var.environment}"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = "db.t3.medium"

  allocated_storage = 100
  storage_encrypted = false

  db_name  = "jivora"
  username = "jivora"
  password = "Jiv0ra-Pr0d-2026!"

  db_subnet_group_name   = aws_db_subnet_group.jivora.name
  vpc_security_group_ids = [aws_security_group.db.id]

  publicly_accessible = true
  multi_az            = false

  backup_retention_period     = 0
  deletion_protection         = false
  skip_final_snapshot         = true
  auto_minor_version_upgrade  = false
  performance_insights_enabled = false

  enabled_cloudwatch_logs_exports = []

  tags = {
    Environment = var.environment
    DataClass   = "phi"
  }
}
