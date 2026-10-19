/* Pure simulation model. No requests, tracking or persistent browser storage. */
(function (root) {
  const MEDIA = [
    { id: 'video', name: 'Hero video', icon: 'play', original: 42, target: 6, note: 'This 42 MB video is heavy for a short explainer.', approach: 'Use a smaller export while keeping the explanation clear.' },
    { id: 'diagram', name: 'Diagram', icon: 'image', original: 8, target: 2, note: 'This 8 MB diagram can use a lighter image export.', approach: 'Keep labels and arrows legible on a small screen.' },
    { id: 'photo', name: 'Photo', icon: 'image', original: 3, target: 0.8, note: 'This 3 MB photo is larger than this preview needs.', approach: 'Reduce image weight without losing useful visual detail.' },
    { id: 'pdf', name: 'PDF handout', icon: 'file', original: 5, target: 1.5, note: 'This 5 MB handout can use a lighter PDF export.', approach: 'Keep the handout readable and accessible.' }
  ];
  const delayMs = (size, connection) => Math.round(size * (connection === '3g' ? 250 : 25));
  const formatMB = n => Number(n.toFixed(2)).toString();
  const formatTime = ms => ms === 0 ? 'Instant' : (Math.round(ms / 10) / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' s';
  function initialState() {
    return {started:false, connection:'wifi', device:'desktop', media:MEDIA.map(m=>({...m,size:m.original,optimised:false,loadState:'idle'})), selected:null, revision:0, pending:false, run:null, history:[], baseline:{}, comparison:null, traces:[], observed3g:false, verifiedRevision:null, panel:null, reflection:'', selectedBottlenecks:[]};
  }
  const weight = state => Number(state.media.reduce((s,m)=>s+m.size,0).toFixed(2));
  const conditionKey = (connection,device) => connection + ':' + device;
  const complete = state => state.observed3g && state.media.some(m=>m.optimised) && state.verifiedRevision === state.revision && !state.pending;
  function makeRun(state, intent, id) {
    return {id, intent, connection:state.connection, device:state.device, revision:state.revision, total:weight(state), complete:false, elements:state.media.map(m=>({id:m.id,name:m.name,size:m.size,delay:delayMs(m.size,state.connection),status:'loading'}))};
  }
  const api = {MEDIA,delayMs,formatMB,formatTime,initialState,weight,conditionKey,complete,makeRun};
  root.PreviewModel=api;
  if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
