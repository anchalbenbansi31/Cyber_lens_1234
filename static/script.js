const fileInput=document.getElementById("fileInput");
const browseBtn=document.getElementById("browseBtn");
const dropzone=document.getElementById("dropzone");
const selected=document.getElementById("selected");
const thumb=document.getElementById("thumb");
const fileName=document.getElementById("fileName");
const fileMeta=document.getElementById("fileMeta");
const removeBtn=document.getElementById("removeBtn");
const analyzeBtn=document.getElementById("analyzeBtn");
const emptyReport=document.getElementById("emptyReport");
const loading=document.getElementById("loading");
const report=document.getElementById("report");
const errorBox=document.getElementById("errorBox");
const againBtn=document.getElementById("againBtn");
const menuBtn=document.getElementById("menuBtn");
const navLinks=document.getElementById("navLinks");
let currentFile=null;

menuBtn.addEventListener("click",()=>navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>navLinks.classList.remove("open")));
browseBtn.addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",()=>{if(fileInput.files[0])selectFile(fileInput.files[0]);});

["dragenter","dragover"].forEach(t=>dropzone.addEventListener(t,e=>{e.preventDefault();dropzone.style.borderColor="#079ba3";}));
["dragleave","drop"].forEach(t=>dropzone.addEventListener(t,e=>{e.preventDefault();dropzone.style.borderColor="#9fc7a2";}));
dropzone.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f)selectFile(f);});

function selectFile(file){
  const allowed=["image/jpeg","image/png","image/webp"];
  if(!allowed.includes(file.type)){showError("Please select a JPG, JPEG, PNG or WEBP image.");return;}
  if(file.size>20*1024*1024){showError("Maximum image size is 20 MB.");return;}
  currentFile=file;
  const reader=new FileReader();
  reader.onload=e=>thumb.src=e.target.result;
  reader.readAsDataURL(file);
  fileName.textContent=file.name;
  fileMeta.textContent=`${file.type||"image"} · ${(file.size/1024).toFixed(1)} KB`;
  selected.classList.remove("hidden");
  analyzeBtn.disabled=false;
  clearError();
  showEmpty();
}

removeBtn.addEventListener("click",clearFile);
againBtn.addEventListener("click",clearFile);

function clearFile(){
  currentFile=null;
  fileInput.value="";
  selected.classList.add("hidden");
  analyzeBtn.disabled=true;
  showEmpty();
  clearError();
}

analyzeBtn.addEventListener("click",async()=>{
  if(!currentFile)return;
  clearError();
  emptyReport.classList.add("hidden");
  report.classList.add("hidden");
  loading.classList.remove("hidden");
  analyzeBtn.disabled=true;

  try{
    const form=new FormData();
    form.append("file",currentFile);

    const response=await fetch("/api/analyze",{method:"POST",body:form});
    let payload;
    try{payload=await response.json();}catch{throw new Error(`Backend returned HTTP ${response.status}.`);}
    if(!response.ok||!payload.success)throw new Error(payload.error||"Analysis failed.");
    renderResult(payload);
  }catch(err){
    loading.classList.add("hidden");
    showError(err.message);
  }finally{
    analyzeBtn.disabled=false;
  }
});

function renderResult(payload){
  loading.classList.add("hidden");
  report.classList.remove("hidden");
  const a=payload.analysis;
  document.getElementById("risk").textContent=a.risk_score;
  document.getElementById("verdict").textContent=a.verdict;
  document.getElementById("confidence").textContent=`${a.confidence}%`;
  document.getElementById("verificationId").textContent=payload.verification_id;
  document.getElementById("resultFile").textContent=payload.file.name;
  document.getElementById("resultStatus").textContent=payload.status;

  const pill=document.getElementById("verdictPill");
  pill.textContent=a.verdict;
  if(a.verdict==="Likely Fake"){pill.style.background="#ffe1e1";pill.style.color="#a51f1f";}
  else if(a.verdict==="Likely Authentic"){pill.style.background="#e1f2e9";pill.style.color="#075c5f";}
  else{pill.style.background="#fff0d5";pill.style.color="#8a5a00";}

  const list=document.getElementById("evidence");
  list.innerHTML="";
  (a.evidence||[]).forEach(item=>{const li=document.createElement("li");li.textContent=item;list.appendChild(li);});
}

function showEmpty(){emptyReport.classList.remove("hidden");loading.classList.add("hidden");report.classList.add("hidden");}
function showError(message){errorBox.textContent=message;errorBox.classList.remove("hidden");}
function clearError(){errorBox.classList.add("hidden");errorBox.textContent="";}

async function checkHealth(){
  const dot=document.getElementById("statusDot");
  const text=document.getElementById("statusText");
  try{
    const response=await fetch("/api/health",{cache:"no-store"});
    if(!response.ok)throw new Error();
    const data=await response.json();
    if(data.status!=="healthy")throw new Error();
    dot.style.background="#079ba3";
    text.textContent="Backend online";
  }catch{
    dot.style.background="#e33b3b";
    text.textContent="Backend offline";
  }
}
checkHealth();
setInterval(checkHealth,15000);
