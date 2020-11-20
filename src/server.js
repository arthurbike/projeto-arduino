require("dotenv").config();

const SERVER_PORT = process.env.SERVER_PORT;
const MAX_CLIENTS_COUNT = 2;
let clients = [];
let clientId = "";

const path = require("path");
const express = require("express");
const cors = require("cors");
const five = require("johnny-five");
const board = new five.Board({ port: "/dev/ttyUSB0", repl: false });

const app = express();

// config middlewares
app.use(cors());
app.set("trust proxy", true);
app.use(express.static(path.resolve(__dirname, "..", "public")));

// arduino settings
let ledState = false;

board.on("ready", () => {
  console.log("Board ready!");
  const led = new five.Led(13);

  const toogleLed = () => {
    ledState ? led.on() : led.off();
  };

  board.loop(100, toogleLed);
});

// routes
app.get("/", (req, res) => res.sendFile("index.html"));

// only accepts requests on the default/home endpoint
app.all("*", (req, res) => res.status(404).send({ message: "Not Found" }));

// socket functionalities
const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  clientId = socket.id;
  clients.push(clientId);
  io.sockets.emit("newClient", clientId);

  socket.on("disconnect", () => {
    console.log(`CLIENT DISCONNECTED: ${clientId}`);
    io.sockets.emit("message", `CLIENT DISCONNECTED: ${clientId}`);
  });

  socket.on("toogleLed", () => {
    ledState = !ledState;
    console.log(ledState);
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
