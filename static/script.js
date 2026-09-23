const BACKEND_URL =
    "https://tension-films-affiliates-cope.trycloudflare.com";

let selectedFile = null;

/* --------------------------------------------------
   FIND PAGE ELEMENTS
-------------------------------------------------- */

const fileInput = document.querySelector('input[type="file"]');

const analyzeButton = Array.from(document.querySelectorAll("button"))
    .find(button =>
        button.innerText.toLowerCase().includes("analyze")
    );

/* --------------------------------------------------
   BACKEND STATUS
-------------------------------------------------- */

function setBackendStatus(online) {
    const elements = document.querySelectorAll("body *");

    elements.forEach(element => {
        if (element.children.length > 0) return;

        const text = element.textContent.trim();

        if (
            text === "Checking..." ||
            text === "Backend offline" ||
            text === "Backend online" ||
            text === "🔴 Backend offline" ||
            text === "🟢 Backend online"
        ) {
            element.textContent = online
                ? "🟢 Backend online"
                : "🔴 Backend offline";

            element.style.color = online
                ? "#087f5b"
                : "#d63031";
        }
    });
}

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

        console.error(
            "Backend connection failed:",
            error
        );

        setBackendStatus(false);
    }
}

/* --------------------------------------------------
   FILE SELECTION
-------------------------------------------------- */

function handleFile(file) {

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ];

    const fileName = file.name.toLowerCase();

    const validType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.some(ext =>
            fileName.endsWith(ext)
        );

    if (!validType) {

        alert(
            "Please upload JPG, JPEG, PNG or WEBP image."
        );

        return;
    }

    const maxSize =
        20 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "File size must be less than 20 MB."
        );

        return;
    }

    selectedFile = file;

    console.log(
        "Selected file:",
        selectedFile.name
    );

    updateSelectedFileDisplay();
}

/* --------------------------------------------------
   SHOW SELECTED FILE
-------------------------------------------------- */

function updateSelectedFileDisplay() {

    if (!selectedFile) {
        return;
    }

    const elements =
        document.querySelectorAll("body *");

    elements.forEach(element => {

        if (element.children.length > 0) {
            return;
        }

        const text =
            element.textContent.trim();

        if (
            text ===
            "Drag & drop your file here"
        ) {

            element.textContent =
                selectedFile.name;
        }
    });
}

/* --------------------------------------------------
   ANALYZE IMAGE
-------------------------------------------------- */

async function analyzeFile() {

    if (!selectedFile) {

        alert(
            "Please select an image first."
        );

        return;
    }

    if (analyzeButton) {

        analyzeButton.disabled = true;
        analyzeButton.textContent =
            "Analyzing...";
    }

    showLoading();

    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            selectedFile
        );

        console.log(
            "Sending image to:",
            `${BACKEND_URL}/api/analyze`
        );

        const response = await fetch(
            `${BACKEND_URL}/api/analyze`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {

            let errorMessage =
                `HTTP ${response.status}`;

            try {

                const errorData =
                    await response.json();

                if (errorData.error) {
                    errorMessage =
                        errorData.error;
                }

            } catch (_) {}

            throw new Error(errorMessage);
        }

        const data =
            await response.json();

        console.log(
            "Analysis result:",
            data
        );

        if (!data.success) {

            throw new Error(
                data.error ||
                "Analysis failed."
            );
        }

        displayAnalysis(data);

    } catch (error) {

        console.error(
            "Analysis failed:",
            error
        );

        showError(
            error.message ||
            "Unable to analyze the image."
        );

    } finally {

        if (analyzeButton) {

            analyzeButton.disabled = false;
            analyzeButton.textContent =
                "Analyze file";
        }
    }
}

/* --------------------------------------------------
   LOADING DISPLAY
-------------------------------------------------- */

function showLoading() {

    const result =
        findResultContainer();

    if (!result) {
        return;
    }

    result.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            min-height:300px;
            text-align:center;
        ">
            <div style="
                width:48px;
                height:48px;
                border:5px solid #cceeee;
                border-top-color:#0b9fac;
                border-radius:50%;
                animation: cyberLensSpin 1s linear infinite;
                margin-bottom:20px;
            "></div>

            <h3 style="margin:0 0 8px;">
                Analyzing image...
            </h3>

            <p style="margin:0;color:#526777;">
                CyberLens AI is checking the uploaded image.
            </p>
        </div>

        <style>
            @keyframes cyberLensSpin {
                to {
                    transform: rotate(360deg);
                }
            }
        </style>
    `;
}

/* --------------------------------------------------
   FIND RESULT PANEL
-------------------------------------------------- */

function findResultContainer() {

    const possible =
        Array.from(
            document.querySelectorAll(
                "main section, main div, section, article"
            )
        );

    for (const element of possible) {

        const text =
            element.textContent || "";

        if (
            text.includes(
                "Your analysis report will appear here."
            )
        ) {

            return element;
        }
    }

    const fallback =
        document.querySelector(
            '[id*="result"], [class*="result"]'
        );

    return fallback || null;
}

/* --------------------------------------------------
   DISPLAY ANALYSIS
-------------------------------------------------- */

function displayAnalysis(data) {

    const analysis =
        data.analysis || data;

    const verdict =
        analysis.verdict ||
        "Unknown";

    const confidence =
        Number(
            analysis.confidence || 0
        );

    const riskScore =
        Number(
            analysis.risk_score || 0
        );

    const fakeProbability =
        Number(
            analysis.fake_probability || 0
        ) * 100;

    const realProbability =
        Number(
            analysis.real_probability || 0
        ) * 100;

    const evidence =
        Array.isArray(analysis.evidence)
            ? analysis.evidence
            : [];

    const result =
        findResultContainer();

    if (!result) {

        console.log(
            "Analysis completed:",
            analysis
        );

        return;
    }

    const verdictLower =
        verdict.toLowerCase();

    let verdictIcon = "🔎";

    if (
        verdictLower.includes("fake")
    ) {
        verdictIcon = "⚠️";
    }

    if (
        verdictLower.includes("authentic") ||
        verdictLower.includes("real")
    ) {
        verdictIcon = "✅";
    }

    result.innerHTML = `
        <div style="
            padding:28px;
            font-family:inherit;
        ">

            <div style="
                text-align:center;
                margin-bottom:25px;
            ">

                <div style="
                    font-size:48px;
                    margin-bottom:10px;
                ">
                    ${verdictIcon}
                </div>

                <h2 style="
                    margin:0 0 8px;
                    color:#123447;
                ">
                    ${escapeHTML(verdict)}
                </h2>

                <p style="
                    margin:0;
                    color:#526777;
                ">
                    AI confidence:
                    <strong>
                        ${confidence.toFixed(2)}%
                    </strong>
                </p>

            </div>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(140px,1fr));
                gap:12px;
                margin-bottom:22px;
            ">

                ${makeStat(
                    "Fake Probability",
                    `${fakeProbability.toFixed(2)}%`
                )}

                ${makeStat(
                    "Real Probability",
                    `${realProbability.toFixed(2)}%`
                )}

                ${makeStat(
                    "Risk Score",
                    `${riskScore.toFixed(2)}`
                )}

            </div>

            <div style="
                border-top:1px solid #d5e5e0;
                padding-top:20px;
            ">

                <h3 style="
                    margin:0 0 12px;
                    color:#123447;
                ">
                    Evidence
                </h3>

                ${
                    evidence.length
                    ? `
                        <ul style="
                            margin:0;
                            padding-left:20px;
                            line-height:1.7;
                            color:#526777;
                        ">
                            ${evidence
                                .map(item =>
                                    `<li>${escapeHTML(item)}</li>`
                                )
                                .join("")
                            }
                        </ul>
                    `
                    : `
                        <p style="color:#526777;">
                            No additional evidence was returned.
                        </p>
                    `
                }

            </div>

            ${
                data.verification_id
                ? `
                    <p style="
                        margin-top:22px;
                        font-size:13px;
                        color:#71818b;
                    ">
                        Verification ID:
                        <strong>
                            ${escapeHTML(
                                data.verification_id
                            )}
                        </strong>
                    </p>
                `
                : ""
            }

        </div>
    `;
}

/* --------------------------------------------------
   STAT CARD
-------------------------------------------------- */

function makeStat(label, value) {

    return `
        <div style="
            background:#f4faf7;
            border:1px solid #d7e8df;
            border-radius:12px;
            padding:16px;
            text-align:center;
        ">

            <div style="
                font-size:13px;
                color:#60747e;
                margin-bottom:6px;
            ">
                ${escapeHTML(label)}
            </div>

            <strong style="
                font-size:20px;
                color:#087f8c;
            ">
                ${escapeHTML(value)}
            </strong>

        </div>
    `;
}

/* --------------------------------------------------
   ERROR DISPLAY
-------------------------------------------------- */

function showError(message) {

    const result =
        findResultContainer();

    if (!result) {

        alert(message);
        return;
    }

    result.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            min-height:300px;
            text-align:center;
            padding:25px;
        ">

            <div style="
                font-size:45px;
                margin-bottom:15px;
            ">
                ⚠️
            </div>

            <h3 style="
                margin:0 0 10px;
                color:#b42318;
            ">
                Analysis failed
            </h3>

            <p style="
                margin:0;
                color:#526777;
                max-width:500px;
            ">
                ${escapeHTML(message)}
            </p>

        </div>
    `;
}

/* --------------------------------------------------
   ESCAPE HTML
-------------------------------------------------- */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}

/* --------------------------------------------------
   FILE INPUT
-------------------------------------------------- */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            handleFile(file);
        }
    );
}

/* --------------------------------------------------
   ANALYZE BUTTON
-------------------------------------------------- */

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        analyzeFile
    );
}

/* --------------------------------------------------
   DRAG & DROP
-------------------------------------------------- */

const dropZone =
    document.querySelector(
        'input[type="file"]'
    )?.closest("div");

if (dropZone) {

    dropZone.addEventListener(
        "dragover",
        event => {
            event.preventDefault();
        }
    );

    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            const file =
                event.dataTransfer.files[0];

            handleFile(file);
        }
    );
}

/* --------------------------------------------------
   START BACKEND CHECK
-------------------------------------------------- */

checkBackend();

setInterval(
    checkBackend,
    15000
);