const http = require("http");
const url = require("url");
let students = require("./data/students");

const PORT = 5000;

// Utility to send JSON responses

const sendJSON = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

// Utility to parse request body

const getRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // ROUTES

  // GET all students

  if (path === "/students" && method === "GET") {
    return sendJSON(res, 200, students);
  }

  // GET student by ID

  if (path.match(/^\/students\/\d+$/) && method === "GET") {
    const id = parseInt(path.split("/")[2]);
    const student = students.find(s => s.id === id);
    return student
      ? sendJSON(res, 200, student)
      : sendJSON(res, 404, { message: "Student not found" });
  }

  // POST new student

  if (path === "/students" && method === "POST") {
    try {
      const body = await getRequestBody(req);
      if (!body.name || !body.room) {
        return sendJSON(res, 400, { message: "Name and room are required" });
      }
      const newStudent = { id: students.length + 1, ...body };
      students.push(newStudent);
      return sendJSON(res, 201, newStudent);
    } catch {
      return sendJSON(res, 400, { message: "Invalid JSON" });
    }
  }

  // PUT update student
  
  if (path.match(/^\/students\/\d+$/) && method === "PUT") {
    try {
      const id = parseInt(path.split("/")[2]);
      const student = students.find(s => s.id === id);
      if (!student) return sendJSON(res, 404, { message: "Student not found" });

      const body = await getRequestBody(req);
      student.name = body.name || student.name;
      student.room = body.room || student.room;
      return sendJSON(res, 200, student);
    } catch {
      return sendJSON(res, 400, { message: "Invalid JSON" });
    }
  }

  // DELETE student

  if (path.match(/^\/students\/\d+$/) && method === "DELETE") {
    const id = parseInt(path.split("/")[2]);
    const exists = students.some(s => s.id === id);
    if (!exists) return sendJSON(res, 404, { message: "Student not found" });

    students = students.filter(s => s.id !== id);
    return sendJSON(res, 200, { message: `Student with ID ${id} deleted` });
  }

  // GET students in a room

  if (path.match(/^\/rooms\/\d+$/) && method === "GET") {
    const roomNumber = parseInt(path.split("/")[2]);
    const roomStudents = students.filter(s => s.room === roomNumber);
    return roomStudents.length > 0
      ? sendJSON(res, 200, roomStudents)
      : sendJSON(res, 404, { message: `No students found in room ${roomNumber}` });
  }

  // Default: Route not found

  sendJSON(res, 404, { message: "Route not found" });
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
