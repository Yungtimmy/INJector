const http = require("http");
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("INJector is running");
});
server.listen(process.env.PORT || 3000);
module.exports = { server };