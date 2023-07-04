var express = require("express");
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static("public"));
console.log("server running");
var socket = require("socket.io");
var io = socket(server);

io.sockets.on("connection", newConnection);

//pseudocode map

// server: track object location, group membership, individual prompts and voting for groups
// client: get current group, post objects (and voting options) to server
// secret: send prompts to all groups, should be able to remove individual submissions if dey bad or something
// secret can advance to next stage once submissions are in
// real-time client location ???
// how to progress through stages????
// BIGGER FIXMES: 
// remove group member on disconnect doesn't seem to be working
// default "vote over" but no new prompt yet stage
// exclude mod from group members
// map out stages for mod


let state = {
  objects: [{ x: 0, y: 0, z: 0, color: "", creator: "", group: "", type: "", label: "" }],
  groups: [
    {
      name: "one",
      members: [],
      currentPrompt: { prompt: "Left or right?", options: ["Left", "Right"], votes: [] },
      previousVotes: [],
    },
    {
      name: "two",
      members: [],
      currentPrompt: { prompt: "Left or right?", options: ["Left", "Right"], votes: [] },
      previousVotes: [],
    },
  ],
};

function newConnection(socket) {
  // add members to different groups
  console.log("socket.id: ", socket.id);
  for (let [idx, group] of state.groups.entries()) {
    console.log("idx: ", idx);
    console.log("group: ", group);
    if (group.members.length <= state.groups[idx + 1 == state.groups.length ? 0 : idx + 1].members.length) {
      group.members.push(socket.id);
      break;
    }
  }
  // not really doing anything with todd's code here but leaving it if it's useful
  // updateGuestList();

  io.emit("sendGuestList", state.groups);

  socket.on("guestEnter", function (data) {
    socket.join("guests");
  });
  // send state to client
  io.emit("updateState", state);

  // this stuff should be adapted to allow i/o from client/"performer"
  socket.on("sendStatus", function (data) {
    io.emit("statusMsg", socket.id + " " + data);
  });

  socket.on("clientAction", function (data) {
    io.emit(data.type, data);
  });

  // host actions should be sent to group
  // a potential refactor back to using host/client instead of a catchall updateState *could* be a good idea but
  // for now updateState seems simpler
  socket.on("hostAction", function (data) {
    // this is actually a clever little thing but i'm not sure how it would work unless i were using rooms better
    //if (data.target && data.type) {
    //  io.to(data.target).emit(data.type, data);
    //} else {
    //  io.emit(data.type, data);
    //}
  });

  socket.on("updateState", function (data) {
    // Object.assign(state, data)
    // if data includes new prompt/option, add that to group
    // if data includes new object, add it to object list
    console.log("updating state: ", data);
    // types:
    // newObject (from client)
    // vote (from client)
    // newPrompt (from admin)
    switch (data.updateType) {
      case "newObject":
        state.objects.push(data.object);
        break;
      case "newPrompt":
        for (group of state.groups) {
          if (data.target == "all") {
            group.previousVotes.push(group.currentPrompt);
            group.currentPrompt = { prompt: data.prompt, options: data.options, votes: [] };
          } else {
            if (group.name == data.target) {
              group.previousVotes.push(group.currentPrompt);
              group.currentPrompt = { prompt: data.prompt, options: data.options, votes: [] };
            }
          }
        }
        break;
      case "vote":
        console.log("vote: ", data);
        state.groups[data.group.index].currentPrompt.votes.push(data.value);
        break;
      default:
        console.log("Attempting update with incorrect update type");
    }

    io.emit("updateState", state);
  });

  socket.on("disconnect", removeDisconnected);
}
function updateGuestList(socket) {
  // still not sure if i'm gonna do anything with guestlist, but leaving it here just in case
  getSocketsInRoom("guests").then((guests) => {
    console.log(guests);
    io.emit("sendGuestList", guests);
  });
}

// on socket disconnect, remove from group list
// TODO figure out 'soft fail' condition for disconnect
// ideally, getting position from AR stuff or marker, can reassign to group automatically on reconnect
// although I guess it's kinda funny to just make people run to a new group if they disconnect

function removeDisconnected(socket) {
  console.log("should be removing: ", socket.id);
  for (group of state.groups) {
    if (group.members.includes(socket.id)) {
      const idx = group.members.indexOf(socket.id);
      group.members.splice(idx, 1);
    }
  }
}
async function getSocketsInRoom(room) {
  let returnArray = [];
  const sockets = await io.in(room).fetchSockets();
  for (let i = 0; i < sockets.length; i++) {
    returnArray.push(sockets[i].id);
  }
  return returnArray;
}
