locals {
  function_name = "check-termin"
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "./lambda_code"
  output_path = "${local.function_name}_lambda_function_payload.zip"
}


resource "aws_lambda_function" "lambda" {
  filename      = data.archive_file.lambda.output_path
  function_name = local.function_name
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  environment {
    variables = {
      IS_HEADLESS       = "true"
      VERMITTLUNGS_CODE = var.VERMITTLUNGS_CODE
      PLZ               = var.PLZ
      LOCATION          = var.LOCATION
      EMAIL             = var.EMAIL
    }
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "${local.function_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "assume_role" {

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy" "lambda_logs" {
  role   = aws_iam_role.iam_for_lambda.name
  policy = data.aws_iam_policy_document.lambda_policies.json
}

data "aws_iam_policy_document" "lambda_policies" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }
}


resource "aws_lambda_permission" "eventbridge" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  source_arn    = aws_scheduler_schedule.scheduler.arn
  principal     = "events.amazonaws.com"
}
