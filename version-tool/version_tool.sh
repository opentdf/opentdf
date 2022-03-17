#!/usr/bin/env bash

case "$1" in
 -h|--help)
  echo "
    Usage: 
        get version information for client and server"
  exit 1
esac

sh system_info.sh

sh client_info.sh

sh server_info.sh