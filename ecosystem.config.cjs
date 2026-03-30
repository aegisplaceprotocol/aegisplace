module.exports = {
  apps: [{
    name: "aegis-protocol",
    script: "dist/index.js",
    cwd: "/root/aegis/aegis-build",
    node_args: "",
    env: {
      NODE_ENV: "production",
    }
  }]
};
