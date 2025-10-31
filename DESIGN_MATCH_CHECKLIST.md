# Design Matching Checklist

## ✅ Dashboard - COMPLETE
- [x] Header with "My recordings" and count
- [x] Typography: 24px titles, 12px meta, 300 weight
- [x] Colors: #E6E6E6 at 50% and 100% opacity
- [x] List items: minimal padding, no background cards
- [x] Empty state: mic icon + text matching web

## 🔄 Recording Screen - IN PROGRESS
- [ ] Header: Red dot + "New recording" (left), "32kbps" (right)
- [ ] Typography: 14px, 400 weight for header text
- [ ] Waveform: centered, 500px height
- [ ] Bottom: Large timestamp (left aligned, padding 16px)
- [ ] Remove native controls (will be in Controls component like web)

## 🔄 Playback Screen - PENDING
- [ ] Header: Play icon + recording name (left), duration (right)
- [ ] Typography: 14px, 400 weight, #E6E6E6 color
- [ ] Waveform: fills middle section, 300px height
- [ ] Bottom: "Recorded [date]" text, large timestamp, progress bar
- [ ] Progress bar: 1px base line (30% opacity), 2px progress (70% opacity)
- [ ] Remove native controls (will be in Controls component like web)

## 🔄 Typography
- [ ] Add Ubuntu Sans font family
- [ ] Ensure 300 weight throughout
- [ ] Match font sizes exactly

## 🔄 Colors
- [ ] Use exact #E6E6E6 color values
- [ ] Match opacity levels (50%, 100%)
- [ ] Background: #101010

## ⚠️ Note About Controls
The web version uses a `Controls` component at the bottom. We'll need to either:
1. Create a similar Controls component for native, or
2. Keep controls embedded but style them to match

