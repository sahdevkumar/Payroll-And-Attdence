import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";

const API_BASE_URL = "http://43.225.52.40:81";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy API requests to the biometric device API
  app.use("/api/biometric", async (req, res) => {
    try {
      const url = `${API_BASE_URL}${req.url}`;
      const headers: any = {
        ...req.headers,
        host: undefined,
        origin: undefined,
        referer: undefined,
      };

      if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
        delete headers.authorization;
      }

      const response = await axios({
        method: req.method,
        url: url,
        data: req.body,
        headers: headers,
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
