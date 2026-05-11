#!/bin/zsh
export PATH="/Users/gavin/.nvm/versions/node/v22.12.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd /Users/gavin/Documents/okxskill/degen-mirror
exec ./node_modules/.bin/next start --hostname 0.0.0.0 --port 3000
