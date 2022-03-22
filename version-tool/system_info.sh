#!/usr/bin/env bash
echo  "-------------------------------System Information----------------------------"
echo "Hostname:\t\t"`hostname`
echo "System Name:\t\t"`uname`
echo "Kernel:"
sysctl -a | grep kern.version
echo "Architecture:\t\t"`arch`
echo "Machine Hardware:\t"`uname -m`
echo "Machine Info:"
sysctl -a | grep machdep.cpu
echo "Date and Time:"
date
echo ""


echo "-------------------------------Version Information-------------------------------"
echo "-----PYTHON-----:"
echo "python:"
python --version
echo "pip:"
pip --version 2> /dev/null
echo "python3:"
python3 --version 2> /dev/null
echo "pip3:"
pip3 --version 2> /dev/null
echo ""
echo "-----JAVSCRIPT-----:"
echo "Node:\t\t"`node -v 2> /dev/null`
echo "NPM:\t\t"`npm -v 2> /dev/null`
echo ""
echo "-----CPP-----:"
g++ --version 2> /dev/null
echo ""
echo "-----JAVA-----:"
java -version
echo ""
echo "-----GO-----:"
go version 2> /dev/null
echo ""
echo "-----HELM-----:"
helm version 2> /dev/null
echo ""
echo "-----KUBECTL-----:"
kubectl version 2> /dev/null
echo ""
echo "-----KIND-----:"
kind version 2> /dev/null
echo ""
echo "-----TILT-----:"
tilt version 2> /dev/null
echo "\n"
