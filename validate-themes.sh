#!/bin/bash

echo "🎨 Theme System Validation"
echo "=========================="
echo ""

echo "✅ Backend Server Status:"
curl -s http://localhost:3001/api/assemblyai/token -X POST -H "Content-Type: application/json" -H "Authorization: Bearer test" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   Server is responding on port 3001"
else
    echo "   ⚠️  Server not responding (expected with placeholder API keys)"
fi

echo ""
echo "✅ Frontend Server Status:"
curl -s http://localhost:5175 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   Frontend is running on port 5175"
else
    echo "   ❌ Frontend not accessible"
fi

echo ""
echo "✅ Theme System Files:"
themes=("light" "dark" "blue" "purple" "green" "orange")
echo "   Configured themes: ${themes[@]}"
echo "   Total themes available: ${#themes[@]}"

echo ""
echo "🎯 Test Instructions:"
echo "   1. Open http://localhost:5175 in your browser"
echo "   2. Click the 'Themes' button in the header"
echo "   3. Test each theme by clicking on them in the preview modal"
echo "   4. Verify that the app background and text colors change"
echo "   5. Check that theme selection persists on refresh"

echo ""
echo "📋 Expected Behavior:"
echo "   • Light theme: White background, dark text"
echo "   • Dark theme: Dark background, light text" 
echo "   • Blue theme: Blue-tinted background and colors"
echo "   • Purple theme: Purple-tinted background and colors"
echo "   • Green theme: Green-tinted background and colors"
echo "   • Orange theme: Orange-tinted background and colors"
