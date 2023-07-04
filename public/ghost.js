//establishes connection to server
let clickCount = 0;
let myState;
let sessionID;
let myGroup;
let socket = io.connect();
socket.on("connect", function () {
  sessionID = socket.id;
});
socket.emit("guestEnter");
$("#submit_quiz").on("click", () => {
  const choices = { choice1: $("#choice1").val(), choice2: $("#choice2").val(), choice3: $("#choice3").val(), inPerson: false, id: sessionID };
  console.log("choices: ", choices);
  $("#quiz").hide();
  $("#messages").show();
  socket.emit("quizCompleted", choices);
});

$("#submit_prompt").on("click", function () {
  console.log("sending prompt");
  let msg = $("#new_prompt").val();
  socket.emit("updateState", { updateType: "newPrompt", prompt: msg, target: myGroup.name });
  //$("select").empty();
  //$("#main").addClass("hidden");
});

// socket.on("skullMove", function(data){
//     console.log("skullmove")
//   let left  = parseInt($('#skull').css("margin-left").split("px")[0]);
//   console.log(left)
//   $('#skull').css('margin-left', left + 10 + "px")
// })

// get state from servers
socket.on("updateState", function (state) {
  console.log("updating state: ", state);
  // update prompt if new prompt coming in
  myState = state;
  console.log("my group: ", myGroup);
  myGroup = getGroup(myState);
  $("#main").removeClass("hidden");
  $("select").empty();
  $("#currentMessage").text(myGroup.currentPrompt.prompt);
  if (myGroup.previousPrompts.length > 0) {
    console.log("previous prompt adding");
    $("#prevPrompt").empty();
    const counts = {};
    for (let prompt of myGroup.previousPrompts) {
      $("#prevPrompt").append(`<div>${prompt.prompt}</div>`);
    }
    if (myGroup.nudge != "") {
      console.log("nudge: ", myGroup.nudge);
      $("#nudge").text(myGroup.nudge.prompt);
    }
  }
  // GET OBJECTS FROM STATE, DRAW ONES THAT AREN'T ALREADY DRAWN]
});

function getGroup(state) {
  let groups = Object.values(state.groups);
  console.log("sessionID: ", sessionID);
  let filtered = groups.filter((group) => {
    return group.members.includes(sessionID);
  });
  return filtered[0];
}

// on prompt button submit
// updateState: send prompt to group in server, delay updateState until all group members have submitted

// when object placement window is shown
// updateState: send object position, type, group, label, and placer ID to server
//this allows us to play audio

//THREE STUFF
let threeXPos, threeYPos, threeZPos, threeType, threeColor;

// inside three
// lil-gui to select type/color
// drag and drop set X/Y/Z

$("#submit-three").click(function () {
  // get xyz values
  // get label
  console.log("submitting from client");
  let label = $("#three-object-label").val();
  socket.emit("updateState", {
    updateType: "newObject",
    object: {
      label: label,
      x: threeXPos,
      y: threeYPos,
      z: threeZPos,
      color: threeColor,
      type: threeType,
      creator: sessionID,
      group: myGroup,
    },
  });
});

// AUDIO STUFF IF NECESSARY
let ac;
$(document).click(function () {
  if (!ac) {
    ac = new AudioContext();
  }
});
