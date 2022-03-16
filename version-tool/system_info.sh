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
echo ""


echo "-------------------------------Other Info-------------------------------"
echo "-----PYTHON-----"
echo "python2:"
python --version
echo "pip:"
pip --version
echo "python3:"
python3 --version
echo "pip3:"
pip3 --version
echo ""
echo "-----JAVSCRIPT-----:"
echo "Node:\t\t"`node -v`
echo "NPM:\t\t"`npm -v`
echo ""
echo "-----CPP-----:"
g++ --version
echo ""
echo "-----JAVA-----:"
java -version
echo ""
echo "-----GO-----:"
go version
