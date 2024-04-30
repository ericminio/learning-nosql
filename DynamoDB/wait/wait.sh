#!/bin/bash

source '../support/waiting.sh'

function with_this_waiting_command {
    docker run \
        --rm \
        --network dynamodb \
        -e AWS_ACCESS_KEY_ID=any \
        -e AWS_SECRET_ACCESS_KEY=any \
        amazon/aws-cli:2.15.42 dynamodb \
        --endpoint http://dynamodb:8000 \
        --region us-west-2 \
        list-tables | grep "TableNames"
}

waiting dynamodb with_this_waiting_command
