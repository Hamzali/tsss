const Snake = require("./snake"),
  CONSTANTS = require("./constants"),
  configs = require("./configs");

function generateFood(width, height, map, type = 1) {
  let x = Math.floor(Math.random() * width),
      y = Math.floor(Math.random() * height);

  while(map[x + "#" + y]) {
    x = Math.floor(Math.random() * width);
    y = Math.floor(Math.random() * height);
  }

  return {x, y, type};
}

function initFoods(count, width, height, map, type) {
  const f = [];
  while(count--) {
    f.push(generateFood(width, height, map, type))
  }
  return f;
}
exports.setupRoom = (roomId, io, width, height, foodCount, speed) => {
  const nsp = io.of("/" + roomId);
  // Server state.
  const players = {};
  const gameMap = {};
  let foods = initFoods(foodCount, width, height, gameMap);
 

  function checkFood() {
    const foodKey = this.x + "#" + this.y;
    if (gameMap[foodKey]) {
      // notify the clients.
      this.socket.emit("grow", {
        id: this.socket.id,
        body: this.body,
        foodKey
      });
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
      const newFood = generateFood(width, height, gameMap);
      foods = [...foods.slice(0, key), ...foods.slice(key + 1), newFood];

      nsp.socket.emit("create_food", newFood);
    }
  }

  const { DIRECTIONS } = CONSTANTS;

  nsp.on("connection", socket => {
    console.log("connected:" + roomId, socket.id);

    const snakes = Object.keys(players).reduce((acc, id) => {
      if (!players[id]) {
        return acc;
      }
      const { bodyLength, x, y, direciton, bodyColor } = players[id];
      return [...acc, { id, x, y, direciton, length: bodyLength, bodyColor }];
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
      socket.broadcast.emit("destroy_snake", { id: socket.id });
      players[socket.id] = undefined;
    });
  });
};
