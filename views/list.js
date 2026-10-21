// list.js

let selectedFlags = JSON.parse(localStorage.getItem('selectedFlags')) || []; // Retrieve from local storage
let isGrouped = JSON.parse(localStorage.getItem('isGrouped')) || false; // Retrieve from local storage
let notifyOnUpdate = JSON.parse(localStorage.getItem('notifyOnUpdate')) ?? true; // Default to true
let columnVisibility = JSON.parse(localStorage.getItem('columnVisibility')) || {
    region: true,
    city: true,
    method: true,
    source: true,
    url: true,
    mac: false, // Add mac visibility state
    os: true   // Add os visibility state
};
let uniqueFlags = new Set(); // Define uniqueFlags here
let updateTableBody;
let controlStates = {}; // Initialize an object to hold control states 

let unsubscribeEvents = null; // Declare a variable to hold the unsubscribe function

// Global error handling functions
function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    } else {
        console.error("Error div not found, message:", message);
    }
}

function hideError() {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
        errorDiv.style.display = "none";
    }
}

openModal = ()=>{
    console.log("openModal() not initialized yet");
};

function updateControlState(ip, newState) {
    fetch(`/mine/update-state/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip, newState }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('State updated successfully:', data);
        updateTableBody();
    })
    .catch(error => {
        console.error('Error updating state:', error);
        showError('Error updating state: ' + error.message);
    });
}

// Save selectedFlags, isGrouped, and columnVisibility to Local Storage
function saveStateToLocalStorage() {
    localStorage.setItem('selectedFlags', JSON.stringify(selectedFlags));
    localStorage.setItem('isGrouped', JSON.stringify(isGrouped));
    localStorage.setItem('notifyOnUpdate', JSON.stringify(notifyOnUpdate));
    localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility)); // Save column visibility
}

// Load the flags, grouping preferences, and column visibility from local storage
function loadStateFromLocalStorage() {
    selectedFlags = JSON.parse(localStorage.getItem('selectedFlags')) || [];
    isGrouped = JSON.parse(localStorage.getItem('isGrouped')) || false;
    notifyOnUpdate = JSON.parse(localStorage.getItem('notifyOnUpdate')) ?? true;

    columnVisibility = JSON.parse(localStorage.getItem('columnVisibility')) || {
        region: true,
        city: true,
        method: true,
        source: true,
        url: true
    }; // Load/initialize column visibility

    // Synchronize the toggleGroupView button's class with the isGrouped state
    const groupButton = document.getElementById("toggleGroupView");
    if (isGrouped) {
        groupButton.classList.remove("off");
    } else {
        groupButton.classList.add("off");
    }
}

// Initialize state on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    loadStateFromLocalStorage(); // Load state from local storage

    try {
        // Simple check for Firebase availability
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase is not loaded. Please refresh the page.');
        }
        
        const firebaseConfig = {
            apiKey: "AIzaSyDPAA8sIykrIrV1ks-oJMjhKFNBvULsD6w",
            authDomain: "ip-server-project.firebaseapp.com",
            projectId: "ip-server-project",
            storageBucket: "ip-server-project.firebasestorage.app",
            messagingSenderId: "992124664872",
            appId: "1:992124664872:web:11d9e31b7b2ad0c9f0091d"
          };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        console.log("Firebase initialized successfully");
        
        openModal = (ip) => {
            document.getElementById("modalIp").textContent = ip; // Set IP in the modal title
            const modal = document.getElementById("dataModal");
            const tableBody = document.getElementById("modalTableBody");
            tableBody.innerHTML = ""; // Clear previous content

            // Fetching event data from Firestore
            const clientEventsRef = db.collection(`Events_${ip}`).orderBy("timestamp", "desc");

            // Listener for real-time updates
            unsubscribeEvents = clientEventsRef.onSnapshot(querySnapshot => {
                tableBody.innerHTML = ""; // Clear the table body for updates
                querySnapshot.forEach(doc => {
                    const eventData = doc.data();
                    const row = `
                        <tr>
                            <td>${eventData.timestamp || "N/A"}</td>
                            <td>${eventData.type || "N/A"}</td>
                            <td>${eventData.data || "N/A"}</td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
                modal.style.display = "block"; // Show modal
            }, error => {
                console.error("Error fetching event data:", error);
                showError("Error fetching event data: " + error.message);
            });
        }
        
        function listenForControlStates(db) {
            const controlStatesRef = db.collection("registered");
        
            controlStatesRef.onSnapshot(snapshot => {
                const newControlStates = {};
        
                snapshot.forEach(doc => {
                    const data = doc.data();
                    newControlStates[data.ip] = data.controlState;
                });
        
                controlStates = newControlStates; // Update the controlStates in the outer scope
                updateTableBody(); // Call this function to update the display with the new control states
            }, error => {
                console.error("Error getting control states:", error);
                showError("Error fetching control states: " + error.message);
            });
        }
        
        listenForControlStates(db); // Use the new listener for control states
        const toggleRegion = document.getElementById("toggle-region");
        const toggleCity = document.getElementById("toggle-city");
        const toggleMethod = document.getElementById("toggle-method");
        const toggleSource = document.getElementById("toggle-source");
        const toggleUrl = document.getElementById("toggle-url");
        const toggleMac = document.getElementById("toggle-mac");
        const toggleOs = document.getElementById("toggle-os");


    
        // Set initial visibility based on local storage
        toggleRegion.checked = columnVisibility.region;
        toggleCity.checked = columnVisibility.city;
        toggleMethod.checked = columnVisibility.method;
        toggleSource.checked = columnVisibility.source;
        toggleUrl.checked = columnVisibility.url;
        
        // Set initial visibility based on local storage
        toggleMac.checked = columnVisibility.mac;
        toggleOs.checked = columnVisibility.os;

        // Add event listeners for the toggle checkboxes
        toggleRegion.addEventListener('change', () => { 
            columnVisibility.region = toggleRegion.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        toggleCity.addEventListener('change', () => { 
            columnVisibility.city = toggleCity.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        toggleMethod.addEventListener('change', () => { 
            columnVisibility.method = toggleMethod.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        toggleSource.addEventListener('change', () => { 
            columnVisibility.source = toggleSource.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        toggleUrl.addEventListener('change', () => { 
            columnVisibility.url = toggleUrl.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        
        // Add event listeners for the toggle checkboxes for MAC and OS
        toggleMac.addEventListener('change', () => { 
            columnVisibility.mac = toggleMac.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });
        toggleOs.addEventListener('change', () => { 
            columnVisibility.os = toggleOs.checked; 
            saveStateToLocalStorage(); 
            updateTableBody(); 
        });

        const groupButton = document.getElementById("toggleGroupView");
        groupButton.onclick = toggleGroupView;

        function toggleFlag(flag) {
            const index = selectedFlags.indexOf(flag);
            if (index === -1) {
                selectedFlags.push(flag);
            } else {
                selectedFlags.splice(index, 1);
            }
            saveStateToLocalStorage(); // Save state after change
            updateTableBody();
        }

        const deleteButton = document.getElementById("deleteAllButton");
        deleteButton&& deleteButton.addEventListener("click", deleteAllRows);
        async function deleteAllRows() {
            const confirmation = confirm("Are you sure you want to delete all rows?");
            if (!confirmation) return; // Exit if the user cancels
        
            const querySnapshot = await db.collection("request_history").get();
            
            const batch = db.batch(); // Use a batch write for performance
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
        
            // Commit the batch delete
            batch.commit()
                .then(() => {
                    console.log("All rows deleted successfully");
                    updateTableBody(); // Refresh table view
                })
                .catch((error) => {
                    console.error("Error deleting rows:", error);
                    showError("Error deleting rows: " + error.message);
                });
        }

        function toggleGroupView() {
            isGrouped = !isGrouped;
            document.getElementById("toggleGroupView").classList.toggle("off");
            saveStateToLocalStorage(); // Save state after change
            updateTableBody();
        }

        function createFlagButtons(uniqueFlags) {
            console.log("createFlag Buttons");
            const container = document.getElementById("flagButtonsContainer");
            container.innerHTML = ''; // Clear previous buttons

            // Convert uniqueFlags Set to an array and sort it
            const sortedFlags = Array.from(uniqueFlags).sort();
            selectedFlags = selectedFlags.length === 0 ? sortedFlags : selectedFlags; // Initialize selectedFlags with all flags
            sortedFlags.forEach((flag) => {
                const button = document.createElement('button');
                button.textContent = flag;
    
                button.className = selectedFlags.indexOf(flag) === -1 ? 'toggle-btn off' : 'toggle-btn on';

                button.onclick = () => {
                    button.classList.toggle("off");
                    toggleFlag(flag);
                };
                container.appendChild(button);
            });
        }

        function createTableHeader() {
            const headerRow = `
                <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>Country</th>
                    <th ${columnVisibility.region ? '' : 'style="display: none;"'}>Region</th>
                    <th ${columnVisibility.city ? '' : 'style="display: none;"'}>City</th>
                    <th ${columnVisibility.method ? '' : 'style="display: none;"'}>Method</th>
                    <th ${columnVisibility.source ? '' : 'style="display: none;"'}>Source</th>
                    <th>IP</th>
                    <th ${columnVisibility.url ? '' : 'style="display: none;"'}>Request URL</th>
                    <th>Flag</th>
                    <th ${columnVisibility.os ? '' : 'style="display: none;"'}>OS</th>
                    <th ${columnVisibility.mac ? '' : 'style="display: none;"'}>Mac Address</th> <!-- Added MAC address column here -->
                    <th>PC name / Username</th>
                    <th>Control</th>
                    <th>View Event</th>
                </tr>
            `;
            const tableHead = document.querySelector("#logsTable thead");
            tableHead.innerHTML = headerRow; // Clear existing header and set new one
        }

        function createTableRow(doc, index, controlStates) {
            const data = doc.data();
            const isFilteredOut = data.url === "/mine/list";
            const rowClass = isFilteredOut ? "hidden-row" : "";
        
            const controlState = controlStates[data.ip] || "S2"; // Fallback
            const controlButtons = ['S1', 'S2', 'S3'].map(state => {
                const isActive = (!controlState && state === 'S2') || controlState === state;
                const buttonClass = isActive ? 'active' : 'inactive';
                return `
                    <button class="${buttonClass}" onclick="updateControlState('${data.ip}', '${state}')">${state}</button>
                `;
            }).join('');
            console.log("Table row data",data);
        
            return `
                <tr data-url="${data.url}" data-id="${doc.id}">
                    <td>${index}</td>
                    <td>${data.timestamp || "N/A"}</td>
                    <td>${data.country || "N/A"}</td>
                    <td ${columnVisibility.region ? '' : 'style="display: none;"'}>${data.regionName || "N/A"}</td>
                    <td ${columnVisibility.city ? '' : 'style="display: none;"'}>${data.city || "N/A"}</td>
                    <td ${columnVisibility.method ? '' : 'style="display: none;"'}>${data.method || "N/A"}</td>
                    <td ${columnVisibility.source ? '' : 'style="display: none;"'}>${data.source || "N/A"}</td>
                    <td>${data.ip || "N/A"}</td>
                    <td ${columnVisibility.url ? '' : 'style="display: none;"'}>${data.url || "N/A"}</td>
                    <td>${data.flag || "N/A"}</td>
                    <td ${columnVisibility.os ? '' : 'style="display: none;"'}>${data.platform || data.os || "Unknown"}</td>
                    <td ${columnVisibility.mac ? '' : 'style="display: none;"'}>${data.macAddresses || "Unknown"}</td>
                    <td>${data.computername || "N/A"}</td>
                    <td>${controlButtons}</td>
                    <td><button onclick="openModal('${data.ip}')">View Events</button></td> <!-- Newly added button -->
                </tr>
            `;
        }

        // Toast notification function
        function showToast(message) {
            const toast = document.getElementById("toast");
            toast.textContent = message;
            toast.className = "toast show";
            setTimeout(() => {
                toast.className = "toast";
            }, 3000);
        }

        // Track seen IPs for duplication detection
        let seenIPs = new Set();
        // Track initial load state
        let initialLoadComplete = false;
        let initialDocCount = 0;
        let processedInitialDocs = 0;

        // Request browser notification permission on load
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        let rowCount = 0;
        const unsubscribe = db.collection("request_history")
            .orderBy("timestamp", "asc")
            .onSnapshot((snapshot) => {
                const tableBody = document.getElementById("logsTableBody");
                loadStateFromLocalStorage();

                // On first snapshot, count initial docs
                if (!initialLoadComplete) {
                    initialDocCount = snapshot.size;
                }

                snapshot.docChanges().forEach((change) => {
                    try {
                        if (change.type === "added") {
                            // Only show notifications after initial load
                            if (initialLoadComplete) {
                                const data = change.doc.data();
                                const ip = data.ip || "N/A";
                                const flag = data.flag || "N/A";
                                const country = data.country || "N/A";
                                const city = data.city || "N/A";
                                let notifType = "Update";
                                if (!seenIPs.has(ip)) {
                                    notifType = "New";
                                    seenIPs.add(ip);
                                }
                                
                                const shouldNotify = (notifType === "New") || (notifType === "Update" && notifyOnUpdate);

                                if (shouldNotify) {
                                    const notifMsg = `${notifType} IP: ${ip} | Flag: ${flag} | Country: ${country} | City: ${city}`;
                                    showToast(notifMsg);
                                    if ("Notification" in window && Notification.permission === "granted") {
                                        const notifTitle = `${notifType} : ${flag}`;
                                        new Notification(notifTitle, { body: `Flag: ${flag}\nCountry: ${country}\nCity: ${city}\nIP: ${ip}` });
                                    }
                                }
                            } else {
                                // During initial load, just track seen IPs
                                const data = change.doc.data();
                                const ip = data.ip || "N/A";
                                seenIPs.add(ip);
                                processedInitialDocs++;
                            }
                            if (!isGrouped || (isGrouped && !selectedFlags.length)) {
                                rowCount++;
                                const newRow = createTableRow(change.doc, rowCount, controlStates);
                                tableBody.insertAdjacentHTML("afterbegin", newRow);
                            }
                            // Add flag to uniqueFlags, or "N/A" if no flag exists
                            const flag = change.doc.data().flag;
                            if (flag) {
                                uniqueFlags.add(flag);
                            } else {
                                uniqueFlags.add("N/A");
                            }
                        } else if (change.type === "modified") {
                            const row = document.querySelector(`tr[data-id="${change.doc.id}"]`);
                            if (row) {
                                const index = row.querySelector("td").textContent;
                                const updatedRow = createTableRow(change.doc, index, controlStates); // Pass controlStates here
                                row.outerHTML = updatedRow;
                            }
                        } else if (change.type === "removed") {
                            const row = document.querySelector(`tr[data-id="${change.doc.id}"]`);
                            if (row) row.remove();
                        }
                    } catch (err) {
                        console.error("Error handling document change:", err);
                        showError("Error updating table");
                    }
                });

                // After processing all docChanges, if initial load is done, set the flag
                if (!initialLoadComplete && processedInitialDocs >= initialDocCount) {
                    initialLoadComplete = true;
                }

                // Create flag buttons if unique flags available
                if (uniqueFlags.size > 0) {
                    createFlagButtons(Array.from(uniqueFlags));
                    saveStateToLocalStorage();
                }

                updateTableBody();
            }, (error) => {
                console.error("Firestore listener error:", error);
                showError("Error connecting to database: " + error.message);
            });

        window.addEventListener("unload", () => {
            if (unsubscribe) unsubscribe();
        });

        updateTableBody = () => {
            console.log("---updating table body");
            hideError(); 
            loadStateFromLocalStorage();
            console.log("selectedFlag", selectedFlags);

            // First update the header
            createTableHeader();

            db.collection("request_history")
                .orderBy("timestamp", "asc")
                .get()
                .then((snapshot) => {
                    const tableBody = document.getElementById("logsTableBody");
                    tableBody.innerHTML = ""; // Clear table body
                    let count = 0; // To keep the index of the displayed rows
                    const groupedData = {};

                    snapshot.forEach(doc => {
                        const data = doc.data();
                        // Add flag to uniqueFlags for button creation, or "N/A" if no flag exists
                        const flag = data.flag;
                        if (flag) {
                            uniqueFlags.add(flag);
                        } else {
                            uniqueFlags.add("N/A");
                        }
                        
                        if (shouldDisplayRow(data)) {
                            if (isGrouped) {
                                // Group by IP
                                groupedData[data.ip] = doc; // Save the first document for the IP
                            } else {
                                count++;
                                const newRow = createTableRow(doc, count, controlStates); // Pass controlStates here
                                tableBody.insertAdjacentHTML("afterbegin", newRow);
                            }
                        }
                    });

                    if (isGrouped) {
                        Object.values(groupedData).forEach((doc, index) => {
                            const newRow = createTableRow(doc, index + 1, controlStates); // Pass controlStates here
                            tableBody.insertAdjacentHTML("afterbegin", newRow);
                        });
                    }
                    
                    // Create flag buttons after processing all documents
                    if (uniqueFlags.size > 0) {
                        createFlagButtons(Array.from(uniqueFlags));
                        saveStateToLocalStorage();
                    }
                })
                .catch((error) => {
                    console.error("Error updating table:", error);
                    showError("Error updating table: " + error.message);
                });
        }
        
        function shouldDisplayRow(data) {
            console.log("shouldDisplayRow", data.flag, selectedFlags);
            // If no flags are selected, show all rows
            if (selectedFlags.length === 0) {
                return true;
            }
            // Normalize the flag - if no flag exists, treat it as "N/A"
            const normalizedFlag = data.flag || "N/A";
            // Check if the normalized flag is in the selected flags
            return selectedFlags.includes(normalizedFlag);
        }
        
        const modalCloseButton = document.getElementsByClassName("close")[0];
        modalCloseButton.onclick = function() {
            const modal = document.getElementById("dataModal");
            modal.style.display = "none"; // Hide modal
            if (unsubscribeEvents) {
                unsubscribeEvents(); // Unsubscribe from the Firestore listener
                unsubscribeEvents = null; // Prevent further calls to unsubscribe
            }
        };

        // Close modal on outside click
        window.onclick = function(event) {
            const modal = document.getElementById("dataModal");
            if (event.target === modal) {
                modal.style.display = "none"; // Hide modal
                if (unsubscribeEvents) {
                    unsubscribeEvents(); // Unsubscribe from the Firestore listener
                    unsubscribeEvents = null; // Prevent further calls to unsubscribe
                }
            }
        };

        const toggleUpdateNotificationsButton = document.getElementById("toggleUpdateNotifications");

        function updateNotificationsButtonAppearance() {
            if (notifyOnUpdate) {
                toggleUpdateNotificationsButton.textContent = "Disable Update Notifications";
                toggleUpdateNotificationsButton.classList.remove("off");
            } else {
                toggleUpdateNotificationsButton.textContent = "Enable Update Notifications";
                toggleUpdateNotificationsButton.classList.add("off");
            }
        }

        updateNotificationsButtonAppearance(); // Set initial state

        toggleUpdateNotificationsButton.addEventListener('click', () => {
            notifyOnUpdate = !notifyOnUpdate;
            updateNotificationsButtonAppearance();
            saveStateToLocalStorage();
        });

    } catch (err) {
        console.error("Firebase initialization error:", err);
        if (err.message.includes('Firebase failed to load')) {
            showError("Unable to connect to Firebase. Please check your internet connection and refresh the page.");
        } else {
            showError("Error initializing Firebase: " + err.message);
        }
    }
});
