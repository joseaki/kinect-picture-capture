const express = require("express");
const { exec, spawn } = require("child_process");
const app = express();
const bodyParser = require("body-parser");
const port = 8080;
const readline = require("node:readline/promises");
const asd = require("node:process");
const { stdin, stdout } = asd;

const rl = readline.createInterface({ input: stdin, output: stdout });

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static("public"));

let command;
const controller = new AbortController();
const { signal } = controller;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/start", (req, res) => {
  const { fps = 5, length = -1, color = "1080p", exposure } = req.body;

  if (command) {
    res.send({
      message: "already started",
    });
    return;
  }

  exposureList = exposure ? ["-e", exposure] : [];

  command = spawn(`./azure pictures/TakePictureAzureKinect.exe`);
  console.log(command.pid);

  command.stdout.on("data", (data) => {
    io.emit("commandEvent", {
      line: `stdout: ${data}`,
      data,
    });
  });

  command.stderr.on("data", (data) => {
    io.emit("commandEvent", {
      line: `stdout: ${data}`,
      data,
    });
  });

  command.on("error", (error) => {
    io.emit("commandEvent", {
      line: `stdout: ${error}`,
      error,
    });
  });

  command.on("close", (code, signal) => {
    console.log(`child process terminated due to receipt of signal ${signal}`);
    command = undefined;
  });

  res.send({
    message: "started",
  });
});

app.post("/newPicture", (req, res) => {
  io.emit("commandEvent", {
    line: `stdout: loading ................`,
    data: {},
  });
  command.stdin.setEncoding("utf-8");
  command.stdout.pipe(process.stdout);
  command.stdin.cork();
  command.stdin.write("1\n");
  command.stdin.uncork();
  res.send({
    message: "taking",
  });
});

app.post("/stop", (req, res) => {
  try {
    command.stdin.setEncoding("utf-8");
    command.stdout.pipe(process.stdout);
    command.stdin.cork();
    command.stdin.write("0\n");
    command.stdin.uncork();
    res.send({
      message: "stopped",
    });
  } catch (error) {
    res.send({
      message: "error stopping",
    });
  }
});

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
  });
});

server.listen(port, () => {
  console.log("listening on *:" + port);
});
