const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const shortid = require('shortid');

app.use("/static", express.static('public'));
app.set('view engine', 'pug')

const { setupRoom } = require("./room");

server.listen(process.env.PORT || 8000);

const configs = require("./configs");

app.get("/", (req, res) => {
  // generate unique room id.
  const id = shortid.generate();
  
  // create room.
  setupRoom(id, io, configs.width, configs.height, configs.foodCount);

  // redirect user to room.
  res.redirect("/" + id);
});

app.get("/:id", (req, res) => {
  // give the game file.
  res.render("index");
})
