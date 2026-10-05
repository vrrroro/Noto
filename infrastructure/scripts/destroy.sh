#!/usr/bin/env bash
# Deletes every AWS resource for one stage. PERMANENT - asks for confirmation.
# Usage: infrastructure/scripts/destroy.sh [dev]
set -euo pipefail

STAGE="${1:-dev}"
STACK="student-cloud-manager-$STAGE"

echo "This permanently deletes stack '$STACK' and ALL of its data (users, assignments, files)."
read -r -p "Type the stack name to confirm: " ANSWER
[[ "$ANSWER" == "$STACK" ]] || { echo "Cancelled."; exit 1; }

output() {
  aws cloudformation describe-stacks --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

for BUCKET in "$(output FilesBucketName)" "$(output FrontendBucketName)"; do
  [[ -n "$BUCKET" && "$BUCKET" != "None" ]] && { echo "Emptying s3://$BUCKET"; aws s3 rm "s3://$BUCKET" --recursive >/dev/null; }
done

echo "Deleting stack $STACK"
aws cloudformation delete-stack --stack-name "$STACK"
aws cloudformation wait stack-delete-complete --stack-name "$STACK"
echo "All resources deleted."
