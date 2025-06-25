let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let io = require("socket.io")(httpServer);

let connections = [];
let history = [];
let redoHistory = [];

io.on("connect", (socket) => {
  connections.push(socket);
  console.log(`${socket.id} connected`);

  socket.on("down", (data) => {
    socket.broadcast.emit("ondown", { x: data.x, y: data.y });
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("ondraw", data);
  });

  socket.on("onshape", (data) => {
    if (data.before) {
      history.push(data.before); 
      redoHistory = [];
    }
    socket.broadcast.emit("onshape", data);
  });

  socket.on("onclear", (beforeDataUrl) => {
    if (beforeDataUrl) {
      history.push(beforeDataUrl); 
      redoHistory = [];
    }
    socket.broadcast.emit("onclear");
  });

  socket.on("onundo", () => {
    if (history.length > 0) {
      redoHistory.push(history.pop());
      let prevState = history.length ? history[history.length - 1] : null;
      io.emit("onundo", prevState); 
    }
  });

  socket.on("onredo", () => {
    if (redoHistory.length > 0) {
      let restoredState = redoHistory.pop();
      history.push(restoredState);
      io.emit("onredo", restoredState); 
    }
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
    connections = connections.filter((c) => c.id !== socket.id);
  });

  socket.on('oncommit', ({ before }) => {
    if (before) {
        history.push(before);
        redoHistory = [];
    }
});


});

app.use(express.static("public"));
let PORT = process.env.PORT || 6969;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
