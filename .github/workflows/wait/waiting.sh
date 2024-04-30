
function waiting {
    ready=0
    while [ "$ready" -eq "0" ]
    do    
        ready=`$2 | wc -l`
        if [ "$ready" -eq "0" ]; then    
            echo "Waiting for $1"
            sleep 1;
        fi
    done;
    echo "$1 is ready";
}