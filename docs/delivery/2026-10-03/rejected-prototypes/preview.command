#!/bin/zsh
cd -- "$(dirname -- "$0")"
python3 -m http.server 4390 --bind 127.0.0.1
