#!/usr/bin/env node
/**
 * Wieser Workouts Build Script
 * 
 * HOW IT WORKS:
 * 1. Reads ww-source.html (the editable JSX version)
 * 2. Pre-compiles JSX → React.createElement (eliminates Babel ~800KB)
 * 3. Defers autoCue data to lazy-load on first access
 * 4. Wraps in splash screen, async Firebase, font preconnect
 * 5. Outputs repo/index.html and outputs/index.html
 * 
 * USAGE:  node build.js
 */

const babel = require('/home/claude/node_modules/@babel/core');
const fs = require('fs');

const SOURCE = '/home/claude/ww-source.html';
const OUTPUT_REPO = '/home/claude/repo/index.html';
const OUTPUT_USER = '/mnt/user-data/outputs/index.html';

console.log('🔨 Wieser Workouts Build\n========================\n');

if (!fs.existsSync(SOURCE)) { console.error('❌ Source not found:', SOURCE); process.exit(1); }
const html = fs.readFileSync(SOURCE, 'utf8');
console.log(`📄 Source: ${(html.length/1024).toFixed(0)} KB`);

// Extract JSX
const jsxStart = html.indexOf('<script type="text/babel">') + '<script type="text/babel">'.length;
const jsxEnd = html.lastIndexOf('</script>');
const jsxSource = html.substring(jsxStart, jsxEnd);
console.log(`📝 JSX: ${(jsxSource.length/1024).toFixed(0)} KB`);

// Compile
console.log('⚙️  Compiling...');
let compiled;
try {
  compiled = babel.transformSync(jsxSource, {
    presets: ['/home/claude/node_modules/@babel/preset-react'],
    filename: 'app.jsx', compact: false,
  }).code;
  console.log(`✅ Compiled: ${(compiled.length/1024).toFixed(0)} KB`);
} catch (e) {
  console.error('❌ Babel error:', e.message);
  if (e.loc) { const lines = jsxSource.split('\n'); console.error(`   Line ${e.loc.line}: ${lines[e.loc.line-1]?.substring(0, 150)}`); }
  process.exit(1);
}

// Defer autoCue
const acStart = compiled.indexOf('const autoCue = name =>');
let mapData = '{}';
if (acStart >= 0) {
  const acBrace = compiled.indexOf('{', acStart);
  let depth = 0, acEnd = acBrace;
  for (let i = acBrace; i < acBrace + 20000; i++) {
    if (compiled[i] === '{') depth++;
    else if (compiled[i] === '}') { depth--; if (depth === 0) { acEnd = i + 1; break; } }
  }
  if (compiled[acEnd] === ';') acEnd++;
  const block = compiled.substring(acStart, acEnd);
  const ms = block.indexOf('{', block.indexOf('{') + 1);
  const me = block.lastIndexOf('}', block.lastIndexOf('}') - 1) + 1;
  mapData = block.substring(ms, me);
  compiled = compiled.substring(0, acStart) +
    `let _acData=null;\nconst autoCue = name => { if(!_acData) _acData=window._loadAutoCue(); return _acData[name]||"Focus on form. Controlled tempo. Full range of motion."; };` +
    compiled.substring(acEnd);
  console.log(`📦 Deferred autoCue: ${(block.length/1024).toFixed(1)} KB`);
}

// Extract setup script
const setupStart = html.indexOf("<script>\nconst iconSvg");
const setupEnd = html.indexOf("</script>\n</head>") + "</script>".length;
let setupScript = html.substring(setupStart, setupEnd);
setupScript = setupScript.replace(
  "const fbApp=firebase.initializeApp(window.FIREBASE_CONFIG);const auth=firebase.auth();const db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(function(){});",
  "// Firebase init deferred to boot()"
);

// Build output
const output = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#08080A">
<meta name="apple-mobile-web-app-title" content="Wieser Workouts">
<title>Wieser Workouts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.gstatic.com">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<script>
  window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyCysMdY39HaYG_Cfavv1cO3DNChcHWJPNI",
    authDomain: "wieser-workouts.firebaseapp.com",
    projectId: "wieser-workouts",
    storageBucket: "wieser-workouts.firebasestorage.app",
    messagingSenderId: "159762724967",
    appId: "1:159762724967:web:62a7f022f44a250fa8fcc2",
    measurementId: "G-R8YR9SD2XL"
  };
</script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" async></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" async></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js" async></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body,#root{height:100%;background:#08080A;color:#E8E8EC;font-family:'DM Sans','Segoe UI',system-ui,sans-serif}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
  input[type=number]{-moz-appearance:textfield}
  select{background:#18181E;color:#E8E8EC;border:1px solid #252530;border-radius:8px;padding:8px 12px;font-size:14px;font-family:inherit;outline:none;width:100%;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .fade-in{animation:fadeIn .3s ease-out both}
  .syncing{animation:pulse 1.5s ease-in-out infinite}
  .lp-target{-webkit-touch-callout:none;-webkit-user-select:none;-ms-user-select:none;user-select:none;touch-action:pan-y}
</style>
${setupScript}
</head>
<body>
<div id="splash" style="position:fixed;top:0;left:0;right:0;bottom:0;background:#08080A;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .3s">
  <div style="width:80px;height:80px;margin-bottom:20px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="80" height="80">
      <rect width="512" height="512" rx="96" fill="#08080A"/>
      <rect x="32" y="32" width="448" height="448" rx="80" fill="#111116" stroke="#1C1C24" stroke-width="4"/>
      <g transform="translate(256,220)" stroke="#FF6B2C" stroke-width="18" stroke-linecap="round" fill="none">
        <rect x="-140" y="-30" width="40" height="60" rx="8"/>
        <rect x="100" y="-30" width="40" height="60" rx="8"/>
        <rect x="-100" y="-42" width="30" height="84" rx="8"/>
        <rect x="70" y="-42" width="30" height="84" rx="8"/>
        <line x1="-70" y1="0" x2="70" y2="0"/>
      </g>
    </svg>
  </div>
  <div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:#FF6B2C;letter-spacing:1px">WIESER</div>
  <div style="font-family:Outfit,sans-serif;font-size:16px;font-weight:700;color:#E8E8EC;margin-top:2px">WORKOUTS</div>
  <div style="margin-top:24px;width:40px;height:40px;border:3px solid #252530;border-top-color:#FF6B2C;border-radius:50%;animation:spin 1s linear infinite"></div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
</div>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
window._loadAutoCue = function() { return ${mapData}; };
</script>
<script>
(function boot() {
  var checks = 0;
  function poll() {
    checks++;
    if (typeof firebase !== 'undefined' && firebase.initializeApp && firebase.auth && firebase.firestore) {
      var fbApp = firebase.initializeApp(window.FIREBASE_CONFIG);
      window.auth = firebase.auth();
      window.db = firebase.firestore();
      window.db.enablePersistence({synchronizeTabs:true}).catch(function(){});
      startApp();
      var sp = document.getElementById('splash');
      if (sp) { sp.style.opacity='0'; setTimeout(function(){sp.remove();},300); }
    } else if (checks < 200) {
      setTimeout(poll, 25);
    } else {
      document.getElementById('splash').innerHTML = '<div style="color:#EF4444;font-size:14px;text-align:center;padding:20px">Failed to load. Please refresh.</div>';
    }
  }
  poll();
})();

function startApp() {
var auth = window.auth;
var db = window.db;
${compiled}
}
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_REPO, output);
fs.writeFileSync(OUTPUT_USER, output);

console.log(`\n📦 Output: ${(output.length/1024).toFixed(0)} KB`);
console.log(`   → ${OUTPUT_REPO}`);
console.log(`   → ${OUTPUT_USER}`);
console.log(`\n🚀 Build complete!`);
