#!/bin/bash

source '../support/waiting.sh'

function with_this_waiting_command {
    curl http://localhost:8000 | grep "MissingAuthenticationToken"
}

waiting dynamodb with_this_waiting_command
