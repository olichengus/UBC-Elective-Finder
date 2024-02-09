import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static InsightFacade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		Server.InsightFacade = new InsightFacade();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
	   this.express.use(express.static("./my-react-frontend/src"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));
		this.express.get("/echo/:msg", Server.echo);
		this.express.put("/dataset/:id/:kind", Server.putEndpoint);
		this.express.delete("/dataset/:id", Server.deleteEndpoint);
		this.express.get("/datasets", Server.getEndpoint);
		this.express.post("/query", Server.postEndpoint);

	}

	private static async putEndpoint(req: Request, res: Response) {
		try {
			let response;
			// the req body should be a zip sent in as a buffer
			const base64Data = Buffer.isBuffer(req.body) ? req.body.toString("base64") : req.body; // CHATGPT line
			let Insight = Server.InsightFacade;
			if (req.params.kind === "sections") {
				response = await Insight.addDataset(req.params.id, base64Data, InsightDatasetKind.Sections);
			} else if (req.params.kind === "rooms") {
				response = await Insight.addDataset(req.params.id, base64Data, InsightDatasetKind.Rooms);
			}
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: "Error inserting dataset"});
		}
	}

	// chatgpt helped with "err instanceof" lines
	private static async deleteEndpoint(req: Request, res: Response) {
		try {
			let response;
			let Insight = Server.InsightFacade;
			response = await Insight.removeDataset(req.params.id);
			res.status(200).json({result: response});
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(400).json({error: "InsightError"});
			} else if (err instanceof NotFoundError) {
				res.status(404).json({error: "NotFoundError"});
			}
		}
	}


	private static async getEndpoint(req: Request, res: Response) {
		try {
			let response;
			let Insight = Server.InsightFacade;
			response = await Insight.listDatasets();
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: "Error listing dataset"});
		}
	}

	private static async postEndpoint(req: Request, res: Response) {
		try {
			let response;
			let Insight = Server.InsightFacade;
			response = await Insight.performQuery(req.body);
			if (!response || response.length === 0) {
				res.status(400).json({error: "Invalid query"});
			} else {
				res.status(200).json({result: response});
			}
		} catch (err) {
			res.status(400).json({error: "Error querying"});
		}
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
