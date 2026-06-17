import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const root = resolve("dist");
const preferredPort = 5173;
const listenHost = "0.0.0.0";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

if (!existsSync(join(root, "index.html"))) {
  console.error("dist/index.html was not found. Run npm.cmd run build first.");
  process.exit(1);
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

function getLanUrls(port) {
  const urls = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        urls.push(`http://${entry.address}:${port}/`);
      }
    }
  }
  return urls;
}

function createAppServer() {
  return createServer(async (request, response) => {
    const requestPath = decodeURIComponent((request.url ?? "/").split("?")[0]);
    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const filePath = normalize(join(root, relativePath));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const content = await readFile(filePath);
      response.setHeader("Content-Type", mimeTypes[extname(filePath)] ?? "application/octet-stream");
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
}

function listenOnPort(port) {
  const server = createAppServer();
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 10) {
      listenOnPort(port + 1);
      return;
    }
    console.error(error.message);
    process.exit(1);
  });
  server.listen(port, listenHost, () => {
    const localUrl = `http://127.0.0.1:${port}/`;
    const lanUrls = getLanUrls(port);
    console.log(`Seminar Design Compass is running: ${localUrl}`);
    if (lanUrls.length > 0) {
      console.log("");
      console.log("Phone/tablet URL on the same Wi-Fi:");
      for (const url of lanUrls) console.log(`  ${url}`);
      console.log("");
      console.log("If Windows Firewall asks, allow access on private networks.");
    } else {
      console.log("No LAN address was found. Check Wi-Fi or network settings.");
    }
    console.log("Keep this window open while using the app.");
    openBrowser(localUrl);
  });
}

listenOnPort(preferredPort);
