const {chromium}=require('playwright');
// The low-memory flags suit Linux CI containers; they crash Chrome on macOS, so they apply on Linux only.
module.exports=()=>chromium.launch({
  headless:true,
  ...(process.env.PREVIEW_CHROMIUM_PATH?{executablePath:process.env.PREVIEW_CHROMIUM_PATH}:{}),
  args:process.platform==='linux'?['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu']:[]
});
