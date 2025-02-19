const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  if (process.env.NODE_ENV === "development") {
    app.use(
      "/",
      createProxyMiddleware({
        target: "http://localhost:8081",
        changeOrigin: true,
      })
    );
  }
};
