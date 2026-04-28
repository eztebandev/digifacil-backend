import express from "express";
import cors from "cors";
import { config } from "./config.js";
import coursesRoutes from "./routes/coursesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/courses", coursesRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Ocurrio un error interno en el servidor." });
});

app.listen(config.port, () => {
  console.log(`DigiFacil API ejecutandose en http://localhost:${config.port}`);
});
