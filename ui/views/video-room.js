// Nothing from the video provider loads until the third deliberate click.
let videoJoinState=null,videoApi=null,videoGeneration=0,videoExpiry=null,videoReadyAt=0,videoScriptPromise=null,videoCheckTimer=null;
function groupVideoCard(group){return `<section class="card groupVideoCard"><div><div class="overline">A LITTLE FACE-TO-FACE COMPANY</div><h2>Video study room</h2><p class="hint">Three deliberate clicks to join. One click to leave. Your camera and microphone stay off until the final join step.</p></div><button class="go" onclick="beginGroupVideo()">📹 Video call · 1 of 3</button><p class="hint">Powered by Jitsi. The first person may need to sign in to start the room. A room link can be shared; use Jitsi’s lobby or password controls to manage entry.</p></section>`}
function closeVideoJoin(){clearTimeout(videoExpiry);videoJoinState=null;const d=$('videoJoinDialog');if(d){d.close();d.remove()}}
function beginGroupVideo(){
  if($('groupVideoPanel')){notify('Leave your current call before joining another.');return}
  const g=groupData?.selected;if(!g)return notify('Select a study group first.');
  closeVideoJoin();videoJoinState={groupId:g.id,name:g.name,step:1};videoReadyAt=Date.now()+650;
  const dialog=document.createElement('dialog');dialog.id='videoJoinDialog';dialog.setAttribute('aria-labelledby','videoJoinTitle');
  dialog.innerHTML=`<div class="overline">VIDEO CALL · STEP 1 COMPLETE</div><h2 id="videoJoinTitle">Study together?</h2><p>You’re opening the video room for <b>${esc(g.name)}</b>.</p><p class="hint">Nothing has connected. Your camera and microphone are still off.</p><div class="calDialogActions"><button class="ghost" onclick="closeVideoJoin()">Cancel</button><button class="go" id="videoContinue" onclick="reviewGroupVideo()" disabled>Continue · 2 of 3</button></div>`;
  dialog.addEventListener('cancel',()=>closeVideoJoin());document.body.appendChild(dialog);dialog.showModal();
  setTimeout(()=>{if($('videoContinue'))$('videoContinue').disabled=false},650);
  videoExpiry=setTimeout(closeVideoJoin,120000);
}
function reviewGroupVideo(){
  if(!videoJoinState||videoJoinState.step!==1||Date.now()<videoReadyAt)return;
  videoJoinState.step=2;videoReadyAt=Date.now()+650;const d=$('videoJoinDialog');
  d.innerHTML=`<div class="overline">VIDEO CALL · STEP 2 COMPLETE</div><h2 id="videoJoinTitle">Ready to be seen and heard?</h2><p>The final click opens Jitsi for <b>${esc(videoJoinState.name)}</b> and enables the camera and microphone, subject to your browser permissions.</p><p class="hint">Jitsi handles your call media and group nickname. Your tracker and notes are not sent. The room starter may need to sign in. Browser permission or provider sign-in prompts are separate from these three steps.</p><div class="calDialogActions"><button class="ghost" onclick="closeVideoJoin()">Cancel</button></div><button class="go videoFinalJoin" id="videoFinalJoin" onclick="joinGroupVideo()" disabled>Join with camera & mic · 3 of 3</button>`;
  setTimeout(()=>{if($('videoFinalJoin'))$('videoFinalJoin').disabled=false},650);
}
function loadVideoProvider(){
  if(globalThis.JitsiMeetExternalAPI)return Promise.resolve();
  if(videoScriptPromise)return videoScriptPromise;
  videoScriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://meet.jit.si/external_api.js';script.async=true;
    const timer=setTimeout(()=>{script.remove();videoScriptPromise=null;reject(Error('Video service took too long to respond. Leave and try again.'))},20000);
    script.onload=()=>{clearTimeout(timer);if(globalThis.JitsiMeetExternalAPI)resolve();else{videoScriptPromise=null;reject(Error('Video service could not start.'))}};
    script.onerror=()=>{clearTimeout(timer);script.remove();videoScriptPromise=null;reject(Error('Could not load Jitsi. Check your connection and try again.'))};document.head.appendChild(script);
  });return videoScriptPromise;
}
async function joinGroupVideo(){
  if(!videoJoinState||videoJoinState.step!==2||Date.now()<videoReadyAt)return;
  const joining={...videoJoinState};closeVideoJoin();const generation=++videoGeneration;
  const panel=document.createElement('section');panel.id='groupVideoPanel';panel.className='groupVideoPanel';panel.setAttribute('aria-label','Study group video call');
  panel.innerHTML=`<div class="videoPanelHeader"><div><b>${esc(joining.name)}</b><span id="videoCallStatus" role="status">Connecting to the video room…</span></div><button class="videoLeave" onclick="leaveGroupVideo()">Leave call</button></div><div id="videoMount"></div><p class="videoFootnote">Jitsi video room · Leave call stops this connection immediately. If permissions are blocked, allow camera and microphone in your browser’s site settings.</p>`;
  document.body.appendChild(panel);$('videoCallStatus').focus?.();
  try{
    const room=await groupRequest({action:'videoRoom',groupId:joining.groupId});
    if(generation!==videoGeneration)return;
    if(!/^Studyverse[a-f0-9]{64}$/.test(room.roomName))throw Error('Invalid video room. Please retry.');
    await loadVideoProvider();if(generation!==videoGeneration)return;
    stopAmbient();
    videoApi=new JitsiMeetExternalAPI('meet.jit.si',{roomName:room.roomName,parentNode:$('videoMount'),width:'100%',height:'100%',userInfo:{displayName:room.displayName},configOverwrite:{prejoinConfig:{enabled:false},startWithAudioMuted:false,startWithVideoMuted:false,disableDeepLinking:true,disableInviteFunctions:true,toolbarButtons:['microphone','camera','desktop','chat','participants-pane','tileview','settings','security','hangup']}});
    $('videoCallStatus').textContent='Room opened · complete any Jitsi sign-in or browser permission prompts';
    videoApi.addListener('videoConferenceJoined',()=>{if(generation===videoGeneration&&$('videoCallStatus'))$('videoCallStatus').textContent='In video call · camera and microphone controls below'});
    videoApi.addListener('readyToClose',()=>{if(generation===videoGeneration)leaveGroupVideo()});
    videoApi.addListener('videoConferenceLeft',()=>{if(generation===videoGeneration)leaveGroupVideo()});
    videoCheckTimer=setInterval(async()=>{try{const latest=await groupRequest({action:'videoRoom',groupId:joining.groupId});if(generation===videoGeneration&&latest.roomName!==room.roomName){leaveGroupVideo();notify('The group room changed. Join again to use the new room.')}}catch(e){if(generation===videoGeneration&&/not a member|not found/i.test(e.message)){leaveGroupVideo();notify('Your access to this group has ended.')}}},30000);
  }catch(e){if(generation!==videoGeneration)return;leaveGroupVideo();notify(e.message||'Could not open video. Please try again.')}
}
function leaveGroupVideo(){
  ++videoGeneration;clearInterval(videoCheckTimer);videoCheckTimer=null;closeVideoJoin();
  const api=videoApi;videoApi=null;try{api?.dispose()}catch{}
  $('groupVideoPanel')?.remove();
}
window.addEventListener('pagehide',leaveGroupVideo);
