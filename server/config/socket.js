import registerSocketEvents from "../socket/index.js";

export default function setupSocket(io) {
  registerSocketEvents(io);
}