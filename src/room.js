const Snake = require("./snake"),
  CONSTANTS = require("./constants"),
  configs = require("./configs");

function removeFood(foods, x, y, map) {
  map[x + "#" + y] = undefined;
  return foods.filter(food => !(food.x === x && food.y === y));
}

function generateFood(width, height, map, type = 1) {
  let x = Math.floor(Math.random() * width - 1),
      y = Math.floor(Math.random() * height - 1);

  while(map[x + "#" + y]) {
    x = Math.floor(Math.random() * width);
    y = Math.floor(Math.random() * height);
  }

  map[x + "#" + y] = {type};

  return {x, y, type};
}

function initFoods(count, width, height, map, type) {
  const f = [];
  while(count--) {
    const newFood = generateFood(width, height, map, type);
    f.push(newFood)
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
    if (gameMap[this.x + "#" + this.y]) {
      const growData = {
        id: this.socket.id,
        body: this.body,
        x: this.x,
        y: this.y
      }

      // notify the clients.
      this.socket.emit("grow", growData);
      this.socket.broadcast.emit("grow", growData);

      // grow the server snake.
      this.grow(1);
      foods = removeFood(foods, this.x, this.y, gameMap);
      // remove food from server
      const newFood = generateFood(width, height, gameMap);
      nsp.emit("create_food", newFood);
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
