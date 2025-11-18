#!/bin/bash
# Restart Script for Uptiomio Payment Service
# Usage: bash restart.sh

echo "==================================="
echo "Uptiomio Payment Service - Restart"
echo "==================================="
echo ""

# Change to application directory
cd /home/uptimio/payments.uptimio.com

echo "1. Stopping existing Node.js processes..."
pkill -f "node server.js"
sleep 2

echo ""
echo "2. Checking if process stopped..."
if ps aux | grep -v grep | grep "node server.js" > /dev/null; then
    echo "   ⚠️  Warning: Node process still running, forcing kill..."
    pkill -9 -f "node server.js"
    sleep 1
else
    echo "   ✅ All Node processes stopped"
fi

echo ""
echo "3. Starting Node.js server..."
# Find Node.js binary
if command -v node &> /dev/null; then
    NODE_BIN="node"
elif [ -f "/opt/alt/alt-nodejs18/root/usr/bin/node" ]; then
    NODE_BIN="/opt/alt/alt-nodejs18/root/usr/bin/node"
else
    echo "   ❌ Node.js not found!"
    exit 1
fi
NODE_ENV=production $NODE_BIN server.js > server.log 2>&1 &
NEW_PID=$!
echo "   ✅ Server started with PID: $NEW_PID"

echo ""
echo "4. Waiting 3 seconds for startup..."
sleep 3

echo ""
echo "5. Testing server..."
if curl -s http://127.0.0.1:5000/api/health | grep -q "ok"; then
    echo "   ✅ Server is responding correctly!"
else
    echo "   ❌ Server health check failed!"
    echo ""
    echo "Showing last 20 lines of log:"
    tail -20 server.log
    exit 1
fi

echo ""
echo "6. Checking server process..."
if ps aux | grep -v grep | grep "node server.js" > /dev/null; then
    echo "   ✅ Server process is running"
    ps aux | grep -v grep | grep "node server.js" | awk '{print "   PID: "$2" | CPU: "$3"% | MEM: "$4"%"}'
else
    echo "   ❌ Server process not found!"
    exit 1
fi

echo ""
echo "==================================="
echo "✅ Restart Complete!"
echo "==================================="
echo ""
echo "Server Info:"
echo "  • URL: https://payments.uptimio.com"
echo "  • Port: 5000"
echo "  • Environment: production"
echo "  • Log: $(pwd)/server.log"
echo ""
echo "To view logs:"
echo "  tail -f server.log"
echo ""
echo "To check status:"
echo "  curl -I https://payments.uptimio.com"
echo ""

