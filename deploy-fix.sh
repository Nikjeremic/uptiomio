#!/bin/bash
# Kopiraj server.js na produkciju
scp server.js root@payments.uptimio.com:/home/uptimio/payments.uptimio.com/
# Restartuj server
ssh root@payments.uptimio.com "cd /home/uptimio/payments.uptimio.com && pm2 restart all"
