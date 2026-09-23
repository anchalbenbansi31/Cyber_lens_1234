const BACKEND_URL =
    "https://nicole-prostores-chemicals-chambers.trycloudflare.com";

let selectedFile = null;

// --------------------------------------------------
// ELEMENTS
// --------------------------------------------------

const fileInput = document.querySelector('input[type="file"]');

const analyzeButton = Array.from(document.querySelectorAll("button"))
    .find(button =>
        button.innerText.toLowerCase().includes("analyze")
    );

function setBackendStatus(online) {

    const elements = document.querySelectorAll("body *");

    elements.forEach(element => {

        const text = element.textContent.trim();

        if (
            text === "Checking..." ||
            text === "Backend offline" ||
            text === "Backend online"
        ) {

            if (online) {
                element.textContent = "🟢 Backend online";
                element.style.color = "#087f5b";
            } else {
                element.textContent = "🔴 Backend offline";
                element.style.color = "#d63031";
            }

        }

    });
}

// --------------------------------------------------
// BACKEND HEALTH CHECK
// --------------------------------------------------

async function checkBackend() {

    try {

        const response = await fetch(
            `${BACKEND_URL}/api/health`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Backend connected:", data);

        setBackendStatus(true);

    } catch (error) {

        console.error("Backend connection failed:", error);

        setBackendStatus(false);
    }
}

// --------------------------------------------------
// BACKEND STATUS
// --------------------------------------------------

function setBackendStatus(online) {

    statusElements.forEach(element => {

        if (online) {

            element.innerHTML = "🟢 Backend online";
            element.style.color = "#087f5b";

        } else {

            element.innerHTML = "🔴 Backend offline";
            element.style.color = "#d63031";

        }

    });
}

// --------------------------------------------------
// FILE SELECTION
// --------------------------------------------------

if (fileInput) {

    fileInput.addEventListener("change", function () {

        if (this.files && this.files.length > 0) {

            selectedFile = this.files[0];

            console.log(
                "Selected file:",
                selectedFile.name
            );
        }

    });
}

// --------------------------------------------------
// ANALYZE BUTTON
// --------------------------------------------------

if (analyzeButton) {

    analyzeButton.addEventListener("click", async function () {

        if (!selectedFile && fileInput && fileInput.files.length > 0) {
            selectedFile = fileInput.files[0];
        }

        if (!selectedFile) {

            showResult("Please select an image first.");

            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(selectedFile.type)) {

            showResult(
                "Please upload JPG, JPEG, PNG or WEBP."
            );

            return;
        }

        if (selectedFile.size > 20 * 1024 * 1024) {

            showResult(
                "File size must be less than 20 MB."
            );

            return;
        }

        analyzeButton.disabled = true;
        analyzeButton.innerText = "Analyzing...";

        showResult(
            "Uploading image and running AI analysis..."
        );

        try {

            const form = new FormData();

            form.append("file", selectedFile);

            console.log(
                "Sending request to:",
                `${BACKEND_URL}/api/analyze`
            );

            const response = await fetch(
                `${BACKEND_URL}/api/analyze`,
                {
                    method: "POST",
                    body: form
                }
            );

            console.log(
                "HTTP status:",
                response.status
            );

            const data = await response.json();

            console.log(
                "Backend response:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    `Backend returned HTTP ${response.status}`
                );
            }

            if (!data.success) {

                throw new Error(
                    data.error ||
                    "AI analysis failed."
                );
            }

            displayAnalysis(data);

        } catch (error) {

            console.error(
                "Analysis error:",
                error
            );

            showResult(
                `❌ ${error.message}`
            );

        } finally {

            analyzeButton.disabled = false;
            analyzeButton.innerText = "Analyze file";
        }

    });
}

// --------------------------------------------------
// DISPLAY ANALYSIS
// --------------------------------------------------

function displayAnalysis(data) {

    const analysis = data.analysis || {};

    const verdict =
        analysis.verdict || "Needs Verification";

    const confidence =
        analysis.confidence ?? 0;

    const fakeProbability =
        analysis.fake_probability !== undefined
            ? Number(analysis.fake_probability) * 100
            : 0;

    const realProbability =
        analysis.real_probability !== undefined
            ? Number(analysis.real_probability) * 100
            : 0;

    const riskScore =
        analysis.risk_score ?? fakeProbability;

    const evidence =
        Array.isArray(analysis.evidence)
            ? analysis.evidence
            : [];

    let evidenceHTML = "";

    evidence.forEach(item => {

        evidenceHTML += `
            <li>${escapeHTML(String(item))}</li>
        `;

    });

    const resultHTML = `
        <div style="
            padding:24px;
            border-radius:16px;
            background:#f7fff8;
            border:1px solid #b9ddc0;
            margin-top:15px;
        ">

            <h2 style="margin-top:0;">
                AI Analysis Result
            </h2>

            <h3>
                Verdict:
                ${escapeHTML(verdict)}
            </h3>

            <p>
                <strong>Confidence:</strong>
                ${Number(confidence).toFixed(2)}%
            </p>

            <p>
                <strong>Fake Probability:</strong>
                ${fakeProbability.toFixed(2)}%
            </p>

            <p>
                <strong>Real Probability:</strong>
                ${realProbability.toFixed(2)}%
            </p>

            <p>
                <strong>Risk Score:</strong>
                ${Number(riskScore).toFixed(2)}
            </p>

            ${
                evidenceHTML
                    ? `
                        <h4>Evidence</h4>
                        <ul>
                            ${evidenceHTML}
                        </ul>
                    `
                    : ""
            }

            <p style="
                font-size:13px;
                color:#666;
                margin-bottom:0;
            ">
                Verification ID:
                ${escapeHTML(
                    data.verification_id || "N/A"
                )}
            </p>

        </div>
    `;

    showResultHTML(resultHTML);
}

// --------------------------------------------------
// RESULT MESSAGE
// --------------------------------------------------

function showResult(message) {

    showResultHTML(`
        <div style="
            padding:20px;
            border-radius:14px;
            background:#fff5f5;
            border:1px solid #ffb5b5;
            color:#a61e1e;
        ">
            ${escapeHTML(message)}
        </div>
    `);
}

// --------------------------------------------------
// RESULT AREA
// --------------------------------------------------

function showResultHTML(html) {

    let resultBox =
        document.getElementById("cyberlens-result");

    if (!resultBox) {

        resultBox = document.createElement("div");

        resultBox.id = "cyberlens-result";

        resultBox.style.marginTop = "20px";

        const analyzer =
            document.querySelector("#analyzer");

        if (analyzer) {

            analyzer.appendChild(resultBox);

        } else if (analyzeButton) {

            analyzeButton.parentElement.appendChild(
                resultBox
            );

        } else {

            document.body.appendChild(resultBox);
        }
    }

    resultBox.innerHTML = html;
}

// --------------------------------------------------
// HTML ESCAPE
// --------------------------------------------------

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// --------------------------------------------------
// START
// --------------------------------------------------

checkBackend();

setInterval(
    checkBackend,
    15000
);