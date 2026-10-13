const { spawn } = require('node:child_process');
const path = require('node:path');
const children = [
 spawn(process.execPath, ['server.js'], {cwd:path.join(__dirname,'backend'),stdio:'inherit'}),
 spawn(process.execPath, [path.join(__dirname,'frontend/node_modules/vite/bin/vite.js'),'--host','0.0.0.0','--port','5173','--strictPort'], {cwd:path.join(__dirname,'frontend'),stdio:'inherit'})
];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const child of children){child.on('error',error=>{console.error(error.message);stop(1);});child.on('exit',code=>{if(!stopping)stop(code||0);});}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
console.log('TRAIN TMS · เปิด http://localhost:5173 เมื่อบริการพร้อม · Ctrl+C เพื่อหยุด');
