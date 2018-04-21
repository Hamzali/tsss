const Snake = require("./snake"),
  CONSTANTS = require("./constants"),
  configs = require("./configs");

const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);

server.listen(process.env.PORT || 8000);

// Server state.
const players = {};

let foods = [
  { x: 1, y: 10, type: 1 },// random generate.
  { x: 5, y: 13, type: 1 },
  { x: 10, y: 10, type: 1 },
  { x: 21, y: 20, type: 1 }
];

const gameMap = {};

foods.forEach((food, key) => {
  gameMap[food.x + "#" + food.y] = {
    type: food.type,
    key: key
  };
});

function checkFood() {
  const foodKey = this.x + "#" + this.y;
  if (gameMap[foodKey]) {
    // notify the clients.
    this.socket.emit("grow", { id: this.socket.id, body: this.body, foodKey });
    this.socket.broadcast.emit("grow", {
      id: this.socket.id,
      body: this.body,
      foodKey
    });
    // grow the server snake.
    this.grow(1);
    // remove food from server
    const { key } = gameMap[foodKey];
    gameMap[foodKey] = undefined;
    foods = [...foods.slice(0, key), ...foods.slice(key + 1, foods.length)];
  }
}

const { DIRECTIONS } = CONSTANTS;

io.on("connection", socket => {
  console.log("connected ", socket.id);
  
  const snakes = Object.keys(players).reduce((acc, id) => {
    if (!players[id]) {
      return acc;
    }
    const { bodyLength, x, y, direciton, bodyColor } = players[id];
    return [...acc, { id, x, y, direciton, length: bodyLength, bodyColor}];
  }, []);

  socket.emit("start_game", { foods, snakes });

  players[socket.id] = new Snake(socket, {
    startX: 0, // random select.
    startY: 0,
    length: configs.startLength,
    checkFood
  });

  socket.on("disconnect", () => {
    console.log("disconnect ", socket.id);
    socket.broadcast.emit("destroy_snake", {id: socket.id});
    players[socket.id] = undefined;
  });
});
