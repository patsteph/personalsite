import type { NextApiResponse } from "next";
import { withCORSAuth, AuthenticatedRequest } from "@/lib/api/middleware";
import { initializeAdminApp, getAdminFirestore } from "@/lib/firebase-admin";
import {
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase-admin/firestore";
import { SignalSchema, SignalSchemaType } from "@/lib/schemas/signals";
import { sanitizeData } from "@/lib/api/signals";

console.log("--- pages/api/signals.ts: Module evaluation starting ---");

// Initialize Firebase Admin
initializeAdminApp();
const db = getAdminFirestore();

const SIGNALS_COLLECTION = "signals";

// Define helper locally as it uses server-only Timestamp
function convertFirestoreSignalToApiResponse(
  docData: FirebaseFirestore.DocumentData | undefined | null,
): Record<string, any> {
  if (!docData) return {};
  const data: Record<string, any> = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString(); // Convert Timestamp to ISO string
    } else if (data[key] === undefined) {
      data[key] = null; // Convert undefined to null
    }
  }
  return data;
}

async function handler(
  req: AuthenticatedRequest,
  // Use `any` for data type temporarily to align with convertFirestoreSignalToApiResponse return type
  res: NextApiResponse<any>,
) {
  console.log(
    `Signals API received ${req.method} request from user: ${req.user?.uid}`,
    req.query ? `with query: ${JSON.stringify(req.query)}` : "",
    req.body ? `with body keys: ${Object.keys(req.body).join(", ")}` : "",
  );

  const signalsCollection = db.collection(SIGNALS_COLLECTION);

  try {
    // --- Handle GET Requests (Publicly Accessible) ---
    if (req.method === "GET") {
      try {
        console.log("Signals API: Processing GET request.");
        const { id, type } = req.query;

        if (id && typeof id === "string") {
          // Fetch specific signal by ID
          console.log(`Signals API: Handling GET request for ID: ${id}`);
          const docRef = signalsCollection.doc(id);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            console.log(`Signals API: Found signal with ID: ${id}`);
            return res.status(200).json({
              success: true,
              data: {
                id: docSnap.id,
                ...convertFirestoreSignalToApiResponse(docSnap.data()),
              },
            });
          } else {
            console.log(`Signals API: Signal not found with ID: ${id}`);
            return res
              .status(404)
              .json({ success: false, error: "Signal not found" });
          }
        } else {
          // Fetch all signals or filter by type
          console.log(
            "Signals API: Handling GET request for all signals or filtered by type.",
          );
          let query = signalsCollection.orderBy("createdAt", "desc");

          if (type && typeof type === "string") {
            console.log(`Signals API: Filtering by type: ${type}`);
            query = signalsCollection
              .where("type", "==", type)
              .orderBy("createdAt", "desc");
          }

          const querySnapshot = await query.get();
          const signals = querySnapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({
              id: doc.id,
              ...convertFirestoreSignalToApiResponse(doc.data()),
            }),
          );
          console.log(`Signals API: Found ${signals.length} signals.`);
          return res.status(200).json({ success: true, data: signals });
        }
      } catch (error: any) {
        console.error("Signals API error handling GET:", error);
        return res
          .status(500)
          .json({
            success: false,
            error: `Internal server error: ${error.message}`,
          });
      }
    }

    // --- Handle Authenticated POST ---
    if (req.method === "POST") {
      try {
        console.log("Signals API: Entered POST handler try block.");
        console.log("Signals API: Raw request body:", req.body);
        const sanitizedBody = sanitizeData(req.body);
        console.log("Signals API: Sanitized request body:", sanitizedBody);

        // --- Data Validation using Imported Zod Schema ---
        let validatedData: SignalSchemaType;
        try {
          console.log("Signals API: Attempting data validation with Zod...");
          // Use the imported SignalSchema
          validatedData = SignalSchema.parse(sanitizedBody);
          console.log("Signals API: Zod validation successful.");
        } catch (error: any) {
          console.error(
            "Signals API: Zod validation failed:",
            error.errors || error,
          );
          // Provide more specific error details if available from Zod
          const zodError = error.errors
            ? error.errors
                .map((e: any) => `${e.path.join(".")}: ${e.message}`)
                .join(", ")
            : error.message;
          return res
            .status(400)
            .json({ success: false, error: `Validation failed: ${zodError}` });
        }
        // --- End Zod Validation ---

        console.log("Signals API: Preparing data for Firestore...");
        const now = Timestamp.now();
        // Define type based on validated data before converting dateAdded
        const { dateAdded: validatedDateAddedString, ...restOfValidatedData } =
          validatedData;
        const signalData: Omit<SignalSchemaType, "id" | "dateAdded"> & {
          createdAt: Timestamp;
          updatedAt: Timestamp;
          dateAdded: Timestamp;
        } = {
          ...restOfValidatedData,
          createdAt: now,
          updatedAt: now,
          dateAdded: validatedDateAddedString
            ? Timestamp.fromDate(new Date(validatedDateAddedString))
            : now,
        };
        console.log("Signals API: Data prepared for Firestore:", signalData);

        console.log("Signals API: Adding document to Firestore...");
        const docRef = await signalsCollection.add(signalData);
        console.log("Signals API: Document added with ID:", docRef.id);

        // Fetch the newly created document
        const newDoc = await docRef.get();
        if (!newDoc.exists) {
          console.error(
            "Signals API: Failed to retrieve newly created signal document:",
            docRef.id,
          );
          return res
            .status(500)
            .json({
              success: false,
              error: "Failed to retrieve signal after creation",
            });
        }

        return res.status(201).json({
          success: true,
          data: {
            id: newDoc.id,
            ...convertFirestoreSignalToApiResponse(newDoc.data()!),
          },
        });
      } catch (error: any) {
        console.error("Signals API error creating signal:", error);
        console.error("Detailed error:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        return res
          .status(500)
          .json({
            success: false,
            error: `Internal server error: ${error.message}`,
          });
      }
    }

    // --- Handle Authenticated PUT ---
    if (req.method === "PUT") {
      try {
        console.log("Signals API: Handling PUT request.");
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res
            .status(400)
            .json({
              success: false,
              error: "Signal ID is required in query parameters",
            });
        }

        const docRef = signalsCollection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          console.log(`Signals API: PUT failed, document not found: ${id}`);
          return res
            .status(404)
            .json({ success: false, error: "Signal not found" });
        }

        const sanitizedBody = sanitizeData(req.body);

        // Validate data with Zod
        let validatedData: SignalSchemaType;
        try {
          validatedData = SignalSchema.parse(sanitizedBody);
        } catch (error: any) {
          const zodError = error.errors
            ? error.errors
                .map((e: any) => `${e.path.join(".")}: ${e.message}`)
                .join(", ")
            : error.message;
          return res
            .status(400)
            .json({ success: false, error: `Validation failed: ${zodError}` });
        }

        const { dateAdded: validatedDateAddedString, ...restOfValidatedData } =
          validatedData;
        const updateData = {
          ...restOfValidatedData,
          updatedAt: Timestamp.now(),
          ...(validatedDateAddedString && {
            dateAdded: Timestamp.fromDate(new Date(validatedDateAddedString)),
          }),
        };
        delete (updateData as any).id; // Prevent changing ID
        delete (updateData as any).createdAt; // Don't update createdAt

        console.log(
          `Signals API: Updating document ${id} with data:`,
          updateData,
        );
        await docRef.update(updateData);
        console.log(`Signals API: Document ${id} updated successfully.`);

        // Fetch and return the updated document
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
          console.error(
            `Signals API: Signal document ${id} not found after update.`,
          );
          return res
            .status(404)
            .json({ success: false, error: "Signal not found after update" });
        }

        return res.status(200).json({
          success: true,
          data: {
            id: updatedDoc.id,
            ...convertFirestoreSignalToApiResponse(updatedDoc.data()!),
          },
        });
      } catch (error: any) {
        console.error(
          `Signals API error updating signal ${req.query.id}:`,
          error,
        );
        return res
          .status(500)
          .json({
            success: false,
            error: `Internal server error: ${error.message}`,
          });
      }
    }

    // --- Handle Authenticated DELETE ---
    if (req.method === "DELETE") {
      try {
        console.log("Signals API: Handling DELETE request.");
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res
            .status(400)
            .json({
              success: false,
              error: "Signal ID is required in query parameters",
            });
        }

        const docRef = signalsCollection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          console.log(`Signals API: DELETE skipped, document not found: ${id}`);
          // Idempotent: Return success even if already deleted
          return res.status(200).json({
            success: true,
            data: { id, message: "Already deleted or never existed" },
          });
        }

        console.log(`Signals API: Deleting document ${id}.`);
        await docRef.delete();
        console.log(`Signals API: Document ${id} deleted successfully.`);

        return res.status(200).json({
          success: true,
          data: { id }, // Confirm deletion by returning ID
        });
      } catch (error: any) {
        console.error(
          `Signals API error deleting signal ${req.query.id}:`,
          error,
        );
        return res
          .status(500)
          .json({
            success: false,
            error: `Internal server error: ${error.message}`,
          });
      }
    }

    // Method Not Allowed
    console.log(`Signals API: Method ${req.method} not allowed.`);
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE", "OPTIONS"]);
    return res
      .status(405)
      .json({ success: false, error: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error("Signals API: UNCAUGHT ERROR IN HANDLER:", error);
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    if (error.cause) {
      console.error("Error Cause:", error.cause);
    }
    if (!res.headersSent) {
      return res
        .status(500)
        .json({
          success: false,
          error: "Internal Server Error occurred in handler.",
        });
    } else {
      console.error(
        "Signals API: Headers already sent, could not send 500 response for uncaught error.",
      );
    }
  }
}

export default withCORSAuth(handler);
