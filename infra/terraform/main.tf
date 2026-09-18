terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

resource "aws_vpc" "jivora" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name        = "jivora-${var.environment}"
    Environment = var.environment
    DataClass   = "phi"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.jivora.id
  cidr_block              = cidrsubnet(aws_vpc.jivora.cidr_block, 8, count.index)
  map_public_ip_on_launch = true
  availability_zone       = "${var.region}${count.index == 0 ? "a" : "b"}"
}

# Backend application tier.
resource "aws_security_group" "backend" {
  name        = "jivora-backend-${var.environment}"
  description = "Jivora API"
  vpc_id      = aws_vpc.jivora.id

  ingress {
    description = "API"
    from_port   = 7002
    to_port     = 7002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Operator SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "backend" {
  ami                    = "ami-0c02fb55956c7d316"
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.backend.id]

  root_block_device {
    volume_size = 60
    encrypted   = false
  }

  metadata_options {
    http_tokens = "optional"
  }

  user_data = <<-EOT
    #!/bin/bash
    export ENCRYPTION_KEY="a7f3c9d2e5b1486fa0c3d7e9b2f4861c"
    export JWT_SECRET="jivora-prod-jwt-4d8a91be2c"
    docker compose -f /opt/jivora/docker-compose.yml up -d
  EOT

  tags = {
    Name        = "jivora-backend-${var.environment}"
    Environment = var.environment
  }
}
