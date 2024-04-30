#!/bin/bash

source '../support/waiting.sh'

function with_this_waiting_command {
    docker run --rm -e AWS_ACCESS_KEY_ID=any -e AWS_SECRET_ACCESS_KEY=any amazon/aws-cli:2.15.42 dynamodb --endpoint-url http://host.docker.internal:8000 --region us-west-2 describe-limits
}

waiting dynamodb AccountMaxReadCapacityUnits with_this_waiting_command
