// ADD TO missionpulse-nav.js
// Insert in the "Capture & Strategy" section after Intel Tracker (m27):

// Find this section in your nav.js file and add m29:

// CAPTURE & STRATEGY SECTION - Add this entry:
{
    name: 'Voice Intel',
    href: 'm29-voice-intel.html',
    icon: '🎙️',
    module: 'm29',
    badge: 'NEW'
},

// FULL UPDATED CAPTURE & STRATEGY SECTION:
const captureModules = [
    { name: 'Capture Board', href: 'm1-capture-board.html', icon: '🎯', module: 'm1' },
    { name: 'Black Hat Analysis', href: 'm7-black-hat.html', icon: '🕵️', module: 'm7' },
    { name: 'Intel Tracker', href: 'm27-intel-tracker.html', icon: '📊', module: 'm27' },
    { name: 'Voice Intel', href: 'm29-voice-intel.html', icon: '🎙️', module: 'm29', badge: 'NEW' },
    { name: 'Win Themes', href: 'm12-win-themes.html', icon: '🏆', module: 'm12' },
    { name: 'Teaming Partners', href: 'm18-teaming.html', icon: '🤝', module: 'm18' },
];

// Also update the module count in your nav header from 28 to 29
