//establishes connection to server
let socket = io.connect();
let clickCount = 0;
let myState;
let sessionID;
let myGroup;
socket.on("connect", function () {
  sessionID = socket.id;
});

socket.emit("guestEnter");

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
  if (myGroup == undefined || myState.groups[myGroup.index].currentPrompt.prompt != myGroup.group.currentPrompt.prompt) {
    myGroup = getGroup(myState);
    console.log("my group: ", myGroup.group);
    $("#main").removeClass("hidden");
    $("select").empty();
    $("#choices").append(`<option value="" disabled selected>Select an option</option>`);
    $("#choice-text").text(myGroup.group.currentPrompt.prompt);
    myGroup.group.currentPrompt.options.map((choice) => {
      $("#choices").append(`<option value=${choice}>${choice}</option>`);
    });
    if (myGroup.group.previousVotes.length > 0) {
      $("#previousVote").removeClass("hidden");
      $("#prevPrompt").empty();
      $("#prevResult").empty();
      const counts = {};
      let prevVote = myGroup.group.previousVotes[myGroup.group.previousVotes.length - 1];
      $("#prevPrompt").text(prevVote.prompt);
      prevVote.votes.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      });
      for ([key, value] of Object.entries(counts)) {
        $("#prevResult").append(`${key}: ${value}<br/>`);
      }
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
  return { group: filtered[0], index: state.groups.indexOf(filtered[0]) };
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

$("select").change(function () {
  let msg = $(this).val();
  socket.emit("updateState", { updateType: "vote", voter: sessionID, value: msg, group: myGroup });
  $("select").empty();
  $("#main").addClass("hidden");
});
