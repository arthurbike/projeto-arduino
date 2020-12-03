require("dotenv").config();

const cors = require("cors");
const path = require("path");
const express = require("express");
const five = require("johnny-five");
const board = new five.Board({ port: "/dev/ttyUSB0", repl: false });

const SERVER_PORT = process.env.SERVER_PORT;

let clients = [];
let clientId = "";

const app = express();

// config middlewares
app.use(cors());
app.set("trust proxy", true);
app.use(express.static(path.resolve(__dirname, "..", "public")));

// routes
app.get("/", (req, res) => res.sendFile("index.html"));

// only accepts requests on the default/home endpoint
app.all("*", (req, res) => res.status(404).send({ message: "Not Found" }));

// arduino settings
let ledState = false;
let led;

const changeState = () => {
  ledState = !ledState;
  if (ledState) {
    led.on();
  } else {
    led.off();
  }
};

board.on("ready", () => {
  console.log("Board ready!");

  led = new five.Led.RGB({
    pins: {
      red: 11,
      green: 10,
      blue: 9,
    },
    isAnode: true,
  });

  button = new five.Button(2);

  button.on("down", () => {
    changeState();
  });

  button.on("up", () => {
    changeState;
  });

  led.on();
  led.color("#FF0000");

  // socket functionalities
  const server = require("http").createServer(app);
  const io = require("socket.io")(server);

  const removeClient = (client) =>
    (clients = clients.filter((x) => clients[client]));

  io.on("connection", (socket) => {
    clientId = socket.id;
    clients.push(clientId);
    io.sockets.emit("newClient", clientId);

    socket.on("disconnect", () => {
      removeClient(clientId);
      console.log(`CLIENT DISCONNECTED: ${clientId}
    List of clients: [${clients}];`);
      io.sockets.emit("message", `CLIENT DISCONNECTED: ${clientId}`);
    });

    socket.on("toogleLed", () => {
      ledState = !ledState;
      if (ledState) {
        led.on();
      } else {
        led.off();
      }
      console.log(ledState);
    });

    socket.on("color_changed", (color) => {
      led.color(color);
      console.log(color);

      io.sockets.emit("color_changed", color);
    });

    console.log(clients);

    io.sockets.emit(
      "message",
      `New client, id: ${clientId};
    List of clients: [${clients}];`
    );
  });

  server.listen(SERVER_PORT, () =>
    console.log(`Server listening on port ${SERVER_PORT}`)
  );
});
