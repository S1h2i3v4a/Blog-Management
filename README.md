"# Blog-Management" 
















1.Architecture Flow (MVC Pattern)
"When a client sends a request like GET /blog/:id, Express matches the incoming URL path in the routes module.

Middleware: Before hitting the main controller, the request passes through middleware functions for authentication, role verification, or input validation. If validation fails, it halts early and returns an error response.

Controller: Once validated, control moves to the specific controller function (e.g., getBlogById). The controller coordinates the execution and handles the request/response lifecycle.

Model: The controller calls the Mongoose/Database model to fetch the blog post data based on the route parameter id. The model queries the database and returns the document object back to the controller.

View: Finally, the controller calls res.render('blog-detail', { blog }), passing the retrieved data to the EJS view engine. EJS populates the dynamic HTML template with the post details, and Express sends the rendered HTML back to the client."


2.Ajax vs. WebSockets
Ajax (Asynchronous JavaScript and XML) is not typically used for true real-time communication because it operates on a standard client-initiated HTTP request-response cycle (polling is required for real-time updates).

WebSockets are specifically designed for real-time, full-duplex, bidirectional communication (e.g., live notifications, instant messaging, live comment feeds) where the server can push updates to the client without the client requesting them.

WebSockets use the ws:// or wss:// protocol over a single, persistent TCP connection—not just standard HTTP web URL connections.

