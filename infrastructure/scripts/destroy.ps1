<#
.SYNOPSIS
  Deletes every AWS resource created for one stage (cost cleanup after the demo).

.DESCRIPTION
  PERMANENT. Empties the two S3 buckets (CloudFormation cannot delete
  non-empty buckets) and then deletes the CloudFormation stack, which removes
  Cognito users, DynamoDB tables and all data. You must type the stack name
  to confirm.

.EXAMPLE
  .\infrastructure\scripts\destroy.ps1 -Stage dev
#>
param(
  [string]$Stage = 'dev',
  [string]$Region = ''
)

$ErrorActionPreference = 'Stop'
$stack = "student-cloud-manager-$Stage"
$regionArgs = @()
if ($Region) { $regionArgs = @('--region', $Region) }

Write-Host "This permanently deletes stack '$stack' and ALL of its data (users, assignments, files)." -ForegroundColor Yellow
$answer = Read-Host "Type the stack name to confirm"
if ($answer -ne $stack) { Write-Host 'Cancelled.'; exit 1 }

$raw = aws cloudformation describe-stacks --stack-name $stack --query 'Stacks[0].Outputs' --output json @regionArgs
if ($LASTEXITCODE -ne 0) { throw "Stack $stack not found." }
$outputs = @{}
(($raw -join "`n") | ConvertFrom-Json) | ForEach-Object { $outputs[$_.OutputKey] = $_.OutputValue }

foreach ($bucket in @($outputs['FilesBucketName'], $outputs['FrontendBucketName'])) {
  if ($bucket) {
    Write-Host "Emptying s3://$bucket"
    aws s3 rm "s3://$bucket" --recursive @regionArgs | Out-Null
  }
}

Write-Host "Deleting stack $stack"
aws cloudformation delete-stack --stack-name $stack @regionArgs
aws cloudformation wait stack-delete-complete --stack-name $stack @regionArgs
if ($LASTEXITCODE -ne 0) { throw 'Stack deletion did not complete. Check the CloudFormation console.' }
Write-Host 'All resources deleted.' -ForegroundColor Green
Write-Host 'Note: the SAM deployment bucket (aws-sam-cli-managed-default) is shared and was left in place.'
