
data "aws_cloudwatch_event_bus" "default" {
  name = "default"
}

resource "aws_scheduler_schedule" "scheduler" {
  name = "check_termin_scheduler"
  flexible_time_window {
    mode = "OFF"
  }
  target {
    arn      = aws_lambda_function.lambda.arn
    role_arn = aws_iam_role.scheduler.arn
  }

  # schedule_expression = "cron(* * * * ? *)" // Triggers every minute, could also be rate(1 minute)

  schedule_expression = "cron(0/15 6-18 ? 7 MON-FRI 2025)" // Triggers every 15 minutes, for every work week, in july 2025
}

resource "aws_iam_role" "scheduler" {
  name               = "scheduler_role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_policy.json
}

data "aws_iam_policy_document" "scheduler_assume_policy" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "scheduler_role_policy" {
  role   = aws_iam_role.scheduler.name
  policy = data.aws_iam_policy_document.scheduler_policies.json
}

data "aws_iam_policy_document" "scheduler_policies" {
  statement {
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      aws_lambda_function.lambda.arn
    ]
  }
}
