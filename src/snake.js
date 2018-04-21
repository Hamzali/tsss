const CONSTANTS = require("./constants"),
  configs = require("./configs");
const { DIRECTIONS } = CONSTANTS;

const getRandomColor = () => 
  Math.floor(Math.random() * 0xFFFFFF)


class Snake {
  constructor(
    socket,
    {
      startX = 0,
      startY = 0,
      length = 3,
      direction = DIRECTIONS.RIGHT,
      speed = 20,
      checkFood
    } = {}
  ) {
    this.socket = socket;
    this.x = startX;
    this.y = startY;
    this.body = [];
    this.bodyLength = length;
    this.direction = direction;
    this.bodyColor = getRandomColor();
    this.headColor = 0xFF0000;
    this.initBody();
    this.speed = speed;
    this.checkFood = checkFood;
    this.setup_connection();
    this.start();
  }

  initBody() {
    const { LEFT, RIGHT, UP, DOWN } = DIRECTIONS;
    let amountX = 0,
      amountY = 0;
    switch (this.direction) {
      case LEFT:
        amountX = 1;
        break;
      case RIGHT:
        amountX = -1;
        break;
      case UP:
        amountY = -1;
        break;
      case DOWN:
        amountY = 1;
        break;
    }

    for (let i = 0; i < this.bodyLength; i++) {
      this.body.push({
        x: this.x + (i + 1) * amountX,
        y: this.y + (i + 1) * amountY
      });
    }
  }

  setup_connection() {
    const { bodyLength, direction, startX, startY, socket, bodyColor } = this;
    const snake_data = {
      id: socket.id,
      bodyLength,
      direction,
      startX,
      startY,
      bodyColor 
    };

    this.socket.emit("setup_snake", snake_data);
    this.socket.broadcast.emit("setup_snake", snake_data);

    this.socket.on("set_direction", data => {
      const { LEFT, RIGHT, UP, DOWN } = DIRECTIONS;
      switch (data) {
        case LEFT:
          this.turnLeft();
          break;
        case RIGHT:
          this.turnRight();
          break;
        case UP:
          this.turnUp();
          break;
        case DOWN:
          this.turnDown();
          break;
      }

      this.socket.broadcast.emit("update_direction", {
        id: socket.id,
        direction: this.direction
      });
    });
  }

  start() {
    // set speed variable.
    setInterval(() => {
      this.update();
      const updateData = {
        id: this.socket.id,
        x: this.x,
        y: this.y,
        body: this.body
      };
      this.socket.emit("update_snake", updateData);
      this.socket.broadcast.emit("update_snake", updateData);
    }, 100); // this might be speed.
  }

  update() {
    this.checkFood && this.checkFood();
    this.move();
  }

  move() {
    // update the body movin.
    const lastPart = this.body[this.body.length - 1];
    lastPart.x = this.x;
    lastPart.y = this.y;
    this.body = [lastPart, ...this.body.slice(0, this.body.length - 1)];

    const { LEFT, RIGHT, UP, DOWN } = DIRECTIONS;
    switch (this.direction) {
      case LEFT:
        this.x -= 1;
        break;
      case RIGHT:
        this.x += 1;
        break;
      case UP:
        this.y -= 1;
        break;
      case DOWN:
        this.y += 1;
        break;
    }
    this.checkBounds();
  }

  checkBounds() {
    if (this.x > configs.width) {
      this.x = 0;
    }

    if (this.y > configs.height) {
      this.y = 0;
    }

    if (this.x < 0) {
      this.x = configs.width;
    }

    if (this.y < 0) {
      this.y = configs.height;
    }
  }

  turnLeft() {
    if (
      this.direction === DIRECTIONS.UP ||
      this.direction === DIRECTIONS.DOWN
    ) {
      this.direction = DIRECTIONS.LEFT;
    }
  }

  turnRight() {
    if (
      this.direction === DIRECTIONS.UP ||
      this.direction === DIRECTIONS.DOWN
    ) {
      this.direction = DIRECTIONS.RIGHT;
    }
  }

  turnUp() {
    if (
      this.direction === DIRECTIONS.LEFT ||
      this.direction === DIRECTIONS.RIGHT
    ) {
      this.direction = DIRECTIONS.UP;
    }
  }

  turnDown() {
    if (
      this.direction === DIRECTIONS.LEFT ||
      this.direction === DIRECTIONS.RIGHT
    ) {
      this.direction = DIRECTIONS.DOWN;
    }
  }

  setSpeed(speed) {
    if (speed > Snake.MAX_SPEED) {
      speed = Snake.MAX_SPEED;
    }

    if (speed < Snake.MIN_SPEED) {
      speed = Snake.MIN_SPEED;
    }

    this.speed = speed;
  }

  grow(count = 1) {
    const { body } = this;
    for (let i = 0; i < count; i++) {
      const { x, y } = body[body.length - 1];
      body.push({
        x: x,
        y: y + 1
      });
    }
    this.bodyLength += count;
  }
}

Snake.MAX_SPEED = 1;
Snake.MIN_SPEED = 100;
Snake.SPEED_CONST = 100;

module.exports = Snake;
