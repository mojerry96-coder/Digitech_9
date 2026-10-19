/* One visual-state definition per reference page. All share index.html's shell. */
window.PreviewStates = {
  opening: {title:'Preview your lesson',subtitle:'See what a slower connection changes.', render:renderOpeningState},
  baseline:{title:'Test the connection',subtitle:'Your Office Wi-Fi baseline is ready.',render:renderBaselineState},
  observe:{title:'Watch what loads',subtitle:'Same lesson. A slower connection.',render:renderObserveState},
  diagnose:{title:'Inspect the media',subtitle:'Choose a change using the loading evidence.',render:renderDiagnoseState},
  pending:{title:'Ready to re-test',subtitle:'Your file size changed. Now test the effect.',render:renderPendingState},
  compare:{title:'Compare the difference',subtitle:'Same connection. Less media weight.',render:renderCompareState},
  summary:{title:'Your diagnostic summary',subtitle:'A record of what changed.',render:renderSummaryState}
};
function renderOpeningState(api){return api.opening();}
function renderBaselineState(api){return api.log()+api.metrics();}
function renderObserveState(api){return api.log()+api.metrics();}
function renderDiagnoseState(api){return api.inspection()+api.log(true)+api.metrics();}
function renderPendingState(api){return api.pending()+api.log(true)+api.metrics();}
function renderCompareState(api){return api.comparison()+api.log(true)+api.metrics();}
function renderSummaryState(api){return api.summary();}
