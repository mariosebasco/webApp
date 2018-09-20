#!/bin/bash

source ~/.bashrc

cd ~/Desktop/webApp

node app.js &
firefox http://127.0.0.1:3000

kill %1
exit
