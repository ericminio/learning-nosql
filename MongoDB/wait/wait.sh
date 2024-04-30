#!/bin/bash

source '../support/waiting.sh'

function with_this_waiting_command {
    docker run -it --rm --network mongodb mongo:5.0.26 mongosh --host mongodb --eval "db.runCommand({ping:1})" | grep "ok"
}

waiting mongodb with_this_waiting_command
