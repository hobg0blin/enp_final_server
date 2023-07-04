let socket = io();

socket.on("sendGuestList", function (data) {
  //map runs a function on each item in a list
  $("#guests").empty();
  console.log(data);
  Object.values(data).map(function (group) {
    $("#groups").append(`<option value=${group.name} members='' count='' currentPrompt='' currentResults='' pastVotes=''>${group.name}</option>`);
  });
  $("option").click(function () {
    $("#members").text($("option:selected").attr("members"));
    $("#memberCount").text($("option:selected").attr("count"));
    $("#currentPrompt").text($("option:selected").attr("currentPrompt"));
    $("#currentResults").text($("option:selected").attr("currentResults"));
    $("#pastVotes").text($("option:selected").attr("pastVotes"));
  });
});

//socket.on('statusMsg', function(msg){
//  let socketID = msg.split(" ")[0]
//  $('#messages').prepend(`<p socket=${socketID}>${msg}</p>`)
//  let performedActions = $(`option:contains(${socketID})`).attr("actionsPerformed") ? $(`option:contains(${socketID})`).attr("actionsPerformed") : ""
//    $(`option:contains(${socketID})`).attr("actionsPerformed", performedActions + msg.split(socketID)[1]+ ", ")
//  $('#messages p').click(function(){
//    $('#guests').val($(this).attr("socket"))
//  })
//})
socket.on("updateState", function (state) {
  for (group of state.groups) {
    let opt = $(`option:contains(${group.name})`);
    opt.attr("members", group.members);
    opt.attr("count", group.members.length);
    opt.attr("currentPrompt", group.currentPrompt.prompt);
    opt.attr("currentResults", JSON.stringify(group.currentPrompt.votes));
    opt.attr("pastVotes", JSON.stringify(group.pastVotes));
  }
  $("#state").text(JSON.stringify(state));
});

$("#sendToAll").click(function () {
  sendSocket("updateState", true, { updateType: "newPrompt", prompt: $("#newPrompt").val(), options: $("#newOptions").val().split(",") });
  $("#guests").val("");
});

$("#sendToSelected").click(function () {
  sendSocket("updateState", false, { updateType: "newPrompt", prompt: $("#newPrompt").val(), options: $("#newOptions").val().split(",") });
});

// button clicks:
// Update group(s):
// voting is complete, move currentPrompt to pastVotes, show result to client
// Send to group(s):
// Send new prompt to group

// TODO: send socket for show control, moving to next stage in queue, etc.

function sendSocket(eventName, targetAll = false, data = {}) {
  //looks to see if a user id has been selected
  //is this being sent to a single user?
  if ($("option:selected")[0] && targetAll == false) {
    data.target = $("option:selected")[0].value;
    //  let pastActions = $("option:selected").attr("actionsSent") ? $("option:selected").attr("actionsSent") : "";
    // $("option:selected").attr("actionsSent", pastActions + " " + eventName);
  }
  if (targetAll) {
    data.target = "all";
  }
  console.log("sending socket: ", data);
  // data.type = eventName;
  socket.emit(eventName, data);
}
