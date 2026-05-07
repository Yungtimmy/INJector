

const http = require("http");
const server = http.createServer((req, res) => {
  res.writeHead(200);
    res.end("INJector is running");
    });
    server.listen(process.env.PORT || 3000);

    // Self ping every 5 minutes
    setInterval(() => {
      http.get(`http://localhost:${process.env.PORT || 3000}`);
      }, 5 * 60 * 1000);

      module.exports = { server };