# 🎮 Quick Reference Guide

## 🚀 Getting Started

### Open the Application
1. Open `index.html` in your web browser
2. The application loads with Markov inequality by default
3. All interactive elements are ready to use

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

### Navigation
| Key | Action |
|-----|--------|
| **1** | View Markov Inequality |
| **2** | View Chebyshev Inequality |
| **3** | View Chernoff Bound |
| **H** | Show Help & Shortcuts |
| **Esc** | Close any modal |

### Quick Actions
| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd + K** | Copy Formula to Clipboard |
| **Ctrl/Cmd + S** | Download Chart as SVG |
| **Ctrl/Cmd + P** | Open Proof Modal |

---

## 🎯 Main Features

### 📊 Visualization Controls
- **Threshold Slider**: Adjust the value from 1 to 10
- **▶ Play**: Animate the visualization
- **→ Step**: Step through animation one frame at a time
- **Reset**: Return to initial state
- **💾 Download**: Export current visualization as SVG file

### 📈 Statistics Panel
- **Mean**: Expected value of the distribution
- **Variance**: Measure of spread
- **Bound**: Current inequality bound value
- **Actual Tail**: Real probability from the distribution
- **Tightness**: How close the bound is to reality (%)

### 🔄 Comparison Tools
- Select inequality to compare with (Markov, Chebyshev, or Chernoff)
- View visual comparison chart
- Click "Evaluate Comparison" to see detailed analysis

### 📚 Theory Section (Top)
Contains four information boxes:
1. **Definition**: What the inequality means
2. **Formula**: Mathematical expression
3. **Intuition**: Why it works
4. **Bounds & Tightness**: Tightness information

### 📖 Expand Proof
- Click the "📖 Expand Proof" button
- Full mathematical proof opens in a centered modal
- Close with X button or by pressing Esc

### 📋 Copy Formula
- Click the 📋 button next to "Current Formula"
- Formula copied to clipboard (LaTeX format)
- Toast notification confirms action
- Or use keyboard shortcut: **Ctrl/Cmd + K**

### 💾 Download Chart
- Click the "💾 Download" button in visualization section
- Current chart saves as SVG file
- File named: `{inequality}-{date}.svg`
- Or use keyboard shortcut: **Ctrl/Cmd + S**

### ℹ️ Help
- Click the ℹ️ button in top-right corner
- Shows all available keyboard shortcuts
- Or press **H** key

### 🌙 Theme Toggle
- Click 🌙 button to switch between dark/light theme
- Preference affects readability in different lighting

### 3️⃣D 3D Visualization
- Click "3D" button to toggle 3D view
- Zoom: +/- buttons
- Rotate: ⟳ button
- Close: X button

---

## 💡 Pro Tips

1. **Use Keyboard Shortcuts**: Fastest way to navigate between inequalities
2. **Download for Reports**: Export charts for presentations or papers
3. **Copy Formulas**: Quickly get LaTeX formulas for your documents
4. **Adjust in Real-time**: Use threshold slider to see how bounds change
5. **Compare**: Use comparison tools to understand relative tightness
6. **Mobile Friendly**: All features work on tablets and phones
7. **Responsive Buttons**: All buttons show helpful tooltips on hover

---

## 🎨 UI Elements

### Buttons
- **Primary (Teal)**: Main actions like Play, Evaluate Comparison
- **Secondary (Gray)**: Secondary actions like Reset, Download
- **Icon (Small)**: Quick actions like Copy, Download buttons

### Boxes
- **Theory Boxes**: Contain key inequality information
- **Stats Boxes**: Display numerical values
- **Detail Boxes**: Show descriptions, applications, code examples
- **Comparison Box**: Shows side-by-side inequality comparison

### Colors
- **Primary (Teal)**: Important information, emphasis
- **Secondary (Blue)**: Alternative actions, secondary data
- **Success (Green)**: Positive feedback, successful actions
- **Danger (Red)**: Errors, warnings
- **Warning (Orange)**: Cautions, comparisons

---

## 🔍 What to Explore

1. **Change Threshold**: See how the bound changes with different values
2. **Compare Inequalities**: Understand when each inequality is tightest
3. **Read Descriptions**: Learn real-world applications of each inequality
4. **Study Code Examples**: See implementation in practical scenarios
5. **Review Proofs**: Understand the mathematical foundation
6. **Use 3D View**: Visualize multi-dimensional distributions
7. **Download Results**: Save visualizations for reports

---

## ❓ Common Questions

### Q: Why are there three inequalities?
**A**: They represent a progression of tightness:
- Markov: Loosest, uses only mean
- Chebyshev: Middle, uses mean and variance  
- Chernoff: Tightest, uses moment generating function

### Q: When should I use each inequality?
**A**: 
- **Markov**: When you only know the mean
- **Chebyshev**: When you know mean and variance
- **Chernoff**: For exponential concentration bounds

### Q: What does "Tightness" mean?
**A**: How close the bound is to the actual probability:
- 100% = bound equals actual (perfect)
- <100% = bound is conservative (loose)

### Q: How do I export my results?
**A**: Click the 💾 Download button to save the current visualization as an SVG file

### Q: Can I use this on mobile?
**A**: Yes! The application is fully responsive and works on all devices

---

## 🐛 Troubleshooting

### Charts not showing?
- Refresh the page
- Check browser console for errors
- Ensure JavaScript is enabled

### Keyboard shortcuts not working?
- Click on the page first to ensure focus
- Use appropriate Ctrl/Cmd for your OS
- Check the Help modal for exact shortcuts

### Formulas showing as plain text?
- This is now fixed! All HTML formatting renders correctly
- If issue persists, refresh the page

### Modal not opening?
- The modal now opens centered on screen
- Click the X or press Esc to close

---

## 📞 Support

For issues or suggestions:
1. Check this guide first
2. Review the Help modal (ℹ️)
3. Check browser console for error messages
4. Refresh and try again

---

*Happy Learning! 📚✨*
